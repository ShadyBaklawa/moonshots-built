"""Fresh-context reviewer: a separate Claude session that grades the prototype it didn't build."""
from __future__ import annotations

import json
import re
from pathlib import Path
from string import Template

from . import config
from .llm import run_claude

_S = {"type": "integer", "minimum": 1, "maximum": 10}
SCORE_KEYS = ["works", "fidelity", "wow", "ux", "code", "honesty"]
WEIGHTS = {"works": 0.25, "fidelity": 0.20, "wow": 0.20, "ux": 0.15, "code": 0.10, "honesty": 0.10}
ACCEPTANCE = {"type": "array", "items": {
    "type": "object",
    "properties": {"criterion": {"type": "string"}, "pass": {"type": "boolean"},
                   "evidence": {"type": "string"}},
    "required": ["criterion", "pass", "evidence"]}}
SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {"type": "object", "properties": {k: _S for k in SCORE_KEYS},
                   "required": SCORE_KEYS},
        "acceptance": ACCEPTANCE,
        "must_fix": {"type": "array", "items": {"type": "string"}},
        "improvements": {"type": "array", "items": {"type": "string"}},
        "verdict": {"type": "string", "enum": ["pass", "fix", "reject"]},
        "headline": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["scores", "acceptance", "must_fix", "improvements", "verdict", "headline",
                 "summary"],
}
NOT_CHECKED = "not checked by the reviewer"


def overall(scores: dict) -> float:
    return round(sum(float(scores.get(k, 0)) * w for k, w in WEIGHTS.items()), 2)


def _key(text) -> str:
    return " ".join(re.sub(r"[^\w$%]+", " ", str(text).lower()).split())


def match_acceptance(expected: list[str], got: list) -> list[dict]:
    """One result per acceptance line of IDEA.json, in its order.

    Results are matched to lines by text (ignoring case and punctuation), then reworded
    results fill the remaining lines in order. A line the reviewer didn't return counts as
    failed, so skipping or repeating a line can never let a prototype through.
    """
    got = [g for g in got if isinstance(g, dict)]
    wanted = {_key(line) for line in expected}
    by_text = {}
    for g in got:
        by_text.setdefault(_key(g.get("criterion", "")), g)
    out, used = [], set()
    for line in expected:
        g = by_text.get(_key(line))
        if g is not None and id(g) not in used:
            used.add(id(g))
        else:
            g = None
        out.append((line, g))
    rest = iter([g for g in got if id(g) not in used
                 and _key(g.get("criterion", "")) not in wanted])   # repeats don't count
    rows = []
    for line, g in out:
        g = g if g is not None else next(rest, None)
        rows.append({"criterion": line, "pass": bool(g and g.get("pass") is True),
                     "evidence": str((g or {}).get("evidence") or NOT_CHECKED)})
    return rows


def passed(review: dict, verify_report: dict) -> bool:
    s = review["scores"]
    return (verify_report.get("ok", False)
            and review["verdict"] == "pass"
            and not review["must_fix"]
            and all(a.get("pass") for a in review.get("acceptance", []))
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
    try:
        expected = json.loads(idea).get("acceptance") or []
    except (ValueError, AttributeError):
        expected = []
    expected = [str(x) for x in expected] if isinstance(expected, list) else []
    rv["acceptance"] = match_acceptance(expected, rv.get("acceptance") or [])
    rv["overall"] = overall(rv["scores"])
    rv["passed"] = passed(rv, verify_report)
    (proto / ".review" / "review.json").write_text(json.dumps(rv, indent=2))
    return rv
