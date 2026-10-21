# Coffee Cup Horizon

A log-scale cost curve that falls toward a dashed "cup of coffee" line. Pick a claim quoted on the
show, or type in your own cost and yearly decline rate, and watch an animated line show you the
exact month the price undercuts your coffee.

## What it is

Enter what an AI feat costs today, how fast that cost falls each year, and what a cup of coffee
costs. The chart plots an exponential decay curve on a log scale and marks the date the curve
crosses below your coffee line — and below a year of daily coffees. A comparison strip and a
set of "quick compare" chips up top show three podcast-quoted scenarios and your own live
scenario side by side.

## Origin

From [Moonshots #288: "Should we slow down AI progress?"](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/should-we-slow-down-ai-progress-moonshots-288),
around 00:58:55. Peter Diamandis, citing Noam Brown, discusses how a frontier AI result that cost
"hundreds of thousands of dollars" became doable for about $20 within roughly two years, and
projects that same curve onto a multi-million-dollar math result discussed the same week.

A later episode, Moonshots #303 ("Flying Tesla, car-robot brains, halving in cost every 3 weeks,
and why incentives decide AI alignment"), revisits the idea: Imad cites a benchmark showing the
cost for a frontier model to complete a robot subtask fell from $2.36 to about $0.38 in two
months — an 84% drop he frames as roughly halving every three weeks. That figure is now a third
preset here.

## How to use

1. Pick a preset pill ("Noam Brown's claim," "This week's math result," or "Robot task cost (Ep
   303)") to load the figures quoted on the podcast, or leave "Custom" selected and type your own
   numbers.
2. Adjust **starting cost**, **yearly decline** (the curve divides the cost by this factor every
   year), and **price of a cup of coffee** with the number fields or sliders.
3. Watch the amber line animate down the log-scale chart and read the crossing date for both the
   single-coffee line and the dotted "year of daily coffees" line at the top of the chart panel.
4. Check the **quick compare** chips right under the headline for an instant read on all three
   podcast scenarios at your current coffee price, or follow "See full comparison" down to the
   **Side by side** strip for the full cards.

## Real vs. simulated

- **From the podcast, labeled as such:** the $300,000 → $20-in-2-years figure (Noam Brown's claim),
  the ~$3,000,000 starting cost for "this week's math result," and the $2.36 → $0.38-in-2-months
  robot task figure from episode 303 — all bundled in `data/presets.json`. The math result's
  decline rate is explicitly a *projection* using Brown's curve, not a number stated on the show.
- **Everything else is your input:** starting cost, decline rate, and coffee price you type or
  drag are plain exponential math (`cost(t) = startCost / decline^t`) computed live in the
  browser, including the "year of daily coffees" line (coffee price × 365). No external data, no
  backend, no tracking.

## v2 ideas

- Let visitors save/share a scenario via a URL query string.
- Pull in a live inflation-adjusted coffee price instead of a fixed default.
- Let visitors toggle the second reference line between a few preset "baskets" (a year of
  coffees, a month of groceries, a laptop) instead of only the coffee multiple.

## Changelog

### v2
- Added a third podcast-cited preset, "Robot task cost (Ep 303)," pulling in the newer episode's
  figure that a robot subtask's cost fell 84% in two months — already cheaper than a cup of
  coffee today.
- Added a second, dotted reference line and readout for "a year of daily coffees" (coffee price
  × 365), so the chart tells two crossing stories instead of one.
- Added "quick compare" chips in the hero so all three podcast scenarios are visible, and the
  full comparison strip discoverable, without scrolling.
- Accessibility: added explicit `aria-label`s to the three range sliders, and aligned the
  yearly-decline slider's minimum with its number field (both now floor at 1.01).

### v1
- Initial release: animated log-scale cost curve, coffee-price horizon line, two podcast-cited
  presets plus free-form custom inputs, and a side-by-side comparison strip.
