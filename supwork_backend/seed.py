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
                "displayName": "Nicholas Ting",
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
                "jobScopeText": (
                    "Agentic LLM systems with tool calling, structured outputs, validation loops, "
                    "production-ready AI engineering, evaluation-first judgment, client communication, "
                    "adoption enablement, ethical AI, privacy, accountability, and compliance."
                ),
            }
        },
        "evidenceMappings": [
            {
                "id": "ev_agent_loop",
                "workflowId": "wf_demo",
                "requirement": "Agentic LLM systems",
                "status": "covered",
                "candidateEvidence": "Built an autonomous agent loop that generates quantitative trading strategies, backtests them, and submits passing strategies via the WorldQuant API with persistent memory.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {
                    "page": 1,
                    "section": "Research Consultant | WorldQuant BRAIN",
                    "excerpt": "Built an autonomous agent loop that generates quantitative trading strategies, backtests them, and submits passing strategies via the WorldQuant API with persistent memory.",
                },
                "whyItMatters": "The role requires LLM workflows with tools, validation loops, and failure handling.",
                "candidateAction": "Prepare to explain tool boundaries, validation, retries, and what you personally owned.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_phoenix_llm",
                "workflowId": "wf_demo",
                "requirement": "Production-ready AI engineering",
                "status": "covered",
                "candidateEvidence": "Collaborated with Mistral AI to adapt a foundation LLM for Singapore government operations and translated policy needs into model training objectives.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {
                    "page": 1,
                    "section": "Phoenix Singapore LLM | HTX",
                    "excerpt": "Collaborated with Mistral AI to adapt a foundation LLM for Singapore government operations and translated policy needs into model training objectives.",
                },
                "whyItMatters": "The role needs applied LLM delivery in a multi-stakeholder environment.",
                "candidateAction": "Bring one implementation story with architecture, constraints, and shipped outcome.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_eval_pipelines",
                "workflowId": "wf_demo",
                "requirement": "Evaluation-first judgment",
                "status": "covered",
                "candidateEvidence": "Built multilingual evaluation pipelines using BERTScore, ROUGE-L, exact-match metrics, and XLM-RoBERTa across English, Mandarin, Malay, and Tamil.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {
                    "page": 1,
                    "section": "Technical Skills and Phoenix Singapore LLM",
                    "excerpt": "Built multilingual evaluation pipelines using BERTScore, ROUGE-L, exact-match metrics, and XLM-RoBERTa across English, Mandarin, Malay, and Tamil.",
                },
                "whyItMatters": "The role asks for measuring accuracy, comparing approaches, and iterating from evidence.",
                "candidateAction": "Prepare one example where evaluation changed the implementation plan.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_governance_controls",
                "workflowId": "wf_demo",
                "requirement": "Ethical AI and governance",
                "status": "covered",
                "candidateEvidence": "Designed AI governance controls with policy-alignment guardrails, LlamaGuard 3, NeMo Guardrails, and adversarial test monitoring.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {
                    "page": 2,
                    "section": "Phoenix Singapore LLM | HTX",
                    "excerpt": "Designed AI governance controls with policy-alignment guardrails, LlamaGuard 3, NeMo Guardrails, and adversarial test monitoring.",
                },
                "whyItMatters": "The role explicitly includes fairness, privacy, accountability, and compliance practices.",
                "candidateAction": "Prepare to describe how governance controls were operationalized, monitored, and reviewed.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_genai_tool",
                "workflowId": "wf_demo",
                "requirement": "Client communication and adoption",
                "status": "partial",
                "candidateEvidence": "Owned end-to-end development of a GenAI creative workflow tool for non-technical stakeholders, integrating chatbot, visual search, and inpainting features.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {
                    "page": 2,
                    "section": "Full-Stack Developer / AI Engineer Intern | HTX",
                    "excerpt": "Owned end-to-end development of a GenAI creative workflow tool for non-technical stakeholders, integrating chatbot, visual search, and inpainting features.",
                },
                "whyItMatters": "The role requires explaining tradeoffs and enabling non-technical teams to adopt AI.",
                "candidateAction": "Use the interview or addendum to clarify repeated external client advisory or adoption ownership.",
                "visibility": "candidate_visible",
            },
            {
                "id": "ev_consulting_gap",
                "workflowId": "wf_demo",
                "requirement": "Enterprise consulting cycles",
                "status": "gap",
                "candidateEvidence": "CV shows stakeholder collaboration, but not repeated external enterprise consulting cycles or director-level client advisory ownership.",
                "sourceArtifactId": "art_cv_demo",
                "sourceLocation": {
                    "page": 2,
                    "section": "CV gap",
                    "excerpt": "Stakeholder collaboration is visible, while repeated external enterprise consulting cycles need validation.",
                },
                "whyItMatters": "The role asks the candidate to act as a trusted AI advisor for enterprise clients.",
                "candidateAction": "Share a concrete advisory, rollout, or stakeholder-alignment example if available.",
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
        "sourceArtifacts": {
            "art_cv_demo": {
                "id": "art_cv_demo",
                "workflowId": "wf_demo",
                "filename": "Nicholas_Ting_Resume_Publications.pdf",
                "artifactType": "cv",
                "sourceType": "talentflow_placeholder",
                "contentType": "application/pdf",
                "visibility": "candidate_visible",
                "parser": "talentflow_demo_extract",
                "liveData": False,
                "pageCount": 2,
                "pages": [
                    {
                        "page": 1,
                        "text": (
                            "Research Consultant | WorldQuant BRAIN. Built an autonomous agent loop that "
                            "generates quantitative trading strategies, backtests them, and submits passing "
                            "strategies via the WorldQuant API with persistent memory. Phoenix Singapore LLM | "
                            "HTX. Collaborated with Mistral AI to adapt a foundation LLM for Singapore government "
                            "operations and translated policy needs into model training objectives. Built "
                            "multilingual evaluation pipelines using BERTScore, ROUGE-L, exact-match metrics, "
                            "and XLM-RoBERTa across English, Mandarin, Malay, and Tamil."
                        ),
                        "charCount": 606,
                    },
                    {
                        "page": 2,
                        "text": (
                            "Designed AI governance controls with policy-alignment guardrails, LlamaGuard 3, "
                            "NeMo Guardrails, and adversarial test monitoring. Full-Stack Developer / AI Engineer "
                            "Intern | HTX. Owned end-to-end development of a GenAI creative workflow tool for "
                            "non-technical stakeholders, integrating chatbot, visual search, and inpainting "
                            "features. Consulting proof area: stakeholder collaboration is visible, while repeated "
                            "external enterprise consulting cycles need validation."
                        ),
                        "charCount": 491,
                    },
                ],
                "uploadedAt": utc_now_iso(),
            }
        },
        "interviewPlans": {
            "wf_demo": {
                "id": "plan_demo",
                "workflowId": "wf_demo",
                "objective": "Validate agentic AI engineering, evaluation judgment, and client adoption evidence without treating missing consulting proof as a negative signal.",
                "questions": [
                    {
                        "question": "Walk me through the autonomous agent loop you built. Where were validation, retries, and failure handling enforced?",
                        "rationale": "Tests source-backed agentic LLM experience.",
                        "expectedSignal": "Clear tool boundaries, validation checks, failure handling, and direct ownership.",
                        "visibility": "recruiter_internal",
                    },
                    {
                        "question": "Tell me about a time you translated technical AI risk for a non-technical stakeholder or client sponsor.",
                        "rationale": "Addresses the client communication and consulting proof area.",
                        "expectedSignal": "Plain-language tradeoffs, stakeholder alignment, and evidence of adoption support.",
                        "visibility": "recruiter_internal",
                    },
                ],
                "candidatePrepThemes": [
                    "Prepare one agentic AI implementation story with validation and failure handling.",
                    "Bring a concrete example of explaining tradeoffs or adoption risk to stakeholders.",
                ],
                "safetyStatus": "passed",
            }
        },
        "interviewRounds": {
            "round_1": {
                "id": "round_1",
                "workflowId": "wf_demo",
                "roundNumber": 1,
                "roundType": "technical",
                "title": "R1 Technical Coding and Q&A",
                "roundStatus": "ready",
                "scheduledStart": None,
                "scheduledEnd": None,
                "timezone": "Asia/Singapore",
                "meetingProvider": "google_meet",
                "calendarEventId": None,
                "calendarHtmlLink": None,
                "meetingJoinUrl": None,
                "notesStatus": "pending",
                "approvalId": None,
                "traceId": None,
                "validationFocus": [
                    "Software engineering and deterministic coding judgment",
                    "Structured prompting and tool-call validation",
                    "Clear technical communication for non-technical stakeholders",
                ],
                "questions": [
                    {
                        "id": "q_r1_merge_intervals",
                        "prompt": "Implement merge intervals. Talk through tests for empty input, nested intervals, touching boundaries, and unsorted input.",
                        "question": "Implement merge intervals. Talk through tests for empty input, nested intervals, touching boundaries, and unsorted input.",
                        "rationale": "Validates core coding, edge-case handling, and test discipline without over-weighting missing CV wording.",
                        "expectedSignal": "Sorts first, merges cleanly, names edge cases, and gives O(n log n) time with O(n) output space.",
                        "evidenceTarget": "Production-ready AI engineering",
                        "visibility": "recruiter_internal",
                        "source": "talentflow_placeholder",
                    },
                    {
                        "id": "q_r1_tool_schema",
                        "prompt": "Design the JSON schema you would give an LLM if it had to call this interval-merging function as a tool.",
                        "question": "Design the JSON schema you would give an LLM if it had to call this interval-merging function as a tool.",
                        "rationale": "Connects the coding task to agentic structured-output work relevant to the role.",
                        "expectedSignal": "Defines typed interval arrays, validation errors, allowed tool name, and repair behavior for malformed input.",
                        "evidenceTarget": "Agentic LLM systems",
                        "visibility": "recruiter_internal",
                        "source": "talentflow_placeholder",
                    },
                ],
                "candidatePrep": [
                    "Prepare one implementation story with tests, edge cases, failure handling, and measurable outcome.",
                    "Be ready to explain when deterministic code is safer than using an LLM.",
                    "Bring examples that clarify agent tool schemas, validation, and retry behavior.",
                ],
                "transcriptPlaceholderPath": "demo_data/interviews/nicholas_ting_ai_solutions_engineer/round_1_technical_coding_and_experience.md",
                "transcriptEvidence": [
                    {
                        "id": "tev_r1_deterministic",
                        "title": "Deterministic implementation judgment",
                        "body": "This is deterministic scheduling logic, so I would implement it in code. An LLM can help generate examples or explain the result, but it should not decide the merge result.",
                        "kind": "transcript",
                        "sourceType": "talentflow_placeholder",
                        "sourceLabel": "TalentFlow placeholder",
                        "statusLabel": "Placeholder",
                        "visibility": "interviewer_internal",
                    },
                    {
                        "id": "tev_r1_schema",
                        "title": "Tool-call validation",
                        "body": "If an agent calls this as a tool, I would require a typed JSON schema for intervals, reject malformed ranges, and return repairable validation errors.",
                        "kind": "transcript",
                        "sourceType": "talentflow_placeholder",
                        "sourceLabel": "TalentFlow placeholder",
                        "statusLabel": "Placeholder",
                        "visibility": "interviewer_internal",
                    },
                ],
                "reviewStatus": "not_started",
                "nextHumanAction": "generate_r1_questions",
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            },
            "round_2": {
                "id": "round_2",
                "workflowId": "wf_demo",
                "roundNumber": 2,
                "roundType": "system_design",
                "title": "R2 System Design",
                "roundStatus": "locked",
                "scheduledStart": None,
                "scheduledEnd": None,
                "timezone": "Asia/Singapore",
                "meetingProvider": "google_meet",
                "calendarEventId": None,
                "calendarHtmlLink": None,
                "meetingJoinUrl": None,
                "notesStatus": "pending",
                "approvalId": None,
                "traceId": None,
                "validationFocus": [
                    "Architecture decomposition",
                    "Evaluation and quality measurement",
                    "Privacy, safety, and observability",
                    "Adoption and rollout judgment",
                ],
                "questions": [
                    {
                        "id": "q_r2_support_agent",
                        "prompt": "Design a client-facing customer-support agent. Show the interface, orchestration, retrieval/tools, evaluation/safety, and observability layers.",
                        "question": "Design a client-facing customer-support agent. Show the interface, orchestration, retrieval/tools, evaluation/safety, and observability layers.",
                        "rationale": "Tests whether the candidate can turn a broad AI idea into a reviewable production architecture.",
                        "expectedSignal": "Separates concerns clearly, defines tool contracts, and keeps safety and observability in the core design.",
                        "evidenceTarget": "System design and client adoption",
                        "visibility": "recruiter_internal",
                        "source": "talentflow_placeholder",
                    },
                    {
                        "id": "q_r2_eval_plan",
                        "prompt": "Define the offline and online evaluation plan for deciding whether the pilot can expand.",
                        "question": "Define the offline and online evaluation plan for deciding whether the pilot can expand.",
                        "rationale": "Assesses whether architecture choices are tied to measurable quality and safety outcomes.",
                        "expectedSignal": "Names task success, escalation quality, safety events, latency, trace review, and rollback thresholds.",
                        "evidenceTarget": "Evaluation-first judgment",
                        "visibility": "recruiter_internal",
                        "source": "talentflow_placeholder",
                    },
                ],
                "candidatePrep": [
                    "Practice explaining goals, users, constraints, architecture layers, failure handling, and rollout checks.",
                    "Use examples from your own work; do not guess hidden interviewer criteria.",
                ],
                "transcriptPlaceholderPath": "demo_data/interviews/nicholas_ting_ai_solutions_engineer/round_2_system_design.md",
                "transcriptEvidence": [
                    {
                        "id": "tev_r2_layers",
                        "title": "Architecture layers",
                        "body": "I would split it into five layers: channel interface, orchestration, retrieval and tools, evaluation and safety, and observability.",
                        "kind": "transcript",
                        "sourceType": "talentflow_placeholder",
                        "sourceLabel": "TalentFlow placeholder",
                        "statusLabel": "Placeholder",
                        "visibility": "interviewer_internal",
                    },
                    {
                        "id": "tev_r2_deterministic",
                        "title": "Avoiding unnecessary RAG",
                        "body": "I would not use RAG for simple deterministic logic like ticket severity mapping. That should be code or rules because it is easier to test and explain.",
                        "kind": "transcript",
                        "sourceType": "talentflow_placeholder",
                        "sourceLabel": "TalentFlow placeholder",
                        "statusLabel": "Placeholder",
                        "visibility": "interviewer_internal",
                    },
                ],
                "reviewStatus": "not_started",
                "nextHumanAction": "complete_r1_first",
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            },
            "round_3": {
                "id": "round_3",
                "workflowId": "wf_demo",
                "roundNumber": 3,
                "roundType": "manager",
                "title": "R3 Manager and Director Q&A",
                "roundStatus": "locked",
                "scheduledStart": None,
                "scheduledEnd": None,
                "timezone": "Asia/Singapore",
                "meetingProvider": "google_meet",
                "calendarEventId": None,
                "calendarHtmlLink": None,
                "meetingJoinUrl": None,
                "notesStatus": "pending",
                "approvalId": None,
                "traceId": None,
                "validationFocus": [
                    "Ownership and communication",
                    "Consulting judgment",
                    "Responsible AI stance",
                    "Mentoring and team fit",
                ],
                "questions": [
                    {
                        "id": "q_r3_unclear_problem",
                        "prompt": "A client wants an AI agent but cannot clearly define the business outcome. How would you lead the conversation?",
                        "question": "A client wants an AI agent but cannot clearly define the business outcome. How would you lead the conversation?",
                        "rationale": "Assesses consulting judgment, scoping, and ability to avoid jumping to a flashy solution.",
                        "expectedSignal": "Separates business outcome from AI idea, defines a narrow first workflow, and sets evaluation criteria.",
                        "evidenceTarget": "Client communication and adoption",
                        "visibility": "recruiter_internal",
                        "source": "talentflow_placeholder",
                    },
                    {
                        "id": "q_r3_ethical_ai",
                        "prompt": "What does ethical AI mean in consulting delivery beyond a policy page?",
                        "question": "What does ethical AI mean in consulting delivery beyond a policy page?",
                        "rationale": "Validates whether responsible AI is treated as operational practice.",
                        "expectedSignal": "Names refusals, privacy, measurement, escalation paths, and honest communication about limits.",
                        "evidenceTarget": "Ethical AI and governance",
                        "visibility": "recruiter_internal",
                        "source": "talentflow_placeholder",
                    },
                ],
                "candidatePrep": [
                    "Prepare examples about business outcomes, communication, ownership, and responsible escalation.",
                    "Use concrete evidence and avoid overclaiming beyond your role.",
                ],
                "transcriptPlaceholderPath": "demo_data/interviews/nicholas_ting_ai_solutions_engineer/round_3_director_hiring_manager_qna.md",
                "transcriptEvidence": [
                    {
                        "id": "tev_r3_scoping",
                        "title": "Scoping ambiguous AI work",
                        "body": "I would start by separating the business outcome from the AI idea. I would ask what process is slow, risky, or expensive today, what a good result looks like, and what decisions the system is allowed to support.",
                        "kind": "transcript",
                        "sourceType": "talentflow_placeholder",
                        "sourceLabel": "TalentFlow placeholder",
                        "statusLabel": "Placeholder",
                        "visibility": "interviewer_internal",
                    },
                    {
                        "id": "tev_r3_ethics",
                        "title": "Operational ethical AI",
                        "body": "Ethical AI means defining what the system should refuse, protecting private data, measuring false refusals and harmful completions, and making escalation paths visible.",
                        "kind": "transcript",
                        "sourceType": "talentflow_placeholder",
                        "sourceLabel": "TalentFlow placeholder",
                        "statusLabel": "Placeholder",
                        "visibility": "interviewer_internal",
                    },
                ],
                "reviewStatus": "not_started",
                "nextHumanAction": "complete_r2_first",
                "createdAt": utc_now_iso(),
                "updatedAt": utc_now_iso(),
            },
        },
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
