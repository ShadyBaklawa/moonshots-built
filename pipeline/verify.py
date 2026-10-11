"""Deterministic smoke test for a prototype: does it load, render, survive clicks, fit a phone?

Runs headless Chromium via Playwright against a local static server and writes screenshots
to <proto>/.review/ (reviewer input) and <proto>/preview.png (gallery thumbnail).
"""
from __future__ import annotations

import functools
import http.server
import json
import socketserver
import threading
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlparse

VIEWPORTS = {"desktop": (1280, 800), "mobile": (390, 844)}
IGNORED_CONSOLE = ("favicon", "Download the React DevTools")
MAX_BYTES = 3 * 1024 * 1024


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):  # noqa: D401
        pass


@contextmanager
def serve(directory: Path):
    handler = functools.partial(_Quiet, directory=str(directory))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}"
        finally:
            httpd.shutdown()


def folder_size(d: Path) -> int:
    return sum(p.stat().st_size for p in d.rglob("*")
               if p.is_file() and ".review" not in p.parts and p.name != "preview.png")


def verify(proto: Path) -> dict:
    from playwright.sync_api import sync_playwright

    proto = proto.resolve()
    review_dir = proto / ".review"
    review_dir.mkdir(exist_ok=True)
    report: dict = {"ok": False, "problems": [], "views": {}, "external_hosts": []}

    if not (proto / "index.html").exists():
        report["problems"].append("index.html is missing")
        _write(review_dir, report)
        return report
    size = folder_size(proto)
    report["bytes"] = size
    if size > MAX_BYTES:
        report["problems"].append(f"folder is {size/1e6:.1f} MB (limit 3 MB)")
    if not (proto / "README.md").exists():
        report["problems"].append("README.md is missing")

    hosts: set[str] = set()
    with serve(proto) as base, sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name, (w, h) in VIEWPORTS.items():
            ctx = browser.new_context(viewport={"width": w, "height": h},
                                      device_scale_factor=1 if name == "desktop" else 2)
            page = ctx.new_page()
            errors: list[str] = []
            page.on("console", lambda m, e=errors: m.type == "error" and not any(
                s in m.text for s in IGNORED_CONSOLE) and e.append(f"console: {m.text[:300]}"))
            page.on("pageerror", lambda exc, e=errors: e.append(f"uncaught: {str(exc)[:300]}"))
            page.on("requestfailed", lambda r, e=errors: "favicon" not in r.url and e.append(
                f"request failed: {r.url[:200]} ({r.failure})"))

            def track(req, base=base):
                host = urlparse(req.url).netloc
                if host and not req.url.startswith(base):
                    hosts.add(host)
            page.on("request", track)

            view: dict = {}
            try:
                page.goto(f"{base}/index.html", wait_until="load", timeout=30000)
                try:
                    page.wait_for_load_state("networkidle", timeout=10000)
                except Exception:  # noqa: BLE001 - long-polling pages never go idle
                    pass
                page.wait_for_timeout(1200)
                view["text_chars"] = page.evaluate("document.body ? document.body.innerText.length : 0")
                view["overflow_px"] = page.evaluate(
                    "Math.max(0, document.documentElement.scrollWidth - window.innerWidth)")
                view["title"] = page.title()
                shot = review_dir / f"{name}.png"
                page.screenshot(path=str(shot))
                if name == "desktop":
                    page.screenshot(path=str(proto / "preview.png"))
                    view["clicked"] = _click_around(page)
                    page.wait_for_timeout(500)
                    page.screenshot(path=str(review_dir / "desktop-after-clicks.png"))
            except Exception as exc:  # noqa: BLE001
                errors.append(f"load failed: {str(exc)[:300]}")
            view["errors"] = errors
            report["views"][name] = view
            ctx.close()
        browser.close()

    report["external_hosts"] = sorted(hosts)
    for name, view in report["views"].items():
        report["problems"] += [f"[{name}] {e}" for e in view.get("errors", [])]
        if view.get("text_chars", 0) < 80:
            report["problems"].append(f"[{name}] page renders almost no text")
    if report["views"].get("mobile", {}).get("overflow_px", 0) > 2:
        report["problems"].append(
            f"[mobile] horizontal overflow of {report['views']['mobile']['overflow_px']}px at 390px wide")
    report["problems"] = list(dict.fromkeys(report["problems"]))
    report["ok"] = not report["problems"]
    _write(review_dir, report)
    return report


def _click_around(page, limit: int = 6) -> int:
    """Click a few visible buttons/tabs to surface errors that only happen on interaction."""
    clicked = 0
    for el in page.query_selector_all("button, [role=button], [role=tab], input[type=range]")[:20]:
        if clicked >= limit:
            break
        try:
            if not el.is_visible() or el.is_disabled():
                continue
            href = el.get_attribute("href")
            if href and href.startswith("http"):
                continue
            el.click(timeout=1500)
            page.wait_for_timeout(250)
            clicked += 1
        except Exception:  # noqa: BLE001 - covered/animated elements are fine to skip
            continue
    return clicked


def _write(review_dir: Path, report: dict) -> None:
    (review_dir / "verify.json").write_text(json.dumps(report, indent=2))
