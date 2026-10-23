You are building one prototype for "Moonshots, Built". The current directory
(`$slug/`) is empty except for `IDEA.json`. Follow the prototype standards in your system
prompt exactly.

## The idea
$idea

## Source episode
$episode
$kind_notes

## How to work
1. Read `IDEA.json`. Decide the single centerpiece interaction that makes the idea click in
   five seconds, and a visual direction that fits the subject (not a generic dashboard).
   Write a 5-line plan for yourself, then build.
2. Build `index.html` and any supporting files in this directory only. Prefer a single
   polished screen over many shallow ones. Bundle any datasets in `data/`.
3. Run the smoke test and fix everything it reports, repeating until it passes:
   `python3 $smoke .`
   It loads the page in headless Chromium at desktop and phone sizes, clicks a few
   controls, and reports console errors, failed requests, missing files and overflow.
   Screenshots land in `.review/`; open `.review/desktop.png` and `.review/mobile.png` with
   the Read tool and fix anything that looks broken, cramped or unfinished.
4. Write `README.md` (sections: what it is, origin, how to use, real vs simulated, v2
   ideas, `## Changelog` with a `v1` entry).
5. Finish with a two-sentence summary of what you built. Do not create `meta.json`.
