# Overlap Finder (Seat Shed)

A subscription audit tool for operations managers who pay for 15+ SaaS tools. List what you pay
for each tool and how many seats, and the ledger sorts every tool into "Likely replaceable",
"Partially replaceable" or "Keep" against an AI-assistant workspace, with a reason, a live
savings total, and a printable migration checklist for the ones to drop.

## Origin

Moonshots #311, around 01:13:01. Peter Diamandis discusses Anthropic shipping AI-built
spreadsheets, whiteboards, dashboards and app connectors directly inside its assistant, and the
hosts note Microsoft shares fell on the news as the market priced in software being absorbed by
AI assistants. This prototype turns that idea into the audit a company would actually run before
cutting any seats.

## How to use

1. Add a tool: name, category (dashboards, whiteboard, forms, spreadsheets, notes, slides,
   meetings, and more), seat count and price per seat per month.
2. Each tool gets an automatic verdict and a one-line reason from the bundled rule table. Click
   the verdict chip on any row to override it — the potential monthly and annual savings at the
   bottom update immediately.
3. Click "Try the example stack" to load a sample 12-tool stack and see the audit in action
   without typing anything (clearly marked "EXAMPLE DATA").
4. Click "Print checklist" to see a migration checklist listing only the tools currently marked
   "Likely replaceable", with step-by-step migration notes and a total. A "Print this checklist"
   button inside opens your browser's print dialog for a paper copy.

## Real vs. simulated

- The subscription list, seats and prices are whatever you type in — nothing is sent anywhere;
  everything runs in your browser.
- The category rule table (`data/rules.js`) is a bundled, editable starting point written for
  this prototype, not a measured study — it is a reasonable guess at what an AI workspace can
  and can't yet do, and every tool's verdict can be overridden by hand.
- The 50% savings credit for "Partially replaceable" tools is a simple, labeled calculation on
  the numbers you entered, not a benchmark.
- The "Try the example stack" data (12 fictional tool names) is sample data only, clearly
  labeled, and never mixed silently into a real audit.
- The two episode figures referenced in `IDEA.json` (the 3.5% Microsoft share drop and the
  $90B/$330B office revenue split) are shown nowhere in the tool itself — this prototype is the
  audit workflow the episode's news implies a company should run, not a figures dashboard.

## v2 ideas

- Let users paste a CSV or bank/credit-card export and auto-detect tool names and prices.
- Save an audit to a shareable link or export it as a PDF directly, instead of relying on the
  browser's print dialog.
- Add a confidence note per category (e.g. "basic workspaces" vs. "regulated/enterprise") so a
  larger company can judge rule-table fit for its own AI vendor and plan tier.
- Let teams maintain their own house rule table (e.g. "our compliance team keeps all storage
  in-house") and save it alongside the audit.

## Changelog

### v1
- Initial release: add/remove tools, auto-verdict via editable category rule table, click-to-cycle
  verdict override, live monthly/annual savings, 12-tool example stack, printable migration
  checklist, phone-width card layout.
