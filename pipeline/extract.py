"""Transcript -> ranked, buildable ideas."""
from __future__ import annotations

import tempfile
from pathlib import Path
from string import Template

from . import config
from .feed import EpisodeDetail
from .llm import run_claude
from .state import all_prototypes

_SCORE = {"type": "integer", "minimum": 1, "maximum": 5}
IDEA_FIELDS = {
    "title": {"type": "string"},
    "one_liner": {"type": "string"},
    "timestamp": {"type": "string"},
    "speaker": {"type": "string"},
    "context": {"type": "string"},
    "demo": {"type": "string"},
    "data_plan": {"type": "string"},
    "feasibility": _SCORE,
    "wow": _SCORE,
    "fidelity": _SCORE,
    "novelty": _SCORE,
    "related_existing": {"type": ["string", "null"]},
    "risks": {"type": "string"},
}
SCHEMA = {
    "type": "object",
    "properties": {
        "episode_summary": {"type": "string"},
        "ideas": {
            "type": "array",
            "items": {"type": "object", "properties": IDEA_FIELDS, "required": list(IDEA_FIELDS)},
        },
    },
    "required": ["episode_summary", "ideas"],
}
WEIGHTS = {"feasibility": 0.35, "wow": 0.30, "fidelity": 0.20, "novelty": 0.15}


def score(idea: dict) -> float:
    return round(sum(float(idea.get(k, 0)) * w for k, w in WEIGHTS.items()), 2)


def existing_summary() -> tuple[str, set[str]]:
    rows, slugs = [], set()
    for d, meta in all_prototypes():
        slugs.add(d.name)
        rows.append(f"- {d.name}: {meta.get('title', '')} — {meta.get('one_liner', '')}")
    return ("\n".join(rows) or "(none yet)"), slugs


def extract_ideas(ep: EpisodeDetail) -> dict:
    existing, _ = existing_summary()
    prompt = Template((config.PROMPTS / "extract.md").read_text()).safe_substitute(
        title=ep.title, date=ep.date, url=ep.url, existing=existing)
    with tempfile.TemporaryDirectory() as tmp:  # empty dir: nothing to read even by accident
        res = run_claude(prompt, cwd=Path(tmp), label=f"extract:{ep.slug}", schema=SCHEMA,
                         tools="", stdin=ep.transcript_text(), max_turns=4)
    data = res.structured or {"episode_summary": "", "ideas": []}
    for idea in data["ideas"]:
        idea["score"] = score(idea)
    data["ideas"].sort(key=lambda i: i["score"], reverse=True)
    return data


def select(ideas: list[dict], existing_slugs: set[str], max_ideas: int | None = None,
           min_score: float | None = None) -> tuple[list[dict], list[dict]]:
    """Split ranked ideas into (new prototypes to build, upgrades to queue)."""
    max_ideas = config.MAX_IDEAS if max_ideas is None else max_ideas
    min_score = config.MIN_IDEA_SCORE if min_score is None else min_score
    build, upgrade, seen_titles = [], [], set()
    for idea in sorted(ideas, key=lambda i: i.get("score", score(i)), reverse=True):
        s = idea.get("score", score(idea))
        if s < min_score or idea.get("feasibility", 0) < 3:
            continue
        rel = idea.get("related_existing")
        if rel and rel in existing_slugs:
            upgrade.append(idea)
            continue
        key = idea["title"].strip().lower()
        if key in seen_titles:
            continue
        seen_titles.add(key)
        if len(build) < max_ideas:
            build.append(idea)
    return build, upgrade
