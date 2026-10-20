# The Rudeness Multiplier

A tiny "lab" scoreboard: type any prompt, and it gets rewritten two ways — a
polite version and a blunt/rude version — then the two race on an animated
bar chart toward a simulated performance score, closing with a card on the
ethics of being rude to an AI.

## Origin

Inspired by Moonshots EP #302 ("OpenAI Bulk-Solves 722 Math Problems,
Anthropic's Cruelty Policy, and Elon's Quadrillion-Dollar SpaceX"), around
00:05:31, where Peter Diamandis cites a Penn State study (via Sergey Brin)
finding rude prompts scored 84.8% versus 80.8% for polite ones — sparking a
debate about whether being cruel to AI "works," and whether it's worth the
ethical cost. The hosts also cover Anthropic's stance against abusive
language toward its models, and Dave's "brusque beats abusive" counter-point.

## How to use

1. Type a prompt in the box, or tap one of the preset chips.
2. Hit "Run the race." Two rewritten versions of your prompt (polite and
   rude) animate across the scoreboard toward their simulated score.
3. After the race finishes, a card appears with the real cited study
   context plus the hosts' ethical pushback.

## What's real vs. simulated

- **Real:** the baseline figures, 84.8% (rude) and 80.8% (polite), are the
  actual numbers cited on the podcast from the Penn State study, bundled in
  `data/study.json`. The Anthropic and Dave quotes are paraphrased summaries
  of points made on the show, not verbatim transcript.
- **Simulated:** the polite/rude rewrites are produced by a simple
  find-and-replace text transform (stripping or adding politeness words),
  not a language model. The per-prompt score is a heuristic — a shared
  "clarity bonus" from prompt length/specificity, plus a small deterministic
  jitter derived from the rewritten text — layered on top of the real
  baseline numbers. It is illustrative only and does not measure any actual
  AI model's accuracy on your prompt.

## v2 ideas

- Let users paste their own rude/polite pair instead of only auto-rewriting.
- Add a second scoreboard for "neutral/direct" prompts to test Dave's
  "brusque beats abusive" claim explicitly.
- Pull in more cited studies (if any surface in future episodes) to compare
  across datasets instead of a single baseline.

## Changelog

### v1
- Initial build: prompt input with presets, auto rude/polite rewrite,
  animated bar-race scoreboard, and a disclaimer card quoting Anthropic's
  cruelty policy and Dave's counter-argument.
