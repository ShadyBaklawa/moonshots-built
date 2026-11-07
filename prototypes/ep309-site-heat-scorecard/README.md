# Site Heat Scorecard

A working tool for data center developers, site-selection consultants and land brokers: enter
candidate sites with plain facts (moratorium status, next vote date, distance to homes, water
source, tax abatement, known opposition groups) and get each one a weighted 0–100 political and
permitting risk score, ranked, with the reasons spelled out — then export a one-page memo.

## Origin

From Moonshots #309, "The Great Collision Between Politics and AI" (around 00:06:01). Salim
Ismail said opposition to big tech and data centers shaped the midterms, with Goldman Sachs
estimating 45% of planned US build could face restrictions and candidates calling for pauses
winning or leading 12 governor races; Dave added that building will shift to friendlier states.
That became the idea behind this scorecard, and the business opportunity "Moratorium Radar" — a
subscription briefing that tracks county and state moratoriums for developers.

## How to use it

1. Three example sites are pre-loaded (labelled "Example: …") so you can see how the ranking
   works immediately. Remove them and add your own with "Add a candidate site".
2. Each site gets a 0–100 risk score, colour-coded from cool (low risk) to hot red (high risk),
   ranked highest-risk first, with every contributing factor and its point value listed.
3. Drag the sliders under "Risk factor weights" to match your own judgment of what matters most —
   the scorecard re-ranks instantly.
4. Click "Draft community talking points" on any site for a starting point for public comment.
5. Click "Export memo" to open a print-ready one-page summary of every site, its score and its
   reasons — print or save as PDF from your browser's print dialog.

## What's real vs simulated

- The risk score is a transparent weighted formula over the facts **you** enter — nothing is
  looked up or guessed. The six factors and their default weights are this tool's own
  assumptions, visible and editable.
- The three pre-loaded sites are example data, clearly labelled "Example:" in their names —
  delete them before relying on the scorecard for a real decision.
- The 56% opposition figure, 45% at-risk estimate and 12 governor races in the header are the
  episode's own figures, labelled "as stated on the podcast". They're background context, not
  inputs to the score.
- Community talking points are AI-drafted only if you paste your own Anthropic API key (kept in
  this browser's local storage only, never sent anywhere but Anthropic's API). Without a key, the
  talking points are a template filled from your site's own data and clearly tagged "Example".

## v2 ideas

- Bundle a dataset of known county moratorium ordinances to pre-fill moratorium status by
  county.
- Let a user save/load a scorecard as a shareable JSON or link.
- Add a map view plotting sites by risk colour.
- Track scorecards over time as votes happen, instead of a single snapshot.

## Changelog

### v1
- Initial release: site form, weighted 0–100 heat-coloured scorecard with ranked reasons, live
  weight sliders, printable one-page memo export, and an optional-API-key / labelled-example
  talking points section.
