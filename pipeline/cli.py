"""Command line: `python -m pipeline <command>`.

  detect            find new episodes (cheap, no AI); sets GitHub output new=true/false
  run               process the oldest pending episode end to end
  extract URL       print ranked ideas for an episode without building anything
  build-idea FILE   build one prototype from an idea JSON file (manual / testing)
  upgrade [SLUG]    upgrade one published prototype
  gallery           build the static site into ./site
  verify DIR        smoke-test a prototype folder
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from . import config, state
from .notify import telegram

PENDING = ("new", "waiting", "error")
MAX_ERRORS = 3


def _gh_output(**kv) -> None:
    path = os.getenv("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as f:
            for k, v in kv.items():
                f.write(f"{k}={v}\n")


def _write_out(name: str, data: dict) -> Path:
    config.OUT.mkdir(exist_ok=True)
    p = config.OUT / name
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    return p


def _ep_info(ep) -> dict:
    return {"slug": ep.slug, "title": ep.title, "number": ep.number, "date": ep.date, "url": ep.url}


def pending_slugs(eps: dict) -> list[str]:
    todo = [(r.get("date", ""), s) for s, r in eps.items()
            if r.get("status") in PENDING
            and not (r.get("status") == "error" and r.get("attempts", 0) >= MAX_ERRORS)]
    return [s for _, s in sorted(todo)]


def cmd_detect(_args) -> int:
    from .feed import fetch_listing

    listing = fetch_listing()
    eps = state.load_episodes()
    first_run = not eps
    for i, e in enumerate(listing):  # listing is newest first
        if e.slug in eps:
            continue
        status = "skipped" if first_run and i >= config.BOOTSTRAP_LATEST else "new"
        eps[e.slug] = {"title": e.title, "date": e.date, "number": e.number, "url": e.url,
                       "status": status, "attempts": 0, "found": state.now()}
    state.save_episodes(eps)
    todo = pending_slugs(eps)
    print(json.dumps({"pending": todo}, indent=2))
    _gh_output(new="true" if todo else "false")
    return 0


def _brief_lines(b: dict, tool: dict | None) -> list[str]:
    steps = [f"{i}. {s}" for i, s in enumerate(b.get("first_steps", []), 1)]
    if tool is None:
        tool_line = "not built (no tool idea was realistic enough)"
    elif not tool.get("slug"):
        tool_line = f"{tool['title']}, build failed"
    else:
        tool_line = f"{tool['title']}, " + ("✓ passed review" if tool["passed"] else "✗ draft")
    return [f"### 💡 {b['title']}: {b['one_liner']}",
            f"Money {b['money']}/5 · Ease {b['ease']}/5 · Speed {b['speed']}/5 · "
            f"Evidence {b['evidence']}/5 · from {b['timestamp']}", "",
            f"- **Who pays:** {b['customer']}", f"- **Problem:** {b['problem']}",
            f"- **How it earns:** {b['revenue_model']}", f"- **Why now:** {b['why_now']}",
            f"- **Cost to start:** {b['cost_to_start']}", f"- **Risks:** {b['risks']}",
            f"- **Working tool:** {tool_line}", "", "First steps:", *steps, ""]


def _acceptance_lines(acc: list[dict]) -> list[str]:
    """The reviewer's pass/fail for each "done means" line, for the PR body."""
    if not acc:
        return []
    met = sum(1 for a in acc if a.get("pass"))
    return ["", f"Done means ({met}/{len(acc)} met):"] + [
        f"- ✓ {a['criterion']}" if a.get("pass") else f"- ✗ {a['criterion']} ({a.get('evidence', '')})"
        for a in acc]


def _pr_body(ep, results: list[dict], upgrades: list[dict], summary: str,
             briefs: list[dict] = (), tools: dict | None = None) -> str:
    repo = os.getenv("GITHUB_REPOSITORY", "")
    branch = f"episode/{ep.slug}"
    lines = [f"**Episode:** [{ep.title}]({ep.url}) ({ep.date})", "", f"> {summary}", ""]
    if briefs:
        lines += ["## Business opportunities", ""]
        for b in briefs:
            lines += _brief_lines(b, (tools or {}).get(b["title"]))
    if results:
        lines += ["## Prototypes", ""]
    for r in results:
        label = "🛠 Tool" if r.get("kind") == "tool" else "🎈 Demo"
        if not r.get("slug"):
            lines += [f"### ✗ {label}: {r['title']}", f"Build failed: {r.get('error')}", ""]
            continue
        mark = "✓ ready to publish" if r["passed"] else "✗ draft (did not pass review)"
        lines += [f"### {label}: {r['title']} — {mark}",
                  f"Review **{r.get('overall', 0):.1f}/10** · smoke test "
                  f"{'passed' if r.get('smoke_ok') else 'failed'} · est. cost ${r.get('est_cost_usd', 0)}",
                  "", r.get("summary", "")]
        lines += _acceptance_lines(r.get("acceptance", []))
        if r.get("must_fix"):
            lines += ["", "Blocking issues:"] + [f"- {x}" for x in r["must_fix"]]
        if repo:
            lines += ["", f"![preview](https://github.com/{repo}/blob/{branch}/prototypes/"
                          f"{r['slug']}/preview.png?raw=true)"]
        lines.append("")
    if upgrades:
        lines += ["### Queued as upgrades (topic revisited)"] + [
            f"- `{u['related_existing']}` ← {u['title']}: {u['one_liner']}" for u in upgrades]
    lines += ["", "Merge to publish the business briefs and the ready prototypes to the "
                  "gallery. Drafts stay hidden until they pass review (re-run with `@claude` or "
                  "fix by hand)."]
    return "\n".join(lines)


def cmd_run(args) -> int:
    from .build import build_prototype
    from .extract import existing_summary, extract_ideas, select
    from .feed import fetch_episode
    from .opportunity import pick_tools, save_brief, tool_idea
    from .opportunity import select as select_briefs

    eps = state.load_episodes()
    if args.episode_url:
        slug = args.episode_url.rstrip("/").rsplit("/", 1)[-1]
        eps.setdefault(slug, {"url": args.episode_url, "status": "new", "attempts": 0})
        state.save_episodes(eps)
    else:
        todo = pending_slugs(eps)
        if not todo:
            print("nothing pending")
            _write_out("run.json", {"action": "none"})
            return 0
        slug = todo[0]
    rec = eps[slug]

    ep = fetch_episode(rec["url"])
    if len(ep.segments) < config.MIN_SEGMENTS:
        attempts = rec.get("attempts", 0) + 1
        status = "waiting" if attempts < config.MAX_WAIT_ATTEMPTS else "failed"
        state.update_episode(slug, status=status, attempts=attempts,
                             note=f"transcript has {len(ep.segments)} segments")
        print(f"{slug}: transcript not ready ({len(ep.segments)} segments) -> {status}")
        _write_out("run.json", {"action": "state"})
        return 0

    state.update_episode(slug, status="processing", title=ep.title, date=ep.date,
                         number=ep.number)
    try:
        data = extract_ideas(ep)
    except Exception as e:  # noqa: BLE001
        state.update_episode(slug, status="error", attempts=rec.get("attempts", 0) + 1,
                             note=f"extract failed: {e}"[:500])
        _write_out("run.json", {"action": "state"})
        raise
    _write_out(f"ideas-{slug}.json", data)

    _, existing = existing_summary()
    to_build, to_upgrade = select(data["ideas"], existing,
                                  max_ideas=args.max_ideas if args.max_ideas else None)
    for idea in to_upgrade:
        state.enqueue_upgrade(idea["related_existing"],
                              reason=f"{idea['one_liner']} ({idea['context']})", episode=slug)

    info = _ep_info(ep)
    briefs = select_briefs(data["opportunities"])
    results, tools = [], {}
    for b in pick_tools(briefs):  # tools first: they matter most if the run is cut short
        tools[b["title"]] = {**build_prototype(tool_idea(b), info), "kind": "tool"}
        results.append(tools[b["title"]])
    results += [{**build_prototype(idea, info), "kind": "demo"} for idea in to_build]
    built = [r["slug"] for r in results if r.get("slug")]
    brief_slugs = [save_brief(b, info, tools.get(b["title"], {}).get("slug")) for b in briefs]
    state.update_episode(
        slug, status="built", prototypes=built, briefs=brief_slugs,
        ideas=[{"title": i["title"], "score": i["score"], "timestamp": i["timestamp"]}
               for i in data["ideas"]],
        opportunities=[{"title": o["title"], "score": o["score"], "timestamp": o["timestamp"]}
                       for o in data["opportunities"]],
        summary=data.get("episode_summary", ""))

    any_ready = any(r.get("passed") for r in results)
    paths = [f"prototypes/{s}" for s in built] + [f"opportunities/{s}.json" for s in brief_slugs]
    out = {"action": "pr" if paths else "state", "branch": f"episode/{slug}",
           "title": f"Briefs and prototypes: {ep.title[:80]}", "paths": paths,
           "draft": not (any_ready or brief_slugs),
           "all_ready": bool(paths) and all(r.get("passed") for r in results),
           "body": _pr_body(ep, results, to_upgrade, data.get("episode_summary", ""),
                            briefs, tools),
           "results": results, "briefs": brief_slugs}
    _write_out("run.json", out)
    ready = [r["title"] for r in results if r.get("passed")]
    telegram(f"Moonshots, Built: {ep.title}\n{len(brief_slugs)} business briefs. "
             f"{len(ready)}/{len(results)} prototypes passed review: {', '.join(ready) or 'none'}")
    print(json.dumps({k: out[k] for k in ("action", "branch", "draft", "all_ready")}, indent=2))
    return 0


def cmd_extract(args) -> int:
    from .extract import extract_ideas
    from .feed import fetch_episode

    data = extract_ideas(fetch_episode(args.url))
    print(json.dumps(data, indent=2, ensure_ascii=False))
    return 0


def cmd_build_idea(args) -> int:
    from .build import build_prototype

    spec = json.loads(Path(args.file).read_text())
    episode = spec.pop("episode")
    result = build_prototype(spec, episode)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result.get("passed") else 1


def cmd_upgrade(args) -> int:
    from .upgrade import upgrade

    res = upgrade(args.slug)
    if not res or not res.get("accepted"):
        _write_out("upgrade.json", {"action": "none", "result": res})
        return 0
    body = (f"**{res['title']}** v{res['from_version']} → v{res['to_version']}\n\n"
            f"Review {res['baseline']:.1f} → **{res['overall']:.1f}**/10\n\n{res['summary']}\n\n"
            + "\n".join(["Why:", *[f"- {r}" for r in res["reasons"]],
                         *_acceptance_lines(res.get("acceptance", []))])
            + "\n\nMerge to publish the new version.")
    _write_out("upgrade.json", {
        "action": "pr", "branch": f"upgrade/{res['slug']}-v{res['to_version']}",
        "title": f"Upgrade: {res['title']} v{res['to_version']}",
        "paths": [f"prototypes/{res['slug']}"], "draft": False, "all_ready": True, "body": body})
    telegram(f"Moonshots, Built: upgraded {res['title']} to v{res['to_version']} "
             f"({res['baseline']:.1f} → {res['overall']:.1f})")
    return 0


def cmd_gallery(args) -> int:
    from .gallery import build_site

    build_site(Path(args.out) if args.out else None)
    return 0


def cmd_verify(args) -> int:
    from .verify import verify

    rep = verify(Path(args.dir))
    print(json.dumps(rep, indent=2))
    return 0 if rep["ok"] else 1


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="pipeline")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("detect").set_defaults(fn=cmd_detect)
    r = sub.add_parser("run")
    r.add_argument("--episode-url")
    r.add_argument("--max-ideas", type=int, default=0)
    r.set_defaults(fn=cmd_run)
    e = sub.add_parser("extract")
    e.add_argument("url")
    e.set_defaults(fn=cmd_extract)
    b = sub.add_parser("build-idea")
    b.add_argument("file")
    b.set_defaults(fn=cmd_build_idea)
    u = sub.add_parser("upgrade")
    u.add_argument("slug", nargs="?")
    u.set_defaults(fn=cmd_upgrade)
    g = sub.add_parser("gallery")
    g.add_argument("--out")
    g.set_defaults(fn=cmd_gallery)
    v = sub.add_parser("verify")
    v.add_argument("dir")
    v.set_defaults(fn=cmd_verify)
    args = p.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
