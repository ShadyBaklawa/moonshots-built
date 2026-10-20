# The Slop Drop

## What it is
A single-screen simulator of OpenAI's 722-problem math "drop": a grid of 722 tiles
represents every problem attempted. Press **Run the drop** and watch tiles flip to solved
(green) or unsolved (red) one by one, while a live meter ticks up elapsed compute-hours,
estimated dollar cost, and the running solve rate. A second panel lets you compare "human
pace" against "AI pace" on an identical progress bar that represents wildly different real
timespans.

## Origin
From Moonshots EP #302, "OpenAI Bulk-Solves 722 Math Problems, Anthropic's Cruelty Policy,
and Elon's Quadrillion-Dollar SpaceX," around 00:40:55. Peter Diamandis and Alex discuss
OpenAI releasing 722 math solutions in a single GitHub drop, each costing roughly 3 hours
of compute, with only 15–20% of attempted problems actually solved — and some mathematicians
pushing back on the quality and framing of the release.

## How to use
1. Open `index.html` in a browser (served statically — no install needed).
2. Pick a speed (1×, 5×, 20×) and click **Run the drop** to watch the grid fill in, or
   **Pause**/**Reset** at any point.
3. Watch the live meter: elapsed compute-hours, estimated cost, and solve rate update as
   tiles are processed.
4. In the lower card, toggle **Human pace** vs. **AI pace** and click **Play timeline** to
   see the same bar fill over the same few seconds — once representing roughly a decade,
   once representing about two weeks.

## Real vs. simulated
- **Real (as stated on the podcast):** 722 problems in the drop, ~3 hours of compute per
  problem, a 15–20% solve rate, a cost estimate in the low tens of millions of dollars, and
  the framing of "a decade of progress in about two weeks." These figures live in
  `data/stats.json` and are explicitly sourced from the episode, not from OpenAI's actual
  release notes.
- **Simulated:** which specific tiles are "solved" is randomized on each run, the flip
  animation and its pacing are stylized for the demo, and the tiles are not a reproduction
  of any real problems or proofs. The UI is labeled "Simulated data" throughout.

## v2 ideas
- Let a visitor paste in their own problem count / hours / solve-rate assumptions and see
  the meter recompute live.
- Add a second grid showing a more optimistic/pessimistic solve-rate scenario side by side.
- Pull in real-time GPU cost benchmarks (keyless API) to make the cost estimate adjustable.

## Changelog
### v1
- Initial build: 722-tile grid simulator with run/pause/reset, speed control, live
  compute/cost/solve-rate meter, and a human-pace-vs-AI-pace timeline toggle.
