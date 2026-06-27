import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export interface HrBriefingBlock {
  headline: string;
  body: string;
  sourceLabel?: string;
}

export interface HrValidationFocusItem {
  id: string;
  label: string;
  rationale: string;
  statusLabel?: string;
}

export interface HrRoundQuestion {
  id: string;
  prompt: string;
  evidenceTarget?: string;
  followUp?: string;
}

export interface HrRoundEvidenceItem {
  id: string;
  title: string;
  body: string;
  kind: "transcript" | "manual" | "candidate_addendum" | "cv_evidence";
  sourceLabel?: string;
  statusLabel?: string;
}

export interface HrAddendumSummary {
  statusLabel: string;
  summary: string;
  receivedAt?: string;
  reviewNote?: string;
}

export interface HrRoundNextAction {
  label: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface HrRoundDetailProps {
  roundLabel: string;
  title: string;
  statusLabel: string;
  briefing: HrBriefingBlock;
  validationFocus: HrValidationFocusItem[];
  questions: HrRoundQuestion[];
  evidence: HrRoundEvidenceItem[];
  addendum?: HrAddendumSummary;
  nextAction?: HrRoundNextAction;
  className?: string;
}

const evidenceKindLabel: Record<HrRoundEvidenceItem["kind"], string> = {
  transcript: "Transcript",
  manual: "Manual note",
  candidate_addendum: "Candidate addendum",
  cv_evidence: "CV evidence",
};

export function HrRoundDetail({
  roundLabel,
  title,
  statusLabel,
  briefing,
  validationFocus,
  questions,
  evidence,
  addendum,
  nextAction,
  className,
}: HrRoundDetailProps) {
  return (
    <section className={["space-y-4", className].filter(Boolean).join(" ")}>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">
                {roundLabel}
              </Badge>
              <Badge variant="outline">{statusLabel}</Badge>
            </div>
            <CardTitle className="mt-3 text-xl leading-7">{title}</CardTitle>
            <CardDescription className="mt-2 leading-6">{briefing.headline}</CardDescription>
          </div>
          {briefing.sourceLabel ? (
            <Badge variant="secondary" className="shrink-0">
              {briefing.sourceLabel}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-700">{briefing.body}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Validation focus
            </CardTitle>
            <CardDescription>Use these areas to clarify evidence, not to make automated decisions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validationFocus.length ? (
              validationFocus.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold leading-5 text-slate-950">{item.label}</h3>
                    {item.statusLabel ? <Badge variant="outline">{item.statusLabel}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.rationale}</p>
                </div>
              ))
            ) : (
              <EmptyState copy="No validation focus has been provided for this round yet." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="h-4 w-4 text-teal-700" />
              Question bank
            </CardTitle>
            <CardDescription>Suggested prompts for the interviewer to adapt in the live conversation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.length ? (
              questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-700 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6 text-slate-950">{question.prompt}</p>
                      {question.evidenceTarget ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">Evidence target: {question.evidenceTarget}</p>
                      ) : null}
                      {question.followUp ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">Follow-up: {question.followUp}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState copy="No questions have been generated or selected for this round yet." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-4 w-4 text-teal-700" />
            Transcript and manual evidence
          </CardTitle>
          <CardDescription>Show what was observed, supplied, or manually noted for this round.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {evidence.length ? (
            evidence.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{evidenceKindLabel[item.kind]}</Badge>
                      {item.sourceLabel ? <Badge variant="secondary">{item.sourceLabel}</Badge> : null}
                    </div>
                    <h3 className="mt-2 text-sm font-bold leading-5 text-slate-950">{item.title}</h3>
                  </div>
                  {item.statusLabel ? <Badge variant="outline">{item.statusLabel}</Badge> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))
          ) : (
            <EmptyState copy="Transcript or manual evidence can appear here after the round is complete." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-teal-700" />
              Addendum summary
            </CardTitle>
            <CardDescription>Candidate-supplied context should be handled carefully and acknowledged.</CardDescription>
          </CardHeader>
          <CardContent>
            {addendum ? (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{addendum.statusLabel}</Badge>
                  {addendum.receivedAt ? <span className="text-xs text-slate-500">Received {addendum.receivedAt}</span> : null}
                </div>
                <p className="text-sm leading-6 text-slate-700">{addendum.summary}</p>
                {addendum.reviewNote ? (
                  <>
                    <Separator />
                    <p className="text-sm leading-6 text-slate-600">Review note: {addendum.reviewNote}</p>
                  </>
                ) : null}
              </div>
            ) : (
              <EmptyState copy="No addendum has been received for this round." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-teal-700" />
              Next action
            </CardTitle>
            <CardDescription>Keep the next human step explicit before any external action happens.</CardDescription>
          </CardHeader>
          <CardContent>
            {nextAction ? (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-5 text-teal-950">{nextAction.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-teal-900">{nextAction.description}</p>
                    {nextAction.onClick ? (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3"
                        onClick={nextAction.onClick}
                        disabled={nextAction.disabled}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState copy="No next action has been set for this round." />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{copy}</div>;
}
