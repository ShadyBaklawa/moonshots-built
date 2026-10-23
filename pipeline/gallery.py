"""Static gallery site: site/index.html, site/p/<slug>/ copies of every ready prototype and
site/o/<slug>/ pages for the business briefs."""
from __future__ import annotations

import json
import re
import shutil
from collections import OrderedDict
from html import escape
from pathlib import Path

from . import config
from .opportunity import all_briefs
from .state import all_prototypes

COPY_IGNORE = shutil.ignore_patterns(".review", "IDEA.json", "meta.json")

CSS = """
:root{--paper:#EDEFF3;--ink:#18203A;--muted:#5B6479;--line:#C7CCD8;--night:#121A33;
--sky:#3E6FB0;--signal:#F2B705;--card:#FFFFFF;--shadow:0 1px 0 rgba(24,32,58,.08)}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--paper:#10172C;--ink:#E6E9F2;
--muted:#9AA3BA;--line:#2A3452;--card:#172041;--sky:#8DB4EA;--shadow:none}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.55 "Archivo",system-ui,sans-serif}
a{color:inherit}a:focus-visible,button:focus-visible{outline:3px solid var(--signal);outline-offset:3px}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
header.top{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:22px 0 10px;flex-wrap:wrap}
.brand{font-stretch:125%;font-weight:850;font-size:20px;letter-spacing:-.01em;text-decoration:none}
.brand b{display:inline-block;width:.62em;height:.62em;border-radius:50%;background:var(--signal);margin-right:.35em;transform:translateY(-.04em)}
.top p{margin:0;color:var(--muted);font-size:14px;max-width:46ch}
.hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:36px;align-items:center;padding:34px 0 56px}
.hero figure{margin:0;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--card);box-shadow:var(--shadow)}
.hero img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top}
.origin{color:var(--muted);font-size:14px;margin:0 0 10px}
.hero h1{font-stretch:125%;font-weight:850;font-size:clamp(32px,5vw,54px);line-height:1.02;letter-spacing:-.02em;margin:0 0 14px}
.hero .lede{font-size:18px;margin:0 0 22px;max-width:40ch}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;font-weight:650;text-decoration:none;border:2px solid var(--ink)}
.btn.primary{background:var(--ink);color:var(--paper)}
.log h2,.how h2{font-stretch:110%;font-weight:800;font-size:24px;margin:0 0 6px}
.log>p,.how>p{color:var(--muted);margin:0 0 26px}
.ep{display:grid;grid-template-columns:150px minmax(0,1fr);gap:28px;padding:26px 0;border-top:1px solid var(--line)}
.epnum{font-stretch:62%;font-weight:900;font-size:76px;line-height:.85;letter-spacing:-.02em}
.epnum small{display:block;font-stretch:100%;font-weight:500;font-size:13px;letter-spacing:0;color:var(--muted);margin-top:10px;line-height:1.35}
.epnum a{font-stretch:100%;font-size:13px;font-weight:600;letter-spacing:0;color:var(--sky)}
.proto{display:grid;grid-template-columns:200px minmax(0,1fr);gap:20px;align-items:start;text-decoration:none;padding:6px;margin:-6px -6px 14px;border-radius:12px}
.proto:hover{background:color-mix(in srgb,var(--card) 70%,transparent)}
.proto img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:9px;border:1px solid var(--line);background:var(--card)}
.proto h3{font-stretch:112%;font-weight:780;font-size:20px;margin:2px 0 4px;line-height:1.15}
.proto p{margin:0 0 8px;max-width:60ch}
.facts{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.score{font-weight:700;color:var(--ink)}
.v2{background:var(--signal);color:#1b1b1b;border-radius:5px;padding:0 6px;font-weight:700}
.how{padding:56px 0 20px}
.how ol{list-style:none;counter-reset:s;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.how li{counter-increment:s;border-top:3px solid var(--ink);padding-top:12px}
.how li::before{content:counter(s);font-stretch:62%;font-weight:900;font-size:40px;display:block;line-height:1}
.how li strong{display:block;margin:6px 0 4px;font-size:17px}
.how li span{color:var(--muted);font-size:15px}
footer{padding:40px 0 50px;color:var(--muted);font-size:13px;border-top:1px solid var(--line);margin-top:40px}
.empty{padding:60px 0;font-size:18px}
@media (max-width:820px){.hero{grid-template-columns:1fr;gap:22px;padding-top:18px}
.ep{grid-template-columns:1fr;gap:12px}.epnum{font-size:60px}.proto{grid-template-columns:110px minmax(0,1fr);gap:14px}
.proto h3{font-size:17px}.how ol{grid-template-columns:1fr}}
@media (prefers-reduced-motion:no-preference){.hero figure{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}}
.tool{background:var(--sky);color:var(--paper);border-radius:5px;padding:0 6px;font-weight:700}
.opps{padding:0 0 48px}.opps h2,.brief h2{font-stretch:110%;font-weight:800;font-size:24px;margin:0 0 6px}
.opps>p{color:var(--muted);margin:0 0 22px;max-width:70ch}
.opp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.opp{display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--line);border-radius:12px;background:var(--card);box-shadow:var(--shadow);text-decoration:none}
.opp:hover{border-color:var(--ink)}
.opp h3{font-stretch:112%;font-weight:780;font-size:19px;margin:0;line-height:1.2}
.opp p{margin:0}.opp .who,.opp .meta{color:var(--muted);font-size:14px}
.chips{display:flex;gap:6px;flex-wrap:wrap;font-size:13px}
.chips span{border:1px solid var(--line);border-radius:999px;padding:1px 9px}.chips span.tool{border-color:transparent}
.more{margin-top:auto;font-weight:650;color:var(--sky);font-size:14px}
.brief{max-width:780px;padding:26px 0 10px}
.brief h1{font-stretch:125%;font-weight:850;font-size:clamp(30px,5vw,48px);line-height:1.05;letter-spacing:-.02em;margin:0 0 12px}
.brief .lede{font-size:18px;margin:0 0 16px;max-width:52ch}.brief .actions{margin-top:20px}
.brief dl{display:grid;grid-template-columns:180px minmax(0,1fr);gap:12px 22px;margin:30px 0}
.brief dt{font-weight:700}.brief dd{margin:0}.brief small{color:var(--muted)}
.brief h2{margin-top:30px}.brief ol,.brief ul{padding-left:22px}.brief li{margin:5px 0}
.brief .note{color:var(--muted);font-size:14px;border-top:1px solid var(--line);padding-top:14px;margin-top:34px}
@media (max-width:820px){.brief dl{grid-template-columns:1fr;gap:2px 0}.brief dd{margin-bottom:14px}}
"""
TAGLINE = ("Ideas from the Moonshots podcast, turned into business briefs, working tools and "
           "demos by AI agents within hours of each episode.")
FOOTER = ('<footer>A fan project. Not affiliated with, or endorsed by, the Moonshots podcast or '
          'its hosts. Prototypes are illustrative demos; anything simulated is labeled inside '
          'each one. Business briefs are AI-written analysis, not financial advice.</footer>')
SLUG_RE = re.compile(r"[a-z0-9][a-z0-9-]*")


def _page(title: str, description: str, body: str, home: str = "./") -> str:
    site = escape(config.SITE_TITLE)
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{escape(title)}</title><meta name="description" content="{escape(description)}">'
            f'<link rel="preconnect" href="https://fonts.googleapis.com">'
            f'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900'
            f'&display=swap" rel="stylesheet"><style>{CSS}</style></head><body><div class="wrap">'
            f'<header class="top"><a class="brand" href="{home}"><b></b>{site}</a>'
            f'<p>{TAGLINE}</p></header>{body}{FOOTER}</div></body></html>')


def _ready() -> list[tuple[Path, dict]]:
    items = [(d, m) for d, m in all_prototypes() if m.get("status") == "ready"]
    items.sort(key=lambda dm: (dm[1].get("episode", {}).get("date", ""), dm[1].get("created", "")),
               reverse=True)
    return items


def _ep_label(ep: dict) -> str:
    return str(ep["number"]) if ep.get("number") else ep.get("date", "")[5:].replace("-", "/")


def _proto_row(d: Path, m: dict) -> str:
    v = int(m.get("version", 1))
    vtag = f'<span class="v2">v{v}</span>' if v > 1 else "<span>v1</span>"
    ts = f"<span>from {escape(m['timestamp'])}</span>" if m.get("timestamp") else ""
    kind = '<span class="tool">Tool</span>' if m.get("kind") == "tool" else ""
    return (f'<a class="proto" href="p/{escape(d.name)}/">'
            f'<img src="p/{escape(d.name)}/preview.png" alt="" loading="lazy" width="200" height="125">'
            f'<div><h3>{escape(m.get("title", d.name))}</h3>'
            f'<p>{escape(m.get("headline") or m.get("one_liner", ""))}</p>'
            f'<div class="facts">{kind}<span class="score">Review {m.get("overall", 0):.1f}/10</span>'
            f'{vtag}{ts}</div></div></a>')


def _scores(b: dict, keys=(("money", "Money"), ("speed", "Speed"), ("ease", "Ease"))) -> str:
    return "".join(f"<span>{label} {int(b.get(k, 0))}/5</span>" for k, label in keys)


def _brief_card(b: dict, ready: set[str]) -> str:
    ep = b.get("episode", {})
    where = f"EP {escape(str(ep['number']))}" if ep.get("number") else escape(ep.get("date", ""))
    if b.get("timestamp"):
        where += f" · {escape(b['timestamp'])}"
    tool = '<span class="tool">Working tool</span>' if b.get("tool_slug") in ready else ""
    return (f'<a class="opp" href="o/{escape(b["slug"])}/"><span class="meta">{where}</span>'
            f'<h3>{escape(b.get("title", ""))}</h3><p>{escape(b.get("one_liner", ""))}</p>'
            f'<p class="who">For: {escape(b.get("customer", ""))}</p>'
            f'<div class="chips">{_scores(b)}{tool}</div>'
            f'<span class="more">Read the brief →</span></a>')


def render_brief(b: dict, ready: set[str]) -> str:
    ep = b.get("episode", {})

    def row(label: str, key: str, note: str = "") -> str:
        return f"<dt>{label}</dt><dd>{escape(str(b[key]))}{note}</dd>" if b.get(key) else ""

    origin = (f'From <a href="{escape(ep.get("url", "#"))}" rel="noopener">'
              f'{escape(ep.get("title", "the episode"))}</a>')
    if b.get("timestamp"):
        origin += f", around {escape(b['timestamp'])}"
    if b.get("speaker"):
        origin += f" ({escape(b['speaker'])})"
    tool = ""
    if b.get("tool_slug") in ready:
        tool = (f'<div class="actions"><a class="btn primary" href="../../p/{escape(b["tool_slug"])}/">'
                f'Try the working tool</a></div>')
    steps = "".join(f"<li>{escape(x)}</li>" for x in b.get("first_steps", []))
    figs = [f for f in b.get("figures", []) if f.get("verified")]  # unverified never shown
    numbers = ""
    if figs:
        numbers = "<h2>Numbers from the episode</h2><ul>" + "".join(
            f"<li><b>{escape(f.get('value', ''))}</b> {escape(f.get('meaning', ''))}"
            + (f" <small>(at {escape(f['timestamp'])})</small>" if f.get("timestamp") else "")
            + "</li>" for f in figs) + "</ul>"
    body = (f'<article class="brief"><p class="origin">{origin}</p>'
            f'<h1>{escape(b.get("title", ""))}</h1>'
            f'<p class="lede">{escape(b.get("one_liner", ""))}</p>'
            f'<div class="chips">{_scores(b)}<span>Evidence {int(b.get("evidence", 0))}/5</span>'
            f'</div>{tool}<dl>{row("Who pays", "customer")}{row("The problem", "problem")}'
            f'{row("How it makes money", "revenue_model")}{row("Why now", "why_now")}'
            f'{row("What was said", "context")}{row("Cost to start", "cost_to_start")}'
            f'{row("Likely competition", "competition", " <small>(from general knowledge, not checked)</small>")}'
            f'{row("Biggest risks", "risks")}</dl>'
            f'<h2>First steps this week</h2><ol>{steps}</ol>{numbers}'
            f'<p class="note">Written by an AI from the episode transcript. Prices and costs are '
            f'estimates. Not financial advice: check the market yourself before you spend '
            f'money.</p></article>')
    return _page(f"{b.get('title', '')} | {config.SITE_TITLE}", b.get("one_liner", ""), body,
                 home="../../")


def render(items: list[tuple[Path, dict]], briefs: list[dict] = ()) -> str:
    ready = {d.name for d, _ in items}
    opps = ""
    if briefs:
        opps = (f'<section class="opps"><h2>Business opportunities</h2><p>The ideas from each '
                f'episode that someone could turn into money: who pays, how it earns and how to '
                f'start this week, written up by an AI scout from the transcript.</p>'
                f'<div class="opp-grid">{"".join(_brief_card(b, ready) for b in briefs)}</div>'
                f'</section>')
    if not items:
        body = opps or ('<p class="empty">No prototypes are published yet. The first ones '
                        'appear after the next episode is built and reviewed.</p>')
    else:
        d0, m0 = items[0]
        ep0 = m0.get("episode", {})
        origin = f"From {escape(ep0.get('title', ''))}"
        if m0.get("timestamp"):
            origin += f", around {escape(m0['timestamp'])}"
        src = ""
        if config.SOURCE_BASE_URL:
            src = (f'<a class="btn" href="{escape(config.SOURCE_BASE_URL.rstrip("/"))}/'
                   f'{escape(d0.name)}">See how it was built</a>')
        body = (f'<section class="hero"><figure><a href="p/{escape(d0.name)}/">'
                f'<img src="p/{escape(d0.name)}/preview.png" alt="Screenshot of {escape(m0.get("title", ""))}">'
                f'</a></figure><div><p class="origin">{origin}</p>'
                f'<h1>{escape(m0.get("title", d0.name))}</h1>'
                f'<p class="lede">{escape(m0.get("headline") or m0.get("one_liner", ""))}</p>'
                f'<div class="actions"><a class="btn primary" href="p/{escape(d0.name)}/">'
                f'Open the prototype</a>{src}</div></div></section>{opps}')

        groups: "OrderedDict[str, list]" = OrderedDict()
        for d, m in items:
            groups.setdefault(m.get("episode", {}).get("slug", "?"), []).append((d, m))
        rows = []
        for _, protos in groups.items():
            ep = protos[0][1].get("episode", {})
            rows.append(
                f'<article class="ep"><div class="epnum">{escape(_ep_label(ep))}'
                f'<small>{escape(ep.get("date", ""))}<br>{escape(ep.get("title", ""))}</small>'
                f'<a href="{escape(ep.get("url", "#"))}" rel="noopener">Episode page</a></div>'
                f'<div>{"".join(_proto_row(d, m) for d, m in protos)}</div></article>')
        body += (f'<section class="log"><h2>Every build, by episode</h2>'
                 f'<p>{len(items)} prototypes so far. Each one passed an automated browser test '
                 f'and a separate AI review before it was published, and some have been upgraded '
                 f'since.</p>{"".join(rows)}</section>')

    how = ('<section class="how"><h2>How it works</h2><p>The whole loop runs on its own; a human '
           'approves what goes public.</p><ol>'
           '<li><strong>A new episode lands</strong><span>A watcher checks for new episodes every two '
           'hours and reads the transcript.</span></li>'
           '<li><strong>A scout picks what is worth building</strong><span>The best business '
           'opportunities get a written brief and a working tool; the most fun idea becomes a '
           'demo.</span></li>'
           '<li><strong>A separate reviewer decides</strong><span>A browser test and an independent '
           'AI review gate publishing. Published prototypes get weekly upgrades.</span></li>'
           '</ol></section>')
    return _page(config.SITE_TITLE, "Business briefs, working tools and demos built from ideas on "
                 "the Moonshots podcast, after each episode.", body + how)


def build_site(out: Path | None = None) -> Path:
    out = out or config.SITE
    if out.exists():
        shutil.rmtree(out)
    (out / "p").mkdir(parents=True)
    items = _ready()
    for d, _ in items:
        shutil.copytree(d, out / "p" / d.name, ignore=COPY_IGNORE)
    briefs = [b for b in all_briefs() if SLUG_RE.fullmatch(str(b.get("slug", "")))]
    ready = {d.name for d, _ in items}
    for b in briefs:
        (out / "o" / b["slug"]).mkdir(parents=True)
        (out / "o" / b["slug"] / "index.html").write_text(render_brief(b, ready))
    (out / "index.html").write_text(render(items, briefs))
    (out / "feed.json").write_text(json.dumps(
        [{"slug": d.name, "title": m.get("title"), "headline": m.get("headline"),
          "episode": m.get("episode"), "version": m.get("version"), "overall": m.get("overall"),
          "url": f"p/{d.name}/"} for d, m in items], indent=2))
    (out / ".nojekyll").write_text("")
    print(f"[gallery] {len(items)} prototypes, {len(briefs)} briefs -> {out}", flush=True)
    return out
