# Model Switch Savings Sheet

A one-page ledger for checking whether you're overpaying for an LLM model. You enter your
own monthly token usage per workload and a price table for the models you'd consider, and it
tells you the cheapest model that still clears your quality bar for each workload, the total
monthly and yearly savings from switching, and a 12-month projection of where costs are
headed if the cheapest-available price keeps halving.

## Origin

From [Moonshots #306](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/anthropics-2t-ipo-elon-predicts-neocloud-death-and-chinas-kimi-catches-up-306),
around 00:55:28. Peter Diamandis and Salim Ismail discussed Kimi K3.1 Pro scoring near the
top of the Artificial Analysis intelligence index at $2/$10 per million tokens in/out, and
noted that token-price halving time has shrunk to roughly seven weeks (53 days cited later
in the episode for the GPT Astra-to-Terra drop). The idea: most teams pick a model once and
never revisit it, even as near-equal models arrive at a fraction of the price every few
weeks.

## How to use it

1. **Your workloads** — add a row per thing you run through a model each month (name, input
   and output tokens in millions, and the minimum quality tier it needs).
2. **Candidate model prices** — edit the pre-filled rows or add your own. Mark whichever
   model you're actually on today as "Current" so savings are measured against it.
3. **Price trend assumption** — adjust the token-price halving period if you don't trust the
   episode's default.
4. Read the **results grid**: every model's monthly cost per workload, with the cheapest
   model that still meets that workload's quality tier highlighted in green.
5. Check the **totals** for monthly/yearly savings, and the **12-month chart** for where
   costs are headed if you keep switching to the cheapest qualifying option as prices fall.
6. **Export CSV** for a row-per-workload-model breakdown, or **Print one-page report** for a
   clean printable summary.

## What's real vs. simulated

- **Real, from the episode:** the Kimi K3.1 Pro price ($2 input / $10 output per million
  tokens) and the 53-day halving-period default. Both carry an on-screen
  "from Moonshots #306, verify current pricing" badge — verify before you rely on them, since
  prices move fast.
- **Example, not real:** the second price-table row ("Your current model") ships with
  placeholder numbers labeled "example — edit me." Replace them with your actual model's
  pricing.
- **Illustrative, not a forecast:** the 12-month projection assumes the cheapest qualifying
  model's price keeps halving at the rate you set. It is not a prediction about any specific
  model's future price, and the chart is labeled as illustrative.
- **Yours:** all workload usage numbers and any additional price rows you add are entered by
  you and never leave your browser — there are no API calls or data collection.

## v2 ideas

- Let users paste a CSV or connect a usage export instead of typing workloads by hand.
- Track a price-table history so re-checks each quarter show how much the market moved.
- Add a quality-tier note field so a team can record *why* a model was rated at a given tier
  (eval name, score, date) instead of a bare 1–5 pick.

## Changelog

### v1.1
- Fixed the "Current?" radio button being rendered at 22px (below the 40px touch target
  minimum) — it now sits in a 40px tappable label.
- Added localStorage persistence: workload rows, price rows, and the halving-period input now
  survive a reload instead of resetting, so a returning client doesn't have to retype
  everything for a quarterly re-check.
- Widened the quality-tier `<select>` column so tier labels (e.g. "4 — Frontier-class") no
  longer truncate on desktop, and added a tooltip noting the tiers are a self-assigned 1–5
  scale, not a measured benchmark.
- CSV export now prefixes any cell starting with `=`, `+`, `-`, or `@` with a leading
  apostrophe to prevent formula injection if the file is opened in Excel.

### v1
- Initial release: editable workload and price tables, live per-model cost grid with
  cheapest-qualifying highlight, monthly/yearly savings totals, adjustable-halving 12-month
  SVG projection chart, CSV export, and a print-friendly report view.
