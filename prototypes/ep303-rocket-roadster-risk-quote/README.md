# Rocket Roadster Risk Quote

A satirical insurance calculator for cars with strapped-on rocket thrusters and 2G
fan-suction levitation. Pick a trim or build a custom menace, and an underwriting-risk
gauge and an escalating premium quote update live &mdash; maxing out and visually
"breaking" once your car is officially uninsurable.

## Origin

Inspired by Moonshots #303, "Flying Tesla Car, Robot Brains Halving in Cost Every 3
Weeks, and Why Incentives Decide AI Alignment," around 00:12:19. After watching Tesla's
flying Roadster demo do 0&ndash;60 in under a second and hover upside down on thrusters,
the hosts joked that no insurer would touch it and wondered aloud what coverage would
even cost. This prototype answers that joke.

## How to use

1. Pick a trim &mdash; **Performance**, **Thrust**, **Rocket** &mdash; or switch to
   **Custom** to drag your own 0&ndash;60 time and top speed.
2. Toggle whether the car has rocket thrusters, can fly upside down, or gets driven
   (flown?) to the office daily.
3. Watch the risk gauge and annual premium update in real time, along with a list of
   satirical coverage exclusions. Push the risk past 100% and the gauge needle breaks.

## Real vs. simulated

- The real inputs (0.6&ndash;1.6s 0&ndash;60 time, 230 mph top speed, 380 km/h rocket
  trim) are the specs stated on the podcast for Tesla's flying Roadster demo.
- Everything else &mdash; the premium formula, risk gauge, and exclusion list &mdash; is
  a made-up, joke calculation for entertainment only. It is not real insurance advice,
  and no real insurer is referenced or implied.

## v2 ideas

- A "claims history" mini-story generator that spins up absurd past incidents based on
  your configuration.
- Shareable quote cards (canvas-rendered image) for posting the joke premium.
- A slow-motion crash/"gauge needle snaps off" animation when risk goes far past 100%.

## Changelog

### v1
- Initial release: trim picker, custom specs, toggles, live gauge, animated premium,
  and dynamic exclusions list.
