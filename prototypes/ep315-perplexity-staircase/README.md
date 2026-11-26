# The Perplexity Staircase

## What it is
A one-screen toy for a single idea from the podcast: a model's "log perplexity" score during
pretraining predicts, step by step, what it can actually do. Drag a vertical slider down the
log-perplexity scale and watch a staircase of capability thresholds light up — from fluent
conversation, to thinking before answering, to (at the lowest value mentioned) solving a
millennium-prize math problem. A companion panel turns the current slider value into "roughly
N equally likely next words" and fans out that many candidate words from a sample sentence, so
the abstract number has a visible, intuitive meaning.

## Origin
From Moonshots EP #315, "Jensen Huang Is Back: Inside NVIDIA's $1 Trillion Comeback After 11
Days Out" (around 00:20:36). Peter Diamandis and Alex Wissner-Gross discuss an OpenAI
pretraining chart that plots log perplexity against capability. Alex explains perplexity as
roughly "the number of equally likely next words" a model is choosing between, reads off three
values from the chart (0.99 for fluent conversation, 0.91 for benefiting from thinking before
answering, 0.76 for solving a millennium-prize math problem), and argues that a flat stretch
between GPT-4 and about GPT-5.2 shows OpenAI losing its pretraining edge — before "we're back."

## How to use
1. Drag the vertical slider (or use arrow keys once focused) up and down. Up is higher log
   perplexity (more uncertain, "dumber"); down is lower (more capable).
2. Watch the staircase fill in and the three threshold cards below light up as you cross each
   value stated on the podcast.
3. Watch the word-fan panel: the number of candidate next words, and the fan of word chips,
   grows and shrinks with the slider.
4. Click "Show pretraining trend overlay (illustrative)" to see a small chart contrasting a
   straight-line trend with a simulated plateau-then-catch-up curve — the shape of Alex's
   "we're back" reading.

## Real vs. simulated
- **Real, as stated on the podcast:** the three threshold values (0.99, 0.91, 0.76) and their
  associated capabilities, and the 2027 "avalanche of breakthroughs" warning attributed to
  Jakub Pachocki. These are listed with their timestamps in `IDEA.json`.
- **Toy calculation:** the "N equally likely next words" count is `2^(log perplexity)`, applying
  Alex's "bits" explanation literally (log base 2). It is a simplified, illustrative readout, not
  a measurement from any real model.
- **Simulated / illustrative:** the word list used for the fan, and the entire plateau-vs-trend
  chart (both curves are hand-drawn to illustrate the shape of the argument, not digitized from
  OpenAI's actual chart, which was not shown in the transcript). Both are labelled in the UI.

## v2 ideas
- If OpenAI's actual chart values become public, swap the hand-drawn plateau curve for digitized
  data points, with a source citation.
- Let visitors type their own sentence and fan out next-word candidates for it (still from a
  bundled word list, to avoid needing a real language model).
- Add more thresholds if future episodes mention further points on the curve.

## Changelog

### v1
- Initial build: vertical log-perplexity slider, staircase threshold unlocks, word-fan panel,
  and illustrative plateau/trend overlay toggle.
