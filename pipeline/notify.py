"""Optional Telegram ping. Silently does nothing unless both env vars are set."""
from __future__ import annotations

import os

import httpx


def telegram(text: str) -> None:
    token, chat = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return
    try:
        httpx.post(f"https://api.telegram.org/bot{token}/sendMessage", timeout=20,
                   json={"chat_id": chat, "text": text[:4000], "disable_web_page_preview": True})
    except Exception as e:  # noqa: BLE001 - notifications must never break the pipeline
        print(f"[notify] telegram failed: {e}", flush=True)
