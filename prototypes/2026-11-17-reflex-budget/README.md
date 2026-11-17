# Reflex Budget

Two stick-figure robots balance on one leg while holding a tray. Random shoves hit
both at the same time. One has an onboard brain with (almost) no delay; the other
routes every control decision through a "cloud" with an adjustable per-leg network
latency. Slide the latency up and watch the cloud robot's control rate drop, its
wobble grow, and its falls-per-minute counter climb — while the onboard robot keeps
its tray level.

## Origin

From the Moonshots episode "How Figure AI Is Outcompeting China and Tesla in Robotics
| Robotic Deep-Dive w/ Brett Adcock" (around 00:28:09). Brett Adcock explains why
Figure's Helix runs fully onboard: the best-case 5G connection gives roughly 20–30 ms
of latency per leg of the trip, which adds up to almost 50 ms for a full round trip —
capping control at about 20 Hz before any inference even happens. This prototype
turns that budget into something you can feel: drag the latency slider and see
exactly where a robot's balance loop runs out of "reflex budget."

## How to use

1. Drag the **per-leg network latency** slider (0–30 ms). The round trip and the
   cloud robot's effective control rate update live.
2. Watch both robots. Random shoves hit them at the same moments — the onboard robot
   recovers almost instantly; the cloud robot's correction is held stale for the full
   round trip, so as latency grows it wobbles more and eventually tips over.
3. Click **Episode 5G best case** to jump straight to the episode's 25 ms/leg figure
   (50 ms round trip, 20 Hz).
4. Watch the **Falls / min** counters — at the default 30 ms/leg, the cloud robot
   falls repeatedly within a minute; the onboard robot should stay up.
5. **Reset simulation** clears both robots back to standing and zeroes the counters.

## Real vs. simulated

- **Real, from the episode:** the three latency/rate figures (20–30 ms per leg,
  ≈50 ms round trip, 20 Hz network-imposed control rate) at 00:28:09, shown in the
  "Episode figures used here" list and cited on the preset button.
- **Simulated:** everything about the balancing itself. The robots are a toy
  inverted-pendulum model with an illustrative fall threshold and shove strength —
  not measurements from any real robot. A banner on the page says this. The cloud
  robot's instability comes from holding a stale control command for the chosen
  round-trip time (zero-order hold), which is a standard simplified way to show how
  network delay destabilizes a fast feedback loop — the exact numbers (fall angle,
  shove size, controller gains) are tuned for a clear demo, not derived from Figure's
  actual control stack.

## v2 ideas

- Let the tray carry a ball that visibly rolls off when the lean angle gets large,
  instead of (or in addition to) a hard fall threshold.
- Add an independent "inference time" slider on top of network latency, matching the
  episode's point that inference adds further to the network's 20 Hz budget.
- Log a short replay of the last fall so users can scrub back and see exactly where
  the correction arrived too late.

## Changelog

### v2
- Cut the citation on the "Episode 5G best case" button down to one short quote
  (was three verbatim transcript fragments strung together as one quote).
- Added an explicit Hz number for the onboard robot ("60.0 Hz (no network hop)")
  so the Hz comparison is visible on both sides, not just the cloud robot's.
- Added an in-UI status line noting the fall angle and shove strength are
  illustrative constants, and showing a live "Running for Xs" indicator so the
  falls/min counters don't read as broken before the 60s window fills in.
- Enlarged and recolored the tray/cup so it reads as "carrying a tray" at a
  glance instead of blending into the body color.

### v1
- Initial release: side-by-side onboard vs. cloud balancing demo with a per-leg
  latency slider, live Hz readout, falls-per-minute counters, an episode-figure
  preset, and a simplified-simulation banner.
