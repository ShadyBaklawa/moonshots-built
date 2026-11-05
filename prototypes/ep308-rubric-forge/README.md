# Rubric Forge

A tool for teams rolling out AI who need to know which model actually does *their* work. Paste
the tasks your team does every day, and Rubric Forge turns them into a scored benchmark spec and
a side-by-side scoring sheet for up to four models — so you can see what a generic leaderboard
can't.

## Where this idea came from

Moonshots EP #308 ("Big Tech's $3T AI Bet, Claude Writes 90% of Anthropic's Code, AIs Editing AI
Brains"), around 00:35:55. Alex Wissner-Gross and Peter Diamandis argued that if you want AI to
get better at something you care about, you build a benchmark for it — and you don't need to be
an expert yourself, just find the experts and define what success looks like. Dave and Salim
added that companies should be building these benchmarks internally, not just relying on public
leaderboards. The same conversation referenced GDPX, a 206-task benchmark built with 14
specialist partners, on which even the best model only scored 12%.

## How to use it

1. **Paste your tasks.** One per line, in the box under "Your tasks." Add a short note after a
   `|` to describe what a good result looks like — it pre-fills that task's pass criteria.
2. **Click "Build benchmark spec."** Every line becomes an editable row: task, pass criteria, and
   a 1–5 weight for how much it matters.
3. **Name your models** under "Models to compare" (up to four).
4. **Score each cell.** Click a cell in the score sheet to cycle Pass → Partial → Fail → clear.
   The weighted score bar above the grid for each model updates the moment you click.
5. **Export** the spec and scores as JSON or CSV to share or archive.

No account, no server, no API key required for any of this. If you want help drafting pass
criteria for tasks you didn't write a note for, open "Optional: draft missing pass criteria with
AI," paste your own Anthropic API key, and click "Draft missing criteria." The key is only ever
held in a page variable in your browser tab — it's never saved or sent anywhere except directly
to Anthropic's API, and it disappears when you close or reload the page.

## What's real vs. simulated

- **Your tasks, spec, and scores** are exactly what you type and click — nothing here is
  generated or altered.
- **"Load example (insurance claims)"** fills in a bundled example benchmark (10 tasks, 3 models,
  pre-scored) so you can see the tool working before you bring your own tasks. It's always marked
  with a visible "Example data" badge, and its scores are illustrative, not a real evaluation of
  any actual product.
- **The AI-drafted pass criteria** (optional, bring-your-own-key) are a starting draft from the
  model you call — always reviewed and edited by you before they count as your spec.
- **The GDPX figures** (206 tasks, 14 partners, 12% top score) are quoted from the podcast and
  labeled "as stated on the podcast." They describe a different benchmark than the example in
  this tool.

## Ideas for a v2

- Let a team invite colleagues to score the same grid independently, then show inter-rater
  agreement.
- Track a benchmark over time, so a re-run after each model release shows whether scores moved.
- Add a "confidence" note per cell so scorers can flag tasks that need a second opinion.
- Support partial weights or sub-criteria within a single task.

## Changelog

### v1
- Initial release: paste-to-spec flow, editable weighted spec table, up to four models, a
  click-to-cycle scoring grid with live weighted score bars, JSON/CSV export, a bundled
  insurance-claims example, and optional bring-your-own-key AI drafting of pass criteria.
