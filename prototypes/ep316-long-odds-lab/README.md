# Long-Odds Lab

## What it is
An interactive calculator for "X times more likely" claims about tech CEOs. You set a
population share and a CEO-group share with two sliders, and the page computes both a
**representation ratio** (CEO share ÷ population share) and an **odds ratio** ((CEO odds) ÷
(population odds)) live, side by side, with a shaded uncertainty band driven by how many CEOs
are in the sample.

## Where it's from
On Moonshots episode #316 ("Thanksgiving Special: The Moments That Almost Ended Us (And Why
We're Grateful)"), around 00:31:34, Dave Blundin says an AI comparison of top tech CEOs by
market cap against the general population found foreign-born people "eight times more likely"
to be a top tech CEO, citing 14% of Americans as foreign-born versus 60% of top tech CEOs. He
also claims college dropouts are 3x more likely and adoptees 10x more likely, without giving
base rates for either.

## How to use it
- Drag the **population share** and **CEO-group share** sliders to see the two bars move and
  the ratios recompute instantly.
- Drag **number of top CEOs sampled** to see the shaded uncertainty band widen (small sample)
  or narrow (large sample) around each ratio.
- Click **Foreign-born (episode)** to load the show's own 14% / 60% figures and drop a red
  "episode claim: 8x" marker on both scales for comparison.
- Click **Dropout** or **Adopted** to drop a 3x or 10x target marker without touching the
  sliders — since the show gave no base rates for either, try dragging the sliders yourself to
  find a population/CEO-share combination that would produce that ratio.
- Read the "Why doesn't 60% ÷ 14% = 8x?" panel for the possible explanations for the gap
  between the show's stated 8x and the 4.3x you get from the two stated percentages.

## Real vs. simulated
The 14%, 60%, 8x, 3x and 10x figures are exactly as stated on the episode (see the "as stated"
labels and the explainer panel). Everything else — the slider positions you choose, the
resulting ratios, and the uncertainty band — is live arithmetic on whatever inputs are
currently set, clearly presented as a calculator rather than as additional real-world data.
The uncertainty band uses a standard 95% Wilson confidence interval on the CEO-group share
given the chosen sample size; it is a statistical illustration, not a claim about the real
number of top tech CEOs.

## v2 ideas
- Let users name their own trait and save a custom preset card.
- Add a worked "what sample size would make 60% statistically indistinguishable from 50%?"
  callout.
- Show a small table of real, sourced base rates for comparison (e.g., published estimates of
  the US dropout rate) if a verified figure is ever added to the episode data.

## Changelog
### v1
- Initial release: population/CEO-share/sample-size sliders, live representation and odds
  ratio readouts, Wilson-interval uncertainty bands, three presets (foreign-born, dropout,
  adopted), and a permanent explainer on the 8x vs. 4.3x gap.
