"""Small JSON-file state store committed to the repo, so every run knows what's been done."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import config

EPISODES = config.STATE_DIR / "episodes.json"
QUEUE = config.STATE_DIR / "upgrade_queue.json"


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _load(path: Path, default: Any) -> Any:
    if not path.exists() or not path.read_text().strip():
        return default
    return json.loads(path.read_text())


def _save(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def load_episodes() -> dict[str, dict]:
    return _load(EPISODES, {})


def save_episodes(data: dict[str, dict]) -> None:
    _save(EPISODES, dict(sorted(data.items(), key=lambda kv: kv[1].get("date", ""), reverse=True)))


def update_episode(slug: str, **fields) -> dict:
    data = load_episodes()
    rec = data.setdefault(slug, {})
    rec.update(fields)
    rec["updated"] = now()
    save_episodes(data)
    return rec


def load_queue() -> list[dict]:
    return _load(QUEUE, [])


def save_queue(items: list[dict]) -> None:
    _save(QUEUE, items)


def enqueue_upgrade(prototype: str, reason: str, episode: str) -> None:
    q = load_queue()
    if any(i["prototype"] == prototype and i["episode"] == episode for i in q):
        return
    q.append({"prototype": prototype, "reason": reason, "episode": episode, "added": now()})
    save_queue(q)


def pop_upgrade(prototype: str) -> list[dict]:
    q = load_queue()
    taken = [i for i in q if i["prototype"] == prototype]
    save_queue([i for i in q if i["prototype"] != prototype])
    return taken


def read_meta(proto_dir: Path) -> dict:
    return _load(proto_dir / "meta.json", {})


def write_meta(proto_dir: Path, meta: dict) -> None:
    _save(proto_dir / "meta.json", meta)


def all_prototypes() -> list[tuple[Path, dict]]:
    out = []
    if not config.PROTOTYPES.exists():
        return out
    for d in sorted(config.PROTOTYPES.iterdir()):
        if d.is_dir() and (d / "meta.json").exists():
            out.append((d, read_meta(d)))
    return out
