from __future__ import annotations

from datetime import datetime, timedelta, timezone


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def demo_state() -> dict:
    now = datetime.now(timezone.utc)
    scheduled = now + timedelta(days=4)
    return {
        "users": {
            "usr_candidate": {
                "id": "usr_candidate",
                "email": "interviewee@demo.supwork.local",
                "displayName": "Maya Tan",
                "role": "interviewee",
            },
            "usr_hr": {
                "id": "usr_hr",
                "email": "hr@demo.supwork.local",
                "displayName": "Alex Lee",
                "role": "hr",
            },
        },
        "tokens": {},
        "workflows": {
            "wf_demo": {
                "id": "wf_demo",
                "candidateId": "usr_candidate",
                "roleId": "role_demo",
                "stage": "interview_planning",
                "providerMode": "mock",
                "statusSummary": "Evidence mapped; recruiter can enrich research and schedule with approval.",
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            }
        },
        "roles": {
            "role_demo": {
                "id": "role_demo",
                "company": "Example AI",
                "title": "AI Solutions Engineer",
                "location": "Singapore/APAC",
                "seniority": "mid-senior",
                "jobScopeText": "Customer-facing AI deployment, Python, React, LLM evaluation, stakeholder communication.",
            }
        },
        "evidenceMappings": [
            {
                "id": "ev_1",
                "workflowId": "wf_demo",
                "requirement": "Customer-facing AI deployment",
                "status": "partial",
                "candidateEvidence": "CV mentions two enterprise AI rollout projects.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {"page": 2, "section": "Experience"},
                "whyItMatters": "The role asks for customer implementation experience.",
                "candidateAction": "Add metrics, customer type, post-launch ownership, or a project link.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_2",
                "workflowId": "wf_demo",
                "requirement": "Python and backend integration",
                "status": "covered",
                "candidateEvidence": "CV lists Python APIs, LLM evaluation scripts, and integration automation.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {"page": 1, "section": "Skills"},
                "whyItMatters": "The role needs technical depth for AI delivery.",
                "candidateAction": "Bring one concrete integration story to the interview.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_3",
                "workflowId": "wf_demo",
                "requirement": "Post-launch ownership",
                "status": "gap",
                "candidateEvidence": "No clear post-launch support or adoption metrics found in the CV.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {"page": 2, "section": "Experience"},
                "whyItMatters": "Customer-facing AI roles often need rollout follow-through.",
                "candidateAction": "Add a support, monitoring, or customer-success example if available.",
                "visibility": "candidate_visible",
            },
        ],
        "researchArtifacts": [
            {
                "id": "rs_demo",
                "workflowId": "wf_demo",
                "researchType": "company",
                "query": "Example AI product overview AI deployment",
                "provider": "fixture",
                "summary": "Fixture public context for the demo. Replace with Exa-backed research when EXA_API_KEY is configured.",
                "sources": [
                    {
                        "url": "https://example.com",
                        "title": "Example AI",
                        "snippet": "Demo source for candidate-safe role context.",
                        "publishedDate": None,
                        "retrievedAt": utc_now_iso(),
                    }
                ],
                "visibility": "candidate_visible",
                "freshness": "cached",
            }
        ],
        "interviewPlans": {
            "wf_demo": {
                "id": "plan_demo",
                "workflowId": "wf_demo",
                "objective": "Validate customer-facing deployment depth and post-launch ownership.",
                "questions": [
                    {
                        "question": "Walk me through an AI rollout where a customer requirement changed late.",
                        "rationale": "Tests customer-facing deployment experience.",
                        "expectedSignal": "Clear tradeoffs, stakeholder communication, and delivery ownership.",
                        "visibility": "recruiter_internal",
                    },
                    {
                        "question": "What metrics did you track after launch?",
                        "rationale": "Addresses the post-launch ownership gap.",
                        "expectedSignal": "Monitoring, adoption, reliability, or business outcome metrics.",
                        "visibility": "recruiter_internal",
                    },
                ],
                "candidatePrepThemes": [
                    "Prepare one customer deployment story with constraints and outcomes.",
                    "Bring metrics or evidence for post-launch ownership if available.",
                ],
                "safetyStatus": "passed",
            }
        },
        "interviewRounds": {},
        "candidateAddenda": {},
        "communicationDrafts": {},
        "approvalRequests": {},
        "integrationEvents": [],
        "agentRuns": [],
        "auditEvents": [
            {
                "id": "aud_seed",
                "workflowId": "wf_demo",
                "eventType": "workflow.created",
                "actorType": "system",
                "actorId": "seed",
                "summary": "Seeded demo workflow created.",
                "payload": {},
                "visibility": "candidate_visible",
                "traceId": "trc_seed",
                "createdAt": utc_now_iso(),
            }
        ],
        "candidateReceipts": [
            {
                "id": "rcp_seed",
                "workflowId": "wf_demo",
                "receiptType": "workflow_created",
                "summary": "Your demo workflow is ready for evidence review.",
                "sharedArtifacts": [],
                "externalActions": [],
                "createdAt": utc_now_iso(),
            }
        ],
        "suggestedSchedule": scheduled.isoformat(),
    }
