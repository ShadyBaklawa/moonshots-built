# Checkout Script X-Ray

A tool for e-commerce and SaaS teams who run checkout or login pages with lots of
third-party marketing, analytics and A/B-testing tags but no dedicated security staff.
Paste the page's HTML and it lists every outside script and iframe by domain, flags the
ones missing Subresource Integrity (SRI), separates out inline scripts and tag-manager
loaders that a CSP can't fully control, and drafts a Content-Security-Policy header plus
a prioritised fix list — all parsed locally in the browser.

## Origin

From Moonshots with Peter Diamandis, "Anthropic's $1.4T IPO: The Biggest Wealth Event in
Human History?", around 00:39:17. Diamandis described a confirmed incident where a flaw
in a website-experimentation vendor's sign-up flow let attackers inject hostile
JavaScript into 178 organisations' sites at once — the script tried to skim card numbers,
steal cookies and hijack crypto payments. His point: scripts from trusted vendors need
rewriting, because one vendor's breach becomes every customer's breach.

## How to use it

1. Paste the full HTML source of your checkout or login page into the box (view source
   or inspect, then copy), or click **Load sample checkout page** to try it with a
   bundled example first.
2. Click **Analyze**.
3. Review the domain table: each external `<script>` or `<iframe>` is grouped by domain,
   with a count and an SRI status flag per tag.
4. Check the **Harder to control** section for inline scripts and tag-manager/analytics
   loaders — these can't be locked down with a CSP domain allow-list alone.
5. Untick any domain in the table to drop it from the generated CSP header.
6. Copy the CSP header and the prioritised fix list and hand them to a developer.

## What's real vs. simulated

- The script/iframe inventory, SRI flags, tag-manager detection and CSP header are
  computed live from whatever HTML you paste or the bundled sample — nothing here is
  canned output for your input.
- Parsing happens entirely in the browser with `DOMParser`; nothing you paste is sent
  anywhere.
- The "178 organisations" figure is labelled "as stated on the podcast" because it's
  Diamandis's number, not independently re-verified by this tool.
- The bundled sample checkout page (`data/sample-checkout.html`) is a fictional page
  built to exercise every flag (missing SRI, inline script, tag-manager pattern, plain
  HTTP script, an iframe) — it is not a real company's site.
- Tag-manager/dynamic-loader detection is a simple keyword match against the domain
  (e.g. "analytics", "tagmanager", "experiment") — it's a heuristic, not a vendor
  database, so it can miss or over-flag unusual domains.

## v2 ideas

- Detect `<link rel="preconnect">`/`<link rel="dns-prefetch">` hints and third-party
  fonts/stylesheets alongside scripts.
- Let the user paste a live URL and fetch its HTML via a CORS proxy, instead of only
  pasting source.
- Export the fix list and CSP header as a single Markdown file for a ticket.
- A small maintained list of known tag-manager/vendor domains instead of keyword
  guessing.

## Changelog

### v1.1
- Bumped the domain table, script lines, harder-to-control list, and section/privacy
  notes from 12.8-14.4px to >=15px so the primary reading surface stays legible once it
  stacks into cards on mobile.

### v1
- Initial release: paste-HTML analysis, domain table with SRI flags, harder-to-control
  section for inline scripts and tag-manager loaders, live CSP header builder with
  per-domain checkboxes, and a copyable prioritised fix list.
