"""
CloakSight — Pydantic Schemas: Context

Mirrors the TypeScript AgentRequest / AgentResponse types.
These schemas define what the extension sends and receives.

PRIVACY: All fields must be sanitized before reaching this server.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ElementPosition(BaseModel):
    x: float
    y: float
    width: float
    height: float


class SanitizedElement(BaseModel):
    tag_id: str = Field(description="Opaque tag ID (e.g. TAG_001)")
    semantic_label: str = Field(description="Human-readable label (e.g. PERSON_NAME)")
    element_type: str
    element_role: str
    is_sensitive: bool
    current_value: Optional[str] = Field(
        default=None,
        description="Only present for non-sensitive fields",
    )
    position: Optional[ElementPosition] = None
    is_interactive: bool
    is_visible: bool


class PageMetadata(BaseModel):
    page_url: str
    page_title: str
    element_count: int
    sensitive_element_count: int
    interactive_element_count: int
    redaction_ratio: float
    perception_confidence: float


class SanitizedContext(BaseModel):
    session_id: str
    page_metadata: PageMetadata
    elements: list[SanitizedElement]
    available_actions: list[str]
    built_at: datetime
    leak_guard_passed: bool


class AgentRequest(BaseModel):
    session_id: str
    task: str = Field(description="User's task intent (plain text)")
    sanitized_context: SanitizedContext
    requested_at: datetime
