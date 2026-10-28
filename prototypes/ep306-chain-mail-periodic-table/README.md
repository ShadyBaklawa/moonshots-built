# Chain Mail Periodic Table

## What it is
An interactive grid of qudit-pair "links" (dimensions 2–6 on each axis), styled like a cross
between chain mail and a periodic table. Clicking a cell reveals the fundamental force Alex
Wissner-Gross assigned to that pair of dimensions, or marks it "not specified in episode."
Cells whose dimension product is 8 or more are shaded as dark-sector ("bound entanglement
possible") candidates. A side panel evaluates his spoken formula for the inverse fine
structure constant step by step, entirely in-browser, and compares it digit by digit against
the quoted measured value.

## Origin
From Moonshots #306, around 01:29:04, Alex Wissner-Gross describes his own new "chain theory":
the universe built from maximally entangled pairs of finite quantum systems, where each pair
of dimensions corresponds to a force (2-2 spacetime, 3-2 electromagnetism, 3-3 strong,
4-2 weak, 4-3 Yukawa, 4-4 Higgs), and pairs with a dimension product of 8 or more permit
undistillable "dark" states. Around 01:44:59 he gives a closed-form expression for the inverse
fine structure constant, and around 01:10:59 he quotes the measured value of 137.035999… to
ten digits.

## How to use
- Click any cell in the grid to see which force (if any) Alex assigned to that pair of qudit
  dimensions, and whether its dimension product crosses the dark-sector threshold of 8.
- Read the formula panel: every term of `(79 + 48√2 + 42√3 + 3√6) / (24·36²)` is computed
  live, along with the sum, the denominator, the result, and its inverse.
- The digit-by-digit row at the bottom highlights, in green, exactly how many leading digits
  of the computed inverse match the quoted 137.035999 value before the first difference.

## Real vs. simulated
- The force mappings (2-2 through 4-4) and the formula's integers (79, 48, 42, 3, 24, 36) and
  the quoted value 137.035999 are transcribed as stated on the podcast.
- All arithmetic (square roots, sums, the division, the digit comparison) is computed live in
  the browser from those inputs — nothing about the result is hard-coded or faked.
- Cells beyond 4×4 (5, 6) have no mapping from the episode and are honestly labeled
  "not specified in episode," not invented.
- Chain theory itself is one researcher's new, unreviewed framework. It is not an established
  or peer-reviewed physics result, and the mapping/formula as transcribed here may not exactly
  match whatever Alex's published version says.

## v2 ideas
- Let visitors toggle between "unordered pair" and "ordered pair" views of the grid, since
  chain theory's actual indexing convention isn't specified in the episode excerpt.
- Add a short animated "chain link" visualization showing two qudits entangling when a cell
  is selected.
- Link out to Alex Wissner-Gross's own writeup of chain theory, if and when one is published,
  so visitors can compare the transcribed formula against the real one.

## Changelog
### v1
- Initial release: qudit-pair grid with force mappings and dark-sector shading, live formula
  evaluator with digit-by-digit comparison against the quoted alpha value, not-peer-reviewed
  banner, and responsive mobile layout.
