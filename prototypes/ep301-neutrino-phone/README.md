# Neutrino Phone

A cross-section race between two light-speed signals: one that curves along Earth's surface
(today's fiber or satellite path) and one that cuts straight through the planet's core. Pick
two cities and watch the straight shot win.

## Origin

From Moonshots #301, around 02:28:13, Alex Wisner-Gross described wanting a neutrino-based
communication link that shoots straight through the Earth, beating fiber or satellite paths
that must follow the surface or orbit. This prototype turns that idea into a side-by-side
physics comparison.

## How to use

1. Pick a "From" and "To" city from the dropdowns (or hit the swap button) — you can't pick
   the same city twice, since that would make the race meaningless.
2. Flip "Use real fiber-optic speed" on to slow the surface beam the way light actually slows
   down inside glass fiber, instead of assuming it moves at the vacuum speed of light.
3. Press "Fire the beams" to watch the surface beam race the core beam across a cutaway
   view of the Earth. Hover any ring in the cutaway for a one-word label (crust, mantle, outer
   core, inner core).
4. Read the three cards below: surface distance/time, through-core distance/time, and the
   time saved by cutting through the planet.

The cutaway circle isn't a literal map — it's the exact plane that contains both cities and
Earth's center, drawn flattened with city A fixed at the top, so it won't match a real compass
bearing. The angle between the two cities on that circle comes straight from their real
latitude/longitude, so the arc (surface path) and the chord (through-core path) are both
geometrically exact, not illustrative — and because a straight chord between two points on a
circle is always shorter than the arc between them, the through-core line always wins.

## What's real vs. simulated

- **Real, computed client-side:** city coordinates, the great-circle surface distance, the
  straight chord distance through the Earth, and both routes' light-speed transit times
  (distance ÷ the speed of light).
- **Illustrative:** the "real fiber-optic speed" toggle slows the surface beam by a fixed,
  rough factor to stand in for light moving through glass instead of vacuum — it's a
  ballpark, not a measured figure for any specific cable. The glowing beam race itself is also
  slowed down (the exact factor is shown in the disclaimer) so the difference is visible to the
  eye — real transit times are a few to tens of milliseconds. The concentric "crust / mantle /
  core" rings are a stylized cutaway, not a geologically accurate model of Earth's interior.
- **Speculative, not technology:** there is no way to detect or steer a neutrino beam for
  point-to-point communication today. Catching even a handful of neutrinos requires large,
  heavily shielded detector facilities. This prototype only compares the physics of the two
  paths, as a thought experiment from the episode.

## v2 ideas

- Let visitors drop custom pins on a world map instead of choosing from a preset list.
- Show the "neutrino interaction problem" visually — e.g. a detector size that would be needed
  to catch a usable fraction of a beam over that distance.
- Add a third, laser-through-orbit beam (straight satellite-to-satellite hop, not through the
  core) to compare all three paths at once.

## Changelog

### v3
- Removed an unsourced disclaimer line attributing an "episode #314" laser-satellite argument to
  a named real person; the disclaimer and README now stick to what this prototype's own episode
  (#301, Alex Wisner-Gross) actually said.
- Moved the color legend above the cutaway animation so the surface-vs-core routes are legible
  before pressing "Fire the beams", instead of only being explained in a caption underneath.
- Tightened spacing and shrank the cutaway diagram so the three result cards (surface distance,
  core distance, time saved) sit inside the first screen on both desktop and mobile instead of
  requiring a scroll.
- Enlarged the "real fiber speed" checkbox to a 40×40px touch target.
- Dropped the unused `light` keyword from `color-scheme` since the palette is dark-only.

### v2
- Fixed a same-city dead end: picking the same city in both dropdowns made the math divide by
  zero. Each dropdown now disables whichever city is already selected in the other one.
- Added an "illustrative" real-fiber-speed toggle that slows the surface beam the way light
  actually slows inside glass, instead of assuming fiber moves at the vacuum speed of light.
- Added a one-line caption under the cutaway explaining why the chord always beats the arc, a
  note that the cutaway is a flattened plane (not a real compass bearing), and hover labels on
  the crust/mantle/core rings.
- Removed an unused duplicate `data/cities.json` (the city list already lived in `script.js`).

### v1
- Initial release: city-pair selector, exact arc-vs-chord geometry, animated beam race,
  computed latency readouts, and speculative-physics disclaimer.
