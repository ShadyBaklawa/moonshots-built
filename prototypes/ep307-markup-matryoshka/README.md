# Markup Matryoshka

## What it is

A nested-doll visualization of the margins stacked inside the price of one AI token: a core for
the raw manufacturing cost, then a ring each for the foundry, the chipmaker and the AI lab.
Drag each layer's margin slider and the matching ring — and the illustrative token price —
grows or shrinks. A "vertically integrate" button merges adjacent layers one boundary at a time,
collapsing rings together and logging the before/after price, echoing the squeeze Dave Blundin
predicts.

## Origin

From Moonshots #x307, "Making Sense of This Week's AI Market Crashes", around 02:12:34. Dave
Blundin argues a token's price stacks an AI lab margin of about 80–85% on top of a chipmaker
margin of about 80–85% on top of a foundry margin of about 50%, and predicts vertical
integration will squeeze these layers out.

## How to use

1. Drag the three margin sliders (foundry, chipmaker, AI lab) to see the rings and the
   illustrative token price change.
2. Adjust the two "simulated assumption" sliders — the manufacturing cost base and the share of
   the lab's serving cost that comes from chips — to explore different toy-model scenarios.
3. Click **⚡ Vertically Integrate** to merge the foundry into the chipmaker, then click again to
   merge the chipmaker into the AI lab. Each click collapses a ring onto the one inside it and
   logs the before/after price in the ledger.
4. Click **↺ Reset** to restore the episode's default margins and undo any merges.
5. The "Where the price goes" bar shows what share of the final price is raw manufacturing cost
   versus markup and overhead.

## Real vs. simulated

- **Real, sourced to the episode:** the foundry margin (~50%), chipmaker margin (~80–85%) and AI
  lab margin (~80–85%), each shown with its timestamp and quote.
- **Simulated / illustrative:** the manufacturing cost base, the share of a lab's serving cost
  that comes from chips, and the layer-on-layer stacking math itself. This is a simplified toy
  model — real companies sit on different cost bases, and chips are only one part of what it
  costs a lab to serve a token. The banner at the top of the page says so.

## Ideas for v2

- Let visitors compare two named scenarios (e.g. "today" vs. "fully integrated") side by side.
- Add a second toy model for inference-time cost (power, datacenter, staff) instead of folding it
  into a single "chip share" slider.
- Animate the ring merge with a visible "doll nesting" motion instead of an instant radius change.

## Changelog

### v1
- Initial release: nested-ring visualization, three sourced margin sliders, two simulated
  assumption sliders, two-step vertical integration with a merge ledger, and a
  manufacturing-vs-markup breakdown bar.
