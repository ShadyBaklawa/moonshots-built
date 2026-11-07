# Swarm Exposure

A dark-sky scene over a mountain silhouette where pressing "Expose" stacks simulated
photo frames one by one, letting satellite trails pile into a glowing band — then a
"future satellites" slider pushes that band into a dense, dusk-lit halo.

## Origin

From Moonshots #309, "The Great Collision Between Politics and AI", around 01:34:16.
Salim Ismail described a New Zealand photographer who stacked 578 photos over Mount
Taranaki, capturing "almost 15,000 satellite trail appearances from about 1,400
satellites" (as stated on the podcast). On the episode, that image was also called a
"baby Dyson swarm," with a prediction of a visible compute halo forming in
sun-synchronous orbit.

## How to use

1. Press **Expose**. Frames climb from 0 to 578 as the real figures from the photo
   animate in: satellites spotted and trail appearances build up on the canvas.
2. Drag the **Future satellites** slider at any time (before, during, or after an
   exposure). It layers on an illustrative ring of additional satellites concentrated
   near the horizon — at the top of the slider, that ring thickens into a dense,
   dusk-coloured glowing halo.
3. Press **Expose again** to replay the stacking from zero.

## Real vs. simulated

- **Real, labelled "today" preset**: 578 frames, ~1,400 satellites, ~15,000 trail
  appearances — all as stated on the podcast at 01:34:16. The frame/satellite/trail
  counters animate toward these exact figures during an exposure.
- **Simulated**: every trail line, orbit path, and star on the canvas is a stylised
  illustration, not real satellite tracking data or a brightness forecast.
- **Illustrative / future**: the "future satellites" slider's added count (up to
  ~60,000) and the dusk halo it draws are a speculative projection, not a measurement
  or a prediction attributed to anyone. This is called out next to the slider.

## v2 ideas

- Swap the simplified mountain silhouette for a real elevation profile of Mount
  Taranaki.
- Let visitors drag across the sky to "pan" the exposure, like a real stacked
  astrophotography viewer.
- Add a day/night cycle so the dusk-halo effect is tied to a moving sun position
  instead of a slider value.

## Changelog

### v1.1
- Fixed Origin section: the "baby Dyson swarm" quote and compute-halo prediction were
  misattributed to Salim Ismail; now presented as said on the episode without naming
  the wrong speaker, and the trail-appearances figure is quoted directly.

### v1
- Initial release: frame-stacking exposure animation with real "today" figures from
  the podcast, plus an illustrative future-satellites slider that builds a halo band.
