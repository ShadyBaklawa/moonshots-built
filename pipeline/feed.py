"""Episode discovery and transcript fetching from podscripts.co.

The parser is deliberately text-based (h3 links + "Episode Date:" + "Starting point is HH:MM:SS"
markers) so small markup changes on the site don't break it.
"""
from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from datetime import date, datetime
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from . import config

DATE_RE = re.compile(r"Episode Date:\s*([A-Z][a-z]+ \d{1,2}, \d{4})")
TS_RE = re.compile(r"Starting point is (\d{1,2}:\d{2}:\d{2})")
NUM_RE = re.compile(r"(?:\bEP|\bEp)\.?\s*#?\s*(\d{2,4})\b|#\s*(\d{2,4})\b")
END_MARKERS = ("There aren't comments yet", "There aren’t comments yet", "© PodScripts")


@dataclass
class Episode:
    slug: str
    url: str
    title: str
    date: str  # ISO yyyy-mm-dd
    number: int | None = None


@dataclass
class EpisodeDetail(Episode):
    description: str = ""
    segments: list[tuple[str, str]] = field(default_factory=list)  # (HH:MM:SS, text)

    def transcript_text(self) -> str:
        return "\n".join(f"[{ts}] {txt}" for ts, txt in self.segments)


def episode_number(title: str) -> int | None:
    m = NUM_RE.search(title)
    if not m:
        return None
    return int(m.group(1) or m.group(2))


def slug_from_url(url: str) -> str:
    return url.rstrip("/").rsplit("/", 1)[-1]


def _parse_date(s: str) -> str:
    return datetime.strptime(s, "%B %d, %Y").date().isoformat()


def parse_listing(html: str, base_url: str = config.PODCAST_URL) -> list[Episode]:
    soup = BeautifulSoup(html, "html.parser")
    prefix = "/" + base_url.rstrip("/").rsplit("/", 1)[-1] + "/"
    out: list[Episode] = []
    seen: set[str] = set()
    for h3 in soup.find_all("h3"):
        a = h3.find("a", href=True)
        if not a or prefix not in a["href"]:
            continue
        url = urljoin(base_url + "/", a["href"])
        slug = slug_from_url(url)
        if slug in seen or slug == prefix.strip("/"):
            continue
        node = h3.find_next(string=DATE_RE)
        m = DATE_RE.search(node or "")
        if not m:
            continue
        title = " ".join(a.get_text(" ", strip=True).split())
        out.append(Episode(slug=slug, url=url, title=title, date=_parse_date(m.group(1)),
                           number=episode_number(title)))
        seen.add(slug)
    return out


def parse_episode(html: str, url: str) -> EpisodeDetail:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    h1 = soup.find("h1")
    raw_title = h1.get_text(" ", strip=True) if h1 else slug_from_url(url)
    title = re.sub(r"^Moonshots with Peter Diamandis\s*-\s*", "", raw_title).strip()
    text = soup.get_text("\n", strip=True)
    m = DATE_RE.search(text)
    ep_date = _parse_date(m.group(1)) if m else date.today().isoformat()

    desc = ""
    h3 = soup.find("h3")
    if h3:
        desc = " ".join(h3.get_text(" ", strip=True).split())[:2000]

    body = text
    for marker in END_MARKERS:
        i = body.find(marker)
        if i != -1:
            body = body[:i]
    parts = TS_RE.split(body)
    # parts = [preamble, ts1, text1, ts2, text2, ...]
    segments: list[tuple[str, str]] = []
    for i in range(1, len(parts) - 1, 2):
        ts = parts[i]
        if len(ts.split(":")[0]) == 1:
            ts = "0" + ts
        seg = " ".join(parts[i + 1].split())
        if seg:
            segments.append((ts, seg))
    return EpisodeDetail(slug=slug_from_url(url), url=url, title=title, date=ep_date,
                         number=episode_number(title), description=desc, segments=segments)


def _get(url: str, retries: int = 4) -> str:
    last: Exception | None = None
    for attempt in range(retries):
        try:
            r = httpx.get(url, headers={"User-Agent": config.USER_AGENT}, timeout=45,
                          follow_redirects=True)
            r.raise_for_status()
            return r.text
        except Exception as e:  # noqa: BLE001 - retry anything network-ish
            last = e
            time.sleep(2 ** attempt)
    raise RuntimeError(f"GET {url} failed: {last}")


def fetch_listing(page: int = 1) -> list[Episode]:
    url = config.PODCAST_URL if page == 1 else f"{config.PODCAST_URL}?page={page}"
    return parse_listing(_get(url))


def fetch_episode(url: str) -> EpisodeDetail:
    return parse_episode(_get(url), url)
