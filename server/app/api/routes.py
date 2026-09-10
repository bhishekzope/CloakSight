"""
CloakSight — API Routes

STATUS: Placeholder — endpoints registered but not implemented.
TODO(phase-7): Implement agent planning endpoint.
"""

from fastapi import APIRouter
from datetime import datetime, timezone

from app.schemas.context import AgentRequest
from app.schemas.actions import AgentResponse
from app.schemas.common import (
    HealthResponse,
    ErrorResponse,
    ProvidersResponse,
    ProviderInfo,
)
from app.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        agent_provider=settings.agent_provider or "not_configured",
    )


@router.get("/agent/providers", response_model=ProvidersResponse)
async def list_providers() -> ProvidersResponse:
    """List available AI providers and their configuration status."""
    providers = [
        ProviderInfo(id="openai", configured=False, model=None),
        ProviderInfo(id="google", configured=False, model=None),
        ProviderInfo(id="anthropic", configured=False, model=None),
    ]
    if settings.agent_provider:
        for p in providers:
            if p.id == settings.agent_provider:
                p.configured = bool(settings.agent_api_key)
                p.model = settings.agent_model or None
    return ProvidersResponse(providers=providers)


@router.post(
    "/agent/plan",
    response_model=AgentResponse,
    responses={
        403: {"model": ErrorResponse, "description": "Leak guard blocked"},
        422: {"model": ErrorResponse, "description": "Invalid context schema"},
        503: {"model": ErrorResponse, "description": "Provider not configured"},
    },
)
async def plan(request: AgentRequest) -> AgentResponse:
    """
    Receive sanitized context and return a structured action plan.

    STATUS: Not implemented.
    TODO(phase-7): Call the configured AI provider.
    """
    # TODO(phase-7): Validate leak_guard_passed is True
    # TODO(phase-7): Check provider is configured
    # TODO(phase-7): Call agent.plan(request)
    # TODO(phase-7): Return structured AgentResponse
    raise NotImplementedError("Agent planning endpoint not implemented — Phase 7")
