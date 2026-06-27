import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  MessageSquareText,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  HrRoundDetail,
  RoundSelectorStatusStrip,
  type LiveRoundSelectorItem,
  type LiveRoundStatus,
} from "@/components/rounds/live";
import { EvidenceGapPanel } from "@/components/rounds/EvidenceGapPanel";
import { RoundStatusRail, type RoundRailItem } from "@/components/rounds/RoundStatusRail";
import { useWorkflow } from "@/context/WorkflowContext";

const fallbackQuestions = [
  {
    text: "Walk through a customer AI deployment you helped move from prototype to production. What changed between demo and launch?",
    gap: "Customer-facing AI deployment",
    rationale: "Evidence is partial: the CV mentions rollouts but not deployment size, customer type, or ownership.",
    signal: "Clear implementation steps, constraint handling, customer communication, and measurable launch outcome.",
    type: "situational",
  },
  {
    text: "After launch, what did you own? Monitoring, documentation, customer success handoff, incidents, or iteration?",
    gap: "Post-launch ownership",
    rationale: "The CV suggests launch involvement but ongoing ownership is unclear.",
    signal: "Specific post-launch responsibility and evidence of operational maturity.",
    type: "competency",
  },
  {
    text: "Describe an LLM evaluation workflow where the results changed your implementation plan.",
    gap: "LLM evaluation and quality measurement",
    rationale: "Covered evidence should still be validated with a concrete decision example.",
    signal: "Uses evaluation to manage risk rather than treating model output as inherently reliable.",
    type: "technical",
  },
  {
    text: "Tell me about a time you explained technical risk to a business stakeholder or customer sponsor.",
    gap: "Enterprise stakeholder communication",
    rationale: "The evidence map marks this as a proof area to strengthen.",
    signal: "Accurate translation of constraints, careful expectations, and collaborative next steps.",
    type: "behavioral",
  },
];

export default function InterviewPlan() {
  const {
    addenda,
    auditEvents,
    completeInterviewRound,
    evidenceMappings,
    generateInterviewPlan,
    interviewPlan,
    interviewRounds,
    approvalRequests,
    storeInterviewTranscript,
    syncState,
    workflow,
  } = useWorkflow();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoringTranscript, setIsStoringTranscript] = useState(false);
  const [isCompletingRound, setIsCompletingRound] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<string | undefined>();
  const [notesDraft, setNotesDraft] = useState(
    "Seeded interviewer note: validate post-launch ownership, stakeholder communication, and concrete deployment metrics before drafting candidate-safe follow-up.",
  );

  const firstActionableRound = interviewRounds.find(round => round.status !== "locked") ?? interviewRounds[0];
  const primaryRound = interviewRounds.find(round => round.id === activeRoundId) ?? firstActionableRound;
  const scheduleApproval = approvalRequests.find(request => request.type === "scheduling");
  const visibleGaps = evidenceMappings.filter(mapping => mapping.visibility === "candidate-visible" && mapping.status !== "covered");
  const isScheduled = primaryRound?.status === "scheduled" || isRoundCompleteStatus(primaryRound?.status) || workflow.stage === "scheduled" || workflow.stage === "interview_scheduled";
  const isComplete = isRoundCompleteStatus(primaryRound?.status) || workflow.stage === "interview_completed" || workflow.stage === "interview_complete" || workflow.stage === "addendum_window_open" || workflow.stage === "notes_ready";
  const pendingAddendum = addenda.find(addendum => addendum.status === "pending");
  const acknowledgedAddendum = addenda.find(addendum => addendum.status === "acknowledged");
  const generatedQuestions = interviewPlan?.questions.length
    ? interviewPlan.questions.map(question => ({
      gap: "Evidence validation",
      rationale: question.rationale,
      signal: question.expectedSignal,
      text: question.question,
      type: "backend-generated",
    }))
    : fallbackQuestions;
  const selectedRoundQuestions = primaryRound?.questions?.length
    ? primaryRound.questions.map(question => ({
      gap: question.evidenceTarget ?? "Round validation",
      rationale: question.rationale ?? "Generated or seeded for this round.",
      signal: question.expectedSignal ?? "Specific, role-relevant evidence.",
      text: question.prompt,
      type: question.source ?? "round",
    }))
    : generatedQuestions;
  const roundSelectorItems = useMemo<LiveRoundSelectorItem[]>(() => interviewRounds.map(round => ({
    description: round.candidateBriefing ?? round.roundType?.replace("_", " "),
    disabled: round.status === "locked",
    id: round.id,
    meta: round.dateTime ? format(new Date(round.dateTime), "MMM d, h:mm a") : undefined,
    roundNumber: (round.roundNumber ?? 1) as 1 | 2 | 3,
    status: toLiveRoundStatus(round.status),
    statusLabel: humanizeRoundStatus(round.status),
    title: round.title,
  })), [interviewRounds]);

  const railItems = useMemo<RoundRailItem[]>(() => [
    {
      label: "Evidence mapped",
      description: visibleGaps.length ? `${visibleGaps.length} proof areas need validation focus.` : "Candidate-visible evidence is ready.",
      state: evidenceMappings.length ? "done" : "current",
      meta: syncState.dataSource,
    },
    {
      label: "Questions prepared",
      description: interviewPlan?.questions.length ? "Backend-generated plan is available." : "Generate or review the seeded plan.",
      state: interviewPlan?.questions.length ? "done" : "current",
      meta: interviewPlan?.safetyStatus ?? "review",
    },
    {
      label: "Schedule",
      description: scheduleApproval?.status === "pending" ? "Google Meet payload needs approval." : isScheduled ? "Calendar details are visible to candidate." : "No confirmed slot yet.",
      state: isScheduled ? "done" : scheduleApproval?.status === "pending" ? "blocked" : "upcoming",
      meta: scheduleApproval?.status ?? "draft",
    },
    {
      label: "Interview",
      description: isComplete ? "Round is complete and addendum window can be used." : isScheduled ? "Use this workbench during the conversation." : "Waiting for scheduling.",
      state: isComplete ? "done" : isScheduled ? "current" : "upcoming",
      meta: primaryRound?.status,
    },
    {
      label: "Addendum and follow-up",
      description: pendingAddendum ? "Candidate context needs HR acknowledgement." : acknowledgedAddendum ? "Addendum acknowledged before follow-up." : "Follow-up waits for notes and candidate context.",
      state: pendingAddendum ? "blocked" : acknowledgedAddendum || workflow.stage === "follow_up_sent" ? "done" : isComplete ? "current" : "upcoming",
      meta: pendingAddendum ? "review" : acknowledgedAddendum ? "ack" : undefined,
    },
  ], [acknowledgedAddendum, evidenceMappings.length, interviewPlan, isComplete, isScheduled, pendingAddendum, primaryRound?.status, scheduleApproval, syncState.dataSource, visibleGaps.length, workflow.stage]);

  const nextAction = getNextAction({
    hasPlan: Boolean(interviewPlan?.questions.length),
    isComplete,
    isScheduled,
    pendingAddendum: Boolean(pendingAddendum),
    schedulePending: scheduleApproval?.status === "pending",
    workflowStage: workflow.stage,
  });

  const noteEvents = auditEvents.filter(event => {
    const text = `${event.eventType} ${event.summary}`.toLowerCase();
    return text.includes("note") || text.includes("round") || text.includes("interview");
  }).slice(0, 3);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateInterviewPlan(primaryRound?.id);
      toast.success(syncState.backendAvailable ? "Interview plan generated by backend." : "Backend unavailable; fixture plan remains visible.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStoreTranscript = async () => {
    if (!primaryRound) return;
    setIsStoringTranscript(true);
    try {
      await storeInterviewTranscript(primaryRound.id, notesDraft, "live");
      toast.success("Live transcript text stored for this round.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to store transcript.");
    } finally {
      setIsStoringTranscript(false);
    }
  };

  const handleCompleteRound = async () => {
    if (!primaryRound) return;
    setIsCompletingRound(true);
    try {
      await completeInterviewRound(primaryRound.id, notesDraft);
      toast.success("Round marked complete. Candidate addendum window is open.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete round.");
    } finally {
      setIsCompletingRound(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Round workbench</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {primaryRound?.title ?? "Customer AI deployment interview"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              A recruiter-only workspace for briefing, validation focus, candidate-visible gaps, generated questions, interview notes, addendum context, and the next approved action.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button className="gap-2" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate from backend
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setLocation(nextAction.href)}>
              {nextAction.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <RoundStatusRail items={railItems} />

      {roundSelectorItems.length ? (
        <RoundSelectorStatusStrip
          rounds={roundSelectorItems}
          activeRoundId={primaryRound?.id}
          onSelectRound={setActiveRoundId}
        />
      ) : null}

      {primaryRound ? (
        <HrRoundDetail
          roundLabel={`R${primaryRound.roundNumber ?? 1}`}
          title={primaryRound.title}
          statusLabel={humanizeRoundStatus(primaryRound.status)}
          briefing={{
            body: primaryRound.hrBriefing ?? "Use source-backed evidence and candidate-supplied context to guide this round. Missing evidence should become a fair validation prompt, not an unsupported conclusion.",
            headline: primaryRound.roundType ? primaryRound.roundType.replace("_", " ") : "Round briefing",
            sourceLabel: syncState.dataSource === "backend" ? "Backend state" : "Fixture",
          }}
          validationFocus={(primaryRound.validationFocus?.length ? primaryRound.validationFocus : visibleGaps.map(gap => gap.requirement)).map((focus, index) => ({
            id: `${primaryRound.id}_focus_${index}`,
            label: focus,
            rationale: visibleGaps.find(gap => gap.requirement === focus)?.whatToAdd ?? "Validate this area with concrete, role-related evidence.",
            statusLabel: visibleGaps.find(gap => gap.requirement === focus)?.status,
          }))}
          questions={selectedRoundQuestions.map((question, index) => ({
            evidenceTarget: question.gap,
            followUp: question.signal,
            id: `${primaryRound.id}_detail_q_${index}`,
            prompt: question.text,
          }))}
          evidence={(primaryRound.transcriptEvidence ?? []).map((item, index) => ({
            body: item.body,
            id: item.id ?? `${primaryRound.id}_evidence_${index}`,
            kind: item.kind,
            sourceLabel: item.sourceLabel,
            statusLabel: item.statusLabel,
            title: item.title,
          }))}
          addendum={pendingAddendum || acknowledgedAddendum ? {
            reviewNote: acknowledgedAddendum?.reviewNote,
            statusLabel: pendingAddendum ? "Needs acknowledgement" : "Acknowledged",
            summary: (pendingAddendum ?? acknowledgedAddendum)?.body ?? "Candidate context is recorded.",
          } : undefined}
          nextAction={{
            description: nextAction.description,
            disabled: isGenerating,
            label: nextAction.label,
            onClick: nextAction.label === "Generate plan" ? handleGenerate : () => setLocation(nextAction.href),
          }}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <UserCheck className="h-4 w-4 text-teal-700" />
              Validation focus
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {visibleGaps.slice(0, 3).map(gap => (
                <div key={gap.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <Badge variant="outline" className="mb-2 bg-white capitalize">{gap.status}</Badge>
                  <h3 className="text-sm font-bold leading-5 text-slate-950">{gap.requirement}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{gap.whatToAdd}</p>
                </div>
              ))}
              {!visibleGaps.length ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:col-span-3">
                  No open candidate-visible proof areas. Use questions to validate covered evidence and role fit.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <CalendarClock className="h-4 w-4 text-teal-700" />
              Round logistics
            </div>
            <dl className="grid gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Candidate</dt>
                <dd className="mt-1 font-semibold text-slate-950">{workflow.candidateName}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Schedule</dt>
                <dd className="mt-1 text-slate-700">
                  {primaryRound?.dateTime ? `${format(new Date(primaryRound.dateTime), "MMM d, h:mm a")} (${primaryRound.timezone})` : "Pending approval"}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Provider state</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">{syncState.dataSource}</Badge>
                  <Badge variant="outline" className="bg-white">{workflow.providerMode ?? "fixture"}</Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <EvidenceGapPanel gaps={visibleGaps} audience="hr" onAction={() => setLocation("/hr/candidate-packet")} />

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Generated questions</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Question bank tied to evidence</h2>
          </div>
          <Badge variant="outline" className="w-fit bg-slate-50">
            Candidate sees prep themes only
          </Badge>
        </div>

        <div className="grid gap-4">
          {selectedRoundQuestions.map(question => (
            <Card key={question.text}>
              <CardContent className="p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-bold leading-6 text-slate-950">{question.text}</h3>
                  <Badge variant="outline" className="w-fit bg-slate-50 capitalize">{question.type}</Badge>
                </div>
                <div className="mb-4 inline-flex rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                  Addresses: {question.gap}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <Info className="h-4 w-4" />
                      Rationale
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{question.rationale}</p>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-900">
                      <ShieldCheck className="h-4 w-4" />
                      Expected signal
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-teal-900">{question.signal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <NotebookPen className="h-4 w-4 text-teal-700" />
              Manual or seeded notes
            </div>
            <Textarea
              className="min-h-[136px] resize-none bg-slate-50"
              value={notesDraft}
              onChange={event => setNotesDraft(event.target.value)}
            />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Notes are recruiter-internal. Use approved follow-up tooling before anything candidate-facing is released.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="gap-2" onClick={handleStoreTranscript} disabled={!primaryRound || isStoringTranscript}>
                {isStoringTranscript ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                Store live transcript
              </Button>
              <Button className="gap-2 bg-slate-950 hover:bg-slate-800" onClick={handleCompleteRound} disabled={!primaryRound || isCompletingRound || isRoundCompleteStatus(primaryRound.status)}>
                {isCompletingRound ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Complete selected round
              </Button>
            </div>
            {noteEvents.length ? (
              <div className="mt-4 space-y-2">
                {noteEvents.map(event => (
                  <div key={event.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-slate-900">{event.actor}:</span> {event.summary}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <MessageSquareText className="h-4 w-4 text-teal-700" />
              Addendum context
            </div>
            {addenda.length ? (
              <div className="space-y-3">
                {addenda.map(addendum => (
                  <div key={addendum.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="bg-white capitalize">{addendum.type.replace("_", " ")}</Badge>
                      <Badge variant="outline" className={addendum.status === "acknowledged" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                        {addendum.status === "acknowledged" ? "Acknowledged" : "Needs acknowledgement"}
                      </Badge>
                      {addendum.sensitive ? <Badge variant="outline" className="bg-rose-50 text-rose-700">Voluntary sensitive context</Badge> : null}
                    </div>
                    <p className="line-clamp-4 text-sm leading-6 text-slate-600">{addendum.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {isComplete
                  ? "No candidate addendum submitted yet. If one arrives, acknowledge it before generating candidate-safe follow-up."
                  : "Candidate addendum context appears here after the round is marked complete and the candidate submits optional context."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <p className="text-sm leading-6 text-slate-600">
            Safety notice: do not ask about protected characteristics, private life, health, family status, or unsupported assumptions. Candidate prep sees safe themes and proof areas, not private notes or internal interpretation.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-base font-bold text-teal-950">Next action</h2>
              <p className="mt-1 text-sm leading-6 text-teal-900">{nextAction.description}</p>
            </div>
          </div>
          <Button className="gap-2 bg-teal-700 hover:bg-teal-800" onClick={() => setLocation(nextAction.href)}>
            {nextAction.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function getNextAction({
  hasPlan,
  isComplete,
  isScheduled,
  pendingAddendum,
  schedulePending,
  workflowStage,
}: {
  hasPlan: boolean;
  isComplete: boolean;
  isScheduled: boolean;
  pendingAddendum: boolean;
  schedulePending: boolean;
  workflowStage: string;
}) {
  if (!hasPlan) {
    return {
      href: "/hr/interview-plan",
      label: "Generate plan",
      description: "Generate or refresh evidence-backed questions before scheduling or conducting the round.",
    };
  }
  if (schedulePending || !isScheduled) {
    return {
      href: "/hr/scheduling",
      label: "Review schedule",
      description: "Review the candidate-facing Google Meet payload before any calendar event is created.",
    };
  }
  if (!isComplete) {
    return {
      href: "/hr/scheduling",
      label: "Open scheduling",
      description: "Use the scheduling page to mark the round complete when interview notes are ready.",
    };
  }
  if (pendingAddendum) {
    return {
      href: "/hr/addendum",
      label: "Review addendum",
      description: "Acknowledge candidate-supplied context before drafting or approving follow-up.",
    };
  }
  if (workflowStage === "notes_ready" || workflowStage === "follow_up_pending_approval") {
    return {
      href: "/hr/follow-up",
      label: "Draft follow-up",
      description: "Prepare candidate-safe follow-up using notes and reviewed addendum context.",
    };
  }
  return {
    href: "/hr/follow-up",
    label: "Prepare follow-up",
    description: "Round context is ready. Keep candidate-facing communication approved and constructive.",
  };
}

function isRoundCompleteStatus(status?: string) {
  return status === "complete" || status === "completed" || status === "interview_completed" || status === "supplement_submitted" || status === "reviewed";
}

function toLiveRoundStatus(status?: string): LiveRoundStatus {
  if (status === "locked") return "locked";
  if (status === "scheduled") return "scheduled";
  if (status === "supplement_submitted") return "needs_action";
  if (isRoundCompleteStatus(status)) return "complete";
  if (status === "questions_ready" || status === "ready" || status === "pre_interview" || status === "transcript_ready") return "active";
  return "waiting";
}

function humanizeRoundStatus(status?: string) {
  if (!status) return "Pending";
  const labels: Record<string, string> = {
    complete: "Complete",
    completed: "Complete",
    interview_completed: "Complete",
    locked: "Locked",
    pending: "Pending",
    pre_interview: "Ready",
    questions_ready: "Questions ready",
    ready: "Ready",
    reviewed: "Reviewed",
    scheduled: "Scheduled",
    supplement_submitted: "Addendum submitted",
    transcript_ready: "Transcript ready",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}
