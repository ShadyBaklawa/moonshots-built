"""Business opportunities from the scout: rank them, pick briefs and tools, store the briefs."""
from __future__ import annotations

import json

from . import config
from .build import slugify
from .state import now

WEIGHTS = {"money": 0.35, "speed": 0.25, "evidence": 0.25, "ease": 0.15}
BRIEF_KEYS = ("title", "one_liner", "customer", "problem", "revenue_model", "why_now")


def score(opp: dict) -> float:
    return round(sum(float(opp.get(k, 0)) * w for k, w in WEIGHTS.items()), 2)


def all_briefs() -> list[dict]:
    if not config.OPPORTUNITIES.exists():
        return []
    briefs = [json.loads(p.read_text()) for p in sorted(config.OPPORTUNITIES.glob("*.json"))]
    briefs.sort(key=lambda b: (b.get("episode", {}).get("date", ""), b.get("score", 0)),
                reverse=True)
    return briefs


def existing_summary() -> str:
    rows = [f"- {b.get('title', '')} — {b.get('one_liner', '')}" for b in all_briefs()]
    return "\n".join(rows) or "(none yet)"


def select(opps: list[dict], max_briefs: int | None = None,
           min_score: float | None = None) -> list[dict]:
    """Best opportunities first, skipping weak ones and titles that already have a brief."""
    max_briefs = config.MAX_BRIEFS if max_briefs is None else max_briefs
    min_score = config.MIN_OPPORTUNITY_SCORE if min_score is None else min_score
    seen = {b.get("title", "").strip().lower() for b in all_briefs()}
    picked = []
    for opp in sorted(opps, key=lambda o: o.get("score", score(o)), reverse=True):
        key = opp["title"].strip().lower()
        if opp.get("score", score(opp)) < min_score or key in seen:
            continue
        seen.add(key)
        if len(picked) < max_briefs:
            picked.append(opp)
    return picked


def pick_tools(briefs: list[dict], max_tools: int | None = None) -> list[dict]:
    """The best-ranked briefs whose working tool is realistic to build as a static page."""
    max_tools = config.MAX_TOOLS if max_tools is None else max_tools
    return [b for b in briefs if b.get("tool", {}).get("feasibility", 0) >= 3][:max_tools]


def tool_idea(opp: dict) -> dict:
    """Turn an opportunity's tool into an idea the builder and reviewer understand."""
    t = opp["tool"]
    return {"title": t["title"], "one_liner": t["one_liner"], "timestamp": opp["timestamp"],
            "speaker": opp.get("speaker", ""), "context": opp["context"], "demo": t["demo"],
            "data_plan": t["data_plan"], "feasibility": t["feasibility"],
            "risks": opp.get("risks", ""), "figures": opp.get("figures", []),
            "related_existing": None, "score": opp.get("score", score(opp)), "kind": "tool",
            "opportunity": {k: opp.get(k, "") for k in BRIEF_KEYS}}


def save_brief(opp: dict, episode: dict, tool_slug: str | None = None) -> str:
    """Write the brief to opportunities/<slug>.json and return the slug."""
    prefix = f"ep{episode['number']}" if episode.get("number") else episode["date"]
    base = f"{prefix}-{slugify(opp['title'])}"
    slug, i = base, 2
    while (config.OPPORTUNITIES / f"{slug}.json").exists():
        slug, i = f"{base}-{i}", i + 1
    config.OPPORTUNITIES.mkdir(parents=True, exist_ok=True)
    brief = {**opp, "slug": slug, "episode": episode, "score": opp.get("score", score(opp)),
             "tool_slug": tool_slug, "created": now()}
    (config.OPPORTUNITIES / f"{slug}.json").write_text(
        json.dumps(brief, indent=2, ensure_ascii=False) + "\n")
    return slug
