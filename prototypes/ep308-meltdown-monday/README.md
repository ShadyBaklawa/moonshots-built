# Meltdown Monday

A night-shift defense game: twenty supermarket freezers, each sitting on the open internet,
come under simulated remote "defrost" attacks over a compressed overnight shift. You have a
limited budget to defend stores before the attacks land, and watch spoiled-stock losses pile
up for anyone left exposed.

## Origin

Inspired by Moonshots EP #308 (around 01:14:29), where Peter Diamandis described hackers
remotely switching European supermarket freezers into defrost mode overnight, pushing
temperatures up to 55°C across eight countries, after an earlier wave that hit more than 500
stores in France. Paraphrased for this prototype; this is a fan-made game, not the podcast's
own material.

## How to use

1. Read the briefing and click **Start the night**.
2. Spend your €2,000 budget on any store, any time: **Change password**, **Add VPN**,
   **High-temp alarm**, or **Take offline**. Each has a different cost and effect — VPN and
   Take offline fully block an attack (even one already in progress), a password change slows
   a successful attack's temperature rise, and an alarm halts losses once the freezer crosses
   a danger threshold.
3. Watch the map: attacked stores glow red, their thermometer climbs, and their euro loss
   counter grows if they're undefended.
4. At 06:00 the night ends and a recap compares your total losses with the real incident
   figures from the podcast.

## Real vs. simulated

- **Simulated:** all 20 store names/locations, the timing and targets of each attack, freezer
  temperatures, defense costs and effects, and resulting euro losses. A banner and status pill
  on the page mark this explicitly.
- **Real, sourced from the podcast:** the recap's comparison figures — 55°C peak attacker
  temperature, eight countries hit, ≈€100,000 in spoiled food in the Belgian incident, and
  500+ French stores hit three weeks earlier — each labeled "as stated on the podcast".

## v2 ideas

- Let players see which stores are "exposed" vs already patched at a glance before spending,
  mirroring real asset-inventory tools.
- Add a second wave later in the night so early spending choices get retested.
- Show a running leaderboard of loss totals across playthroughs (stored locally, no server).

## Changelog

### v1
- Initial release: 20-store night map, budget-limited defenses (password, VPN, alarm,
  offline), live thermometers and loss counters, end-of-night recap sourced to the podcast.
