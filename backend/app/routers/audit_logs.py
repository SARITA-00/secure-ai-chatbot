from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import (
    AuditLogCreate,
    AuditLogResponse,
)


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.post(
    "",
    response_model=AuditLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_audit_log(
    request: AuditLogCreate,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client_ip = (
        http_request.client.host
        if http_request.client
        else None
    )

    audit_log = AuditLog(
        user_id=current_user.id,
        event_type=request.event_type,
        resource_type=request.resource_type,
        resource_id=request.resource_id,
        details=request.details,
        ip_address=client_ip,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log