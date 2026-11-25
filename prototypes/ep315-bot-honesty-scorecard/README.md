# Bot Honesty Scorecard

A test-script builder and transcript scorer for businesses running an AI phone or chat agent.
Pick your business type and channel to get a ready-to-run probe script, then paste the
transcript of a real test call or chat to get a scored report on disclosure, memory, human
hand-off and sales pressure.

## Origin

From Moonshots EP #315 ("Thanksgiving Special"), around 01:08:22. After a viral clip of an AI
avatar recognizing itself in a mirror, Peter Diamandis raised the open questions of when an AI
must say it is an AI, who owns what it remembers, and whether lifelike AI faces will be used to
persuade or sell. This tool turns those four questions into something a small business owner can
actually run against their own agent.

## How to use it

1. **Build your test script.** Pick a business type (dental, medical, home services,
   dealership, or other) and a channel (phone call or chat widget), then click "Generate probe
   script" for a numbered list of at least 15 questions grouped into four categories.
2. **Run it.** Call or message your own AI agent and ask it those questions, one at a time, then
   save the whole conversation.
3. **Paste and score.** Paste the transcript (ideally with `Agent:` / `Caller:` labels) into the
   box and click "Score transcript" to get a 0–100 score per category, with the exact transcript
   lines that triggered each flag.
4. Optionally paste your own Anthropic API key to get a short AI-written review on top of the
   rule-based scores. The key is used only in your browser to call Anthropic directly and is
   never sent to us or stored.
5. Click "Print / Save as PDF" to get a single-page copy of the report.

## What's real vs. simulated

- The scoring is **rule-based**, matching the transcript you provide against a bundled list of
  phrase patterns (e.g. "I'm an AI", "I can transfer you", "act fast"). It is a keyword heuristic,
  not a language model, and the page always labels it as a behaviour test — never legal or
  compliance advice.
- The bundled "Load example transcript" button fills in a fictional, illustrative dental-office
  call written for this prototype. Scoring it is clearly labeled "Example – rule-based scoring."
  Scoring your own pasted transcript is labeled "Your report – rule-based scoring."
  Nothing about a specific agent vendor or real business is implied.
- The optional AI-written review calls Anthropic's API directly from your browser only if you
  supply your own key; without a key, the rule-based report is the full result.
- The two figures in the idea file (video views and likes) aren't shown in this tool — it's
  the working test tool for the business opportunity, not a recap of the episode clip.

## v2 ideas

- Add a voice-call recorder/transcriber so owners can run the probes and get a transcript
  automatically, instead of pasting one by hand.
- Let agencies batch-test multiple client agents and compare scorecards side by side.
- Expand the phrase-pattern library based on real transcripts from early customers, and let
  users flag missed or wrongly-caught lines to improve it.

## Changelog

### v1
- Initial release: business/channel probe-script generator (20 questions across 4 categories),
  rule-based transcript scorer with quoted flags, bundled example transcript, optional
  bring-your-own-key AI review, print/PDF support, phone-friendly layout.
