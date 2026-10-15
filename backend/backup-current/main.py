
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.chat import router as chat_router
from app.routers.conversations import router as conversations_router
from app.routers.auth import router as auth_router
from app.routers.security_events import router as security_events_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.admin import router as admin_router


app = FastAPI(
    title="Secure AI Chatbot",
    description="Secure AI-powered customer support chatbot",
    version="1.0.0",
)


# Allowed frontend origins.
# If CORS_ORIGINS is set in Render, its value overrides these defaults.
default_origins = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "https://frontend-e5bs.onrender.com"
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        default_origins,
    ).split(",")
    if origin.strip()
]


# Configure CORS before registering routes.
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
    ],
)


# Register application routers.
app.include_router(auth_router)
app.include_router(security_events_router)
app.include_router(audit_logs_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "Secure AI Chatbot API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
