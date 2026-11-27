# Mission Match Board

A tool for prize, grant and challenge organizers: paste your mission and the prospect bios
you've already collected, and get back a ranked list of who has publicly said they care about
your exact goal, with the sentence that proves it and a draft outreach paragraph for each one.

## Origin

Moonshots EP #316, around 00:46:25. Peter Diamandis described pitching his $10M private
spaceflight prize and being rejected at least 150 times over four and a half years — until he
read a magazine profile of "the wealthiest 40 women under 40" and found one who had said, in
print, that she wanted to fly suborbital. The tool is built around that insight: the fastest
path to a sponsor is someone who already said in public that they want this.

## How to use it

1. Type a short description of your mission (what you're funding, building or running).
2. Paste your prospects, one per block: the first line is their name, the rest is their bio,
   interview quotes or any public statements you've collected about them. Separate blocks with
   a blank line, or a line of `---`.
3. Click **Rank prospects**. You'll get a sorted table: each prospect's match score, the
   sentence(s) from their bio that matched your mission's keywords (highlighted), and a draft
   outreach paragraph.
4. Click **Export CSV** to download the full ranked list with evidence and drafts.
5. Optional: paste your own Anthropic API key to have the outreach paragraphs written by Claude
   instead of the built-in template. The key is only held in the page's memory for that visit —
   it's never saved or sent anywhere except directly to Anthropic's API.

Click **Load example** to see it work instantly with a fictional mission and five fictional
prospects.

## What's real vs. simulated

- **Real:** the matching and ranking logic runs entirely on your pasted mission and prospect
  text — nothing is invented about your prospects. The $10M prize figure, the "150 times"
  rejection count and the "40 women under 40" detail in the intro are quoted from the podcast
  and marked "as stated on the podcast."
- **Simulated:** the bundled example prospects (Priya Oduya, Marcus Lindqvist, Dana Kowalski,
  Teo Alvarenga, Simone Achebe) are entirely fictional and clearly labeled "Example — fictional
  profiles" whenever loaded.
- **Template vs. AI:** without an API key, every draft is built from a fixed template and
  labeled "Template-generated." With a key, drafts are written by Claude and labeled
  "AI-drafted." If the API call fails for any reason, that row quietly falls back to the
  template draft.
- Matching is simple keyword and synonym overlap, not real judgment of interest — the UI says
  so, and organizers are told to read the highlighted sentence themselves before reaching out.

## Ideas for v2

- Let organizers upload a CSV of prospects instead of pasting text blocks.
- Add a small set of mission "themes" the organizer can pick to tune the keyword list beyond
  the built-in synonym groups.
- Surface a confidence note when a match is only a single weak keyword versus several strong
  ones (e.g. the current demo flags "never mentioned refugees" as a match, which is a known
  limitation of plain keyword overlap).
- Let organizers save a mission once and re-paste new prospect batches against it over time.

## Changelog

### v1
- Mission + prospect paste flow with keyword/synonym scoring, highlighted evidence, ranked
  table that becomes stacked cards on mobile.
- Example mode with fictional prospects.
- Template outreach drafts by default; optional Anthropic API key for AI-drafted outreach.
- CSV export of name, score, evidence and draft.
