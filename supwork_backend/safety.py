from __future__ import annotations


BLOCKED_TERMS = {
    "ai decided",
    "guaranteed",
    "perfect fit",
    "rejected by ai",
    "failed",
    "score:",
    "pregnant",
    "religion",
    "disability",
    "marital",
}

INTERNAL_TERMS = {
    "internal note",
    "private deliberation",
    "raw transcript",
    "service-role",
    "api key",
    "refresh token",
}


def candidate_safe_check(text: str) -> dict:
    normalized = text.lower()
    findings = sorted(term for term in BLOCKED_TERMS | INTERNAL_TERMS if term in normalized)
    return {
        "passed": not findings,
        "findings": findings,
        "visibility": "candidate_visible" if not findings else "recruiter_internal",
    }


def assert_candidate_safe(text: str) -> None:
    check = candidate_safe_check(text)
    if not check["passed"]:
        raise ValueError(f"Candidate-facing content failed safety check: {', '.join(check['findings'])}")
