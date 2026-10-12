"""
Read-mostly admin API used by the React admin area.

Everything here requires an ADMIN user. It only relies on the models/tables
that already exist (User, Conversation, Message, security_events), so it needs
no migration. Fields that may not exist on your models (e.g. User.created_at)
are read defensively.
"""

from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User


router = APIRouter(prefix="/admin", tags=["Admin"])

ACTIVE_WINDOW = timedelta(hours=24)


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def _role(user: User) -> str:
    role = getattr(user, "role", None)

    if role is None:
        return ""

    return str(getattr(role, "name", "")).upper()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if _role(current_user) != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user


def _aware(value: datetime | str | None) -> datetime | None:
    """Treat naive timestamps as UTC so comparisons never raise."""
    if value is None:
        return None
    if isinstance(value, str):  # some drivers return raw-SQL timestamps as text
        value = datetime.fromisoformat(value)
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _user_created_at(user: User) -> datetime | None:
    return _aware(getattr(user, "created_at", None))


def _security_rows(db: Session, limit: int = 1000) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id, user_id, conversation_id, event_type, severity,
                   description, action_taken, created_at
            FROM security_events
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()

    return [dict(row) for row in rows]


def _users_by_id(db: Session) -> dict[int, User]:
    return {u.id: u for u in db.scalars(select(User)).all()}


# --------------------------------------------------------------------------
# schemas
# --------------------------------------------------------------------------

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    admin_users: int
    total_conversations: int
    conversations_last_24h: int
    active_conversations: int
    total_messages: int
    security_events_total: int
    security_events_high: int
    security_events_last_24h: int
    prompt_injection_total: int
    unsafe_output_total: int


class AdminUser(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime | None
    last_activity_at: datetime | None
    conversation_count: int


class StatusUpdate(BaseModel):
    is_active: bool


class AdminConversation(BaseModel):
    id: int
    user_id: int
    customer: str
    email: str
    title: str | None
    last_message: str
    created_at: datetime
    last_activity_at: datetime
    message_count: int
    flagged: bool


class AdminMessage(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


class AdminSecurityEvent(BaseModel):
    id: int
    event_type: str
    severity: str
    description: str
    action_taken: str
    user_id: int | None
    user_name: str | None
    user_email: str | None
    conversation_id: int | None
    created_at: datetime


class AdminActivity(BaseModel):
    id: str
    actor: str
    actor_type: str  # Customer | Admin | System
    action: str
    description: str
    kind: str  # Success | Security | Warning | Info
    created_at: datetime


class ReportBar(BaseModel):
    label: str
    value: int


class AdminReport(BaseModel):
    period: str
    new_users: int | None  # None when User has no created_at column
    new_users_delta: float | None
    conversations: int
    conversations_delta: float | None
    messages: int
    security_events: int
    bars: list[ReportBar]
    active_pct: int
    idle_pct: int
    flagged_pct: int
    prompt_injection: int
    unsafe_output: int
    other_security: int


# --------------------------------------------------------------------------
# stats
# --------------------------------------------------------------------------

@router.get("/stats", response_model=AdminStats)
def get_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.scalars(select(User)).all()
    now = _now()

    conv_rows = db.execute(
        select(Conversation.id, Conversation.created_at)
    ).all()
    last_by_conv = dict(
        db.execute(
            select(Message.conversation_id, func.max(Message.created_at))
            .group_by(Message.conversation_id)
        ).all()
    )

    active = 0
    recent = 0
    for conv_id, created_at in conv_rows:
        last = _aware(last_by_conv.get(conv_id)) or _aware(created_at)
        if last and now - last <= ACTIVE_WINDOW:
            active += 1
        created = _aware(created_at)
        if created and now - created <= ACTIVE_WINDOW:
            recent += 1

    events = _security_rows(db)
    type_counts = Counter(str(e["event_type"]).upper() for e in events)

    return AdminStats(
        total_users=len(users),
        active_users=sum(1 for u in users if u.is_active),
        suspended_users=sum(1 for u in users if not u.is_active),
        admin_users=sum(1 for u in users if _role(u) == "ADMIN"),
        total_conversations=len(conv_rows),
        conversations_last_24h=recent,
        active_conversations=active,
        total_messages=db.scalar(select(func.count(Message.id))) or 0,
        security_events_total=len(events),
        security_events_high=sum(
            1 for e in events if str(e["severity"]).upper() == "HIGH"
        ),
        security_events_last_24h=sum(
            1
            for e in events
            if _aware(e["created_at"]) and now - _aware(e["created_at"]) <= ACTIVE_WINDOW
        ),
        prompt_injection_total=type_counts.get("PROMPT_INJECTION", 0),
        unsafe_output_total=type_counts.get("UNSAFE_LLM_OUTPUT", 0),
    )


# --------------------------------------------------------------------------
# users
# --------------------------------------------------------------------------

@router.get("/users", response_model=list[AdminUser])
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    counts = dict(
        db.execute(
            select(Conversation.user_id, func.count(Conversation.id))
            .group_by(Conversation.user_id)
        ).all()
    )
    last_activity = dict(
        db.execute(
            select(Conversation.user_id, func.max(Message.created_at))
            .join(Message, Message.conversation_id == Conversation.id)
            .group_by(Conversation.user_id)
        ).all()
    )

    users = db.scalars(select(User).order_by(User.id.desc())).all()

    return [
        AdminUser(
            id=u.id,
            name=u.name,
            email=u.email,
            role=_role(u),
            is_active=bool(u.is_active),
            created_at=_user_created_at(u),
            last_activity_at=_aware(last_activity.get(u.id)),
            conversation_count=counts.get(u.id, 0),
        )
        for u in users
    ]


@router.post("/users/{user_id}/status", response_model=AdminUser)
def set_user_status(
    user_id: int,
    payload: StatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Suspend or reactivate an account (POST so it works with the current CORS config)."""
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=400, detail="You can't change your own account status"
        )

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    count = db.scalar(
        select(func.count(Conversation.id)).where(Conversation.user_id == user.id)
    ) or 0
    last = db.scalar(
        select(func.max(Message.created_at))
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(Conversation.user_id == user.id)
    )

    return AdminUser(
        id=user.id,
        name=user.name,
        email=user.email,
        role=_role(user),
        is_active=bool(user.is_active),
        created_at=_user_created_at(user),
        last_activity_at=_aware(last),
        conversation_count=count,
    )


# --------------------------------------------------------------------------
# conversations
# --------------------------------------------------------------------------

@router.get("/conversations", response_model=list[AdminConversation])
def list_all_conversations(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = _users_by_id(db)

    stats = {
        row[0]: (row[1], row[2])
        for row in db.execute(
            select(
                Message.conversation_id,
                func.count(Message.id),
                func.max(Message.created_at),
            ).group_by(Message.conversation_id)
        ).all()
    }

    flagged_ids = {
        e["conversation_id"]
        for e in _security_rows(db)
        if e["conversation_id"] is not None
    }

    results: list[AdminConversation] = []

    for conv in db.scalars(select(Conversation)).all():
        count, last_at = stats.get(conv.id, (0, None))

        last_text = db.scalar(
            select(Message.content)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.id.desc())
            .limit(1)
        )
        first_user = db.scalar(
            select(Message.content)
            .where(Message.conversation_id == conv.id, Message.role == "user")
            .order_by(Message.id.asc())
            .limit(1)
        )

        owner = users.get(conv.user_id)

        results.append(
            AdminConversation(
                id=conv.id,
                user_id=conv.user_id,
                customer=owner.name if owner else "Unknown user",
                email=owner.email if owner else "",
                title=conv.title or (first_user or "")[:80] or None,
                last_message=(last_text or "")[:160],
                created_at=_aware(conv.created_at),
                last_activity_at=_aware(last_at) or _aware(conv.created_at),
                message_count=count,
                flagged=conv.id in flagged_ids,
            )
        )

    results.sort(key=lambda c: c.last_activity_at, reverse=True)
    return results


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[AdminMessage],
)
def get_any_conversation_messages(
    conversation_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.get(Conversation, conversation_id) is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.id.asc())
    ).all()


# --------------------------------------------------------------------------
# security events
# --------------------------------------------------------------------------

@router.get("/security-events", response_model=list[AdminSecurityEvent])
def list_security_events(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = _users_by_id(db)
    events: list[AdminSecurityEvent] = []

    for row in _security_rows(db, limit=500):
        owner = users.get(row["user_id"]) if row["user_id"] is not None else None

        events.append(
            AdminSecurityEvent(
                id=row["id"],
                event_type=str(row["event_type"]),
                severity=str(row["severity"]),
                description=str(row["description"] or ""),
                action_taken=str(row["action_taken"] or ""),
                user_id=row["user_id"],
                user_name=owner.name if owner else None,
                user_email=owner.email if owner else None,
                conversation_id=row["conversation_id"],
                created_at=_aware(row["created_at"]),
            )
        )

    return events


# --------------------------------------------------------------------------
# activity feed
# --------------------------------------------------------------------------

@router.get("/activity", response_model=list[AdminActivity])
def activity_feed(
    limit: int = Query(200, ge=1, le=500),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    A merged feed built from data we already store: new accounts, started
    conversations and security events.
    """
    users = _users_by_id(db)
    feed: list[AdminActivity] = []

    for user in users.values():
        created = _user_created_at(user)
        if created:
            feed.append(
                AdminActivity(
                    id=f"user-{user.id}",
                    actor=user.name,
                    actor_type="Admin" if _role(user) == "ADMIN" else "Customer",
                    action="Account Created",
                    description=f"{user.email} registered an account.",
                    kind="Success",
                    created_at=created,
                )
            )

    for conv in db.scalars(select(Conversation)).all():
        owner = users.get(conv.user_id)
        feed.append(
            AdminActivity(
                id=f"conversation-{conv.id}",
                actor=owner.name if owner else "Unknown user",
                actor_type="Admin" if owner and _role(owner) == "ADMIN" else "Customer",
                action="Conversation Started",
                description="Started a new support conversation.",
                kind="Info",
                created_at=_aware(conv.created_at),
            )
        )

    for row in _security_rows(db, limit=500):
        blocked = "BLOCK" in str(row["action_taken"] or "").upper()
        event_type = str(row["event_type"]).replace("_", " ").title()
        feed.append(
            AdminActivity(
                id=f"security-{row['id']}",
                actor="Security System",
                actor_type="System",
                action=f"{event_type} {'Blocked' if blocked else 'Logged'}",
                description=str(row["description"] or ""),
                kind="Security" if blocked else "Warning",
                created_at=_aware(row["created_at"]),
            )
        )

    feed.sort(key=lambda item: item.created_at, reverse=True)
    return feed[:limit]


# --------------------------------------------------------------------------
# reports
# --------------------------------------------------------------------------

PERIODS = {
    "today": timedelta(days=1),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
    "year": timedelta(days=365),
}


def _delta(current: int, previous: int) -> float | None:
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 1)


def _buckets(period: str, now: datetime) -> list[tuple[str, datetime, datetime]]:
    """(label, start, end) buckets covering the period, oldest first."""
    spans: list[tuple[str, datetime, datetime]] = []

    if period == "today":
        for i in range(12):
            end = now - timedelta(hours=2 * (11 - i))
            start = end - timedelta(hours=2)
            spans.append((start.strftime("%H:%M"), start, end))
    elif period == "7d":
        for i in range(7):
            end = now - timedelta(days=6 - i)
            start = end - timedelta(days=1)
            spans.append((end.strftime("%a"), start, end))
    elif period == "30d":
        for i in range(4):
            start = now - timedelta(days=30 - i * 7.5)
            end = start + timedelta(days=7.5)
            spans.append((f"Wk {i + 1}", start, end))
    elif period == "90d":
        for i in range(3):
            start = now - timedelta(days=90 - i * 30)
            end = start + timedelta(days=30)
            spans.append((end.strftime("%b"), start, end))
    else:
        for i in range(12):
            start = now - timedelta(days=365 - i * 30.4)
            end = start + timedelta(days=30.4)
            spans.append((end.strftime("%b"), start, end))

    return spans


@router.get("/reports", response_model=AdminReport)
def report(
    period: str = Query("30d"),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if period not in PERIODS:
        raise HTTPException(status_code=400, detail="Unknown period")

    now = _now()
    span = PERIODS[period]
    start = now - span
    prev_start = start - span

    conversations = [
        (c.id, _aware(c.created_at))
        for c in db.scalars(select(Conversation)).all()
    ]
    in_range = [c for c in conversations if c[1] and c[1] >= start]
    in_prev = [c for c in conversations if c[1] and prev_start <= c[1] < start]

    created_dates = [
        d for d in (_user_created_at(u) for u in db.scalars(select(User)).all())
    ]
    has_created = any(d is not None for d in created_dates) or not created_dates
    new_users = new_prev = None
    if has_created and created_dates:
        new_users = sum(1 for d in created_dates if d and d >= start)
        new_prev = sum(1 for d in created_dates if d and prev_start <= d < start)

    last_by_conv = dict(
        db.execute(
            select(Message.conversation_id, func.max(Message.created_at))
            .group_by(Message.conversation_id)
        ).all()
    )

    events = [
        e for e in _security_rows(db) if _aware(e["created_at"]) and _aware(e["created_at"]) >= start
    ]
    flagged_ids = {e["conversation_id"] for e in events if e["conversation_id"] is not None}

    flagged = active = idle = 0
    for conv_id, created in in_range:
        last = _aware(last_by_conv.get(conv_id)) or created
        if conv_id in flagged_ids:
            flagged += 1
        elif now - last <= ACTIVE_WINDOW:
            active += 1
        else:
            idle += 1

    total = len(in_range)

    def pct(n: int) -> int:
        return round(n / total * 100) if total else 0

    bars = [
        ReportBar(
            label=label,
            value=sum(1 for _, created in in_range if b_start <= created < b_end),
        )
        for label, b_start, b_end in _buckets(period, now)
    ]

    type_counts = Counter(str(e["event_type"]).upper() for e in events)
    pi = type_counts.get("PROMPT_INJECTION", 0)
    unsafe = type_counts.get("UNSAFE_LLM_OUTPUT", 0)

    message_count = 0
    if in_range:
        ids = [c[0] for c in in_range]
        message_count = (
            db.scalar(
                select(func.count(Message.id)).where(Message.conversation_id.in_(ids))
            )
            or 0
        )

    return AdminReport(
        period=period,
        new_users=new_users,
        new_users_delta=_delta(new_users, new_prev) if new_users is not None else None,
        conversations=total,
        conversations_delta=_delta(total, len(in_prev)),
        messages=message_count,
        security_events=len(events),
        bars=bars,
        active_pct=pct(active),
        idle_pct=pct(idle),
        flagged_pct=pct(flagged),
        prompt_injection=pi,
        unsafe_output=unsafe,
        other_security=len(events) - pi - unsafe,
    )
