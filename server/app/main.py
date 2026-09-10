"""
CloakSight — FastAPI Application Entry Point

STATUS: Placeholder — not implemented.
TODO(phase-7): Connect to cloud AI providers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router
from app.utils.logging import setup_logging

setup_logging()

app = FastAPI(
    title="CloakSight Server",
    description="Privacy-preserving cloud agent bridge for CloakSight browser extension.",
    version="0.1.0",
    docs_url="/docs" if settings.env == "development" else None,
    redoc_url=None,
)

# CORS: Only allow requests from the Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Session-ID"],
)

app.include_router(router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup() -> None:
    """Application startup tasks."""
    # TODO(phase-7): Validate AI provider configuration
    # TODO(phase-7): Initialize any connection pools
    pass


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Application shutdown tasks."""
    pass
