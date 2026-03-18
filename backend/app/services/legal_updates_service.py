import asyncio
import os
import re
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import httpx


TRUSTED_RSS_SOURCES = [
    {
        "name": "Supreme Court of India",
        "url": "https://www.sci.gov.in/feed/",
    },
    {
        "name": "PIB",
        "url": "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
    },
    {
        "name": "Live Law",
        "url": "https://www.livelaw.in/rss/top-stories",
    },
    {
        "name": "Bar and Bench",
        "url": "https://www.barandbench.com/rss",
    },
]

FALLBACK_LEGAL_UPDATES = [
    {
        "title": "Supreme Court reiterates proportionality in administrative decisions",
        "short_summary": "Recent observations emphasize reasoned orders and proportionality in administrative action.",
        "source": "NyayaAI Curated Brief",
        "link": "https://www.sci.gov.in/",
    },
    {
        "title": "Consumer redressal timelines highlighted in latest circular",
        "short_summary": "Authorities stressed timely disposal and clear notice standards in consumer disputes.",
        "source": "NyayaAI Curated Brief",
        "link": "https://consumeraffairs.nic.in/",
    },
    {
        "title": "Data protection compliance advisories gain focus for digital services",
        "short_summary": "Organizations are advised to strengthen consent handling and incident reporting processes.",
        "source": "NyayaAI Curated Brief",
        "link": "https://www.meity.gov.in/",
    },
    {
        "title": "Recent criminal procedure updates stress evidence chain integrity",
        "short_summary": "Legal notes indicate tighter scrutiny on digital evidence handling and record continuity.",
        "source": "NyayaAI Curated Brief",
        "link": "https://www.indiacode.nic.in/",
    },
    {
        "title": "Public law brief tracks writ maintainability and alternative remedy",
        "short_summary": "Courts continue balancing writ relief with availability of statutory appeal mechanisms.",
        "source": "NyayaAI Curated Brief",
        "link": "https://www.indiacode.nic.in/",
    },
]


class LegalUpdatesService:
    def __init__(self, cache_ttl_seconds: int = 900, fetch_timeout_seconds: int = 10, total_timeout_seconds: int = 12) -> None:
        env_cache_ttl = os.getenv("LEGAL_UPDATES_CACHE_TTL_SECONDS")
        env_fetch_timeout = os.getenv("LEGAL_UPDATES_FETCH_TIMEOUT_SECONDS")
        env_total_timeout = os.getenv("LEGAL_UPDATES_TOTAL_TIMEOUT_SECONDS")

        self.cache_ttl_seconds = int(env_cache_ttl) if env_cache_ttl else cache_ttl_seconds
        self.fetch_timeout_seconds = int(env_fetch_timeout) if env_fetch_timeout else fetch_timeout_seconds
        self.total_timeout_seconds = int(env_total_timeout) if env_total_timeout else total_timeout_seconds
        self.demo_mode = os.getenv("LEGAL_UPDATES_DEMO_MODE", "false").lower() in {"1", "true", "yes", "on"}
        self._cache: dict[str, Any] = {"ts": 0.0, "items": []}

    async def get_updates_payload(self, limit: int = 8) -> dict[str, Any]:
        now_iso = datetime.now(timezone.utc).isoformat()

        if self.demo_mode:
            return {
                "updates": self._fallback_items(limit=limit),
                "mode": "demo",
                "fetched_at": now_iso,
            }

        now = time.time()
        if self._cache["items"] and now - float(self._cache["ts"]) < self.cache_ttl_seconds:
            return {
                "updates": list(self._cache["items"])[:limit],
                "mode": "cache",
                "fetched_at": now_iso,
            }

        updates = await self._fetch_and_normalize_with_timeout()
        if updates:
            self._cache = {"ts": now, "items": updates}
            return {
                "updates": updates[:limit],
                "mode": "live",
                "fetched_at": now_iso,
            }

        if self._cache["items"]:
            return {
                "updates": list(self._cache["items"])[:limit],
                "mode": "stale-cache",
                "fetched_at": now_iso,
            }

        return {
            "updates": self._fallback_items(limit=limit),
            "mode": "fallback",
            "fetched_at": now_iso,
        }

    async def _fetch_and_normalize_with_timeout(self) -> list[dict[str, Any]]:
        try:
            return await asyncio.wait_for(self._fetch_and_normalize(), timeout=self.total_timeout_seconds)
        except asyncio.TimeoutError:
            return []

    async def _fetch_and_normalize(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self.fetch_timeout_seconds, follow_redirects=True) as client:
            tasks = [self._fetch_source(client, source) for source in TRUSTED_RSS_SOURCES]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        items: list[dict[str, Any]] = []
        for result in results:
            if isinstance(result, Exception):
                continue
            items.extend(result)

        dedup: dict[str, dict[str, Any]] = {}
        for item in items:
            key = item.get("link") or item.get("title")
            if not key:
                continue
            existing = dedup.get(key)
            if not existing or item.get("published_at", "") > existing.get("published_at", ""):
                dedup[key] = item

        merged = list(dedup.values())
        merged.sort(key=lambda i: i.get("published_at") or "", reverse=True)
        return merged[:10]

    def _fallback_items(self, limit: int) -> list[dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        return [
            {
                **item,
                "published_at": now_iso,
            }
            for item in FALLBACK_LEGAL_UPDATES[:limit]
        ]

    async def _fetch_source(self, client: httpx.AsyncClient, source: dict[str, str]) -> list[dict[str, Any]]:
        response = await client.get(source["url"])
        response.raise_for_status()
        parsed = feedparser.parse(response.text)

        items: list[dict[str, Any]] = []
        for entry in parsed.entries[:10]:
            title = self._clean_text(getattr(entry, "title", ""))
            link = getattr(entry, "link", "")
            summary_raw = getattr(entry, "summary", "") or getattr(entry, "description", "")
            summary = self._short_summary(self._clean_text(summary_raw))
            published = self._parse_published(
                getattr(entry, "published", "") or getattr(entry, "updated", "")
            )

            if not title or not link:
                continue

            items.append(
                {
                    "title": title,
                    "short_summary": summary,
                    "source": source["name"],
                    "link": link,
                    "published_at": published,
                }
            )

        return items

    @staticmethod
    def _clean_text(text: str) -> str:
        no_tags = re.sub(r"<[^>]+>", " ", text or "")
        normalized = re.sub(r"\s+", " ", no_tags).strip()
        return normalized

    @staticmethod
    def _short_summary(text: str, max_len: int = 150) -> str:
        if not text:
            return "No summary available."
        if len(text) <= max_len:
            return text
        return text[: max_len - 3].rstrip() + "..."

    @staticmethod
    def _parse_published(value: str) -> str:
        if not value:
            return datetime.now(timezone.utc).isoformat()
        try:
            dt = parsedate_to_datetime(value)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except Exception:
            return datetime.now(timezone.utc).isoformat()


legal_updates_service = LegalUpdatesService()
