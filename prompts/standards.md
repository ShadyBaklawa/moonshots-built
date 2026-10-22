# Prototype standards (Moonshots, Built)

Every prototype in `prototypes/<slug>/` is a small, self-contained, honest demo of one idea
discussed on the Moonshots podcast. It is published on a public gallery that the hosts may see.

## Hard rules
1. **Static and self-contained.** `index.html` is the entry point and must work when the folder
   is served by any static file server. No build step, no backend, no `npm install`.
   Plain HTML/CSS/JS or ES modules. Third-party libraries only from a CDN with an exact pinned
   version (cdn.jsdelivr.net/npm/pkg@x.y.z, unpkg.com/pkg@x.y.z, esm.sh/pkg@x.y.z,
   cdnjs.cloudflare.com). Keep total folder size under 3 MB.
2. **Works with zero setup.** No API keys required. If the idea needs live data, use only keyless,
   CORS-friendly public APIs and always ship a bundled fallback dataset in `data/`. An optional
   "bring your own API key" field is allowed for AI features, but the default experience must work
   without it (scripted / simulated mode), and a key must never be stored anywhere but the
   viewer's own browser.
3. **Honest.** Anything simulated, synthetic, or illustrative is labeled visibly in the UI
   (e.g. a "Simulated data" tag next to the chart). Numbers quoted from the podcast are labeled
   "as stated on the podcast". Never present fake data as real measurements.
4. **Accurate numbers.** Every number presented as real (from the podcast or the world) must
   come from the `figures` list in `IDEA.json` with `"verified": true`, shown with the same
   meaning. Never invent, estimate or adjust a figure to make others fit; never attribute a
   number, prediction or quote to a named person unless that figure lists them as saying it.
   A number calculated from listed figures is fine if the calculation is simple and the UI
   says it is derived. Anything else (scenario sliders, example rates) must be labeled
   "illustrative" and must not carry a real person's name. If a figure you need is missing or
   unverified, leave it out or make it a clearly labeled illustrative input. If `IDEA.json`
   has no `figures` list (older prototypes), do not add new real-world numbers.
5. **Original.** Invent original product names, logos and copy. Never use the branding, logo or
   name of a real company or person as the product, never imitate a real site, and never copy
   transcript text: paraphrase, with at most one short quote under 15 words.
6. **No harmful scope.** No real-money trading or payments, no medical diagnosis or dosing
   advice, no scraping of third-party sites, no collection of personal data.
7. **Phone-ready.** Usable at 390 px wide with no horizontal scrolling, readable type
   (≥ 15 px body), touch targets ≥ 40 px, visible keyboard focus, `prefers-reduced-motion`
   respected, and light/dark both legible.
8. **Clean console.** No uncaught errors or console errors on load or on first interactions.

## What good looks like
- Within 5 seconds a visitor understands the idea and can *do* something: drag a slider, run
  a simulation, paste input, watch an agent work. Interaction beats explanation.
- One memorable, polished centerpiece instead of many shallow features.
- Distinct visual identity per prototype that fits its subject; avoid generic SaaS-card layouts.
- A small footer: "Inspired by Moonshots <episode>, around <timestamp>. Fan-made prototype, not
  affiliated with the show." linking to the episode URL.

## Required files
- `index.html` (+ any `*.js`, `*.css`, `data/*`, `assets/*`)
- `README.md` with: what it is (2–3 sentences), the idea's origin (episode, timestamp,
  paraphrased context), how to use it, what is real vs simulated, ideas for a v2, and a
  `## Changelog` section (newest first).
- Do **not** create or edit `meta.json`, `IDEA.json` or anything under `.review/`; the pipeline
  owns those.
