# Moonshots, Built

After every new episode of the Moonshots podcast, this repo reads the transcript, picks the
most buildable ideas, has an AI agent turn them into working browser prototypes, tests and
reviews them, and opens a pull request. Merge the PR and the prototypes go live on a public
gallery. Once a week it also goes back and upgrades the weakest published prototype.

```
 every 2h          new episode?                 per idea (top 2)                    you
┌────────┐   ┌──────────────────┐   ┌───────────────────────────────────┐   ┌──────────────┐
│ watch  │──▶│ fetch transcript │──▶│ build ─▶ smoke test ─▶ review     │──▶│ PR on GitHub │
│ (cron) │   │ extract + rank   │   │   ▲                      │ fix ×2 │   │ merge = live │
└────────┘   └──────────────────┘   │   └──────────────────────┘        │   └──────┬───────┘
                                    └───────────────────────────────────┘          ▼
 weekly: re-review → upgrade → keep only if the score went up → PR          gallery (Pages)
```

- **Builder**: a headless Claude Code session confined to `prototypes/<slug>/`, following
  [`prompts/standards.md`](prompts/standards.md): static, zero-setup, honest labels, phone-ready.
- **Smoke test**: headless Chromium loads the page at desktop and phone sizes, clicks
  controls, and fails on console errors, failed requests, missing files or horizontal overflow.
- **Reviewer**: a *separate* Claude session that didn't build the thing scores it on six axes
  (works, fidelity, wow, UX, code, honesty) from the code and screenshots. Below 7/10, or any
  blocking issue, sends it back to the builder; after two fix rounds it stays a draft.
- **Upgrades**: a newer episode that revisits a topic queues an update for that prototype;
  otherwise the lowest-scoring one gets a turn. The upgrade is thrown away unless the fresh
  review score beats the old one.

## Setup (once, ~10 minutes)

1. **Push this repo** to GitHub (private is fine).
2. **Auth for the agent.** Run `claude setup-token` on your laptop and save the token as the
   repo secret `CLAUDE_CODE_OAUTH_TOKEN` (runs then use your Claude subscription). Or set
   `ANTHROPIC_API_KEY` instead to pay per token.
3. **Let Actions open PRs:** Settings → Actions → General → Workflow permissions →
   *Read and write* + *Allow GitHub Actions to create and approve pull requests*.
4. **Pick where the gallery lives.**
   - Public repo, or GitHub Pro: Settings → Pages → Source: *GitHub Actions*. Done.
   - Private repo on a free plan: create an empty **public** repo (e.g. `moonshots-built-site`),
     enable Pages on its `gh-pages` branch, then in this repo set variable
     `PUBLISH_REPO=you/moonshots-built-site` and secret `PUBLISH_TOKEN` (fine-grained PAT with
     *Contents: read and write* on that repo only).
5. **First run:** Actions → *Watch for new episodes* → *Run workflow*. The first run marks
   older episodes as skipped and builds only the newest one.

Optional: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` secrets for a ping per run, and the
[Claude GitHub App](https://github.com/apps/claude) so you can comment `@claude make the chart
bigger` on any prototype PR (see `.github/workflows/claude.yml`).

## Using it from your phone

- A PR appears after each episode with review scores, a summary and a screenshot per
  prototype. **Merge** to publish, **close** to discard, or comment `@claude <fix>` on a draft.
- Build a specific episode now: *Watch for new episodes* → *Run workflow* → paste the
  podscripts URL.
- Upgrade a specific prototype: *Upgrade a prototype* → *Run workflow* → folder name.
- Hands-off mode: set variable `AUTO_PUBLISH=true` and anything that passes review is merged
  and published automatically.

## Settings (repo variables)

| Variable | Default | What it does |
| --- | --- | --- |
| `MODEL` | `claude-sonnet-5` | Model for scout, builder and reviewer |
| `MAX_IDEAS` | `2` | Prototypes built per episode |
| `PASS_SCORE` | `7.0` | Minimum weighted review score to publish |
| `AUTO_PUBLISH` | unset | `true` = merge passing PRs without you |
| `PUBLISH_REPO` | unset | Separate public repo for the gallery |
| `SOURCE_BASE_URL` | unset | Adds a "See how it was built" link, e.g. `https://github.com/you/repo/tree/main/prototypes` |

More knobs (fix rounds, turn limits, cooldowns) are in [`pipeline/config.py`](pipeline/config.py).

## Costs and limits

Each prototype is roughly one long build session plus 1–3 review/fix rounds; each run logs an
estimated cost to `state/costs.jsonl`. With `CLAUDE_CODE_OAUTH_TOKEN` this counts against your
subscription's usage limits rather than API billing; with an API key, set `MAX_BUDGET_USD` to cap
each agent call. An idle check (no new episode) uses no AI at all and about 30 s of Actions time.

## Safety

The builder only gets file tools and a short list of shell commands, runs inside the
prototype's folder, and never sees a git token (checkout uses `persist-credentials: false`;
PRs are opened by a separate step). Transcripts are only used as model input; nothing quotes
them beyond a short phrase, and every prototype links back to the episode. The gallery says
it's a fan project, not affiliated with the show.

## Local commands

```bash
pip install --require-hashes -r requirements.lock && python -m playwright install chromium
npm i -g @anthropic-ai/claude-code              # needs CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY

python -m pipeline detect                       # what's new (no AI)
python -m pipeline extract <episode-url>        # ranked ideas only
python -m pipeline run --episode-url <url>      # full build for one episode
python -m pipeline build-idea idea.json         # one prototype from a hand-written idea
python -m pipeline upgrade [slug]
python scripts/smoke.py prototypes/<slug>       # browser smoke test
python -m pipeline gallery && python -m http.server -d site
python -m pytest -q
scripts/lock.sh                                 # after editing requirements.txt (needs uv)
```
