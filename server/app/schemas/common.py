"""
CloakSight — Pydantic Schemas: Common

Shared error and utility schemas.
"""

from __future__ import annotations
from pydantic import BaseModel
from typing import Optional


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    status: str
    version: str
    agent_provider: str


class ProviderInfo(BaseModel):
    id: str
    configured: bool
    model: Optional[str]


class ProvidersResponse(BaseModel):
    providers: list[ProviderInfo]
