#!/usr/bin/env bash
# Commit pipeline state to the default branch, then open a PR with the built/upgraded prototypes.
# Usage: scripts/ship.sh out/run.json   (needs GH_TOKEN, GITHUB_REPOSITORY; optional AUTO_PUBLISH=true)
set -euo pipefail

OUT="${1:-out/run.json}"
BASE="${BASE_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

# 1) State goes straight to the base branch so the next run never redoes an episode.
git add state/
if ! git diff --cached --quiet; then
  git commit -q -m "chore(state): update pipeline state [skip ci]"
  git pull -q --rebase --autostash origin "$BASE"
  git push -q origin "HEAD:$BASE"
  echo "state committed to $BASE"
fi

[ -f "$OUT" ] || { echo "no $OUT, nothing to ship"; exit 0; }
[ "$(jq -r .action "$OUT")" = "pr" ] || { echo "no PR needed"; exit 0; }

BRANCH=$(jq -r .branch "$OUT")
TITLE=$(jq -r .title "$OUT")
DRAFT=$(jq -r .draft "$OUT")
ALL_READY=$(jq -r .all_ready "$OUT")
mkdir -p out
jq -r .body "$OUT" > out/pr-body.md

# 2) Prototypes go on their own branch -> PR. A human merge is the publish button.
git checkout -q -B "$BRANCH"
jq -r '.paths[]' "$OUT" | while read -r p; do git add -A -- "$p"; done
if git diff --cached --quiet; then
  echo "nothing changed in prototype paths"; exit 0
fi
git commit -q -m "feat(prototypes): $TITLE"
git push -q -f origin "$BRANCH"

# Only an open PR is updated in place. `gh pr view <branch>` also finds merged and closed PRs,
# so a re-run of an episode whose PR was already merged would otherwise edit that old PR.
if [ "$(gh pr view "$BRANCH" --json state --jq .state 2>/dev/null)" = "OPEN" ]; then
  gh pr edit "$BRANCH" --title "$TITLE" --body-file out/pr-body.md
else
  args=(--base "$BASE" --head "$BRANCH" --title "$TITLE" --body-file out/pr-body.md)
  [ "$DRAFT" = "true" ] && args+=(--draft)
  gh pr create "${args[@]}"
fi

# 3) Optional hands-off mode: merge when everything passed review, then publish.
if [ "${AUTO_PUBLISH:-}" = "true" ] && [ "$ALL_READY" = "true" ]; then
  gh pr merge "$BRANCH" --squash --delete-branch
  gh workflow run publish.yml --ref "$BASE"
  echo "auto-published"
fi
