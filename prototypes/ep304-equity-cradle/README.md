# Equity Cradle

## What it is
A compound-growth playground for the "give every kid a stake at birth" idea. Pick a
starting asset — one SpaceX share (~$146) or a $2,000 locked birth dividend — set
a growth-rate preset, then drag an "age they sell" slider and hit **Sell now** to see
exactly how much future value gets forfeited by cashing out early versus holding to 65.

## Origin
From Moonshots EP #304, "Chamath: AGI Is Here, Anthropic's $100B Giveaway, Elon's SpaceX
Shares for 72M Kids," around 00:24:41. Elon pledged one SpaceX share (~$146
at the time) to every American kid, likely via the new Trump Accounts; Chamath countered with a proposal for
a simpler, locked $2,000 cash dividend at birth. The hosts debated whether kids would
actually hold the stake or dump it immediately.

## How to use
1. Choose a birth year, then pick a starting asset (SpaceX share or birth dividend).
2. Pick a growth-rate preset (or drag the slider) to set the annual compounding rate.
3. Drag "age they sell" to the age you want to test, then click **Sell now at this age**.
4. The chart splits into the held curve (gold) and the frozen cash payout (cyan), with
   the forfeited growth marked in red and totalled in the results panel.
5. Click **Hold instead** to reset and compare a different scenario.

## Real vs simulated
- **Real (as stated on the podcast):** one SpaceX share per kid at about $146 (the
  share price when the pledge was made), the $2,000 birth-dividend proposal, the 72M kids / $10.5B total
  gift figures, and the $250/kid Dell comparison — all shown in the "From the episode"
  panel.
- **Simulated:** the compound-growth curve itself. Growth-rate presets (7% historical
  S&P 500 baseline, 20% bullish SpaceX case, 45% "orders of magnitude" moonshot bet) are
  illustrative scenarios inspired by the episode's discussion, not forecasts or financial
  advice. Real markets are never this smooth, and nothing here should be used to make an
  investment decision.

## v2 ideas
- Let users compare both assets side by side on the same chart.
- Add a toggle for the reinvestment rate on sold cash (currently a fixed 5%/yr default)
  so visitors can test more/less optimistic opportunity-cost scenarios.
- Pull a live SpaceX (SPCX) quote (if a keyless public source exists) to
  update the reference share price instead of a static bundled figure.
- Add arrow-key navigation to the starting-asset radio group for full keyboard parity
  with native radio buttons.

## Changelog
### v2
- Fixed: the birth-year slider was a dead control that updated its own label but nothing
  else. It now drives real calendar-year labels throughout (e.g. "turns 65 in 2091"),
  stamps the sell-age marker with the year it lands in, and adds a "today" marker on the
  chart showing how old the kid would actually be right now given that birth year.
- Changed: cash from an early sale now grows at a modest, clearly-labeled 5%/yr
  reinvestment rate instead of sitting flat at $0 growth, so the "forfeited growth" stat
  compares against a more honest baseline.
### v1
- Initial release: asset picker, growth-rate presets/slider, animated log-scale
  compound-growth chart, sell/hold comparison with forfeited-value stat, bundled podcast
  figures panel, starfield visual theme.
