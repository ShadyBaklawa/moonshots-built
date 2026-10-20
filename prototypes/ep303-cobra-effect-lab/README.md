# Cobra Effect Lab

## What it is
A retro control-room simulator where you design an incentive, then watch it backfire.
Pick a scenario, crank an "incentive strength" dial, and run a 10-week simulation: a bright
green "official metric" climbs beautifully while a hidden red "real outcome" line stalls or
drops as the population games the reward. A banner reveals exactly how they gamed it, then a
closing card shows what really happened in the historical case.

## Origin
Inspired by Moonshots #303, around 00:40:29, where Peter Diamandis describes the "cobra
effect": colonial Hanoi's bounty on rat tails led to rat farming instead of fewer rats, and a
major bank's account-opening quota led employees to open an estimated 3.5 million fake
accounts. Both anecdotes are paraphrased here, not quoted from the transcript.

## How to use
1. Pick a scenario card (Rat Tail Bounty, Cross-Sell Quota, or Ticket Quota Precinct).
2. Drag the incentive dial — higher pressure means a bigger reward for hitting the number.
3. Hit "Run 10-week simulation" and watch the two lines diverge on the chart.
4. When the gaming strategy kicks in, a reveal banner explains the trick in plain language.
5. After week 10, a card shows the real historical facts (or, for the third scenario, the
   generalized research pattern it's based on).

## Real vs. simulated
- The rat-tail bounty and bank cross-sell quota facts are **as stated on the podcast**.
- The "Ticket Quota Precinct" scenario is an explicit **generalized, non-partisan pattern**
  drawn from public-administration research on quota policing — not a specific real agency —
  to avoid the politically charged framing the idea brief flagged.
- Every week-by-week number, chart line, and "gamed units" count is a **simulated model**
  driven by the dial, not measured data.

## v2 ideas
- Let players type a custom incentive and scenario, with an optional AI-assisted (bring your
  own key) prediction of how it might get gamed.
- Add a "redesign the incentive" step where players tie the reward to the real outcome metric
  and re-run the simulation to see the gap close.
- Sound/haptic cues on the reveal moment for a bigger "gotcha" beat.

## Changelog
### v2
- Fixed: "Run simulation" button is now `disabled` from first paint instead of only after a
  reviewer-flagged bug where it looked clickable but silently did nothing until a scenario
  was picked.
- Synced the offline fallback copy of the rat-farm icon with `data/scenarios.json` (both now
  use 🕳️).
- Chart lines are now also distinguished by shape and stroke style (solid line + circle dots
  for the official metric, dashed line + square markers for the real outcome), not color alone.
- The gaming-strategy reveal banner and a new line on the historical-facts card now scale their
  language to the incentive dial setting (mild/moderate/extreme), so a low-pressure run reads
  differently from a maxed-out one.
- Scenario cards now support left/right/up/down arrow-key navigation between options, per the
  standard radiogroup keyboard pattern.

### v1
- Initial build: three scenarios, incentive dial, animated canvas chart, gamed-units
  pictogram strip, gaming-strategy reveal banner, and historical facts card.
