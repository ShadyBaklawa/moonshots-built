#!/usr/bin/env python3
"""Loop breaker (playbook P20): a PreToolUse hook that stops an agent repeating itself.

When the same tool is called with the same input 3 times in a row in one session, the third
call is blocked (exit 2) and the agent is told to change approach. History is kept per session
in the temp folder, so nothing is written into the repo. Any error here lets the call through:
a broken hook must never block the agent.
"""
import hashlib
import json
import pathlib
import sys
import tempfile

LIMIT = 3
# Free-text fields the model rewrites on every call ("run 2 of 3"); they don't change what the
# call does, so they are left out of the comparison. Found in a real run on 3 Nov 2026.
IGNORED = {"description"}


def main() -> int:
    try:
        ev = json.load(sys.stdin)
        inp = ev.get("tool_input")
        if isinstance(inp, dict):
            inp = {k: v for k, v in inp.items() if k not in IGNORED}
        key = hashlib.sha256(
            json.dumps([ev.get("tool_name"), inp], sort_keys=True, default=str).encode()
        ).hexdigest()[:32]
        sid = "".join(c for c in str(ev.get("session_id", "")) if c.isalnum() or c == "-")[:64] or "none"
        path = pathlib.Path(tempfile.gettempdir()) / f"claude-loop-breaker-{sid}"
        lines = path.read_text().split("\n") if path.exists() else []
        hist = [ln for ln in lines if ln][-(LIMIT - 1):]
        use_id = str(ev.get("tool_use_id") or "")
        if use_id and hist and hist[-1].endswith(" " + use_id):
            return 0  # the same call seen twice (hook registered twice): count it once
        hist.append(f"{key} {use_id}".strip())
        path.write_text("\n".join(hist) + "\n")
    except Exception:
        return 0
    keys = [h.split(" ")[0] for h in hist]
    if len(keys) == LIMIT and len(set(keys)) == 1:
        print(f"Same tool call {LIMIT}x in a row. Stop, explain why it failed, and try a different approach.",
              file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
