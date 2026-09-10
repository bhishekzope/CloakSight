"""
CloakSight — Server Logging Utilities

Structured logging setup using structlog.
PRIVACY: Log handlers must never log raw PII values.
"""

import logging
import structlog
from app.config import settings


def setup_logging() -> None:
    """Configure structured logging for the server."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer()
            if settings.env == "development"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
    )

    logging.basicConfig(level=log_level)
