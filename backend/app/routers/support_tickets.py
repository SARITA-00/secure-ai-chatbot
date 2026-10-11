from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.support_ticket import SupportTicket
from app.models.user import User
from app.schemas.support_ticket import (
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketUpdate,
)

router = APIRouter(
    prefix="/support-tickets",
    tags=["Support Tickets"],
)


@router.post(
    "",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    request: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=request.subject,
        description=request.description,
        priority=request.priority,
        status="OPEN",
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


@router.get(
    "/my",
    response_model=list[SupportTicketResponse],
)
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tickets = db.scalars(
        select(SupportTicket)
        .where(SupportTicket.user_id == current_user.id)
        .order_by(SupportTicket.created_at.desc())
    ).all()

    return tickets


@router.get(
    "/{ticket_id}",
    response_model=SupportTicketResponse,
)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ticket = db.get(SupportTicket, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found",
        )

    # Customers can only access their own tickets.
    if ticket.user_id != current_user.id:
        role_name = current_user.role.name if current_user.role else None

        if role_name not in {"AGENT", "ADMIN"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to access this ticket",
            )

    return ticket


@router.get(
    "",
    response_model=list[SupportTicketResponse],
)
def get_all_tickets(
    current_user: User = Depends(
        require_role("AGENT", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    tickets = db.scalars(
        select(SupportTicket)
        .order_by(SupportTicket.created_at.desc())
    ).all()

    return tickets


@router.patch(
    "/{ticket_id}",
    response_model=SupportTicketResponse,
)
def update_ticket(
    ticket_id: int,
    request: SupportTicketUpdate,
    current_user: User = Depends(
        require_role("AGENT", "ADMIN")
    ),
    db: Session = Depends(get_db),
):
    ticket = db.get(SupportTicket, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found",
        )

    if request.status is not None:
        ticket.status = request.status

    if request.priority is not None:
        ticket.priority = request.priority

    if request.assigned_agent_id is not None:
        agent = db.get(User, request.assigned_agent_id)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned agent not found",
            )

        if not agent.role or agent.role.name != "AGENT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must have AGENT role",
            )

        ticket.assigned_agent_id = agent.id

    db.commit()
    db.refresh(ticket)

    return ticket