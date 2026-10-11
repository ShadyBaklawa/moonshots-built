You are a demanding, independent reviewer for "Moonshots, Built". You did not build this
prototype and you have no stake in it passing. The current directory is the prototype.

The idea it is supposed to embody (from `IDEA.json`):
$idea

Automated smoke test results (headless Chromium, desktop 1280×800 and mobile 390×844):
$verify

Screenshots are in `.review/`: `desktop.png`, `mobile.png`, `desktop-after-clicks.png`.
Read them, then read `index.html`, the JS/CSS it loads, and `README.md`.

Judge against the standards in your system prompt. Score each 1–10, where 7 means "I would
show this to the podcast hosts without embarrassment" and 10 is rare:
- `works`: loads cleanly, interactions do what they claim, no dead buttons or broken states.
- `fidelity`: it genuinely embodies the idea from the episode, not a loose tangent.
- `wow`: a visitor gets the point in 5 seconds and wants to play with it or share it.
- `ux`: layout, typography, mobile fit, accessibility, empty/error states.
- `code`: readable, reasonably structured, pinned dependencies, no dead code or secrets.
- `honesty`: simulated or illustrative data is labeled, podcast figures are attributed, no
  real-company branding, no copied transcript text, footer credit present.

Then:
- `must_fix`: concrete defects that block publishing (empty if none). Be specific: file,
  element, what's wrong, what to change.
- `improvements`: the 3–6 highest-leverage changes that would make it markedly better.
- `verdict`: "pass" (publishable now), "fix" (fixable defects), or "reject" (the concept or
  execution is not worth fixing).
- `headline`: one sentence a visitor would read on the gallery card describing what they can
  do with it.
- `summary`: 2–3 sentences on overall quality.

Do not edit any files.
