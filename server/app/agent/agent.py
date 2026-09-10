"""
CloakSight — Cloud Agent Orchestrator

STATUS: Not implemented.
TODO(phase-7): Implement cloud AI orchestration.
"""

from app.schemas.context import AgentRequest
from app.schemas.actions import AgentResponse


async def plan(request: AgentRequest) -> AgentResponse:
    """
    Orchestrate a cloud AI call for the given sanitized request.

    PRIVACY: The request must not contain raw PII.
    This function is called only after the extension's leak guard has passed.

    TODO(phase-7): Call provider.call_llm(request)
    TODO(phase-7): Parse and validate the response
    TODO(phase-7): Build AgentResponse with ActionPlan
    """
    raise NotImplementedError("Agent.plan not implemented — Phase 7")
