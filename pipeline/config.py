"""Central configuration. Every knob can be overridden with an environment variable."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROTOTYPES = ROOT / "prototypes"
OPPORTUNITIES = ROOT / "opportunities"
STATE_DIR = ROOT / "state"
PROMPTS = ROOT / "prompts"
SITE = ROOT / "site"
OUT = ROOT / "out"


def _env(name: str, default: str) -> str:
    v = os.getenv(name)
    return v if v not in (None, "") else default


PODCAST_URL = _env("PODCAST_URL", "https://podscripts.co/podcasts/moonshots-with-peter-diamandis")
USER_AGENT = _env("USER_AGENT", "Mozilla/5.0 (compatible; moonshots-built/1.0; +https://github.com)")

# Model / agent
CLAUDE_BIN = _env("CLAUDE_BIN", "claude")
MODEL = _env("MODEL", "claude-sonnet-5")
REVIEW_MODEL = _env("REVIEW_MODEL", MODEL)
SCOUT_MODEL = _env("SCOUT_MODEL", "claude-opus-5-5")  # reads the transcript, writes the briefs
BUILD_MAX_TURNS = int(_env("BUILD_MAX_TURNS", "90"))
REVIEW_MAX_TURNS = int(_env("REVIEW_MAX_TURNS", "25"))
AGENT_TIMEOUT_S = int(_env("AGENT_TIMEOUT_S", "2700"))  # 45 min per agent call
MAX_BUDGET_USD = _env("MAX_BUDGET_USD", "")  # only enforced when using an API key

# Selection
MAX_IDEAS = int(_env("MAX_IDEAS", "1"))          # fun demos built per episode
MIN_IDEA_SCORE = float(_env("MIN_IDEA_SCORE", "3.6"))  # 1-5 scale
MAX_BRIEFS = int(_env("MAX_BRIEFS", "2"))        # business briefs published per episode
MAX_TOOLS = int(_env("MAX_TOOLS", "1"))          # working tools built for the best briefs
MIN_OPPORTUNITY_SCORE = float(_env("MIN_OPPORTUNITY_SCORE", "3.0"))  # 1-5 scale
BOOTSTRAP_LATEST = int(_env("BOOTSTRAP_LATEST", "1"))  # on first run, build only the newest N episodes

# Review gate
PASS_SCORE = float(_env("PASS_SCORE", "7.0"))    # 1-10 weighted average
FIX_ROUNDS = int(_env("FIX_ROUNDS", "2"))

# Episode transcript availability
MIN_SEGMENTS = int(_env("MIN_SEGMENTS", "20"))
MAX_WAIT_ATTEMPTS = int(_env("MAX_WAIT_ATTEMPTS", "12"))

# Upgrades
UPGRADE_COOLDOWN_DAYS = int(_env("UPGRADE_COOLDOWN_DAYS", "14"))

# Gallery
SITE_TITLE = _env("SITE_TITLE", "Moonshots, Built")
SOURCE_BASE_URL = _env("SOURCE_BASE_URL", "")  # e.g. https://github.com/you/repo/tree/main/prototypes
