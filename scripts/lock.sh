#!/usr/bin/env bash
# Regenerate requirements.lock from requirements.txt: exact versions with hashes,
# nothing uploaded in the last 7 days (new releases are where hijacked packages
# show up, e.g. litellm 1.107.0 on 21 Oct 2026, pulled within 2 hours).
# Security fixes that can't wait go in requirements-overrides.txt with a reason,
# and get their own --exclude-newer-package date below. Needs uv.
set -euo pipefail
cd "$(dirname "$0")/.."
cutoff="$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)"
uv pip compile requirements.txt \
  --override requirements-overrides.txt \
  --exclude-newer-package "certifi=2026-10-21T00:00:00Z" \
  --generate-hashes --no-header \
  --python-version 3.12 --python-platform x86_64-unknown-linux-gnu \
  --exclude-newer "$cutoff" \
  -o requirements.lock
echo "requirements.lock regenerated (cutoff $cutoff). Review the diff, then run: pip install --require-hashes -r requirements.lock && python -m pytest -q"
