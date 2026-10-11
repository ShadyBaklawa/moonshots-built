# Coffee Cup Horizon

A log-scale cost curve that falls toward a dashed "cup of coffee" line. Pick a claim quoted on the
show, or type in your own cost and yearly decline rate, and watch an animated line show you the
exact month the price undercuts your coffee.

## What it is

Enter what an AI feat costs today, how fast that cost falls each year, and what a cup of coffee
costs. The chart plots an exponential decay curve on a log scale and marks the date the curve
crosses below your coffee line. A comparison strip shows two podcast-quoted scenarios and your own
live scenario side by side.

## Origin

From [Moonshots #288: "Should we slow down AI progress?"](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/should-we-slow-down-ai-progress-moonshots-288),
around 00:58:55. Peter Diamandis, citing Noam Brown, discusses how a frontier AI result that cost
"hundreds of thousands of dollars" became doable for about $20 within roughly two years, and
projects that same curve onto a multi-million-dollar math result discussed the same week.

## How to use

1. Pick a preset pill ("Noam Brown's claim" or "This week's math result") to load the figures
   quoted on the podcast, or leave "Custom" selected and type your own numbers.
2. Adjust **starting cost**, **yearly decline** (the curve divides the cost by this factor every
   year), and **price of a cup of coffee** with the number fields or sliders.
3. Watch the amber line animate down the log-scale chart and read the crossing date at the top of
   the chart panel.
4. Scroll down to the **Side by side** strip to compare both podcast scenarios against your live
   "Your scenario" card, all evaluated at the same coffee price.

## Real vs. simulated

- **From the podcast, labeled as such:** the $300,000 → $20-in-2-years figure (Noam Brown's claim,
  bundled in `data/presets.json`) and the ~$3,000,000 starting cost for "this week's math result."
  The math result's decline rate is explicitly a *projection* using Brown's curve, not a number
  stated on the show.
- **Everything else is your input:** starting cost, decline rate, and coffee price you type or
  drag are plain exponential math (`cost(t) = startCost / decline^t`) computed live in the
  browser. No external data, no backend, no tracking.

## v2 ideas

- Let visitors save/share a scenario via a URL query string.
- Add a second horizontal reference line (e.g. "price of a Netflix subscription") for extra
  context beyond coffee.
- Pull in a live inflation-adjusted coffee price instead of a fixed default.

## Changelog

### v1
- Initial release: animated log-scale cost curve, coffee-price horizon line, two podcast-cited
  presets plus free-form custom inputs, and a side-by-side comparison strip.
