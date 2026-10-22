# Satoshi's Countdown

A dark, terminal-styled dramatization where a simulated self-improving AI "races" against
SHA-256 to crack and drain a fictional genesis Bitcoin wallet. Set how fast the AI's compute
doubles, toggle a hypothetical quantum-assisted mode, and watch an animated bar race across a
log-scale 2²⁵⁶ keyspace track while a readout translates the slider into a dramatized crack-time
estimate.

## Origin

Inspired by a claim Chamath Palihapitiya made on **Moonshots EP #304** (around **01:48:14**):
that crypto's upside is capped because recursive AI self-improvement could eventually be pointed
at breaking SHA-256 to drain Satoshi's original wallet, and then short Bitcoin. This prototype
turns that claim into an interactive, clearly-labeled thought experiment rather than a prediction.

## How to use

1. Drag the **AI compute doubling period** slider — lower values mean a faster, more dramatic
   takeoff.
2. Flip the **Classical / Quantum-assisted** toggle to move the target from the full 2²⁵⁶
   keyspace down to the Grover's-algorithm-reduced 2¹²⁸ target (the orange line on the track).
3. Press **RUN SIMULATION** to watch the progress bar race toward the target and see the vault
   flip from `LOCKED` to `WALLET DRAINED (simulated)`.
4. Open **Model assumptions** to see every made-up number the estimate is built from.

Serve the folder with any static file server, or just open `index.html` directly.

## What's real vs. simulated

- **Real:** SHA-256 has a 256-bit keyspace. Grover's algorithm gives a genuine quadratic speedup
  against brute-force search, which is why a quantum-assisted search is modeled against an
  effective 128-bit target. The age-of-the-universe comparison uses a real estimate (~13.8
  billion years) for scale.
- **Simulated / fictional, clearly labeled in the UI:** the starting "AI compute" baseline, the
  doubling-growth model, the resulting crack-time estimates, the wallet balance and drain
  animation, and the vault itself. None of this is a security analysis — brute-forcing SHA-256 is
  considered infeasible for any real or foreseeable computer, regardless of how fast compute
  grows. See `data/assumptions.json` and the in-page "Model assumptions" panel for the exact
  (made-up) parameters.

## v2 ideas

- Let visitors compare named historical compute growth curves (e.g. Moore's Law vs. a dramatized
  "fast takeoff") side by side on the same track.
- Add a second track showing how long the *entire* history of Bitcoin mining hash power has taken
  to search, for a grounded contrast with the fictional AI curve.
- Narrate the race with short log lines ("AI doubles compute... now searching 2^140 keys...") for
  more story-like pacing.

## Changelog

### v1.1
- Fixed: the classical/quantum toggle was 56×32px, below the 40px minimum touch target; it's now
  72×40px.
- Fixed: pressing RUN a second time without touching the slider/toggle no longer leaves the
  balance reading `₿ 0.00000000` during the new race — it resets to `₿ 50.00000000` first.
- Polish: the range slider thumb/track now use the theme's green accent instead of browser-default
  blue; the fill bar uses a distinct amber, shimmering gradient during quantum-assisted runs; the
  "2¹²⁸ quantum" track label now highlights when quantum mode is active; and the progress readout
  previews the dramatized crack-time estimate before RUN is pressed.

### v1
- Initial build: log-scale keyspace track, doubling-period slider, classical/quantum toggle,
  animated drain race, dramatized crack-time readout, and an inspectable model-assumptions panel.
