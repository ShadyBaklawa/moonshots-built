# Moonshots, Built

Pipeline that turns ideas from new Moonshots podcast episodes into reviewed static prototypes.

## Layout
- `pipeline/`: Python package (`python -m pipeline <cmd>`): `feed` (podscripts parsing),
  `extract` (idea scout + ranking), `build` (builder agent + fix loop), `verify` (Playwright
  smoke test), `review` (independent reviewer), `upgrade`, `gallery`, `cli`.
- `prompts/`: agent prompts. `standards.md` is appended to every builder/reviewer session.
- `prototypes/<slug>/`: one folder per prototype. `meta.json` and `IDEA.json` are written by
  the pipeline only; `.review/` is scratch (gitignored).
- `state/`: committed JSON state (episodes seen, upgrade queue, cost log).
- `scripts/ship.sh`: commits state to main and opens the PR. `scripts/smoke.py`: smoke test.

## Rules
- Working inside `prototypes/<slug>/`: follow `prompts/standards.md`, touch only that folder,
  and run `python3 scripts/smoke.py prototypes/<slug>` until it passes.
- Changing the pipeline: keep `python -m pytest -q` green; add a test for new parsing or
  selection logic. Conventional commits (`feat:`, `fix:`, `chore:`).
- Never commit secrets; auth comes from `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY` env vars.
