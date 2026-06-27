from __future__ import annotations

from typing import Any

from supwork_backend.config import Settings
from supwork_backend.safety import candidate_safe_check


class ModelProvider:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def status(self) -> dict[str, Any]:
        return {
            "configured": self.settings.model_provider != "mock",
            "provider": self.settings.model_provider,
            "deployment": self.settings.model_deployment if self.settings.model_provider != "mock" else "fixture",
        }

    def interview_plan(self, workflow: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
        gaps = [item for item in evidence if item.get("status") in {"gap", "partial", "unclear"}]
        questions = []
        for item in gaps[:4]:
            questions.append(
                {
                    "question": f"Can you walk through evidence for: {item['requirement']}?",
                    "rationale": f"Evidence status is {item['status']}; recruiter should validate with the candidate.",
                    "expectedSignal": item.get("candidateAction") or "Specific, role-relevant evidence.",
                    "visibility": "recruiter_internal",
                }
            )
        if not questions:
            questions.append(
                {
                    "question": "Which project best represents your fit for this role?",
                    "rationale": "Gives the candidate room to connect evidence to the role.",
                    "expectedSignal": "Concrete project scope, tradeoffs, and outcomes.",
                    "visibility": "recruiter_internal",
                }
            )
        return {
            "objective": "Validate evidence gaps while keeping the conversation role-relevant and fair.",
            "questions": questions,
            "candidatePrepThemes": [
                "Prepare examples that show concrete outcomes.",
                "Clarify any areas marked partial, gap, or unclear.",
            ],
            "safetyStatus": "passed",
        }

    def feedback_draft(self, recruiter_view: dict[str, Any], next_step: str) -> dict[str, Any]:
        candidate = recruiter_view["candidate"]["name"]
        role = recruiter_view["role"]["title"]
        body = (
            f"Hi {candidate},\n\n"
            f"Thank you for speaking with us about the {role} role. Evidence from your CV and interview discussion "
            "suggests strong technical foundations. One proof area to strengthen is post-launch ownership: metrics, "
            "customer adoption, or support examples would help the hiring team understand your impact more clearly.\n\n"
            f"Next step: {next_step}.\n\n"
            "This draft is prepared for recruiter approval before it is shared."
        )
        return {
            "subject": f"Next steps for your {role} interview",
            "body": body,
            "safety": candidate_safe_check(body),
        }

    def chat_completion(self, system: str, user: str) -> str:
        if self.settings.model_provider == "mock":
            return "Mock provider response. Configure Azure OpenAI env vars for live model output."
        try:
            from openai import OpenAI
        except ImportError:
            return "OpenAI package is unavailable in this environment."

        base_url = self.settings.azure_openai_endpoint or None
        api_key = self.settings.azure_openai_api_key or self.settings.openai_api_key
        client = OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(
            model=self.settings.model_deployment,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.2,
        )
        return response.choices[0].message.content or ""
