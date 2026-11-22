# One Light Day

A single-screen ride-along with Voyager 1: send a simulated command across the Deep Space
Network, watch its 24-hour trip each way, then drag a slider to see the spacecraft's power
budget fade and its remaining instruments wink out over the decades.

## Origin

From Moonshots EP #314, "Steve Jurvetson on the SpaceX Deal That Almost Didn't Happen," around
02:00:49. Peter Diamandis notes that Voyager 1 just passed one light day from Earth after a
49-year journey — a message now takes 24 hours each way on the Deep Space Network. He adds
(around 02:01:27) that its plutonium generator makes about 200 watts, loses about 4 watts a
year, and only two science instruments remain on, despite a five-year design life stretched
to 50 years of actual operation. Around 02:03:47–02:04:15 he compares its speed to the ISS
(roughly twice as fast) and the Parker Solar Probe (more than 10x faster).

## How to use it

- Press **Send a command** to watch a pulse travel from Earth to Voyager 1 and back, with a
  countdown for each 24-hour leg (sped up for the demo).
- Drag the **years from now** slider to project the power budget forward. The readout drops
  by 4 watts a year, and each instrument greys out once the power crosses its shut-off point.
- Scroll to the comparison panel for the five-year design life vs. 50 years of actual
  operation, and a speed comparison against the ISS and Parker Solar Probe.

## Real vs. simulated

- Every number labeled "as stated on the podcast" — the distance, journey length, signal
  delay, power output, loss rate, instrument count, design life, actual life, and the two
  speed comparisons — comes straight from the episode.
- The signal countdown is real timing (24 hours each way) compressed into a few seconds and
  labeled as such; nothing about the trip duration itself is invented.
- The future power readout is a straight-line projection from the stated 4 W/year loss rate,
  labeled "projection."
- The podcast doesn't say which two instruments are still active or at what power level they
  shut off, so "Instrument 1" / "Instrument 2" and their 120 W / 40 W thresholds are made-up
  assumptions for this demo, clearly labeled as such — not real NASA figures.
- The Parker Solar Probe's speed bar is capped and marked "&gt;" because the podcast gives a
  lower bound ("more than 10x faster") rather than an exact multiple.

## v2 ideas

- Swap in NASA's real instrument list and published power curve if a bundled, sourced dataset
  becomes available.
- Let visitors pick a future year and see a one-line "what's still on" summary they can share.
- Add a to-scale distance view (with an explicit "not to scale" toggle for the default lane).

## Changelog

### v1
- Initial build: signal round-trip simulator, power budget slider with instrument shut-offs,
  and a design-life / speed comparison panel.
