import { useWorkflow } from "@/context/WorkflowContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, CalendarDays, ShieldCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Schedule() {
  const { approvalRequests, interviewRounds } = useWorkflow();

  const scheduling = approvalRequests.find(request => request.type === 'scheduling');
  const primaryRound = interviewRounds[0];
  const isApproved = scheduling?.status === 'approved' || primaryRound?.status === 'scheduled';
  const date = primaryRound ? new Date(primaryRound.dateTime) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview schedule</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {isApproved ? 'Confirmed Google Meet interview' : 'Schedule pending human approval'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              sup'work only shows a confirmed calendar event after HR approves the candidate-facing payload. Timezone, duration, attendees, and provider receipt stay visible here.
            </p>
          </div>
          <Badge variant="outline" className={isApproved ? 'w-fit border-emerald-200 bg-emerald-50 text-emerald-800' : 'w-fit border-amber-200 bg-amber-50 text-amber-800'}>
            {isApproved ? 'approved and scheduled' : 'approval required'}
          </Badge>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{primaryRound?.title ?? 'Interview round'}</h2>
              <p className="mt-1 text-sm text-slate-500">Round 1 - candidate-facing calendar description only</p>
            </div>
            <Badge variant="outline" className="w-fit bg-slate-50">{primaryRound?.duration ?? 45} minutes</Badge>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Date</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{date ? format(date, 'MMM d, yyyy') : 'Pending'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Time</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{date ? format(date, 'h:mm a') : 'Pending'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Timezone</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{primaryRound?.timezone ?? scheduling?.timezone}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Provider</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">Google Calendar / Meet</p>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Timezone is shown as {primaryRound?.timezone ?? 'Asia/Singapore'} for the demo. Confirm this before joining.
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Attendees</p>
              <div className="flex flex-wrap gap-2">
                {primaryRound?.attendees.map(attendee => (
                  <span key={attendee} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-950">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Approval receipt
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-800">Approval:</span> {isApproved ? 'Approved by HR before event creation' : 'Waiting for HR approval'}</p>
                <p><span className="font-semibold text-slate-800">Candidate-facing content:</span> role, date, time, attendees, and Meet link only</p>
                <p><span className="font-semibold text-slate-800">Internal fields:</span> excluded from calendar description</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="gap-2 bg-slate-950 hover:bg-slate-800" disabled={!primaryRound?.meetLink} asChild={Boolean(primaryRound?.meetLink)}>
                {primaryRound?.meetLink ? (
                  <a href={primaryRound.meetLink} target="_blank" rel="noreferrer">
                    <Video className="h-4 w-4" />
                    Join Google Meet
                  </a>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Meet link pending
                  </>
                )}
              </Button>
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {isApproved ? <CalendarDays className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                <span className="font-mono">{scheduling?.googleCalendarEventId ?? 'event id pending'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
