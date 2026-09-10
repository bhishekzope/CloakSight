"""
CloakSight — AI Provider Interface

Pluggable interface for different AI providers (OpenAI, Google, Anthropic, local).

STATUS: Not implemented.
TODO(phase-7): Implement each provider adapter.
"""

from abc import ABC, abstractmethod
from app.schemas.context import AgentRequest
from app.schemas.actions import ActionPlan


class BaseProvider(ABC):
    """Abstract base class for AI provider adapters."""

    @abstractmethod
    async def generate_plan(self, request: AgentRequest) -> ActionPlan:
        """Call the provider's LLM/VLM and return an action plan."""
        ...


class OpenAIProvider(BaseProvider):
    """OpenAI (GPT-4o, etc.) provider adapter."""

    async def generate_plan(self, request: AgentRequest) -> ActionPlan:
        # TODO(phase-7): Implement OpenAI API call using openai SDK
        raise NotImplementedError("OpenAIProvider not implemented — Phase 7")


class GoogleProvider(BaseProvider):
    """Google (Gemini) provider adapter."""

    async def generate_plan(self, request: AgentRequest) -> ActionPlan:
        # TODO(phase-7): Implement Google Generative AI call
        raise NotImplementedError("GoogleProvider not implemented — Phase 7")


class AnthropicProvider(BaseProvider):
    """Anthropic (Claude) provider adapter."""

    async def generate_plan(self, request: AgentRequest) -> ActionPlan:
        # TODO(phase-7): Implement Anthropic API call
        raise NotImplementedError("AnthropicProvider not implemented — Phase 7")


def get_provider(provider_id: str) -> BaseProvider:
    """Factory function to get the configured provider."""
    providers: dict[str, type[BaseProvider]] = {
        "openai": OpenAIProvider,
        "google": GoogleProvider,
        "anthropic": AnthropicProvider,
    }
    cls = providers.get(provider_id)
    if cls is None:
        raise ValueError(f"Unknown provider: {provider_id}")
    return cls()
