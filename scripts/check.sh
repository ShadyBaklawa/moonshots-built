#!/usr/bin/env bash
# One gate before calling a pipeline change done: tests, syntax, no tracked secrets, hashed locks.
# Meant to stay under ~30 s. Exit code 0 = green. The real-browser test needs
# `playwright install chromium` (CI has it). Set PYTHON to use another interpreter.
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
start=$(date +%s)

"$PY" -m pytest -q
"$PY" -m compileall -q pipeline scripts tests

if git ls-files | grep -iE '(^|/)\.claude/settings\.local\.json$|(^|/)\.env$'; then
  echo "check: a secret-bearing file is tracked by git (see above)" >&2
  exit 1
fi

grep -q -- '--hash=sha256:' requirements.lock || { echo "check: requirements.lock has no sha256 hashes" >&2; exit 1; }

echo "check: green in $(( $(date +%s) - start )) s"
