# Line Spec Scorer

A one-screen audit tool for operations managers scoping a humanoid or mobile-robot pilot.
You list the tasks on your line with how long each takes a human today, and the tool scores
each one 0–100 for robot-readiness, ranks them as pilot candidates, and draws a 24-hour map
of when a robot would sit idle waiting on trucks or staff.

## Origin

From the Moonshots episode "How Figure AI Is Outcompeting China and Tesla in Robotics |
Robotic Deep-Dive w/ Brett Adcock" (2026-11-17). Around 00:03:59 Brett says commercial work
is easier to automate because tasks are tightly specified, almost writable on paper, but
speed targets are strict. Later in the episode he gives two of those targets — a sub-three-second
package move (00:21:21) and carrying boxes around 50 lb (01:05:37) — and separately notes that
automated lines still stall because trucks and other human processes run on fixed shifts. This
tool turns those three points into a scoring rubric and an idle-time map a manager can run
against their own site.

## How to use it

1. Set your **truck dock window** and **staff shift window** — the 24-hour map below updates
   live and totals the idle hours outside both.
2. Enter each task: its name, cycle time in seconds, how much that cycle time varies, the
   heaviest item it handles, and whether a human has to hand work into it. Five rows are ready
   by default; add more with **+ Add task**.
3. Click **Score tasks** to get a ranked table: a 0–100 readiness score, a one-line reason, and
   any flags against the episode's reference figures (sub-3-second pace, 50 lb payload).
4. Click **Load example warehouse** to see a filled-in sample site — it's clearly labeled as an
   example, not your data.
5. Click **Print one-page summary** to get a print-ready version of the shift windows, idle map
   and ranking (browser print dialog — save as PDF or send to a printer).

## What's real vs. simulated

- The sub-three-second pace and 50 lb payload figures, and their citations, are what Brett
  actually said on the episode (see `IDEA.json`).
- The scoring weights (speed margin, payload margin, spec tightness, no-handoff) are this
  tool's own assumptions, not from the episode — they're exposed as editable sliders and
  labeled "editable assumptions" in the UI.
- Every task score, flag, idle-hour total and ranking is computed live from whatever you type
  in; nothing is precomputed or faked. The "Load example warehouse" sample is a made-up site for
  demonstration only, and is labeled as such on screen.

## Ideas for v2

- Let the manager mark which tasks depend on the truck window vs. the staff window
  individually, instead of one site-wide idle map.
- A shareable link/export (JSON) so a vendor and the customer can compare the same audit.
- Multi-shift sites (e.g. two staff shifts with a gap) instead of one window each for trucks
  and staff.

## Changelog

### v1
- Initial release: task table with live 0–100 scoring, ranked results with flags citing the
  episode's figures, a 24-hour truck/staff idle-time map, example data loader, and a
  print-ready one-page summary.
