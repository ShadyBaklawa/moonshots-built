# Cure Compiler

A dark, terminal-styled page that turns a single thought experiment into something you can
drag and click: what happens to the bill for curing 5,000 diseases if you stop approving one
drug at a time and start approving a delivery *platform* once?

## Origin

From Moonshots #310 ("Can Jensen Huang remain CEO? Inside NVIDIA's next steps"), around
**00:54:40**. An AI thought-experiment agent argued that curing 5,000 diseases at roughly $2B
per drug would cost $10 trillion &mdash; more than 30 years of global pharma R&amp;D. Its proposal:
approve a gene-editing delivery platform once, then treat each new disease as a ~$2M sequence
swap, dropping the total toward $10 billion. The agent also named the real bottlenecks: delivery
to tissues (liver, blood and eye work; kidney and most of the brain don't), late diagnosis, and
too few medical geneticists.

## How to use it

- Drag the **cost-per-disease slider** from $2B down to $2M and watch the total cost counter
  fall from $10 trillion toward $10 billion.
- Click any tissue on the **delivery map** (or its label in the list) to toggle it between
  locked and unlocked, and watch the "reachable diseases" count change.
- Read the **geneticist gauge** to see 1,200 certified medical geneticists set against the
  25&ndash;30 million Americans with a rare disease.

## Real vs. simulated

- **Real, cited to the episode:** the $2B/$2M per-disease costs, the $10 trillion/$10 billion
  totals, the "30 years" comparison, the five-year average diagnosis wait, and the
  1,200-geneticists-vs-25&ndash;30M-patients figures (see `data/figures.json` for exact quotes
  and timestamps).
- **Derived:** "1 geneticist per 21,000 patients" is simple arithmetic on the two cited figures
  above, labelled as derived.
- **Simulated / illustrative:** every per-tissue disease count (liver, blood, eye, kidney, brain)
  is an invented number for this demo, clearly tagged "simulated" in the UI. The episode's agent
  named which tissues are reachable and which aren't, but gave no disease counts per tissue.
- This whole scenario was a thought experiment voiced by an AI agent on the show, not an
  established scientific or regulatory roadmap, and the page is not medical advice about any
  disease. A banner says so up top.

## v2 ideas

- Let visitors see which specific (illustrative) disease categories move from "locked" to
  "reachable" when a tissue unlocks, instead of just a count.
- Add a second slider for diagnosis delay, showing how fewer geneticists or faster sequencing
  change the five-year wait.
- Animate the counter dropping digit-by-digit like a terminal compiling, rather than snapping
  instantly.

## Changelog

### v1
- Initial build: cost counter + log-scale slider, clickable SVG body map with five tissues,
  geneticist-vs-patient gauge, thought-experiment banner, bundled `data/figures.json`.
