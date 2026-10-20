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

1. Pick a "From" and "To" city from the dropdowns (or hit the swap button).
2. Press "Fire the beams" to watch the surface beam race the core beam across a cutaway
   view of the Earth.
3. Read the three cards below: surface distance/time, through-core distance/time, and the
   time saved by cutting through the planet.

The cutaway circle isn't a literal map — it's the exact plane that contains both cities and
Earth's center. The angle between the two cities on that circle comes straight from their real
latitude/longitude, so the arc (surface path) and the chord (through-core path) are both
geometrically exact, not illustrative.

## What's real vs. simulated

- **Real, computed client-side:** city coordinates, the great-circle surface distance, the
  straight chord distance through the Earth, and both routes' light-speed transit times
  (distance ÷ the speed of light).
- **Simulated / illustrative:** the glowing beam race is slowed down (the exact factor is shown
  in the disclaimer) so the difference is visible to the eye — real transit times are a few to
  tens of milliseconds. The concentric "crust / mantle / core" rings are a stylized cutaway, not
  a geologically accurate model of Earth's interior.
- **Speculative, not technology:** there is no way to detect or steer a neutrino beam for
  point-to-point communication today. Catching even a handful of neutrinos requires large,
  heavily shielded detector facilities. This prototype only compares the physics of the two
  paths, as a thought experiment from the episode.

## v2 ideas

- Let visitors drop custom pins on a world map instead of choosing from a preset list.
- Show the "neutrino interaction problem" visually — e.g. a detector size that would be needed
  to catch a usable fraction of a beam over that distance.
- Compare against real submarine fiber cable latency (which is higher than the light-speed
  theoretical minimum) to show today's actual gap.

## Changelog

### v1
- Initial release: city-pair selector, exact arc-vs-chord geometry, animated beam race,
  computed latency readouts, and speculative-physics disclaimer.
