import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  Lightbulb,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

export interface CandidateSafeBriefing {
  headline: string;
  body: string;
  visibilityLabel?: string;
}

export interface CandidatePrepTheme {
  id: string;
  title: string;
  guidance: string;
  proofPrompt?: string;
}

export interface CandidateScheduleStatus {
  statusLabel: string;
  detail: string;
  when?: string;
  timezone?: string;
  locationLabel?: string;
}

export interface CandidateAddendumState {
  availabilityLabel: string;
  summary: string;
  receiptLabel?: string;
  canSubmit?: boolean;
}

export interface CandidateRoundNextAction {
  label: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface CandidateRoundDetailProps {
  roundLabel: string;
  title: string;
  statusLabel: string;
  briefing: CandidateSafeBriefing;
  prepThemes: CandidatePrepTheme[];
  schedule: CandidateScheduleStatus;
  addendum: CandidateAddendumState;
  nextAction?: CandidateRoundNextAction;
  className?: string;
}

export function CandidateRoundDetail({
  roundLabel,
  title,
  statusLabel,
  briefing,
  prepThemes,
  schedule,
  addendum,
  nextAction,
  className,
}: CandidateRoundDetailProps) {
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
          {briefing.visibilityLabel ? (
            <Badge variant="secondary" className="shrink-0 gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {briefing.visibilityLabel}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-700">{briefing.body}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-teal-700" />
              Prep themes
            </CardTitle>
            <CardDescription>These prompts are here to help you prepare clear examples and useful context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prepThemes.length ? (
              prepThemes.map((theme) => (
                <div key={theme.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-5 text-slate-950">{theme.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{theme.guidance}</p>
                      {theme.proofPrompt ? (
                        <div className="mt-3 rounded-md border border-teal-100 bg-white p-3 text-sm leading-6 text-teal-900">
                          {theme.proofPrompt}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState copy="Prep themes will appear here once the round plan is ready." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-teal-700" />
                Schedule
              </CardTitle>
              <CardDescription>Your visible interview status and meeting details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <Badge variant="outline">{schedule.statusLabel}</Badge>
                <p className="mt-3 text-sm leading-6 text-slate-700">{schedule.detail}</p>
                {schedule.when || schedule.timezone || schedule.locationLabel ? (
                  <dl className="mt-3 grid gap-2 text-sm">
                    {schedule.when ? <ScheduleRow label="When" value={schedule.when} /> : null}
                    {schedule.timezone ? <ScheduleRow label="Timezone" value={schedule.timezone} /> : null}
                    {schedule.locationLabel ? <ScheduleRow label="Location" value={schedule.locationLabel} /> : null}
                  </dl>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck2 className="h-4 w-4 text-teal-700" />
                Addendum
              </CardTitle>
              <CardDescription>A place to add context or corrections when the workflow allows it.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{addendum.availabilityLabel}</Badge>
                  {addendum.receiptLabel ? (
                    <Badge variant="secondary" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {addendum.receiptLabel}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{addendum.summary}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {nextAction ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold leading-5 text-slate-950">{nextAction.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{nextAction.description}</p>
              </div>
              {nextAction.onClick ? (
                <Button type="button" size="sm" onClick={nextAction.onClick} disabled={nextAction.disabled}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function ScheduleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{copy}</div>;
}
