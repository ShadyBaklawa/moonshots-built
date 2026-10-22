#!/usr/bin/env python3
"""Stand-in for the `claude` CLI in tests. Echoes canned JSON based on the --json-schema shape."""
import json
import sys

args = sys.argv[1:]
schema = json.loads(args[args.index("--json-schema") + 1]) if "--json-schema" in args else None
stdin = sys.stdin.read() if not sys.stdin.isatty() else ""

structured = None
if schema and "ideas" in schema.get("properties", {}):
    structured = {"episode_summary": "Test summary.", "ideas": [
        {"title": "Solar Tipping Map", "one_liner": "Drag battery cost, watch countries flip to solar.",
         "timestamp": "00:12:05", "speaker": "", "context": "A slider for battery cost.",
         "demo": "A world map with a slider.", "data_plan": "Bundled illustrative data.",
         "feasibility": 5, "wow": 4, "fidelity": 5, "novelty": 3, "related_existing": None,
         "risks": "", "figures": []},
        {"title": "Weak Idea", "one_liner": "Meh.", "timestamp": "00:00:31", "speaker": "",
         "context": "", "demo": "", "data_plan": "", "feasibility": 2, "wow": 2, "fidelity": 2,
         "novelty": 1, "related_existing": None, "risks": "", "figures": []}]}
elif schema:
    structured = {"scores": {k: 8 for k in ["works", "fidelity", "wow", "ux", "code", "honesty"]},
                  "must_fix": [], "improvements": ["x"], "verdict": "pass",
                  "headline": "Try it.", "summary": "Good."}

print(json.dumps({"type": "result", "subtype": "success", "is_error": False,
                  "result": f"ok ({len(stdin)} chars on stdin)", "structured_output": structured,
                  "total_cost_usd": 0.01, "num_turns": 1}))
