# Stack Exposure Checker

A tool for freelance web designers and small agencies that keep a pile of WordPress/PHP sites
alive. Paste the PHP version a site runs and its `composer.lock` (or just a plain package list),
and it tells you whether that PHP branch is still getting security fixes and which Composer
packages have known, publicly-documented vulnerabilities — prioritized worst-first, with a
client-ready summary you can copy straight into an email.

## Origin

From [Moonshots EP #305](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/spacexs-ai-business-up-830-openai-agents-lie-and-startup-turns-mercury-into-gold-ep-305),
around 00:55:57. Peter Diamandis described AI-assisted researchers turning up decade-old, critical
PHP flaws — the kind that allow a takeover without even a password — in PHP, which includes
WordPress and runs roughly 70% of websites. He cited Alex's reference to Linux kernel developers bracing
for an 18-month wave of similar discoveries, and OpenAI's billion-dollar commitment to subsidized
cyber-defense AI for under-resourced organizations. The gap this tool targets: nobody who maintains
a stack of small client sites has an easy way to know, today, which of them are quietly exposed.

## How to use it

1. Enter the PHP version the site runs (e.g. `8.1.29`) and/or paste the contents of its
   `composer.lock`, or a plain list like `vendor/package 1.2.3`, one per line.
2. Click **Scan my stack**. Your browser queries two public services directly — nothing is sent
   to any server this prototype controls.
3. Read the prioritized findings (critical first), and click **Copy to clipboard** on the
   client-ready summary to paste into an email or ticket.
4. No input yet? Click **Load example outdated stack** to see a real, previously-captured scan of
   a deliberately old, vulnerable stack render instantly — no live request. A **Refresh with live
   data** button in the results panel re-runs that same stack against the live databases now.

## What's real vs. simulated

- **Real, live, and specific to what you paste:** PHP end-of-life status comes from
  [endoflife.date](https://endoflife.date/php)'s public API. Package vulnerabilities come from
  [OSV.dev](https://osv.dev)'s public API, queried against the Packagist ecosystem. Every
  severity, CVE, fixed-in version, and advisory link shown for packages you enter is live data
  from OSV.dev at the moment you scan — never invented or pre-written.
- **Offline fallback:** if the live PHP end-of-life lookup fails, the tool falls back to a bundled
  snapshot (`data/php-eol-fallback.json`, dated on its generation day) and labels it clearly as
  such. There is no offline fallback for package vulnerabilities — that lookup always needs a live
  connection, because a stale vulnerability database would be actively misleading.
- **Example mode:** "Load example outdated stack" fills in a real, deliberately ancient sample
  stack (old PHPMailer, Symfony, Laravel, Twig, and a clean Monolog) and instantly renders a real
  result set captured from OSV.dev on 2026-10-23 (`data/example-stack.json`) — no live request,
  so it's never at the mercy of the ~40 individual lookups a full scan of that stack requires.
  It's clearly labeled "cached example" throughout. A **Refresh with live data** button re-runs
  the same stack against the live databases if you want to confirm the cached copy still holds;
  if that live refresh fails, it falls back to the cached copy again and says so — it never
  fabricates findings.
- All percentages, timeframes, and dollar figures in the opening paragraph are quoted from the
  episode as stated; they are not computed by this tool.

## Ideas for v2

- Accept a WordPress plugin/theme list (via the WordPress.org API) alongside Composer packages.
- Let an agency save a list of client sites and re-run all of them with one click.
- Turn the client-ready summary into a one-click email draft.
- Surface a rough "patch effort" estimate (major vs. patch-level upgrade) per finding.

## Changelog

### v1.2
- Fixed `extractFixedVersions()` reporting "no fix published yet" for a vulnerability whose
  matching affected-range only had a `last_affected` event (no `fixed` event of its own), even
  when another range in the same OSV record documented a fix on a later branch — e.g.
  laravel/framework 5.5.0 against CVE-2018-15133 now correctly shows "Fixed in: 5.6.30" instead
  of claiming no fix exists.

### v1.1
- Example mode now renders the bundled cached result set instantly, with zero live requests,
  instead of attempting a ~40-request live OSV.dev fan-out first — guarantees the "see it work"
  path is actually instant. A "Refresh with live data" button lets you re-run that same stack
  live on demand.
- Added a live progress status ("checked N of M vulnerability records…") during the per-finding
  OSV.dev detail fetch so a large composer.lock doesn't sit behind one static "Scanning…" line.
- Tightened a garbled clause in the origin paragraph ("PHP, which includes WordPress").

### v1
- Initial release: PHP end-of-life lookup (endoflife.date) + Composer package vulnerability
  lookup (OSV.dev), prioritized findings table, copyable client-ready summary, and a live
  example-mode scan with an honest offline fallback.
