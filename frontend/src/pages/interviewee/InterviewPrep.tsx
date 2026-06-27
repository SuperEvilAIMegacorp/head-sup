import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FilePlus2,
  Lightbulb,
  MessagesSquare,
  Network,
  ShieldCheck,
  Users,
  Video,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CandidateRoundDetail,
  RoundSelectorStatusStrip,
  type LiveRoundSelectorItem,
  type LiveRoundStatus,
} from "@/components/rounds/live";
import { AnswerShapeGuide } from "@/components/rounds/AnswerShapeGuide";
import { EvidenceGapPanel } from "@/components/rounds/EvidenceGapPanel";
import { RoundStatusRail, type RoundRailItem } from "@/components/rounds/RoundStatusRail";
import { useWorkflow } from "@/context/WorkflowContext";

const fallbackPrepThemes = [
  {
    title: "Customer AI deployment",
    icon: Network,
    text: "Prepare a story about moving from prototype to customer-ready workflow, including constraints and rollout decisions.",
  },
  {
    title: "Evaluation and reliability",
    icon: Wrench,
    text: "Explain how you measured model behavior, handled failure cases, and decided when output quality was acceptable.",
  },
  {
    title: "Stakeholder communication",
    icon: Users,
    text: "Show how you translated technical risk for non-technical teams and kept customers aligned after launch.",
  },
];

export default function InterviewPrep() {
  const { addenda, evidenceMappings, interviewPlan, interviewRounds, workflow } = useWorkflow();
  const [, setLocation] = useLocation();
  const [activeRoundId, setActiveRoundId] = useState<string | undefined>();

  const firstVisibleRound = interviewRounds.find(round => round.status !== "locked") ?? interviewRounds[0];
  const primaryRound = interviewRounds.find(round => round.id === activeRoundId) ?? firstVisibleRound;
  const proofAreas = evidenceMappings.filter(mapping => mapping.visibility === "candidate-visible" && mapping.status !== "covered");
  const isScheduled = primaryRound?.status === "scheduled" || isRoundCompleteStatus(primaryRound?.status) || workflow.stage === "scheduled" || workflow.stage === "interview_scheduled";
  const isComplete = isRoundCompleteStatus(primaryRound?.status) || workflow.stage === "interview_completed" || workflow.stage === "interview_complete" || workflow.stage === "addendum_window_open" || workflow.stage === "notes_ready";
  const hasAddendum = addenda.length > 0;
  const addendumAcknowledged = addenda.some(addendum => addendum.status === "acknowledged");
  const feedbackPending = workflow.stage === "notes_ready" || workflow.stage === "follow_up_pending_approval";
  const feedbackReleased = workflow.stage === "follow_up_sent" || workflow.stage === "follow_up";
  const stateCopy = getCandidateStateCopy({
    addendumAcknowledged,
    feedbackPending,
    feedbackReleased,
    hasAddendum,
    isComplete,
    isScheduled,
  });

  const railItems = useMemo<RoundRailItem[]>(() => [
    {
      label: "Evidence mapped",
      description: proofAreas.length ? `${proofAreas.length} proof areas to prepare.` : "Candidate-visible evidence is ready.",
      state: "done",
      meta: "visible",
    },
    {
      label: "Schedule",
      description: isScheduled ? "Interview logistics are available." : "Waiting for recruiter approval.",
      state: isScheduled ? "done" : "current",
      meta: primaryRound?.status,
    },
    {
      label: "Interview",
      description: isComplete ? "Round has been marked complete." : isScheduled ? "Prepare for the scheduled conversation." : "Not started yet.",
      state: isComplete ? "done" : isScheduled ? "current" : "upcoming",
    },
    {
      label: "Addendum window",
      description: hasAddendum ? "Your addendum receipt is visible." : isComplete ? "You can add optional context." : "Opens after the interview.",
      state: hasAddendum ? "done" : isComplete ? "current" : "upcoming",
    },
    {
      label: "Feedback",
      description: feedbackReleased ? "Approved feedback is available." : feedbackPending ? "Candidate-safe follow-up is pending approval." : "Not released yet.",
      state: feedbackReleased ? "done" : feedbackPending || addendumAcknowledged ? "current" : "upcoming",
    },
  ], [addendumAcknowledged, feedbackPending, feedbackReleased, hasAddendum, isComplete, isScheduled, primaryRound?.status, proofAreas.length]);

  const prepThemes = primaryRound?.candidatePrepThemes?.length
    ? primaryRound.candidatePrepThemes.map((theme, index) => ({
      title: theme,
      icon: fallbackPrepThemes[index % fallbackPrepThemes.length].icon,
      text: "Use this theme to prepare role-related examples from your own work and candidate-visible evidence.",
    }))
    : interviewPlan?.candidatePrepThemes.length
      ? interviewPlan.candidatePrepThemes.map((theme, index) => ({
        title: theme,
        icon: fallbackPrepThemes[index % fallbackPrepThemes.length].icon,
        text: "Use this theme to prepare role-related examples from your own work and candidate-visible evidence.",
      }))
    : fallbackPrepThemes;
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

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview prep</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{stateCopy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {stateCopy.body}
            </p>
          </div>
          <Button className="gap-2 bg-teal-700 hover:bg-teal-800" onClick={() => setLocation(stateCopy.href)}>
            {stateCopy.action}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {roundSelectorItems.length ? (
        <RoundSelectorStatusStrip
          rounds={roundSelectorItems}
          activeRoundId={primaryRound?.id}
          onSelectRound={setActiveRoundId}
        />
      ) : null}

      {primaryRound ? (
        <CandidateRoundDetail
          roundLabel={`R${primaryRound.roundNumber ?? 1}`}
          title={primaryRound.title}
          statusLabel={humanizeRoundStatus(primaryRound.status)}
          briefing={{
            body: primaryRound.candidateBriefing ?? "Use your own source-backed examples to prepare for this round. Missing evidence is a prompt to clarify, not an automatic conclusion.",
            headline: primaryRound.roundType ? primaryRound.roundType.replace("_", " ") : "Round briefing",
            visibilityLabel: "Candidate view",
          }}
          prepThemes={(primaryRound.candidatePrepThemes?.length ? primaryRound.candidatePrepThemes : prepThemes.map(theme => theme.title)).map((theme, index) => ({
            guidance: "Prepare a concrete example, your role, tradeoffs, and what changed because of your work.",
            id: `${primaryRound.id}_prep_${index}`,
            proofPrompt: proofAreas[index]?.whatToAdd,
            title: theme,
          }))}
          schedule={{
            detail: primaryRound.dateTime
              ? "Your scheduled meeting details are visible here after HR approval."
              : "The schedule will appear after HR approves the candidate-facing calendar payload.",
            locationLabel: primaryRound.meetLink ? "Google Meet" : undefined,
            statusLabel: humanizeRoundStatus(primaryRound.status),
            timezone: primaryRound.timezone,
            when: primaryRound.dateTime ? format(new Date(primaryRound.dateTime), "EEEE, MMMM d, h:mm a") : undefined,
          }}
          addendum={{
            availabilityLabel: hasAddendum ? "Submitted" : isComplete ? "Open" : "Opens after interview",
            canSubmit: isComplete && !hasAddendum,
            receiptLabel: addendumAcknowledged ? "Acknowledged" : hasAddendum ? "Received" : undefined,
            summary: hasAddendum
              ? "Your optional context is recorded as candidate-supplied material."
              : isComplete
                ? "You can add a clarification, correction, extra document note, or voluntary consideration before follow-up is finalized."
                : "The addendum window opens only after this round is marked complete.",
          }}
          nextAction={{
            description: stateCopy.body,
            label: stateCopy.action,
            onClick: () => setLocation(stateCopy.href),
          }}
        />
      ) : null}

      <RoundStatusRail items={railItems} />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <CalendarClock className="h-4 w-4 text-teal-700" />
              Round state
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-white">{primaryRound?.status ?? "pending"}</Badge>
                <Badge variant="outline" className="bg-white">Candidate-visible</Badge>
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-950">{primaryRound?.title ?? "Customer AI deployment interview"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {primaryRound?.dateTime
                  ? `${format(new Date(primaryRound.dateTime), "EEEE, MMMM d, h:mm a")} (${primaryRound.timezone})`
                  : "The schedule will appear after HR approves the candidate-facing calendar payload."}
              </p>
              {primaryRound?.meetLink ? (
                <a href={primaryRound.meetLink} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:underline">
                  <Video className="h-4 w-4" />
                  Open Google Meet
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              What this prep uses
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Evidence</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">Candidate-visible CV evidence and proof areas.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Role context</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">Public role and company context shown elsewhere in your portal.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Boundary</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">Private recruiter notes and internal interpretation are not shown here.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {prepThemes.map(({ title, icon: Icon, text }) => (
          <Card key={title}>
            <CardContent className="p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <AnswerShapeGuide proofAreas={proofAreas} />

      <EvidenceGapPanel gaps={proofAreas} audience="candidate" onAction={() => setLocation("/interviewee/cv-evidence")} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <FilePlus2 className="h-4 w-4 text-teal-700" />
              Addendum window
            </div>
            {hasAddendum ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  Addendum received
                </div>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Your optional context is labeled candidate-supplied. {addendumAcknowledged ? "HR has acknowledged it." : "It is waiting for HR acknowledgement."}
                </p>
              </div>
            ) : isComplete ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-6 text-amber-900">
                  The interview round is complete. You can add a clarification, correction, project link, document note, or voluntary special consideration before follow-up is finalized.
                </p>
                <Button className="mt-3 gap-2" variant="outline" onClick={() => setLocation("/interviewee/addendum")}>
                  Open addendum
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                The addendum window opens after HR marks the interview round complete.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-950">
              <MessagesSquare className="h-4 w-4 text-teal-700" />
              Follow-up state
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="outline" className={feedbackReleased ? "bg-emerald-50 text-emerald-700" : "bg-white"}>
                  {feedbackReleased ? "Approved feedback available" : feedbackPending ? "Feedback pending approval" : "Feedback not released"}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Feedback or next-step communication appears only after HR approves candidate-safe content. This page does not predict an outcome.
              </p>
              <Button className="mt-3 gap-2" variant="outline" onClick={() => setLocation("/interviewee/feedback")}>
                Open feedback
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 text-teal-700" />
          <div>
            <h2 className="text-base font-bold text-teal-950">Candidate agency reminder</h2>
            <p className="mt-1 text-sm leading-6 text-teal-900">
              If the evidence map misses something important, you can prepare it for the interview or add context after the round. Candidate-supplied material is reviewed by a human and is not an automatic decision override.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function getCandidateStateCopy({
  addendumAcknowledged,
  feedbackPending,
  feedbackReleased,
  hasAddendum,
  isComplete,
  isScheduled,
}: {
  addendumAcknowledged: boolean;
  feedbackPending: boolean;
  feedbackReleased: boolean;
  hasAddendum: boolean;
  isComplete: boolean;
  isScheduled: boolean;
}) {
  if (feedbackReleased) {
    return {
      title: "Approved follow-up is available",
      body: "Your interview round is complete and HR-approved feedback or next-step guidance is available in your portal.",
      action: "Open feedback",
      href: "/interviewee/feedback",
    };
  }
  if (feedbackPending || addendumAcknowledged) {
    return {
      title: "Feedback is pending approval",
      body: "HR is preparing candidate-safe follow-up. It will only be visible after human approval.",
      action: "Check feedback",
      href: "/interviewee/feedback",
    };
  }
  if (hasAddendum) {
    return {
      title: "Your addendum was received",
      body: "Your optional context is part of the workflow record. HR can acknowledge it before finalizing follow-up.",
      action: "View addendum",
      href: "/interviewee/addendum",
    };
  }
  if (isComplete) {
    return {
      title: "The addendum window is open",
      body: "The interview round is complete. You can add context, corrections, or extra proof before follow-up is finalized.",
      action: "Open addendum",
      href: "/interviewee/addendum",
    };
  }
  if (isScheduled) {
    return {
      title: "Prepare for your scheduled round",
      body: "Use candidate-visible evidence and public role context to prepare concrete examples. This is not an automated assessment.",
      action: "View schedule",
      href: "/interviewee/schedule",
    };
  }
  return {
    title: "Prepare while scheduling is pending",
    body: "The round has not been confirmed yet. You can still review proof areas and prepare examples from your own work.",
    action: "Review evidence",
    href: "/interviewee/cv-evidence",
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
