"""Fresh-context reviewer: a separate Claude session that grades the prototype it didn't build."""
from __future__ import annotations

import json
from pathlib import Path
from string import Template

from . import config
from .llm import run_claude

_S = {"type": "integer", "minimum": 1, "maximum": 10}
SCORE_KEYS = ["works", "fidelity", "wow", "ux", "code", "honesty"]
WEIGHTS = {"works": 0.25, "fidelity": 0.20, "wow": 0.20, "ux": 0.15, "code": 0.10, "honesty": 0.10}
SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {"type": "object", "properties": {k: _S for k in SCORE_KEYS},
                   "required": SCORE_KEYS},
        "must_fix": {"type": "array", "items": {"type": "string"}},
        "improvements": {"type": "array", "items": {"type": "string"}},
        "verdict": {"type": "string", "enum": ["pass", "fix", "reject"]},
        "headline": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["scores", "must_fix", "improvements", "verdict", "headline", "summary"],
}


def overall(scores: dict) -> float:
    return round(sum(float(scores.get(k, 0)) * w for k, w in WEIGHTS.items()), 2)


def passed(review: dict, verify_report: dict) -> bool:
    s = review["scores"]
    return (verify_report.get("ok", False)
            and review["verdict"] == "pass"
            and not review["must_fix"]
            and s.get("works", 0) >= 7
            and s.get("honesty", 0) >= 7
            and overall(s) >= config.PASS_SCORE)


def review(proto: Path, verify_report: dict) -> dict:
    idea = (proto / "IDEA.json").read_text() if (proto / "IDEA.json").exists() else "{}"
    slim = {k: verify_report.get(k) for k in ("ok", "problems", "external_hosts", "bytes")}
    slim["views"] = {n: {k: v for k, v in view.items() if k != "errors"}
                     for n, view in verify_report.get("views", {}).items()}
    prompt = Template((config.PROMPTS / "review.md").read_text()).safe_substitute(
        idea=idea, verify=json.dumps(slim, indent=2))
    res = run_claude(prompt, cwd=proto, label=f"review:{proto.name}", schema=SCHEMA,
                     tools="Read,Glob,Grep", permission_mode="dontAsk",
                     max_turns=config.REVIEW_MAX_TURNS, model=config.REVIEW_MODEL,
                     system_append_file=config.PROMPTS / "standards.md")
    rv = res.structured
    rv["overall"] = overall(rv["scores"])
    rv["passed"] = passed(rv, verify_report)
    (proto / ".review" / "review.json").write_text(json.dumps(rv, indent=2))
    return rv
