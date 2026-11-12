# Egress Sniff Sheet

A one-screen tool for a lab manager or PI: paste a CSV export from your router, firewall or
DNS resolver and see which devices are talking to the outside world, how much data they're
sending, when they send it, and where it goes — then generate a network segmentation plan
naming exactly which devices to isolate.

## Origin

From [Moonshots #310](https://podscripts.co/podcasts/moonshots-with-peter-diamandis/can-jensen-huang-remain-ceo-inside-nvidia-s-next-steps-moonshots-310),
around 00:11:55. Dave Blundin describes MIT investigating its Chinese-made robots and finding
they were sending video and audio back to China; the robots are now confined to a separate
room. He adds that anything connected to the internet can leak data in subtle ways — the seed
for this tool's business, "Phone-Home Patrol," which audits lab robots, cameras and IoT gear
for unexpected outbound traffic.

## How to use it

1. Click **Load simulated example data**, or paste your own exported log (or upload a `.csv`
   file) with columns `device, destination, bytes, timestamp` — one row per connection.
2. Click **Analyze traffic**. Devices are ranked by total outbound volume, with the top
   uploader highlighted. Any device that sent traffic between 22:00 and 06:00 gets an
   after-hours flag and its night-time byte total shown.
3. Click a device row to see every external destination it contacted, with connection counts,
   byte totals, and first/last-seen times.
4. Click **Generate plan** for a segmentation checklist: which devices to move to an isolated
   VLAN, why each was flagged (after-hours traffic, high volume, or an unmanaged robot/camera),
   and the destinations to review before allow-listing.

## Real vs. simulated

Everything runs client-side in your browser tab — no server, no upload, nothing stored. The
"Load simulated example data" button loads a clearly-labelled fictional lab network
(`data/sample.csv`) so you can see the tool work before bringing your own export. Any real log
you paste or upload is parsed the same way, entirely on your device, and the page never sends
it anywhere.

## v2 ideas

- Accept common router/firewall export formats directly (pfSense, UniFi, Pi-hole query logs)
  instead of requiring a four-column CSV.
- Resolve destination IPs to ASN/country so a reviewer can spot traffic leaving the region
  without looking up each domain.
- Let the user save a labeled device list (type + "approved" destinations) and diff future
  logs against it to catch new destinations automatically.
- Export the segmentation plan as a PDF or ticket-ready checklist.

## Changelog

### v1
- Initial release: CSV paste/upload, device ranking by outbound volume, after-hours detection,
  per-device destination drill-down, and segmentation plan generator.
