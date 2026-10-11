from datetime import datetime, timedelta, timezone
import os

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

load_dotenv()


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: int, role: str) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    expire_minutes = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )

    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=algorithm,
    )


def decode_access_token(token: str) -> dict:
    secret_key = os.getenv("JWT_SECRET_KEY")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")

    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")

    return jwt.decode(
        token,
        secret_key,
        algorithms=[algorithm],
    )