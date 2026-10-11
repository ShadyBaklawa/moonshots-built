"""Smoke-test a prototype folder: `python3 scripts/smoke.py prototypes/<slug>`.

Prints a short report and exits non-zero when there are problems. Used by the builder agent
while it works, by CI on pull requests, and by hand.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.verify import verify  # noqa: E402

if __name__ == "__main__":
    target = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    report = verify(target)
    print(json.dumps({k: report.get(k) for k in ("ok", "problems", "external_hosts", "bytes")},
                     indent=2))
    print("Screenshots: .review/desktop.png .review/mobile.png .review/desktop-after-clicks.png")
    sys.exit(0 if report["ok"] else 1)
