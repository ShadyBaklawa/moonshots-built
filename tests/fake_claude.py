#!/usr/bin/env python3
"""Stand-in for the `claude` CLI in tests. Echoes canned JSON based on the --json-schema shape."""
import json
import sys

args = sys.argv[1:]
schema = json.loads(args[args.index("--json-schema") + 1]) if "--json-schema" in args else None
stdin = sys.stdin.read() if not sys.stdin.isatty() else ""


def _opportunity(title, money, tool_feasibility, said):
    return {"title": title, "one_liner": "Sell battery-cost forecasts.", "timestamp": "00:12:05",
            "speaker": "", "context": "Battery costs decide who goes solar first.",
            "customer": "Solar installers", "problem": "They can't time their bids.",
            "revenue_model": "Subscription, about $49 a month (estimate)",
            "why_now": "Battery prices are falling fast.",
            "first_steps": ["Call 5 installers", "Mock up a report", "Charge for the first one"],
            "cost_to_start": "Two weeks, under $100", "competition": "unknown", "risks": "Thin data.",
            "money": money, "ease": 4, "speed": 4, "evidence": 4,
            "tool": {"title": f"{title} Calculator", "one_liner": "Price your next bid.",
                     "demo": "Enter a quote, get a payback date.", "data_plan": "User input.",
                     "feasibility": tool_feasibility,
                     "acceptance": ["Entering a quote shows a payback date",
                                    "  entering a quote   shows a payback date ", "",
                                    "Works at phone width"]},
            "figures": [{"value": "slider", "meaning": "test", "timestamp": "00:12:05",
                         "said": said}]}


structured = None
if schema and "ideas" in schema.get("properties", {}):
    structured = {"episode_summary": "Test summary.", "opportunities": [
        _opportunity("Side Gig", 2, 2, "words nobody said here"),
        _opportunity("Solar Bid Desk", 5, 4, "drag a slider for battery cost")], "ideas": [
        {"title": "Solar Tipping Map", "one_liner": "Drag battery cost, watch countries flip to solar.",
         "timestamp": "00:12:05", "speaker": "", "context": "A slider for battery cost.",
         "demo": "A world map with a slider.", "data_plan": "Bundled illustrative data.",
         "feasibility": 5, "wow": 4, "fidelity": 5, "novelty": 3, "related_existing": None,
         "risks": "", "figures": [],
         "acceptance": [f"Line {i}" for i in range(1, 8)]},
        {"title": "Weak Idea", "one_liner": "Meh.", "timestamp": "00:00:31", "speaker": "",
         "context": "", "demo": "", "data_plan": "", "feasibility": 2, "wow": 2, "fidelity": 2,
         "novelty": 1, "related_existing": None, "risks": "", "figures": []}]}
elif schema:
    # Reviewer: passes every acceptance line in ./IDEA.json, except lines containing "FAIL"
    # (failed) and "SKIP" (left out, as a careless reviewer might), listed in reverse order.
    try:
        with open("IDEA.json") as f:
            lines = json.load(f).get("acceptance", [])
    except (OSError, ValueError):
        lines = []
    acceptance = [{"criterion": c, "pass": "FAIL" not in c, "evidence": "index.html"}
                  for c in reversed(lines) if "SKIP" not in c]
    structured = {"scores": {k: 8 for k in ["works", "fidelity", "wow", "ux", "code", "honesty"]},
                  "acceptance": acceptance, "must_fix": [], "improvements": ["x"],
                  "verdict": "pass", "headline": "Try it.", "summary": "Good."}

print(json.dumps({"type": "result", "subtype": "success", "is_error": False,
                  "result": f"ok ({len(stdin)} chars on stdin)", "structured_output": structured,
                  "total_cost_usd": 0.01, "num_turns": 1}))
