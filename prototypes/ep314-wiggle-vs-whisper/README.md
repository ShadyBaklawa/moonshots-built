# Whisper vs Wiggle

A side-by-side training race between two identical tiny neural nets: one learns with
**backpropagation**, the other with **weight perturbation** ("nudge a weight, check if the
loss dropped, keep it or revert"). Press Train and watch the decision-boundary heatmaps,
loss curves, and a running "forward passes used" counter show exactly how much more
compute the wiggle-and-check method burns through to get to the same place.

## Origin

From Moonshots episode #314 ("AI Market Shocks, Anthropic's Stock Slide, Gemini Releases,
and Elon's $435M Bet"), around 01:19:30. Dave Blundin contrasts backprop — which sends the
error signal backward through a network in one pass to get every weight's gradient at
once — with inference-time "nudge and check" training, where a weight is perturbed and the
change in output is observed directly. He notes it's mathematically similar but much less
efficient, and that closing that efficiency gap is an active area of research.

## How to use

1. Press **Train** to start both networks learning the same 2D "two moons" pattern from
   the same starting weights.
2. Watch the two heatmaps color in as each network's decision boundary shifts, and the
   loss curves plot live underneath.
3. The **forward passes used** counter under each panel shows the real cost: backprop
   gets a full gradient from one pass over the data each epoch; perturbation needs one
   extra pass per weight it tests.
4. Drag **Hidden layer size** to add more weights to both networks — the "passes needed to
   reach target loss" bars at the bottom will show the gap widen further.
5. Drag **Target loss** to pick a stricter or looser finish line for that readout.
6. **Reset** restarts both networks from a fresh (but matched) set of starting weights.

## What's real vs simulated

- The two neural networks, their math (forward pass, backprop gradients, weight
  perturbation), and the training loop are real and run live in your browser — nothing is
  pre-recorded or faked.
- The dataset is a small synthetic "two moons" toy pattern generated with a seeded random
  function, labeled as such. It is not real-world data.
- The perturbation method here is a simplified, sequential "nudge one weight, test, keep or
  revert" version, not a state-of-the-art method such as SPSA with intermediate targets.
  Modern research narrows this gap faster than this demo shows.
- The "2 trillion weights" figure in the callout is quoted from the podcast (as stated by
  Dave Blundin, 01:19:30) purely for scale — it is not computed from anything in this demo.

## v2 ideas

- Add a third panel for a smarter perturbation variant (e.g. simultaneous perturbation of
  all weights per trial, like SPSA) to show how research narrows the gap.
- Let users draw their own 2D pattern for the networks to fit.
- Add a "wall-clock" estimate translating forward passes into rough GPU-seconds at
  different model sizes, clearly labeled as illustrative.

## Changelog

### v1
- Initial release: matched backprop vs weight-perturbation training race on a toy 2D
  dataset, with live heatmaps, loss chart, forward-pass counters, and a target-loss gap
  readout that widens with hidden-layer size.
