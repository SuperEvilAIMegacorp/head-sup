from __future__ import annotations

from copy import deepcopy
from typing import Any, Mapping


ROUND_TEMPLATES: tuple[dict[str, Any], ...] = (
    {
        "roundNumber": 1,
        "roundType": "technical",
        "title": "R1 Technical Validation",
        "hrBriefing": (
            "Validate the candidate's hands-on delivery depth for Python, API integration, "
            "LLM evaluation, and customer-facing AI rollout work. Focus on evidence-backed "
            "examples rather than broad self-assessment."
        ),
        "candidateBriefing": (
            "This round is a technical conversation about projects already reflected in "
            "your CV or addendum. Prepare one concrete implementation story with context, "
            "tradeoffs, your role, and measurable outcome."
        ),
        "validationFocus": [
            "Python and backend integration depth",
            "Customer-facing AI deployment ownership",
            "LLM evaluation or quality assurance practice",
            "Evidence for debugging, tradeoffs, and post-launch iteration",
        ],
        "suggestedExercise": {
            "label": "Implementation walkthrough",
            "prompt": (
                "Ask the candidate to walk through an AI integration they shipped, including "
                "inputs, outputs, dependencies, failure modes, and how quality was measured."
            ),
        },
        "answerShape": [
            "Problem and users affected",
            "Technical architecture or integration path",
            "Candidate's direct contribution",
            "Tradeoffs, failure modes, and debugging steps",
            "Outcome, metric, or lesson learned",
        ],
        "fallbackQuestions": [
            "Walk me through the most production-like AI or automation system you built.",
            "What broke or changed during delivery, and how did you respond?",
            "How did you evaluate whether the model or workflow was good enough?",
            "Which part would you redesign if you had another week?",
        ],
        "candidatePrepThemes": [
            "Bring one implementation story with enough technical detail to inspect.",
            "Prepare metrics, logs, evaluation notes, or links that support your claims.",
            "Be ready to explain what you personally owned versus what the team owned.",
        ],
        "addendumPrompt": (
            "After the round, add any project link, metric, architecture note, or clarification "
            "that would help HR understand the technical evidence discussed."
        ),
        "nextAction": {
            "hrLabel": "Record technical notes",
            "candidateLabel": "Prepare technical evidence",
            "actionType": "complete_technical_round",
        },
    },
    {
        "roundNumber": 2,
        "roundType": "system_design",
        "title": "R2 System Design",
        "hrBriefing": (
            "Assess how the candidate structures an ambiguous AI solution, balances user, "
            "business, reliability, and privacy constraints, and communicates design choices "
            "to technical and non-technical stakeholders."
        ),
        "candidateBriefing": (
            "This round is a collaborative design discussion. You are not expected to guess a "
            "single correct architecture. Show how you clarify requirements, make tradeoffs, "
            "and keep the solution practical."
        ),
        "validationFocus": [
            "Requirement clarification and scope control",
            "System boundaries, data flow, and integration choices",
            "Evaluation, monitoring, privacy, and failure handling",
            "Communication of tradeoffs to customer and internal teams",
        ],
        "suggestedExercise": {
            "label": "AI support workflow design",
            "prompt": (
                "Design a customer-facing AI assistant workflow for a support team. Cover data "
                "sources, retrieval or model use, human review, quality checks, observability, "
                "and rollout risks."
            ),
        },
        "answerShape": [
            "Clarifying questions and assumptions",
            "Users, goals, and non-goals",
            "High-level architecture and data flow",
            "Quality, safety, and monitoring plan",
            "Rollout plan, risks, and fallback path",
        ],
        "fallbackQuestions": [
            "What would you clarify before proposing an architecture?",
            "Where would you put human approval in this workflow?",
            "How would you detect low-quality or risky model output?",
            "What is the smallest version you would ship first?",
        ],
        "candidatePrepThemes": [
            "Practice explaining architecture with clear boundaries and tradeoffs.",
            "Prepare examples of monitoring, evaluation, or rollout decisions you have made.",
            "Think about privacy and human approval for customer-facing AI systems.",
        ],
        "addendumPrompt": (
            "After the round, add any diagram, rollout example, or clarification that better "
            "shows your system design thinking."
        ),
        "nextAction": {
            "hrLabel": "Capture design signals",
            "candidateLabel": "Prepare a design walkthrough",
            "actionType": "complete_system_design_round",
        },
    },
    {
        "roundNumber": 3,
        "roundType": "manager",
        "title": "R3 Manager Conversation",
        "hrBriefing": (
            "Validate role fit, collaboration style, customer judgment, ownership, and growth "
            "signals. Keep the conversation evidence-based and candidate-safe; do not turn "
            "personal circumstances into inferred risk."
        ),
        "candidateBriefing": (
            "This round focuses on ways of working, stakeholder communication, ownership, and "
            "what support helps you do your best work. Prepare examples that show judgment, "
            "collaboration, and learning."
        ),
        "validationFocus": [
            "Stakeholder communication and customer judgment",
            "Ownership through ambiguity and follow-through",
            "Team collaboration and feedback habits",
            "Motivation for the role and support needed to succeed",
        ],
        "answerShape": [
            "Situation and stakeholders",
            "Decision or behavior chosen",
            "How feedback or constraints were handled",
            "Outcome and what changed afterward",
            "What support or environment helped",
        ],
        "fallbackQuestions": [
            "Tell me about a time you had to align technical and non-technical stakeholders.",
            "How do you handle unclear ownership or changing priorities?",
            "What kind of manager support helps you do your best work?",
            "What have you learned from a project that did not go as planned?",
        ],
        "candidatePrepThemes": [
            "Prepare two collaboration or stakeholder stories with concrete outcomes.",
            "Think about what support, feedback cadence, and role conditions help you succeed.",
            "Bring any context you want HR to consider before final follow-up.",
        ],
        "addendumPrompt": (
            "After the round, add any context, working-style note, or supporting evidence you "
            "want HR to consider before follow-up."
        ),
        "nextAction": {
            "hrLabel": "Draft candidate-safe follow-up",
            "candidateLabel": "Add optional final context",
            "actionType": "draft_follow_up",
        },
    },
)

_ROUND_BY_NUMBER = {template["roundNumber"]: template for template in ROUND_TEMPLATES}
_ROUND_BY_TYPE = {template["roundType"]: template for template in ROUND_TEMPLATES}
_ROUND_ALIASES = {
    "1": 1,
    "r1": 1,
    "technical": "technical",
    "tech": "technical",
    "2": 2,
    "r2": 2,
    "system": "system_design",
    "system_design": "system_design",
    "system-design": "system_design",
    "design": "system_design",
    "3": 3,
    "r3": 3,
    "manager": "manager",
    "management": "manager",
    "hm": "manager",
}


def get_round_template(round_type_or_number: str | int) -> dict[str, Any]:
    """Return a copy of the configured template for a round type, alias, or number."""

    key: str | int
    if isinstance(round_type_or_number, str):
        normalized = round_type_or_number.strip().lower().replace(" ", "_")
        key = _ROUND_ALIASES.get(normalized, normalized)
    else:
        key = round_type_or_number

    if isinstance(key, int):
        template = _ROUND_BY_NUMBER.get(key)
    else:
        template = _ROUND_BY_TYPE.get(key)

    if not template:
        raise ValueError(f"Unknown round template: {round_type_or_number!r}")
    return deepcopy(template)


def default_rounds(workflow_id: str) -> list[dict[str, Any]]:
    """Build the default R1/R2/R3 round records for a workflow."""

    rounds: list[dict[str, Any]] = []
    for template in ROUND_TEMPLATES:
        round_type = template["roundType"]
        round_number = template["roundNumber"]
        round_id = f"round_{round_number}" if workflow_id == "wf_demo" else f"{workflow_id}_round_{round_number}"
        rounds.append(
            {
                "id": round_id,
                "workflowId": workflow_id,
                "roundNumber": round_number,
                "roundType": round_type,
                "title": template["title"],
                "roundStatus": "locked" if round_number > 1 else "ready",
                "notesStatus": "pending",
                "template": deepcopy(template),
            }
        )
    return rounds


def round_template_payload(round_record: Mapping[str, Any]) -> dict[str, Any]:
    """Merge a stored round record with its template for API/store response payloads."""

    round_key = round_record.get("roundType") or round_record.get("roundNumber")
    template = get_round_template(round_key)
    payload = deepcopy(dict(round_record))

    payload.setdefault("roundType", template["roundType"])
    payload.setdefault("roundNumber", template["roundNumber"])
    payload.setdefault("title", template["title"])
    payload["template"] = template

    for key in (
        "hrBriefing",
        "candidateBriefing",
        "validationFocus",
        "suggestedExercise",
        "answerShape",
        "fallbackQuestions",
        "candidatePrepThemes",
        "addendumPrompt",
        "nextAction",
    ):
        if key in template:
            payload.setdefault(key, deepcopy(template[key]))

    return payload


__all__ = [
    "ROUND_TEMPLATES",
    "default_rounds",
    "get_round_template",
    "round_template_payload",
]
