"""Thin wrapper around the Claude Code CLI in headless mode (`claude -p`).

Auth: set CLAUDE_CODE_OAUTH_TOKEN (Claude subscription, from `claude setup-token`) or
ANTHROPIC_API_KEY (pay per token). With the OAuth token, runs draw on the subscription
instead of API billing.
"""
from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

from . import config


class ClaudeError(RuntimeError):
    pass


@dataclass
class ClaudeResult:
    text: str
    structured: dict | None
    cost_usd: float
    turns: int
    raw: dict


COST_LOG = config.STATE_DIR / "costs.jsonl"


def run_claude(
    prompt: str,
    *,
    cwd: Path,
    label: str,
    schema: dict | None = None,
    tools: str | None = "",
    allowed_tools: list[str] | None = None,
    permission_mode: str = "dontAsk",
    max_turns: int | None = None,
    stdin: str | None = None,
    system_append_file: Path | None = None,
    model: str | None = None,
    timeout: int | None = None,
) -> ClaudeResult:
    """Run one headless Claude Code session and return its result.

    tools=""        -> no built-in tools at all (pure text task)
    tools="Read,..." -> only these tools exist in the session
    allowed_tools   -> pre-approved tool rules (e.g. "Bash(node *)")
    """
    args = [
        config.CLAUDE_BIN, "-p", prompt,
        "--output-format", "json",
        "--model", model or config.MODEL,
        "--permission-mode", permission_mode,
        "--permission-prompts", "none",
        "--no-session-persistence",
        "--disallowedTools", "mcp__*",
    ]
    if tools is not None:
        args += ["--tools", tools]
    if allowed_tools:
        args += ["--allowedTools", ",".join(allowed_tools)]
    if schema is not None:
        args += ["--json-schema", json.dumps(schema)]
    if max_turns:
        args += ["--max-turns", str(max_turns)]
    if system_append_file:
        args += ["--append-system-prompt-file", str(system_append_file)]
    if config.MAX_BUDGET_USD and os.getenv("ANTHROPIC_API_KEY"):
        args += ["--max-budget-usd", config.MAX_BUDGET_USD]

    print(f"[claude:{label}] starting in {cwd}", flush=True)
    try:
        proc = subprocess.run(
            args, cwd=str(cwd), input=stdin, capture_output=True, text=True,
            timeout=timeout or config.AGENT_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired as e:
        raise ClaudeError(f"{label}: timed out after {e.timeout}s") from e

    out = proc.stdout.strip()
    try:
        data = json.loads(out.splitlines()[-1] if out else "{}")
    except json.JSONDecodeError:
        raise ClaudeError(f"{label}: non-JSON output (exit {proc.returncode}): "
                          f"{out[-800:]} {proc.stderr[-800:]}")

    cost = float(data.get("total_cost_usd") or 0)
    turns = int(data.get("num_turns") or 0)
    _log_cost(label, cost, turns, data.get("subtype"))
    print(f"[claude:{label}] done: subtype={data.get('subtype')} turns={turns} est_cost=${cost:.2f}",
          flush=True)

    structured = data.get("structured_output")
    if data.get("is_error") and not (data.get("subtype") == "error_max_turns" and schema is None):
        raise ClaudeError(f"{label}: {data.get('subtype')}: {str(data.get('result'))[:800]}")
    if schema is not None and not isinstance(structured, dict):
        raise ClaudeError(f"{label}: missing structured_output: {str(data.get('result'))[:800]}")
    return ClaudeResult(text=str(data.get("result") or ""), structured=structured,
                        cost_usd=cost, turns=turns, raw=data)


def _log_cost(label: str, cost: float, turns: int, subtype: str | None) -> None:
    from .state import now
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with COST_LOG.open("a") as f:
        f.write(json.dumps({"at": now(), "label": label, "est_cost_usd": round(cost, 4),
                            "turns": turns, "subtype": subtype}) + "\n")
