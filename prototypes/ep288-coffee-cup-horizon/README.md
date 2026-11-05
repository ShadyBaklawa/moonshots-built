# Coffee Cup Horizon

A log-scale cost curve that falls toward a dashed horizon line — a cup of coffee by default, or
a kWh of electricity, or a kg of mass. Pick a claim quoted on the show, or type in your own cost
and yearly decline rate, and watch an animated line show you the exact month the price undercuts
your horizon.

## What it is

Enter what an AI feat costs today, how fast that cost falls each year, and the price of your
chosen horizon unit. The chart plots an exponential decay curve on a log scale and marks the date
the curve crosses below that line — and below a year of daily purchases of it. A comparison strip
and a set of "quick compare" chips up top show the podcast-quoted scenarios and your own live
scenario side by side.

## Origin

From [Moonshots #288: "Should we slow down AI progress?"](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/should-we-slow-down-ai-progress-moonshots-288),
around 00:58:55. Peter Diamandis, citing Noam Brown, discusses how a frontier AI result that cost
"hundreds of thousands of dollars" became doable for about $20 within roughly two years, and
projects that same curve onto a multi-million-dollar math result discussed the same week.

The kWh and kg horizon-unit options are a generic illustrative extension of that same idea —
pricing the curve against a different everyday unit instead of coffee — and aren't tied to any
podcast claim, figure, or named person.

## How to use

1. Pick a preset pill ("Noam Brown's claim" or "This week's math result") to load the figures
   quoted on the podcast, or leave "Custom" selected and type your own numbers.
2. Adjust **starting cost** and **yearly decline** (the curve divides the cost by this factor
   every year) with the number fields or sliders.
3. Pick a horizon unit — ☕ Coffee, ⚡ kWh, or ⚖️ kg — and set its price. Watch the amber line
   animate down the log-scale chart and read the crossing date for both the single-unit line and
   the dotted "year of daily purchases" line at the top of the chart panel.
4. Check the **quick compare** chips right under the headline for an instant read on both podcast
   scenarios at your current horizon price, or follow "See full comparison" down to the **Side by
   side** strip for the full cards.

## Real vs. simulated

- **From the podcast, labeled as such:** the $20 end-point and the "roughly two years" of Noam
  Brown's claim are as stated. The actual quote for the starting cost is "hundreds of thousands
  of dollars" — the $300K figure shown is an illustrative instantiation of that range, labeled as
  such in the UI and `data/presets.json`. "This week's math result" similarly instantiates a
  "multi-million-dollar" quote as $3M; its decline rate is explicitly a *projection* using
  Brown's curve, not a number stated on the show, and the chart shows a "Projected rate" badge
  whenever that preset is active so the chart alone doesn't imply otherwise.
- **Illustrative, generic:** the kWh and kg horizon units and their default prices are not from
  the podcast — they're a generic extension of the coffee-price idea, with no claim to a real
  kWh or kg price and no attribution to any episode or person.
- **Everything else is your input:** starting cost, decline rate, and horizon price you type or
  drag are plain exponential math (`cost(t) = startCost / decline^t`) computed live in the
  browser, including the "year of daily purchases" line (price × 365). No external data, no
  backend, no tracking.

## v2 ideas

- Pull in a live inflation-adjusted coffee price instead of a fixed default.
- Let visitors pick from more illustrative horizon baskets (a month of groceries, a laptop).

## Changelog

### v4
- Removed an incorrect reference to a second, unrelated episode (Moonshots #304) and its
  dollar figures and named-person attributions from the footer and README — those claims
  weren't in this prototype's brief and couldn't be verified, so the kWh/kg horizon units are
  now described as a generic illustrative extension of the coffee-price idea with no episode
  or person cited.
- Raised caption, note, and footer text to the 15px body-text floor for readability.
- Tightened the "This week's math result" preset's chip/card copy to say "projected on Brown's
  curve" instead of the vaguer "same curve," matching the on-chart "Projected rate" badge.
- Added a "Copy link to this scenario" button that encodes startCost, decline, coffee price,
  and horizon unit into the URL's query string, so a scenario can be shared and reloaded.

### v3
- Added a horizon-unit toggle (☕ coffee / ⚡ kWh / ⚖️ kg) as an illustrative extension of the
  original coffee-price idea.
- Fixed a singular/plural bug in the crossing-date readout ("1 months" → "1 month").
- Reworded the two dollar-figure presets so the UI and data file make clear the exact starting
  costs ($300K, $3M) are illustrative instantiations of the vaguer phrases actually used on the
  podcast ("hundreds of thousands," "multi-million-dollar"), not quoted numbers.
- Added an on-chart "Projected rate" badge when the math-result preset is active, so a visitor
  reading only the chart — not the sidebar note or README — isn't misled into thinking its
  decline rate was stated on the show.
- Removed the Episode 303 robot-task preset to tighten fidelity back to the Episode 288 brief;
  the comparison strip and hero chips are back to the two directly-sourced scenarios.

### v2
- Added a third podcast-cited preset, "Robot task cost (Ep 303)," pulling in a newer episode's
  figure that a robot subtask's cost fell 84% in two months — already cheaper than a cup of
  coffee today. (Removed in v3; see above.)
- Added a second, dotted reference line and readout for "a year of daily coffees" (coffee price
  × 365), so the chart tells two crossing stories instead of one.
- Added "quick compare" chips in the hero so podcast scenarios are visible, and the full
  comparison strip discoverable, without scrolling.
- Accessibility: added explicit `aria-label`s to the three range sliders, and aligned the
  yearly-decline slider's minimum with its number field (both now floor at 1.01).

### v1
- Initial release: animated log-scale cost curve, coffee-price horizon line, two podcast-cited
  presets plus free-form custom inputs, and a side-by-side comparison strip.
