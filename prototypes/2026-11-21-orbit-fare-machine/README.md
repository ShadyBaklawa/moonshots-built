# Orbit Fare Machine

## What it is
A single-screen calculator that turns Peter Diamandis's back-of-envelope Starship math into
sliders. Drag propellant cost, fuel's share of operating cost, payload tons and your own body
weight, and watch cost per flight, cost per kilogram and your personal ticket price update live,
plotted on a log-scale chart against the Space Shuttle's historical $54,000/kg.

## Origin
From the Moonshots episode "Anthropic's $1.4T IPO: The Biggest Wealth Event in Human History?"
around 00:54:17. After the Starship tower-catch, Peter reasoned that since fuel is typically only
about a quarter of operating cost, and propellant runs $1M&ndash;$2M per flight, a flight implies
$4M&ndash;$8M in total cost, or $27&ndash;$53 per kilogram &mdash; versus the Shuttle's roughly
$54,000/kg. He used the average 150-lb American to estimate a $2,000&ndash;$4,000 ticket to orbit,
then cited Elon's lower $500,000 propellant figure and 200-ton payload to get tickets under $1,000.

## How to use
1. Drag the four sliders (propellant cost, fuel share, payload, your weight) and watch the three
   readouts and the chart update immediately.
2. Click **Peter's case** to load his stated propellant cost and fuel share, with a callout showing
   the cost/kg and ticket range he actually said (since he never stated a payload, that callout is
   shown separately from your live, payload-dependent readout).
3. Click **Elon update** to load his $500,000 propellant and 200-ton payload; the ticket for a
   150-lb flyer should land under $1,000, matching what Elon said.

## Real vs. simulated
- The ten figures in the "Figures stated on the podcast" panel, and the two preset buttons, come
  directly from what was said in the episode (timestamps shown on every tag).
- Propellant cost, fuel share, payload and body weight are **your assumptions** &mdash; adjustable
  sliders, always labelled as such, and never presented as measured data.
- Cost per flight, cost per kg and ticket price are simple derived math
  (`cost per flight = propellant ÷ fuel share`, `cost/kg = cost per flight ÷ payload kg`,
  `ticket = cost/kg × your weight in kg`) from whatever slider values are currently set.
- Your weight never leaves your browser; nothing is sent anywhere.

## v2 ideas
- Let visitors flip between imperial and metric units for weight and payload.
- Add a second comparison bar for a present-day commercial crew capsule, if a sourced $/kg figure
  turns up.
- Animate the chart transition when a preset is clicked instead of snapping instantly.

## Changelog
### v1
- Initial build: four sliders, live readout, log-scale chart vs. Shuttle, Peter/Elon presets, and
  a sourced-figures panel.
