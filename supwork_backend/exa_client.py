from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from supwork_backend.config import Settings


class ExaClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def status(self) -> dict[str, Any]:
        return {"configured": bool(self.settings.exa_api_key), "status": "ready" if self.settings.exa_api_key else "mock"}

    async def research(self, request: dict[str, Any]) -> dict[str, Any]:
        query = f"{request['company']} {request['roleTitle']} {request.get('region', '')} public role context".strip()
        if not self.settings.exa_api_key:
            return self._fixture(request, query)

        headers = {"x-api-key": self.settings.exa_api_key, "content-type": "application/json"}
        payload = {"query": query, "numResults": 5, "type": "auto"}
        async with httpx.AsyncClient(base_url=self.settings.exa_base_url, timeout=20) as client:
            response = await client.post("/search", headers=headers, json=payload)
            response.raise_for_status()
            raw = response.json()

        sources = []
        for item in raw.get("results", []):
            sources.append(
                {
                    "url": item.get("url"),
                    "title": item.get("title") or item.get("url"),
                    "snippet": item.get("text") or item.get("snippet") or "",
                    "publishedDate": item.get("publishedDate"),
                    "retrievedAt": datetime.now(timezone.utc).isoformat(),
                }
            )
        return {
            "researchType": "company",
            "query": query,
            "provider": "exa",
            "summary": "Exa-backed public context retrieved for recruiter review and candidate-safe role brief.",
            "sources": sources,
            "visibility": "candidate_visible",
            "freshness": "current",
        }

    @staticmethod
    def _fixture(request: dict[str, Any], query: str) -> dict[str, Any]:
        return {
            "researchType": "company",
            "query": query,
            "provider": "fixture",
            "summary": f"Cached demo context for {request['company']} and {request['roleTitle']}.",
            "sources": [
                {
                    "url": request.get("companyUrl") or "https://example.com",
                    "title": request["company"],
                    "snippet": "Fixture public source. Configure EXA_API_KEY for live search.",
                    "publishedDate": None,
                    "retrievedAt": datetime.now(timezone.utc).isoformat(),
                }
            ],
            "visibility": "candidate_visible",
            "freshness": "cached",
        }
