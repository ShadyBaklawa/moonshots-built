# Denominator Dash

A single-screen demo that races the US national debt against GDP growth from 2025 to 2040 and
shows the debt-to-GDP ratio as a speedometer-style gauge, so the effect of faster (AI-driven)
growth on the ratio is visible in seconds rather than explained in a paragraph.

## Origin

From Moonshots EP #304 ("Chamath: AGI Is Here, Anthropic's $100B Giveaway, Elon's SpaceX Shares
for 72M Kids"), around 01:08–01:09. Elon argues only AI and robots can solve the debt problem;
Peter Diamandis cites the ~$40T national debt (growing $2.44T in the past year, about $6.5B/day,
with $3B/day paid in interest) against Jack Clark/Anthropic's projection that US GDP could grow
from $30T to $44T by 2030 — far outpacing the historic 2–3%/year average.

## How to use

- Drag the three sliders — GDP growth/year, debt growth/year, and an illustrative healthcare
  cost cut — to set a scenario, or tap a preset (Historic, Anthropic Projection, Elon Bull Case).
- The line chart races the debt line (red) against the GDP line (green) from 2025 to 2040, with
  a playhead sweeping across on each change.
- The gauge and the Debt/GDP readouts track the playhead's current year as the race plays.
- "Replay the race" re-runs the animation for the current slider settings without changing them.

## Real vs. simulated

- **Real, as stated on the podcast:** the $40T 2025 debt figure, $2.44T/year debt growth,
  $6.5B/day debt added, $3B/day interest paid, the $44T-by-2030 Anthropic GDP projection, and
  the 2–3%/year historic growth range shown in the top stat strip (bundled in
  `data/figures.json`).
- **Illustrative, not a podcast figure:** the model's $30T "2025 GDP" starting point. It is
  never stated in the episode — it's an assumed baseline chosen so the race reaches the verified
  $44T-by-2030 figure. It's labeled as illustrative wherever it appears in the UI, and kept out
  of the "verified figures" stat strip.
- **Derived from the figure above:** the "Anthropic Projection" preset's ~8%/year GDP growth is
  a simple compound annual growth rate calculated from the illustrative $30T baseline against the
  verified $44T by 2030 — not itself a quoted number.
- **Simulated / illustrative, not a forecast:** everything on the chart, gauge, and readouts.
  The model is intentionally simple — debt grows by a fixed $/year, GDP compounds at a fixed
  annual rate — with no interest-rate dynamics, policy response, or recession risk. The
  "healthcare cost cut" slider and the "Elon Bull Case" preset's specific numbers are illustrative
  scenario inputs, not figures or forecasts attributed to Elon Musk.

## v2 ideas

- Add an interest-rate dynamic so higher debt compounds interest costs, feeding back into the
  debt growth rate.
- Let visitors compare two scenarios side-by-side instead of replacing the single race.
- Add a "what would it take" solver: given a target 2040 ratio, back out the required GDP growth.

## Changelog

### v1.1
- Fixed an honesty issue: the stat strip and a slider hint presented the $30T "2025 GDP"
  starting point as if it were stated on the podcast (grouped with the $40T debt, $2.44T/year,
  etc. under "as stated on the podcast"). Only $44T-by-2030 is actually a verified podcast
  figure — $30T is an assumed baseline for the model. Moved it out of the verified stat strip,
  added a dedicated note calling it out as illustrative, and reworded the GDP-growth slider hint
  so the 8–10%/year AI-case rates read as derived/illustrative rather than "cited" on the
  podcast. Updated `data/figures.json` and the README's "Real vs. simulated" section to match.

### v1
- Initial release: animated debt-vs-GDP race chart, debt-to-GDP gauge, three sliders, three
  presets (Historic, Anthropic Projection, Elon Bull Case), bundled verified episode figures.
