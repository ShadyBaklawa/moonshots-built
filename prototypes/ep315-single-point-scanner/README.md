# Single-Point Scanner

A tool for founder-led companies to find out which deals, systems and decisions depend on one
person, with nothing written down and no backup — the kind of risk that turns an absence into a
crisis. List your critical rows, mark what's documented and who could step in, and get a ranked
exposure report you can act on or hand to a lawyer.

## Origin

From Moonshots episode 315 ("Jensen Huang Is Back: Inside NVIDIA's $1 Trillion Comeback After 11
Days Out"), around 00:05:03. Salim guessed the NVIDIA board pushed Jensen out partly over
nepotism, unsigned contracts with major partners, everything centred on one person, and no
succession plan — and that the board wanted things written down and signed.

## How to use it

1. Click **Load example** to see a sample company's rows, or **+ Add row** to start your own.
2. For each deal, system or decision: name it, say who holds it, tick whether it's signed or
   documented somewhere, tick whether a backup person could step in, and enter the annual revenue
   at risk if it fell apart.
3. Rows are ranked automatically — the riskiest (no backup, undocumented) rise to the top with a
   red flag.
4. Watch the exposure dial, the "one person out for two weeks" revenue total, and the single-point-of-failure
   count update as you edit.
5. Click **Print / Export action list** for a clean one-page list to work through or hand off.

Your data stays in your browser's local storage only — nothing is sent anywhere.

## Real vs simulated

- The "Load example" company and its figures are entirely made up for illustration and labeled
  as an example on screen.
- The scoring rules (point values for missing documentation, missing backup, and revenue
  thresholds) are a simple bundled heuristic, shown on the page itself — not a legal or financial
  assessment.
- The "11 days" NVIDIA figure referenced in the footer/episode context is as stated on the
  podcast; it isn't used in any calculation here.

## v2 ideas

- Let founders export/import their row data as a file to back it up or hand to a lawyer.
- Add a "days since last reviewed" field so stale rows resurface automatically.
- Optional AI-assisted first draft: paste rough notes about a deal and get a suggested row.

## Changelog

### v1
- Initial release: ranked risk table, live exposure dial and totals, example company, print/export
  action list, mobile card layout, local-storage persistence.
