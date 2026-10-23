# The Philosopher's Reactor

An interactive toy fusion plant whose mercury-lined walls supposedly make gold alongside
electricity. Drag a gigawatt slider to scale the plant up, watch a neutron keep striking a
mercury nucleus and knocking it into gold, and see a gold-bar rack fill in as the simulated
years tick by.

## Origin

From Moonshots EP #305 ("SpaceX's AI Business Up 830%, OpenAI Agents Lie, and Startup Turns
Mercury Into Gold"), around **01:55:29**. Peter Diamandis and Alex Wissner-Gross discuss a San
Francisco fusion startup that claims it transmuted mercury into stable gold, beating CERN's
transmutation record by "a factor of 10," with a 2025 paper estimating about two tons of gold
per gigawatt-scale plant per year — something Alex frames as the dawn of "femtotech." Later in
the same conversation, Salim restates the yield as "two and a half tons," a figure that conflicts
with the paper's two-ton estimate.

## How to use it

- **Reactor scale** slider sets the plant's size in gigawatts — bigger plants react faster.
- **Plants built worldwide** slider is a hypothetical "what if this scaled" scenario that feeds
  the gold-bug meter only; it doesn't change the single plant's animation or revenue numbers.
- Watch the **simulated year** counter and the gold-bar rack fill in automatically — no need to
  click anything.
- Type your own **gold price** and **electricity price** to compare the two revenue streams for
  the plant at its current gigawatt size.
- The **gold-bug meter** shows, purely illustratively, how big the worldwide gold flow would
  look if that many plants existed at that scale.
- A side panel tells the aluminum story — once a luxury metal, now cheap — as a historical
  parallel for what could happen to gold's scarcity.

## What's real vs. simulated

- **Real, from the podcast** (each tagged "as stated on the podcast" in the UI): the claim of
  beating CERN's record by a factor of 10, the paper's ~2 tons/GW/year estimate, and Salim's
  conflicting "two and a half tons" restatement. None of these claims are independently
  confirmed — the demo says so explicitly.
- **Simulated / illustrative**: the neutron-strike animation (a labeled simplification, not a
  real nuclear physics simulation), the year-by-year gold accumulation rate, the gold-bug
  scarcity meter's scale, and the revenue bars (simple multiplication of whatever price you type
  in against the plant's output — not investment advice).
- **General unit math, not podcast figures**: converting tons to standard 400 troy-oz gold bars,
  troy ounces to tons for the gold-price calculation, and gigawatt-hours to kWh for the
  electricity calculation.
- The aluminum-as-former-luxury-metal story is told as a general, unattributed historical
  analogy — no specific names, dates, or statistics are claimed, since those weren't verified
  for this prototype.

## v2 ideas

- Let users compare the startup's claimed yield against actual historical gold mine output to
  make the scarcity meter concrete (would need a verified, sourced figure first).
- Add a "cost to run the reactor" input so the demo can show net profit, not just gross revenue.
- Show the aluminum price collapse as its own mini timeline next to the gold-bug meter.

## Changelog

### v2
- Removed the unsourced Napoleon III cutlery / 1884 Washington Monument capstone claims from
  the history panel; it's now a general, unattributed aluminum-as-luxury-metal analogy with no
  specific names or dates.
- Fixed the dangling-clause gold-bug-meter hint so it reads as a sentence.
- Added a caption noting the simulated year speeds up with scale and isn't tied to a real clock.
- Added "e.g." to the gold/electricity price field labels and a note that the defaults are just
  starting points, not live market data.

### v1
- Initial build: animated neutron/mercury/gold reactor visual, gigawatt and worldwide-plants
  sliders, year-by-year gold-bar rack, gold vs. electricity revenue comparison, gold-bug
  scarcity meter, and the aluminum historical-parallel panel.
