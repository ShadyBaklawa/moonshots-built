# Offline Hour Planner

## What it is
A tool for the owner of a small, SaaS-dependent business (a clinic front desk, a shop,
a property manager) to list every app and vendor they rely on, mark how critical each one
is, and get back a ranked, printable runbook with a manual fallback step, a "print in
advance" checklist, and a contact line for each — plus a one-page emergency wall card for
the Critical and High items.

## Where this came from
From Moonshots EP #314 ("Steve Jurvetson on the SpaceX Deal That Almost Didn't Happen"),
around 00:17:14. Peter Diamandis walked through recent outages at major tech, aviation and
banking systems, plus third-party vendor breaches, and noted that UK and Finland guidance
tells households to keep three days of food and water on hand, while Sweden and Norway tell
households to keep a week. Emad Mostaque's point in that stretch was that more outages are
coming and companies are moving far too slowly to prepare. This prototype applies that
same "keep an offline fallback ready" idea to a small business's software stack instead of
a household's pantry.

## How to use it
1. Add each tool your business depends on: what it does, its category, how critical it is
   if it goes down, who owns it, and how to reach them or check its status.
2. The runbook on the right re-sorts itself immediately, most critical first. Change any
   tool's criticality with the dropdown on its card and watch it move.
3. Click **Load example business** to see a filled-in example with 8 tools across every
   category.
4. Click **Print runbook + wall card** to get a clean, two-part print preview: a full
   runbook page, then a one-page wall card listing only the Critical/High tools with their
   fallback step and contact — meant to be posted where staff can see it.

## Real vs. simulated
- Everything in the runbook comes from what you type in — there is no outside data call.
- The fallback step and "print in advance" list for each category (payments, email,
  scheduling, phone, website, inventory, security, accounting, other) are a bundled,
  generic library written for this prototype (`data/fallbacks.json`), not advice specific
  to any named vendor or product.
- The example business ("Load example business") is illustrative, invented sample data —
  not a real company.

## Ideas for v2
- Let the owner save/export their runbook as a shareable link or file instead of re-typing
  it each visit.
- Add an editable fallback step per tool, so the owner can override the generic category
  text with what actually works at their business.
- Track a "last drilled" date per tool and nudge a quarterly refresh, matching the
  business opportunity's recurring-revenue model.

## Changelog
### v1
- Initial build: add/edit/remove tools, live priority sort by criticality, category
  fallback library, example business loader, and a two-part print view (runbook + wall
  card).
