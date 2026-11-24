# Vendor Exposure Map

A working tool for the owner of a small shop, clinic-adjacent service business or small SaaS
company who has no in-house security team but relies on 15+ outside tools that touch customer
data. List your vendors, tick which customer data each one holds, and get a ranked exposure
map plus a ready breach-day checklist — before you ever need it.

## Origin

From Moonshots #314, around 00:17:14. Peter Diamandis runs through a week of outages and notes
that big banks and card networks have reported third-party vendor breaches exposing customer
names and emails; Salim Ismail adds that CEOs are panicking because defense still patches one
hole at a time. This prototype is the small-business version of that same problem: knowing
which of *your* vendors hold what, before one of them is the one in the headline.

## How to use it

1. Add your vendors one at a time: name, type, and which customer data types it holds (names,
   emails, addresses, payment details, health notes).
2. The exposure grid ranks every vendor by a weighted score, highest risk first, and color-codes
   which data types each one holds.
3. Click any vendor row to open its breach-day checklist: what it holds, what to rotate right
   now, what to ask the vendor, and a draft heads-up note to customers.
4. Use "Print / Save PDF" on a checklist for a clean, one-page printout.
5. No vendors of your own yet? Click "Load example shop" to see a filled-in sample with 7
   vendors.

## Real vs. simulated

- The vendor list, data-type ticks, exposure scores and checklists are all generated live from
  whatever you type in — nothing here is canned output presented as your answer.
- "Load example shop" fills the page with a clearly labeled sample business (banner + badge)
  so you can see the tool working before entering your own vendors.
- The scoring weights are fixed values built into the page and shown in the "Built-in scoring
  weights" panel — they are not measured or external data.
- The draft customer note is a template, not legal advice; it carries a visible notice to check
  breach-notification duties with a lawyer.
- An optional field lets you paste your own Anthropic API key to have AI polish the wording of
  the draft note. The key is kept only in your browser for the session and is sent directly to
  Anthropic's API, nowhere else. Without a key, the plain template still works.

## v2 ideas

- Save a vendor list in the browser (localStorage) so it survives a reload.
- Let an owner export/import the vendor list as a file to share with a bookkeeper or co-founder.
- Add a lightweight "last reviewed" date per vendor so stale maps are visible at a glance.
- Optional email digest when a listed vendor shows up in public breach-notification feeds.

## Changelog

### v1
- Initial build: add/remove vendors, weighted exposure grid ranked by risk, per-vendor
  breach-day checklist (data held, rotate list, vendor questions, draft note), example shop
  mode, optional AI polish for the draft note, and a print-friendly one-page checklist view.
