# Crew Gap Calculator (Livewire Bench)

A month-by-month staffing planner for data center developers and EPC contractors. Enter your
facility size, target energization date, region and the licensed electricians you already have
committed, and it models how many electricians you need per build phase (rough-in, switchgear,
commissioning), where you fall short, and how severe the schedule risk is. It can export a
draft job description for the role driving the biggest gap.

## Origin

From Moonshots EP #304 ("Chamath: AGI Is Here, Anthropic's $100B Giveaway, Elon's SpaceX Shares
for 72M Kids"), around 00:44:07. Chamath Palihapitiya argues that even with power secured, data
center builds stall on funding, supply chain and skilled labor — licensed master electricians are
scarce and expensive, and you can't just hire them off Craigslist. This prototype is the working
tool behind a pitched staffing-agency opportunity, Livewire Bench, aimed at the developers who
feel that scarcity directly.

## How to use it

1. Enter your facility size (MW), target energization date, region and the licensed electricians
   already committed to the job.
2. The chart and table update instantly, showing modeled headcount by phase per month, your
   committed crew as a dashed line, and any shortfall shaded in red.
3. Open "Staffing assumptions" to see and edit every ratio behind the model — peak electricians
   per MW for each phase, and the share of peak demand typically available in your region.
4. If a gap is modeled, click "Export job description for the peak gap" to download a plain-text
   draft job post for the role and month driving the worst shortfall.

## What's real vs. simulated

- **Real:** your inputs (size, date, region, committed crew) drive every calculation directly —
  there is no canned output.
- **Editable assumptions, not measured data:** the peak-electricians-per-MW ratios, the phase
  timing curve (rough-in → switchgear → commissioning), and the regional-availability share are
  the builder's estimates, not figures from the episode or an industry benchmark. They're exposed
  as plain number inputs so you can replace them with your own numbers.
- **Labeled podcast figures:** the one quote shown ("three or four years," Chamath Palihapitiya,
  00:44:07) is tagged "as stated on the podcast" and used only as framing, not as an input to the
  math.
- **The exported job description** is a draft template built from your inputs — it's explicitly
  labeled as a starting point, not a verified labor-market or compliance document.

## v2 ideas

- Let users attach multiple crews with different start dates instead of one flat "committed"
  number.
- Add a cost-of-delay estimate (liquidated damages per slipped week) next to the risk banner.
- Save/share a scenario via a URL so a GC and an owner can compare assumptions.
- Pull in real, sourced regional electrician wage/availability data instead of an editable
  placeholder, once a licensed data source is identified.

## Changelog

### v1
- Initial build: MW/date/region/committed-crew inputs, phase-based monthly demand model with
  editable staffing ratios, SVG demand chart with shortfall shading, risk banner, breakdown
  table, and downloadable draft job description for the peak gap.
