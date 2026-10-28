"""Idea -> prototype: build, smoke-test, independent review, fix loop."""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from string import Template

from . import config
from .llm import ClaudeError, run_claude
from .review import review
from .state import now, write_meta
from .verify import verify

SMOKE = config.ROOT / "scripts" / "smoke.py"
BUILDER_TOOLS = "Read,Write,Edit,Glob,Grep,Bash"
BUILDER_ALLOWED = [
    "Bash(python3 *)", "Bash(node *)", "Bash(ls *)", "Bash(mkdir *)", "Bash(cp *)",
    "Bash(mv *)", "Bash(rm *)", "Bash(wc *)", "Bash(head *)", "Bash(cat *)", "Bash(du *)",
]


def slugify(text: str, n: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:n].rstrip("-") or "idea"


def proto_slug(idea: dict, episode: dict) -> str:
    prefix = f"ep{episode['number']}" if episode.get("number") else episode["date"]
    base = f"{prefix}-{slugify(idea['title'])}"
    slug, i = base, 2
    while (config.PROTOTYPES / slug).exists():
        slug, i = f"{base}-{i}", i + 1
    return slug


def run_builder(proto: Path, prompt: str, label: str) -> float:
    res = run_claude(prompt, cwd=proto, label=label, tools=BUILDER_TOOLS,
                     allowed_tools=BUILDER_ALLOWED, permission_mode="acceptEdits",
                     max_turns=config.BUILD_MAX_TURNS,
                     system_append_file=config.PROMPTS / "standards.md")
    return res.cost_usd


def _bullets(items: list[str]) -> str:
    return "\n".join(f"- {x}" for x in items) or "- (none)"


def check_and_fix(proto: Path, label: str, rounds: int) -> tuple[dict, dict, float]:
    """Verify + review, then up to `rounds` fix passes. Returns (verify, review, cost)."""
    cost = 0.0
    report = verify(proto)
    rv = review(proto, report)
    for r in range(rounds):
        if rv["passed"] or rv["verdict"] == "reject":
            break
        failed = [f"{a['criterion']} ({a['evidence']})" for a in rv.get("acceptance", [])
                  if not a.get("pass")]
        prompt = Template((config.PROMPTS / "fix.md").read_text()).safe_substitute(
            must_fix=_bullets(rv["must_fix"]), problems=_bullets(report["problems"]),
            acceptance_failed=_bullets(failed),
            improvements=_bullets(rv["improvements"][:4]), smoke=SMOKE)
        cost += run_builder(proto, prompt, f"{label}:fix{r + 1}")
        report = verify(proto)
        rv = review(proto, report)
    return report, rv, cost


def build_prototype(idea: dict, episode: dict) -> dict:
    slug = proto_slug(idea, episode)
    proto = config.PROTOTYPES / slug
    proto.mkdir(parents=True)
    spec = {**idea, "episode": episode}
    (proto / "IDEA.json").write_text(json.dumps(spec, indent=2, ensure_ascii=False))

    kind = idea.get("kind", "demo")
    kind_notes = (config.PROMPTS / "tool.md").read_text() if kind == "tool" else ""
    prompt = Template((config.PROMPTS / "build.md").read_text()).safe_substitute(
        slug=slug, idea=json.dumps(idea, indent=2, ensure_ascii=False),
        episode=json.dumps(episode, indent=2, ensure_ascii=False), smoke=SMOKE,
        kind_notes=kind_notes, acceptance=_bullets(idea.get("acceptance", [])))
    result = {"slug": slug, "title": idea["title"], "passed": False, "error": None}
    cost = 0.0
    try:
        cost += run_builder(proto, prompt, f"build:{slug}")
        report, rv, c = check_and_fix(proto, f"build:{slug}", config.FIX_ROUNDS)
        cost += c
    except ClaudeError as e:
        result["error"] = str(e)
        print(f"[build] {slug} failed: {e}", flush=True)
        if not (proto / "index.html").exists():
            shutil.rmtree(proto)
            result["slug"] = None
            return result
        report = verify(proto)
        rv = {"scores": {}, "overall": 0, "passed": False, "verdict": "fix",
              "must_fix": [f"build error: {e}"], "improvements": [], "headline": idea["one_liner"],
              "summary": "Build did not finish."}

    write_meta(proto, {
        "slug": slug,
        "kind": kind,
        "title": idea["title"],
        "one_liner": idea["one_liner"],
        "headline": rv.get("headline") or idea["one_liner"],
        "episode": episode,
        "timestamp": idea.get("timestamp", ""),
        "idea_score": idea.get("score"),
        "version": 1,
        "status": "ready" if rv["passed"] else "draft",
        "scores": rv.get("scores", {}),
        "overall": rv.get("overall", 0),
        "created": now(),
        "updated": now(),
        "history": [{"version": 1, "at": now(), "overall": rv.get("overall", 0),
                     "summary": rv.get("summary", "")}],
    })
    result.update(passed=rv["passed"], overall=rv.get("overall", 0), verdict=rv.get("verdict"),
                  summary=rv.get("summary", ""), must_fix=rv.get("must_fix", []),
                  acceptance=rv.get("acceptance", []),
                  smoke_ok=report.get("ok"), est_cost_usd=round(cost, 2))
    return result
