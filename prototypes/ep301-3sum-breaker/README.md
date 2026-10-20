# 3SUM Breaker

A "mission clock" style demo that shows why shaving an algorithm's exponent from `n²` down
to `n^1.995` is a bigger deal than it looks: the relative speedup stays modest at any input
size, but because 3SUM shows up at scales where computation is already enormous, that sliver
of exponent compounds into real, absolute years of saved time.

## Origin

From [Moonshots #301](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/why-altman-says-accept-some-bad-things-happening-and-what-it-means-for-ai-safety-moonshots-301),
around 00:36:38. Imad Mustak described an Anthropic model helping mathematicians push the
classic 3SUM problem (given a list of numbers, do any three sum to zero?) from quadratic
(`n²`) to subquadratic (`n^1.995`) time — an improvement over the best known approach that had
stood for decades.

## How to use it

Drag the **input size `n`** slider. The two readouts and the "time saved" stat update live.
Release the slider (or press **Run the race again**) to watch two progress bars race at the
true relative speed of `n²` vs `n^1.995`, compressed into a few seconds so you can watch the
whole thing play out, with each bar's "time remaining" counting down live underneath it.

## What's real vs. simulated

- **Real:** the two formulas (`n²` and `n^1.995`), the arithmetic that turns them into operation
  counts and estimated wall-clock time, and the historical framing (decades without a
  subquadratic result, an Anthropic model helping find one).
- **Simulated / hypothetical, and labeled as such in the UI:**
  - The assumed computer speed (5 billion operations/second — a stand-in for "one modern CPU
    core," not a benchmark of real hardware).
  - The input sizes themselves at the high end of the slider — no real 3SUM dataset has
    anywhere near that many elements. The slider is pushed into hypothetical territory on
    purpose, purely to illustrate how the exponent gap compounds mathematically.
  - The race animation's timing is compressed (both bars are scaled by the same factor) so a
    multi-year or multi-million-year gap can be watched in a few seconds; the relative pacing
    between the two bars is always true to the underlying math.
- This is a visualization of the *math* of the two exponents, not a reproduction of how the
  real subquadratic 3SUM algorithm works internally.

## v2 ideas

- Let visitors pick a custom operations-per-second rate (e.g. "laptop" vs "data center") to see
  how the absolute time-saved number shifts.
- Add a second comparison showing a classic, dramatic complexity gap (e.g. `n²` vs `n log n`)
  side by side, so visitors can see why this particular result is impressive precisely *because*
  the gap is so small, not despite it.
- Plot "time saved" as a continuous curve across the whole slider range instead of a single
  live number.

## Changelog

### v2
- Default slider now starts at exponent 13 (n ≈ 10 trillion) so the "time saved" stat shows a
  dramatic million-plus-year figure the instant the page loads, instead of requiring a drag.
- Added a live "time saved so far" tally that ticks up during the race, since the two bars
  themselves never visually differ by more than a sliver — the tally is where the absolute gap
  (minutes to trillions of years) actually reads.
- Added a "Jump to max scale" button so visitors who don't drag the slider all the way right
  still see the trillion-year payoff.
- The stat-highlight pulse now plays once on reveal instead of looping forever, so it reads as a
  one-time cue rather than a persistent distraction.

### v1
- Initial build: log-scale input-size slider, true-relative-speed race animation with live
  countdown readouts, stats panel (operations, time saved, speedup factor), and a plain-language
  3SUM explainer.
