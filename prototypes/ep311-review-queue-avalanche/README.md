# Review Queue Avalanche

## What it is
A single-screen simulation of the moment human code review stops scaling. Pull requests fall
like snow into a canvas "slope," pile up in front of a row of human reviewers, and occasionally
avalanche over the sides when a bin overflows. Sliders control AI output (model instances,
tokens per second, a productivity multiplier) and human review capacity (reviewers, review
speed). A gauge shows the share of AI-generated changes that actually get human eyes on them,
and once that share drops below a threshold the page flags the loop as "closed by default."

## Origin
From Moonshots #311 ("Jensen's Departure, NVIDIA's succession plan, AI doomer response, and
Demis talks RSI"), around 01:04:23. Demis Hassabis argued that in today's early recursive
self-improvement, humans still review AI-written code while engineers get roughly 3–5x more
productive (00:58:03). Emad Mostaque pushed back: no human can review output from "a 10,000
token a second model, then there's a hundred thousand" instances of it. This prototype lets you
feel the gap between those two positions by turning the dials yourself.

## How to use
- Drag **AI productivity multiplier**, **model instances**, and **tokens per second** up to
  increase AI output; drag **human reviewers** and **human review speed** to change review
  capacity.
- Watch the canvas: pull-request blocks fall faster and pile higher as AI output grows, and
  spill into neighboring stacks (an "avalanche") when a column fills up.
- Watch the **human-reviewed share** gauge and the red threshold marker on it. When the share
  drops below your chosen **threshold** slider, a "Closed loop by default" banner appears and
  the blocks turn red.
- Use the preset buttons to jump straight to **Demis's** scenario (3–5x productivity, loop still
  open) or **Emad's** scenario (10,000 tokens/sec × 100,000 instances, loop closed almost
  instantly). **Reset** returns to the baseline.

## Real vs. simulated
- **Real, from the episode** (see the "episode:" tags and preset buttons): the 3–5x productivity
  range Demis cited, and the 10,000 tokens/second and 100,000 model instances Emad cited.
- **Labelled assumption**: human review speed (PRs reviewed per reviewer per hour) is a made-up,
  editable number — the episode gives no figure for human review throughput.
- **Labelled illustrative**: the conversion of "~50,000 tokens of model output ≈ one reviewable
  pull request" used to turn token throughput into a PR count, and the closed-loop percentage
  threshold itself, which you can move.
- Everything else (the falling-block animation's pacing, bin layout, avalanche visuals) is a
  stylised illustration, not a measurement — it's scaled logarithmically so the demo stays
  watchable even at 100,000+ instances, not a literal one-block-per-PR count.

## v2 ideas
- Let a second gauge show a rolling "review debt" (PRs skipped entirely vs. just delayed).
- Add an AI-reviewer slider so users can explore automated review as a mitigation, with its own
  labelled accuracy assumption.
- Swap the log-scaled animation for a literal per-second counter so power users can audit the
  exact math driving the visuals.

## Changelog
### v1.1
- Fixed the on-page note to say ~50,000 tokens per PR (matching the actual `TOKENS_PER_PR`
  constant and this README, instead of a stale ~3,000 figure).
- Corrected the "four episode figures" claim to "three" (the figures shown as tags), and added
  a labelled note surfacing the fourth verified `IDEA.json` figure (Emad's "about an hour"
  DeepSeek V4 training claim) so every verified figure appears somewhere on the page.
- Added an `illustrative` tag to the "Effectively closed loop" threshold slider, matching this
  README's own description of it.
- Marked the "closed loop" banner as an `aria-live="polite"` status region so screen readers
  announce it when the loop flips.

### v1
- Initial build: sliders for productivity multiplier, model instances, tokens/sec, reviewers,
  and review speed; animated avalanche canvas; human-reviewed-share gauge with threshold
  banner; Demis/Emad presets; mobile-responsive layout.
