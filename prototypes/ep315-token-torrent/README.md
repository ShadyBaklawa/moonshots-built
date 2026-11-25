# Token Torrent

A single-screen demo of just how fast real-time AI avatars could get at generating text.
Press "Speak" (or type a sentence instead), and watch two panes tally up how many tokens,
pages and books that span of time is worth at today's generation speed versus a predicted
future speed, while an ambient bookshelf keeps filling in the background at whatever rate
the speed slider is set to.

## Origin

On Moonshots ep 315 ("Thanksgiving Special: The Moments That Almost Ended Us (And Why We're
Grateful)"), around 01:12:14, Dave Blundin says real-time avatars currently run at "about 100
tokens per second" but expects that to jump "to a million tokens per second... within 18
months for sure" — fast enough, he says, to write a full book series every second you speak.
This prototype turns those two numbers into something you can feel by comparing them against
your own speaking time.

## How to use it

1. Press the **Speak** button, say a sentence or two out loud, then press **Stop**. The
   results strip above the two panes shows exactly how many tokens (and roughly how many
   pages or books) each speed would have produced over that exact duration.
2. Don't want to talk? Type a sentence into the text box instead — it estimates how long that
   sentence would take to say out loud (at ~150 words/minute) and uses that as the duration.
3. Drag the **speed slider** in the Prediction pane anywhere between 100 and 1,000,000
   tokens/second (log scale) to see the ambient bookshelf and the "books per second" counter
   speed up or slow down in real time — independent of the Speak timer.

## What's real vs. simulated

- **Real, cited to the episode:** the "100 tokens/second" and "a million tokens per second"
  figures, and the "within 18 months" time frame, all said by Dave Blundin at 01:12:14 —
  labelled "as stated on the podcast" / "prediction" in the UI.
- **Labelled estimates:** words-per-token, words-per-page, words-per-book, and the
  words-per-minute speaking rate used to convert a typed sentence into a duration. These are
  not from the episode; they're reasonable approximations used only to translate tokens into
  something visual, and are called out as "estimate" wherever they're used.
- **Simulated:** all filler text shown in the scrolling text previews and the bookshelf
  spines are generated locally in the browser from a small fixed word list — no network
  calls, no real book content. At very high speeds the on-screen text and shelf are
  throttled for smooth rendering, but the numeric token/page/book counts are always computed
  exactly from the formulas above, not from counting what's rendered.

## v2 ideas

- Real microphone input (with permission) to measure actual speaking duration and word count
  instead of a manual timer or typed estimate.
- Let visitors pick a genre or reading level to see how the word-per-book estimate shifts.
- Side-by-side cost or energy comparison for generating a book's worth of tokens at each speed.

## Changelog

### v1.1
- Fixed the on-button stopwatch readout: it now updates live while recording and shows the
  final duration on Stop, instead of staying frozen at "0.0s".
- Typing into the sentence box while a Speak recording is in progress no longer overwrites the
  live duration.
- Added a "N× today's speed" multiplier next to the Prediction pane's speed readout, and moved
  the "18 months" figure into visible copy (not just the quoted sentence).
- Added `aria-live` to the Speak timer so screen readers announce the duration too.

### v1
- Initial build: Speak/Stop timer and typed-sentence alternative, dual Today/Prediction
  panes with cited figures, log-scale speed slider, ambient bookshelf + books/s counter,
  labelled assumptions panel, and episode footer citation.
