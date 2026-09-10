"""
CloakSight — Action Planner

Converts a sanitized context into an action plan via an LLM/VLM call.

STATUS: Not implemented.
TODO(phase-7): Implement planning logic.
"""

from app.schemas.context import AgentRequest
from app.schemas.actions import ActionPlan


async def generate_plan(request: AgentRequest) -> ActionPlan:
    """
    Call the cloud LLM/VLM with the sanitized context and return an action plan.

    TODO(phase-7): Build system prompt (include privacy instructions)
    TODO(phase-7): Build user prompt from sanitized context
    TODO(phase-7): Call provider and parse response
    TODO(phase-7): Validate that returned actions use only tag IDs
    """
    raise NotImplementedError("generate_plan not implemented — Phase 7")
