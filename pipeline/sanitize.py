"""Strip invisible Unicode from scraped text before a model reads it (playbook P17).

Unicode tag characters, zero-width characters, bidi controls and the supplementary
variation selectors show as nothing in a browser but a model still reads them, so a
transcript page could hide instructions for the scout in them. A clean transcript
has none of these, so any removal is worth a warning.
"""
from __future__ import annotations

import re

INVISIBLE = re.compile(
    "["
    "\U000E0000-\U000E007F"   # tag characters
    "\U000E0100-\U000E01EF"   # variation selectors 17-256 (used to smuggle bytes)
    "​-‏"           # zero-width space/joiners, LRM/RLM
    "⁠-⁤"           # word joiner, invisible operators
    "﻿"                  # zero-width no-break space / BOM
    "‪-‮"           # bidi embeddings and overrides
    "⁦-⁩"           # bidi isolates
    "]"
)


def sanitize_for_llm(text: str) -> tuple[str, int]:
    """Return the text without invisible characters, and how many were removed."""
    return INVISIBLE.subn("", text or "")
