"""Weekly upgrade pass: re-review a published prototype, improve it, keep it only if it got better."""
from __future__ import annotations

import shutil
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from string import Template

from . import config
from .build import SMOKE, _bullets, check_and_fix, run_builder
from .llm import ClaudeError
from .review import review
from .state import all_prototypes, load_queue, now, pop_upgrade, write_meta
from .verify import verify

ROUTINE_MARGIN = 0.3   # a routine upgrade must beat the fresh baseline by this much
QUEUED_MARGIN = -0.2   # a content update (new episode revisits the topic) may hold steady


def _age_days(iso: str) -> float:
    try:
        return (datetime.now(timezone.utc) - datetime.fromisoformat(iso)).total_seconds() / 86400
    except (TypeError, ValueError):
        return 1e9


def pick_target(slug: str | None = None) -> tuple[Path, dict] | None:
    ready = [(d, m) for d, m in all_prototypes() if m.get("status") == "ready"]
    if slug:
        return next(((d, m) for d, m in all_prototypes() if d.name == slug), None)
    queued = {i["prototype"] for i in load_queue()}
    pool = [(d, m) for d, m in ready
            if d.name in queued or _age_days(m.get("updated", "")) >= config.UPGRADE_COOLDOWN_DAYS]
    if not pool:
        return None
    pool.sort(key=lambda dm: (dm[0].name not in queued, dm[1].get("overall", 0),
                              dm[1].get("updated", "")))
    return pool[0]


def upgrade(slug: str | None = None) -> dict | None:
    picked = pick_target(slug)
    if not picked:
        print("[upgrade] nothing due for an upgrade", flush=True)
        return None
    proto, meta = picked
    label = f"upgrade:{proto.name}"
    queued = [i for i in load_queue() if i["prototype"] == proto.name]
    reasons = [f"A newer episode ({i['episode']}) revisits this topic: {i['reason']}" for i in queued]
    if not reasons:
        reasons = ["Routine improvement pass: this is the lowest-scoring or longest-untouched "
                   "published prototype."]

    backup = Path(tempfile.mkdtemp()) / proto.name
    shutil.copytree(proto, backup)
    try:
        baseline_rv = review(proto, verify(proto))
        baseline = baseline_rv["overall"]
        version = int(meta.get("version", 1))
        prompt = Template((config.PROMPTS / "upgrade.md").read_text()).safe_substitute(
            version=version, next=version + 1, score=baseline, reasons=_bullets(reasons),
            improvements=_bullets(baseline_rv["improvements"]), smoke=SMOKE)
        run_builder(proto, prompt, label)
        report, rv, _ = check_and_fix(proto, label, rounds=1)
    except ClaudeError as e:
        print(f"[upgrade] {proto.name} failed: {e}; restoring", flush=True)
        _restore(backup, proto)
        return {"slug": proto.name, "accepted": False, "reason": str(e)}

    margin = QUEUED_MARGIN if queued else ROUTINE_MARGIN
    accepted = rv["passed"] and rv["overall"] >= baseline + margin
    result = {"slug": proto.name, "title": meta.get("title"), "accepted": accepted,
              "from_version": version, "to_version": version + 1,
              "baseline": baseline, "overall": rv["overall"], "summary": rv["summary"],
              "reasons": reasons, "acceptance": rv.get("acceptance", [])}
    if not accepted:
        print(f"[upgrade] rejected {proto.name}: {baseline} -> {rv['overall']} "
              f"(passed={rv['passed']}); restoring", flush=True)
        _restore(backup, proto)
        return result

    meta.update(version=version + 1, updated=now(), scores=rv["scores"], overall=rv["overall"],
                headline=rv.get("headline") or meta.get("headline"))
    meta.setdefault("history", []).append(
        {"version": version + 1, "at": now(), "overall": rv["overall"], "summary": rv["summary"],
         "reasons": reasons})
    write_meta(proto, meta)
    pop_upgrade(proto.name)
    return result


def _restore(backup: Path, proto: Path) -> None:
    shutil.rmtree(proto)
    shutil.copytree(backup, proto)
