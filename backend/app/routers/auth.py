from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.dependencies import get_current_user

from app.database import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.security import (
    create_access_token,
    hash_password,
    verify_password,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    # Check whether email already exists
    existing_user = db.scalar(
        select(User).where(User.email == request.email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Get the default CUSTOMER role
    role = db.scalar(
        select(Role).where(Role.name == "CUSTOMER")
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default role is not configured",
        )

    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role_id=role.id,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=role.name,
        is_active=user.is_active,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == request.email)
    )

    # Don't reveal whether the email exists
    if not user or not verify_password(
        request.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    role = db.get(Role, user.role_id)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role is not configured",
        )

    access_token = create_access_token(
        user_id=user.id,
        role=role.name,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = db.get(Role, current_user.role_id)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role is not configured",
        )

    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=role.name,
        is_active=current_user.is_active,
    )

@router.put(
    "/profile",
    response_model=UserResponse,
)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_user = db.scalar(
        select(User).where(
            User.email == request.email,
            User.id != current_user.id,
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    current_user.name = request.name
    current_user.email = request.email

    db.commit()
    db.refresh(current_user)

    role = db.get(Role, current_user.role_id)

    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role is not configured",
        )

    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=role.name,
        is_active=current_user.is_active,
    )

@router.post(
    "/change-password",
)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(
        request.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    current_user.password_hash = hash_password(
        request.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully"
    }