"""Pure, side-effect-free logic for your tools.

Keeping it here (separate from the MCP wiring in ``server.py``) makes it
trivial to unit-test with pytest.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone


def text_stats(text: str) -> dict[str, int]:
    """Count characters, words, lines and sentences in ``text``."""
    words = text.split()
    sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    return {
        "characters": len(text),
        "characters_no_spaces": len(re.sub(r"\s", "", text)),
        "words": len(words),
        "lines": len(text.splitlines()) or 1,
        "sentences": len(sentences),
    }


def ping() -> dict[str, str]:
    """Health check payload."""
    return {
        "message": "pong",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def greeting(name: str) -> str:
    """Build a personalized greeting."""
    clean = name.strip() or "world"
    return f"Hello, {clean}! This greeting was served by an MCP resource."
