"""
CloakSight — Pydantic Schemas: Actions

Action plan response schemas.
All targets are tag-based. No raw DOM selectors, no raw PII values.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

ActionType = Literal[
    "click", "fill", "select", "check", "uncheck",
    "upload", "scroll", "focus", "clear", "submit",
    "navigate", "wait",
]


class ActionTarget(BaseModel):
    tag_id: str = Field(description="Semantic tag ID (e.g. TAG_007)")
    expected_label: Optional[str] = None
    expected_element_type: Optional[str] = None


class Action(BaseModel):
    action_id: str
    type: ActionType
    target: ActionTarget
    value: Optional[str] = Field(
        default=None,
        description="Non-sensitive value only. Must not contain raw PII.",
    )
    description: Optional[str] = None
    requires_confirmation: bool = False
    sequence_number: int


class ActionPlan(BaseModel):
    plan_id: str
    actions: list[Action]
    summary: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    generated_at: datetime


class AgentResponse(BaseModel):
    session_id: str
    status: Literal["success", "partial", "error", "clarification_needed"]
    action_plan: Optional[ActionPlan] = None
    reasoning_summary: Optional[str] = None
    plan_confidence: Optional[float] = None
    error: Optional[dict] = None
    responded_at: datetime
