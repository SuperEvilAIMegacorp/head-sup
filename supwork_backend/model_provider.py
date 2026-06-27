from __future__ import annotations

import json
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

    def cv_evidence_analysis(self, workflow: dict[str, Any], cv_artifact: dict[str, Any]) -> dict[str, Any]:
        fallback = self._heuristic_cv_evidence(workflow, cv_artifact)
        if self.settings.model_provider == "mock":
            return fallback

        role = workflow["role"]
        prompt = {
            "candidate": workflow["candidate"],
            "role": role,
            "currentStage": workflow.get("stage"),
            "cvFilename": cv_artifact["filename"],
            "cvPages": [
                {
                    "page": page["page"],
                    "text": page["text"][:3500],
                }
                for page in cv_artifact.get("pages", [])
            ],
            "requiredJsonShape": {
                "roleBrief": {
                    "jobPoints": ["string"],
                    "rubricTags": ["string"],
                    "interviewFocus": ["string"],
                    "source": "uploaded_cv_and_role_scope",
                },
                "evidenceMappings": [
                    {
                        "requirement": "string",
                        "status": "covered|partial|gap|unclear",
                        "candidateEvidence": "short evidence excerpt or explanation",
                        "sourceLocation": {"page": 1, "section": "string", "excerpt": "exact short excerpt from CV when available"},
                        "whyItMatters": "role-related reason",
                        "candidateAction": "constructive candidate-safe next step",
                        "visibility": "candidate_visible",
                    }
                ],
                "candidatePrepThemes": ["string"],
                "nextHumanAction": "string",
            },
        }
        try:
            result = self._json_chat(
                "You map candidate CV evidence to a target role. Return only valid JSON. "
                "Do not infer protected characteristics. Treat missing evidence as a proof area, not a conclusion.",
                json.dumps(prompt, ensure_ascii=True),
            )
            return self._merge_cv_analysis(fallback, result)
        except Exception:
            return fallback

    def interview_plan(self, workflow: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
        active_round = workflow.get("activeRound") if isinstance(workflow.get("activeRound"), dict) else None
        fallback = self._heuristic_interview_plan(evidence, active_round)
        if self.settings.model_provider != "mock":
            try:
                result = self._json_chat(
                    "You generate fair, role-related interviewer questions from source-backed evidence gaps. "
                    "Return only valid JSON with objective, questions, candidatePrepThemes, and safetyStatus. "
                    "Questions must not ask about protected characteristics or private life.",
                    json.dumps(
                        {
                            "candidate": workflow.get("candidate"),
                            "role": workflow.get("role"),
                            "currentStage": workflow.get("stage"),
                            "activeRound": active_round,
                            "evidenceMappings": evidence,
                            "requiredJsonShape": {
                                "objective": "string",
                                "questions": [
                                    {
                                        "question": "string",
                                        "rationale": "string",
                                        "expectedSignal": "string",
                                        "visibility": "recruiter_internal",
                                    }
                                ],
                                "candidatePrepThemes": ["candidate-safe string"],
                                "safetyStatus": "passed",
                            },
                        },
                        ensure_ascii=True,
                    ),
                )
                return self._merge_interview_plan(fallback, result)
            except Exception:
                return fallback
        return fallback

    def _heuristic_interview_plan(self, evidence: list[dict[str, Any]], active_round: dict[str, Any] | None = None) -> dict[str, Any]:
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
        if active_round:
            fallback_questions = active_round.get("fallbackQuestions") or []
            validation_focus = active_round.get("validationFocus") or []
            for index, prompt in enumerate(fallback_questions, start=1):
                if len(questions) >= 6:
                    break
                focus = validation_focus[(index - 1) % len(validation_focus)] if validation_focus else active_round.get("roundType", "role evidence")
                questions.append(
                    {
                        "question": str(prompt),
                        "rationale": f"Round {active_round.get('roundNumber')} focus: {focus}.",
                        "expectedSignal": "Concrete, role-related evidence with clear ownership and tradeoffs.",
                        "evidenceTarget": str(focus),
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
            "objective": str(active_round.get("hrBriefing")) if active_round else "Validate evidence gaps while keeping the conversation role-relevant and fair.",
            "questions": questions,
            "candidatePrepThemes": (active_round or {}).get("candidatePrepThemes") or [
                "Prepare examples that show concrete outcomes.",
                "Clarify any areas marked partial, gap, or unclear.",
            ],
            "safetyStatus": "passed",
            "provider": self.settings.model_provider,
        }

    def feedback_draft(self, recruiter_view: dict[str, Any], next_step: str) -> dict[str, Any]:
        if self.settings.model_provider != "mock":
            try:
                result = self._json_chat(
                    "You draft candidate-safe hiring process follow-up. Return only valid JSON with subject and body. "
                    "Do not reveal internal notes, private rationale, secrets, or protected-characteristics content.",
                    json.dumps(
                        {
                            "candidate": recruiter_view["candidate"],
                            "role": recruiter_view["role"],
                            "stage": recruiter_view.get("stage"),
                            "candidateVisibleEvidence": [
                                item for item in recruiter_view.get("evidenceMappings", []) if item.get("visibility") == "candidate_visible"
                            ],
                            "addendaStatus": [
                                {
                                    "type": item.get("addendumType"),
                                    "status": item.get("status"),
                                    "sensitive": item.get("sensitiveFlag"),
                                }
                                for item in recruiter_view.get("candidateAddenda", [])
                            ],
                            "nextStep": next_step,
                        },
                        ensure_ascii=True,
                    ),
                )
                subject = str(result.get("subject") or f"Next steps for your {recruiter_view['role']['title']} interview")
                body = str(result.get("body") or "")
                if body:
                    return {"subject": subject, "body": body, "safety": candidate_safe_check(body)}
            except Exception:
                pass

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
        return self._chat_text(system, user)

    def _chat_text(self, system: str, user: str) -> str:
        client = self._client()
        response = client.chat.completions.create(
            model=self.settings.model_deployment,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.2,
        )
        return response.choices[0].message.content or ""

    def _json_chat(self, system: str, user: str) -> dict[str, Any]:
        client = self._client()
        response = client.chat.completions.create(
            model=self.settings.model_deployment,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        raw = response.choices[0].message.content or "{}"
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start = raw.find("{")
            end = raw.rfind("}")
            if start >= 0 and end > start:
                return json.loads(raw[start : end + 1])
            raise

    def _client(self):
        try:
            from openai import AzureOpenAI, OpenAI
        except ImportError:
            raise RuntimeError("OpenAI package is unavailable in this environment.")

        if self.settings.azure_openai_endpoint and self.settings.azure_openai_api_key:
            endpoint = self.settings.azure_openai_endpoint.rstrip("/")
            if "/openai/" in endpoint:
                return OpenAI(api_key=self.settings.azure_openai_api_key, base_url=endpoint)
            return AzureOpenAI(
                api_key=self.settings.azure_openai_api_key,
                api_version=self.settings.azure_openai_api_version or "2024-10-21",
                azure_endpoint=endpoint,
            )
        return OpenAI(api_key=self.settings.openai_api_key)

    def _heuristic_cv_evidence(self, workflow: dict[str, Any], cv_artifact: dict[str, Any]) -> dict[str, Any]:
        role = workflow["role"]
        job_scope = role.get("jobScopeText", "")
        requirements = [part.strip() for part in job_scope.split(",") if part.strip()] or [
            "Customer-facing AI deployment",
            "Python and backend integration",
            "Stakeholder communication",
        ]
        full_text = cv_artifact.get("text", "")
        mappings = []
        for index, requirement in enumerate(requirements[:6], start=1):
            keyword = requirement.split()[0].lower()
            page = self._page_for_keyword(cv_artifact, keyword)
            has_signal = keyword in full_text.lower()
            status = "covered" if has_signal else "gap"
            excerpt = self._excerpt(page.get("text", full_text), keyword) if page else ""
            mappings.append(
                {
                    "requirement": requirement,
                    "status": status,
                    "candidateEvidence": excerpt or ("No source-backed evidence found in the uploaded CV." if status == "gap" else requirement),
                    "sourceLocation": {
                        "page": page.get("page", 1) if page else 1,
                        "section": "Uploaded CV",
                        "excerpt": excerpt,
                    },
                    "whyItMatters": f"The role scope includes {requirement}.",
                    "candidateAction": "Add a concise example, metric, or project link if this is relevant to your experience.",
                    "visibility": "candidate_visible",
                }
            )
        return {
            "roleBrief": {
                "jobPoints": requirements,
                "rubricTags": requirements,
                "interviewFocus": [item["requirement"] for item in mappings if item["status"] != "covered"][:4],
                "source": "uploaded_cv_and_role_scope",
            },
            "evidenceMappings": mappings,
            "candidatePrepThemes": [
                "Prepare source-backed examples for partial or missing proof areas.",
                "Bring metrics, customer context, and ownership boundaries where available.",
            ],
            "nextHumanAction": "review_evidence_and_generate_interview_plan",
        }

    def _merge_cv_analysis(self, fallback: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
        mappings = result.get("evidenceMappings")
        if not isinstance(mappings, list) or not mappings:
            return fallback
        merged = {
            "roleBrief": result.get("roleBrief") if isinstance(result.get("roleBrief"), dict) else fallback["roleBrief"],
            "evidenceMappings": mappings,
            "candidatePrepThemes": result.get("candidatePrepThemes") if isinstance(result.get("candidatePrepThemes"), list) else fallback["candidatePrepThemes"],
            "nextHumanAction": str(result.get("nextHumanAction") or fallback["nextHumanAction"]),
        }
        return merged

    def _merge_interview_plan(self, fallback: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
        questions = result.get("questions")
        if not isinstance(questions, list) or not questions:
            return fallback
        return {
            "objective": str(result.get("objective") or fallback["objective"]),
            "questions": questions,
            "candidatePrepThemes": result.get("candidatePrepThemes") if isinstance(result.get("candidatePrepThemes"), list) else fallback["candidatePrepThemes"],
            "safetyStatus": str(result.get("safetyStatus") or "passed"),
            "provider": self.settings.model_provider,
        }

    def _page_for_keyword(self, cv_artifact: dict[str, Any], keyword: str) -> dict[str, Any] | None:
        pages = cv_artifact.get("pages", [])
        for page in pages:
            if keyword and keyword in page.get("text", "").lower():
                return page
        return pages[0] if pages else None

    def _excerpt(self, text: str, keyword: str) -> str:
        if not text:
            return ""
        lower = text.lower()
        index = lower.find(keyword) if keyword else -1
        if index < 0:
            return text[:240].strip()
        start = max(0, index - 90)
        end = min(len(text), index + 180)
        return text[start:end].strip()
