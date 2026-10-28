import json
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
FIX = Path(__file__).parent / "fixtures"
sys.path.insert(0, str(ROOT))


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """Point every state/prototype path at a temp dir and use the fake claude binary."""
    from pipeline import config, llm, state
    monkeypatch.setattr(config, "PROTOTYPES", tmp_path / "prototypes")
    monkeypatch.setattr(config, "OPPORTUNITIES", tmp_path / "opportunities")
    monkeypatch.setattr(config, "STATE_DIR", tmp_path / "state")
    monkeypatch.setattr(config, "OUT", tmp_path / "out")
    monkeypatch.setattr(config, "SITE", tmp_path / "site")
    monkeypatch.setattr(state, "EPISODES", tmp_path / "state" / "episodes.json")
    monkeypatch.setattr(state, "QUEUE", tmp_path / "state" / "upgrade_queue.json")
    monkeypatch.setattr(llm, "COST_LOG", tmp_path / "state" / "costs.jsonl")
    fake = Path(__file__).parent / "fake_claude.py"
    os.chmod(fake, 0o755)
    monkeypatch.setattr(config, "CLAUDE_BIN", str(fake))
    (tmp_path / "prototypes").mkdir()
    return tmp_path


def test_parse_listing():
    from pipeline.feed import parse_listing
    eps = parse_listing((FIX / "listing.html").read_text())
    assert [e.slug for e in eps] == [
        "robots-run-the-farm-ep-300", "guest-interview-on-oceans", "ask-us-anything-ama-299",
        "chips-and-grids-ep298"]
    assert eps[0].number == 300 and eps[0].date == "2026-10-10"
    assert eps[1].number is None
    assert eps[1].url.startswith("https://podscripts.co/podcasts/moonshots-with-peter-diamandis/")
    assert eps[2].number == 299 and eps[3].number == 298


def test_parse_episode():
    from pipeline.feed import parse_episode
    url = "https://podscripts.co/podcasts/moonshots-with-peter-diamandis/robots-run-the-farm-ep-300"
    ep = parse_episode((FIX / "episode.html").read_text(), url)
    assert ep.title.startswith("Robots Run the Farm") and ep.number == 300
    assert ep.date == "2026-10-10"
    assert [ts for ts, _ in ep.segments] == ["00:00:00", "00:00:31", "00:12:05", "01:02:44"]
    assert "battery cost" in ep.segments[2][1]
    assert "comments" not in ep.segments[-1][1]          # end marker cut
    assert "99:99:99" not in ep.transcript_text()        # scripts stripped
    assert ep.transcript_text().splitlines()[1].startswith("[00:00:31] ")


@pytest.mark.parametrize("title,num", [
    ("GPT-6 Astra Saturates ARC-AGI-3 | EP #286", 286), ("Ask the Mates | MOONSHOTS AMA #289", 289),
    ("OpenAI Pauses Training | EP#282", 282), ("Urgent Update | Ep. 272", 272),
    ("Martine Rothblatt: Growing Organs by 2030", None), ("Kimi K3 Released w/ Emad", None)])
def test_episode_number(title, num):
    from pipeline.feed import episode_number
    assert episode_number(title) == num


def test_detect_bootstraps_then_finds_new(sandbox, monkeypatch, capsys):
    from pipeline import cli, feed, state
    from pipeline.feed import parse_listing
    listing = parse_listing((FIX / "listing.html").read_text())
    monkeypatch.setattr(feed, "fetch_listing", lambda page=1: listing[1:])
    cli.main(["detect"])
    eps = state.load_episodes()
    assert eps["guest-interview-on-oceans"]["status"] == "new"
    assert all(eps[s]["status"] == "skipped" for s in ("ask-us-anything-ama-299", "chips-and-grids-ep298"))
    monkeypatch.setattr(feed, "fetch_listing", lambda page=1: listing)
    cli.main(["detect"])
    assert state.load_episodes()["robots-run-the-farm-ep-300"]["status"] == "new"
    assert cli.pending_slugs(state.load_episodes()) == [
        "guest-interview-on-oceans", "robots-run-the-farm-ep-300"]   # oldest first


def test_select_ranks_filters_and_routes_upgrades():
    from pipeline.extract import score, select
    mk = lambda t, f, w, fi, n, rel=None: {"title": t, "feasibility": f, "wow": w, "fidelity": fi,
                                           "novelty": n, "related_existing": rel}
    ideas = [mk("A", 5, 5, 5, 5), mk("B", 4, 4, 4, 4), mk("C", 5, 4, 4, 4, rel="ep1-old"),
             mk("D", 2, 5, 5, 5), mk("E", 3, 2, 2, 2), mk("a", 5, 5, 5, 5)]
    for i in ideas:
        i["score"] = score(i)
    build, upg = select(ideas, {"ep1-old"}, max_ideas=2, min_score=3.6)
    assert [i["title"] for i in build] == ["A", "B"]          # D: infeasible, E: low, 'a' dup
    assert [i["title"] for i in upg] == ["C"]
    build, upg = select(ideas, set(), max_ideas=5, min_score=3.6)
    assert "C" in [i["title"] for i in build] and not upg     # unknown slug -> treated as new


def test_extract_with_fake_claude(sandbox):
    from pipeline.extract import extract_ideas
    from pipeline.feed import parse_episode
    ep = parse_episode((FIX / "episode.html").read_text(),
                       "https://podscripts.co/podcasts/moonshots-with-peter-diamandis/x-ep-300")
    data = extract_ideas(ep)
    assert data["ideas"][0]["title"] == "Solar Tipping Map"
    assert data["ideas"][0]["score"] > data["ideas"][1]["score"]
    opps = data["opportunities"]
    assert [o["title"] for o in opps] == ["Solar Bid Desk", "Side Gig"]   # ranked by score
    assert opps[0]["score"] == 4.35 and opps[0]["figures"][0]["verified"]
    assert not opps[1]["figures"][0]["verified"]                        # quote never said
    assert data["ideas"][0]["acceptance"] == [f"Line {i}" for i in range(1, 6)]   # capped at 5
    assert opps[0]["tool"]["acceptance"] == ["Entering a quote shows a payback date",
                                             "Works at phone width"]  # blank and repeat dropped
    log = (sandbox / "state" / "costs.jsonl").read_text().strip().splitlines()
    assert json.loads(log[-1])["label"].startswith("extract:")


def test_check_figures_only_verifies_words_in_transcript():
    from pipeline.extract import check_figures
    transcript = ("[00:24:41] He's giving one SpaceX share, about $146, to every kid.\n"
                  "[00:24:50] That's 72 million kids, roughly $10.5 billion.")
    figs = check_figures([
        {"value": "$146", "meaning": "one share", "timestamp": "00:24:41",
         "said": "one SpaceX share, about $146"},
        {"value": "72 million", "meaning": "kids", "timestamp": "00:24:50",
         "said": "That's  72 MILLION kids"},                      # case/spacing tolerant
        {"value": "$1,408", "meaning": "share price", "timestamp": "00:24:41",
         "said": "a share costs $1,408"},                          # never said
        {"value": "$146", "meaning": "spans a timestamp", "timestamp": "00:24:41",
         "said": "every kid. 00:24:50 That's"},                   # timestamps aren't speech
        {"value": "x", "meaning": "empty quote", "timestamp": "", "said": ""},
        {"value": "$14", "meaning": "partial number", "timestamp": "00:24:41",
         "said": "share, about $14"},                              # must not match $146
        {"value": "$146", "meaning": "too short to check", "timestamp": "00:24:41",
         "said": "$146"},
        {"value": "$10.5 billion", "meaning": "total", "timestamp": "00:24:50",
         "said": "roughly $10.5 billion."},                        # decimal kept, full stop not
    ], transcript)
    assert [f["verified"] for f in figs] == [True, True, False, False, False, False, False, True]
    assert figs[0]["value"] == "$146"                              # original fields kept


def _opp(title, money=4, ease=4, speed=4, evidence=4, tool_feasibility=4):
    return {"title": title, "one_liner": f"{title} does a thing", "timestamp": "00:41:10",
            "speaker": "Guest", "context": "They said so.", "customer": "Clinics <b>",
            "problem": "Slow intake.", "revenue_model": "About $49 a month (estimate)",
            "why_now": "AI got cheap.", "first_steps": ["One", "Two", "Three"],
            "cost_to_start": "A week", "competition": "unknown", "risks": "Churn.",
            "money": money, "ease": ease, "speed": speed, "evidence": evidence,
            "tool": {"title": f"{title} Tool", "one_liner": "Does the job.", "demo": "In, out.",
                     "data_plan": "User input.", "feasibility": tool_feasibility,
                     "acceptance": ["Typing a clinic size shows a monthly price"]},
            "figures": [{"value": "$146", "meaning": "real", "timestamp": "00:41:10",
                         "said": "x", "verified": True},
                        {"value": "$1,408", "meaning": "made up", "timestamp": "00:41:11",
                         "said": "y", "verified": False}]}


EP = {"slug": "ep-304", "title": "Ep title", "number": 304, "date": "2026-10-21",
      "url": "https://example.com/ep"}


def test_opportunity_select_and_tools(sandbox):
    from pipeline import opportunity as o
    assert o.score(_opp("A", money=5, ease=3, speed=4, evidence=4)) == 4.20
    o.save_brief(_opp("Old News"), EP)                                    # written up last week
    opps = [_opp("Weak", money=1, ease=2, speed=2, evidence=2), _opp("Mid", money=3),
            _opp("Best", money=5, tool_feasibility=2), _opp("old news", money=5),
            _opp("Mid ", money=3)]
    briefs = o.select(opps, max_briefs=2, min_score=3.0)
    assert [b["title"] for b in briefs] == ["Best", "Mid"]   # weak cut, repeat + duplicate skipped
    assert [b["title"] for b in o.pick_tools(briefs, max_tools=1)] == ["Mid"]  # Best's tool too hard
    idea = o.tool_idea(briefs[1])
    assert idea["kind"] == "tool" and idea["title"] == "Mid Tool"
    assert idea["opportunity"]["customer"] == "Clinics <b>" and idea["related_existing"] is None
    assert len(idea["figures"]) == 2                        # builder rules decide what is usable
    assert idea["acceptance"] == ["Typing a clinic size shows a monthly price"]


def test_save_brief_unique_slugs(sandbox):
    from pipeline import opportunity as o
    assert o.save_brief(_opp("Clinic Copilot"), EP, tool_slug="ep304-tool") == "ep304-clinic-copilot"
    assert o.save_brief(_opp("Clinic Copilot"), EP) == "ep304-clinic-copilot-2"
    b = json.loads((sandbox / "opportunities" / "ep304-clinic-copilot.json").read_text())
    assert b["tool_slug"] == "ep304-tool" and b["episode"]["number"] == 304 and b["score"] == 4.0
    assert "Clinic Copilot" in o.existing_summary()


def test_pr_body_lists_briefs_and_kinds():
    from types import SimpleNamespace
    from pipeline.cli import _pr_body
    ep = SimpleNamespace(slug="ep-304", title="Ep title", url="https://example.com/ep",
                         date="2026-10-21")
    tool = {"slug": "ep304-mid-tool", "title": "Mid Tool", "passed": True, "kind": "tool",
            "overall": 8.1, "smoke_ok": True, "est_cost_usd": 0.5, "summary": "Useful.",
            "acceptance": [{"criterion": "Shows a price", "pass": True, "evidence": "app.js"},
                           {"criterion": "Fits a phone", "pass": False,
                            "evidence": "table overflows at 390px"}]}
    demo = {"slug": None, "title": "Fun", "kind": "demo", "error": "timed out"}
    body = _pr_body(ep, [tool, demo], [], "Summary.", [_opp("Mid"), _opp("Best")],
                    {"Mid": tool})
    assert body.index("## Business opportunities") < body.index("## Prototypes")
    assert "**Who pays:** Clinics <b>" in body and "1. One" in body
    assert "Mid Tool, ✓ passed review" in body and "not built" in body   # Best got no tool
    assert "🛠 Tool: Mid Tool" in body and "✗ 🎈 Demo: Fun" in body
    assert "\n\nDone means (1/2 met):\n- ✓ Shows a price\n" in body
    assert "- ✗ Fits a phone (table overflows at 390px)" in body


def test_run_builds_tool_and_demo_and_saves_briefs(sandbox, monkeypatch):
    from types import SimpleNamespace
    from pipeline import build, cli, config, feed, state
    ep = feed.parse_episode((FIX / "episode.html").read_text(),
                            "https://podscripts.co/podcasts/moonshots-with-peter-diamandis/x-ep-300")
    monkeypatch.setattr(feed, "fetch_episode", lambda url: ep)
    monkeypatch.setattr(config, "MIN_SEGMENTS", 1)              # the fixture is 4 lines long
    built = []

    def fake_build(idea, episode):
        slug = f"ep300-{len(built)}"
        built.append((idea.get("kind", "demo"), idea["title"]))
        return {"slug": slug, "title": idea["title"], "passed": True, "overall": 8.0,
                "smoke_ok": True, "est_cost_usd": 0.1, "summary": "ok", "must_fix": []}
    monkeypatch.setattr(build, "build_prototype", fake_build)
    cli.cmd_run(SimpleNamespace(episode_url=ep.url, max_ideas=0))
    # two briefs; only the best has a buildable tool, built first, then one fun demo
    assert built == [("tool", "Solar Bid Desk Calculator"), ("demo", "Solar Tipping Map")]
    out = json.loads((sandbox / "out" / "run.json").read_text())
    assert out["action"] == "pr" and not out["draft"]
    assert out["paths"] == ["prototypes/ep300-0", "prototypes/ep300-1",
                            "opportunities/ep300-solar-bid-desk.json",
                            "opportunities/ep300-side-gig.json"]
    brief = json.loads((sandbox / "opportunities" / "ep300-solar-bid-desk.json").read_text())
    assert brief["tool_slug"] == "ep300-0" and brief["figures"][0]["verified"]
    side = json.loads((sandbox / "opportunities" / "ep300-side-gig.json").read_text())
    assert side["tool_slug"] is None and not side["figures"][0]["verified"]
    assert "## Business opportunities" in out["body"] and "🛠 Tool: Solar Bid Desk" in out["body"]
    assert state.load_episodes()["x-ep-300"]["briefs"] == ["ep300-solar-bid-desk",
                                                          "ep300-side-gig"]


def test_review_gate(monkeypatch):
    from pipeline import config
    from pipeline.review import overall, passed
    monkeypatch.setattr(config, "PASS_SCORE", 7.0)
    good = {"scores": dict(works=8, fidelity=8, wow=7, ux=7, code=7, honesty=9),
            "verdict": "pass", "must_fix": []}
    assert overall(good["scores"]) == 7.65
    assert passed(good, {"ok": True})
    assert not passed(good, {"ok": False})
    assert not passed({**good, "must_fix": ["broken button"]}, {"ok": True})
    assert not passed({**good, "scores": {**good["scores"], "honesty": 5}}, {"ok": True})
    assert not passed({**good, "verdict": "fix"}, {"ok": True})
    line = {"criterion": "Slider recolours the map", "pass": True, "evidence": "app.js"}
    assert passed({**good, "acceptance": [line]}, {"ok": True})
    assert not passed({**good, "acceptance": [line, {**line, "pass": False}]}, {"ok": True})


def test_match_acceptance_by_text_then_order():
    from pipeline.review import NOT_CHECKED, match_acceptance
    got = [{"criterion": "Bee line.", "pass": True, "evidence": "e-b"},
           {"criterion": "  A ", "pass": True, "evidence": "e-a"},
           {"criterion": "reworded c", "pass": True, "evidence": "e-c"},
           "junk", {"criterion": "bee LINE", "pass": True, "evidence": "repeat"}]
    rows = match_acceptance(["a", "Bee line", "c", "d"], got)
    assert [r["criterion"] for r in rows] == ["a", "Bee line", "c", "d"]   # IDEA.json order, text
    assert [r["evidence"] for r in rows] == ["e-a", "e-b", "e-c", NOT_CHECKED]  # repeat ignored
    assert [r["pass"] for r in rows] == [True, True, True, False]
    assert match_acceptance(["a", "Bee line"], got[:1])[0] == {"criterion": "a", "pass": False,
                                                         "evidence": NOT_CHECKED}
    assert match_acceptance(["x"], [{"criterion": "x", "pass": "yes"}])[0]["pass"] is False
    assert match_acceptance([], got) == []                             # old prototypes: no gate


def test_review_checks_every_acceptance_line(sandbox):
    from pipeline.review import NOT_CHECKED, review
    proto = sandbox / "prototypes" / "ep300-map"
    (proto / ".review").mkdir(parents=True)
    lines = ["Slider recolours the map", "Shows a FAIL banner", "SKIP me: phone layout"]
    (proto / "IDEA.json").write_text(json.dumps({"title": "Map", "acceptance": lines}))
    rv = review(proto, {"ok": True, "problems": [], "views": {}})
    assert [a["criterion"] for a in rv["acceptance"]] == lines
    assert [a["pass"] for a in rv["acceptance"]] == [True, False, False]
    assert rv["acceptance"][2]["evidence"] == NOT_CHECKED                # reviewer skipped it
    assert not rv["passed"]                                              # despite verdict "pass"
    saved = json.loads((proto / ".review" / "review.json").read_text())
    assert saved["acceptance"] == rv["acceptance"]


def _fake_proto(root: Path, slug: str, status="ready", ep_date="2026-10-10", version=1):
    d = root / "prototypes" / slug
    d.mkdir(parents=True)
    (d / "index.html").write_text("<!doctype html><title>t</title><p>hello</p>")
    (d / "preview.png").write_bytes(b"\x89PNG")
    (d / ".review").mkdir()
    (d / ".review" / "secret.txt").write_text("x")
    (d / "meta.json").write_text(json.dumps({
        "slug": slug, "title": f"Title {slug} <b>", "one_liner": "does a thing",
        "headline": "Drag & see", "status": status, "version": version, "overall": 8.2,
        "timestamp": "00:12:05", "created": "2026-10-10T00:00:00+00:00",
        "episode": {"slug": f"ep-{ep_date}", "title": "Ep title", "number": 300,
                    "date": ep_date, "url": "https://example.com/ep"}}))
    return d


def test_gallery_only_ready_and_escaped(sandbox):
    from pipeline.gallery import build_site
    _fake_proto(sandbox, "ep300-one", version=2)
    _fake_proto(sandbox, "ep299-two", ep_date="2026-10-03")
    _fake_proto(sandbox, "ep300-draft", status="draft")
    site = build_site()
    html = (site / "index.html").read_text()
    assert "Title ep300-one &lt;b&gt;" in html and "<b>\"" not in html
    assert "ep300-draft" not in html
    assert html.index("ep300-one") < html.index("ep299-two")   # newest episode first
    assert (site / "p" / "ep300-one" / "index.html").exists()
    assert not (site / "p" / "ep300-one" / ".review").exists()
    assert not (site / "p" / "ep300-one" / "meta.json").exists()
    assert json.loads((site / "feed.json").read_text())[0]["slug"] == "ep300-one"
    assert ">v2<" in html


def test_gallery_briefs(sandbox):
    from pipeline import opportunity as o
    from pipeline.gallery import build_site
    tool = _fake_proto(sandbox, "ep304-mid-tool", ep_date="2026-10-21")
    m = json.loads((tool / "meta.json").read_text()); m["kind"] = "tool"
    (tool / "meta.json").write_text(json.dumps(m))
    _fake_proto(sandbox, "ep304-draft-tool", status="draft", ep_date="2026-10-21")
    o.save_brief(_opp("Mid <script>"), EP, tool_slug="ep304-mid-tool")
    o.save_brief(_opp("Drafty"), EP, tool_slug="ep304-draft-tool")
    (sandbox / "opportunities" / "evil.json").write_text(json.dumps({"slug": "../../x", "title": "Evil"}))
    site = build_site()
    html = (site / "index.html").read_text()
    assert "Business opportunities" in html and "Mid &lt;script&gt;" in html and "<script>" not in html
    assert "Evil" not in html and not (site.parent / "x").exists()        # unsafe slug skipped
    assert html.count("Working tool") == 1                                # only the ready tool
    assert '<span class="tool">Tool</span>' in html                       # badge on the tool row
    page = (site / "o" / "ep304-mid-script" / "index.html").read_text()
    assert 'href="../../p/ep304-mid-tool/"' in page and "Clinics &lt;b&gt;" in page
    assert "$146" in page and "$1,408" not in page                        # unverified never shown
    assert "Try the working tool" not in (site / "o" / "ep304-drafty" / "index.html").read_text()


def test_gallery_briefs_without_prototypes(sandbox):
    from pipeline import opportunity as o
    from pipeline.gallery import build_site
    o.save_brief(_opp("Solo"), EP)
    html = (build_site() / "index.html").read_text()
    assert "Solo" in html and "No prototypes are published yet" not in html


def test_gallery_empty_state(sandbox):
    from pipeline.gallery import build_site
    html = (build_site() / "index.html").read_text()
    assert "No prototypes are published yet" in html


def test_upgrade_pick_prefers_queue_then_lowest(sandbox):
    from pipeline import state
    from pipeline.upgrade import pick_target
    a = _fake_proto(sandbox, "ep1-a")
    b = _fake_proto(sandbox, "ep2-b")
    for d, score, upd in ((a, 8.5, "2026-01-01T00:00:00+00:00"), (b, 7.1, "2026-01-02T00:00:00+00:00")):
        m = state.read_meta(d); m.update(overall=score, updated=upd); state.write_meta(d, m)
    assert pick_target()[0].name == "ep2-b"                 # lowest score
    state.enqueue_upgrade("ep1-a", "revisited", "ep-300")
    assert pick_target()[0].name == "ep1-a"                 # queue wins
    m = state.read_meta(b); m["updated"] = state.now(); state.write_meta(b, m)
    m = state.read_meta(a); m["updated"] = state.now(); state.write_meta(a, m)
    assert pick_target()[0].name == "ep1-a"                 # queued ignores cooldown
    state.pop_upgrade("ep1-a")
    assert pick_target() is None                            # both on cooldown


def test_verify_real_browser(tmp_path):
    pytest.importorskip("playwright")
    from pipeline.verify import verify
    good = tmp_path / "good"
    good.mkdir()
    (good / "README.md").write_text("# ok")
    (good / "index.html").write_text(
        "<!doctype html><meta name=viewport content='width=device-width'><h1>Demo</h1>"
        "<p>" + "Some readable text. " * 10 + "</p><button onclick=\"document.body.dataset.x=1\">Go</button>")
    rep = verify(good)
    assert rep["ok"], rep["problems"]
    assert (good / "preview.png").exists() and (good / ".review" / "mobile.png").exists()
    assert rep["views"]["desktop"]["clicked"] >= 1

    bad = tmp_path / "bad"
    bad.mkdir()
    (bad / "index.html").write_text(
        "<!doctype html><meta name=viewport content='width=device-width'>"
        "<div style='width:900px'>wide</div><button onclick='nope()'>Boom</button>"
        "<script>console.error('kaput')</script>")
    rep = verify(bad)
    assert not rep["ok"]
    text = " ".join(rep["problems"])
    assert "kaput" in text and "overflow" in text and "README.md" in text and "nope" in text
