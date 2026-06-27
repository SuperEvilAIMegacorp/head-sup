from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import APIConnectionError, APIStatusError, AuthenticationError, OpenAI


ROOT = Path(__file__).resolve().parents[1]


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def main() -> int:
    load_dotenv(ROOT / ".env")

    endpoint = require_env("AZURE_OPENAI_ENDPOINT").rstrip("/")
    api_key = require_env("AZURE_OPENAI_API_KEY")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or os.getenv("MODEL_DEPLOYMENT_NAME")
    if not deployment:
        raise RuntimeError("Missing required env var: AZURE_OPENAI_DEPLOYMENT or MODEL_DEPLOYMENT_NAME")

    if not endpoint.endswith("/openai/v1"):
        print("Warning: AZURE_OPENAI_ENDPOINT does not end with /openai/v1; this script expects the v1 endpoint shape.")

    client = OpenAI(api_key=api_key, base_url=endpoint)
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": "Reply with one short sentence."},
            {"role": "user", "content": "Say Azure OpenAI key smoke test passed."},
        ],
        max_tokens=24,
        temperature=0,
    )

    content = response.choices[0].message.content or ""
    print("Azure OpenAI smoke test passed")
    print(f"Endpoint: {endpoint}")
    print(f"Deployment: {deployment}")
    print(f"Response: {content[:160]}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AuthenticationError as exc:
        print(f"Azure OpenAI authentication failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
    except APIStatusError as exc:
        print(f"Azure OpenAI API status error {exc.status_code}: {exc.response.text}", file=sys.stderr)
        raise SystemExit(1)
    except APIConnectionError as exc:
        print(f"Azure OpenAI connection failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(2)
