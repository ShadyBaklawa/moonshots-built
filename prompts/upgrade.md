The prototype in this directory is published (currently v$version, review score
$score/10). Your job is to ship v$next: a version that is clearly better to a visitor, not just
different.

## Why it's being upgraded
$reasons

## A fresh review of the current version suggests
$improvements

## Rules
- Keep the core idea and whatever already works. Do not rewrite from scratch unless the
  current code is broken beyond repair.
- Pick the 2–4 changes with the biggest visible payoff (new interaction, better data,
  sharper visuals, clearer story), do them properly, and skip the rest.
- If the reasons include a newer episode revisiting the topic, fold in what changed
  (new figures, new arguments), attributed and paraphrased.
- Update `README.md`: add a `v$next` entry at the top of `## Changelog`.
- Run `python3 $smoke .` and repeat until it reports no problems, then check
  `.review/desktop.png` and `.review/mobile.png`.

Finish with a short list of what changed in v$next.
