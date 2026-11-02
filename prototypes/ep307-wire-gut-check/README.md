# Wire Gut-Check

**What it is.** A tool for the person at a small company who approves wires or ACH payments.
Paste the email, chat message or call notes asking for a payment, and it highlights the
phrasing that fraud investigators look for — urgency, secrecy, changed bank details, a new
contact channel, a senior title used as pressure — gives a 0–100 risk score, and hands back a
callback script that always points to a number you already have, never one in the message.

**Origin.** Moonshots #307, "Making Sense of This Week's AI Market Crashes," around 00:02:20.
Peter Diamandis and Emad Mostaque discuss a record crypto theft that started with one
engineer's compromised machine and was over in 20 minutes, then Emad brings up the Bangladesh
SWIFT fraud and warns that AI will make human-targeted, voice-cloned attacks more convincing.
This prototype is the "callback drill" habit that advice points toward, built as a one-screen
checker.

**How to use it.** Paste a payment request into the box, or click one of the three example
buttons to load a sample instantly. Click "Check this request" to see the highlighted red
flags, the risk score, the matched rules, and a ready-to-read callback script. Optionally type
a name in "who should the script tell you to call" to personalize the script — it is never
filled in from the pasted text. The "Add free-form AI analysis" section is optional: paste
your own Anthropic API key to get a short plain-English second opinion; everything else works
without one.

**Real vs. simulated.** The red-flag rules, scoring and callback script are real logic running
entirely in your browser on whatever text you paste — nothing is sent anywhere unless you use
the optional AI section. The three example requests are invented for this demo (clearly
labeled "Example: …" when loaded) and are not real messages from any real person or company.
The AI analysis, when used, is a live model response labeled as an optional, unverified
add-on — your API key is only used for that one request and is never saved.

**v2 ideas.**
- Let a team save their own "numbers on file" so the script fills in a real extension instead
  of a placeholder name.
- Parse forwarded email headers to flag look-alike domains, not just body text.
- A short quarterly "drill" mode that sends a team a fake request (with the client's written
  consent) and reports who called back versus who paid.

## Changelog

### v1
- Initial release: rules-based red-flag highlighter, 0–100 risk gauge, matched-rules list,
  callback script, three labeled examples, and an optional BYOK AI analysis add-on.
