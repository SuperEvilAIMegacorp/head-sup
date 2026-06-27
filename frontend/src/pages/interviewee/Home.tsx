import { useWorkflow } from "@/context/WorkflowContext";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar, CalendarCheck, FileText, Paperclip, Receipt, ScanSearch,
  ShieldCheck, ArrowRight, Video, CheckCircle2, AlertTriangle, Lock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { HiringJourney } from "@/components/timeline/HiringJourney";
import { StatusChip } from "@/components/evidence/StatusChip";

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className={`mb-2 h-1.5 w-10 rounded-full ${tone}`} />
      <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { workflow, evidenceMappings, timelineEvents, interviewRounds, approvalRequests, addenda } = useWorkflow();
  const [, setLocation] = useLocation();

  const firstName = user?.name.split(' ')[0] ?? workflow.candidateName.split(' ')[0];
  const scheduling = approvalRequests.find(request => request.type === 'scheduling');
  const activeRound = interviewRounds.find(round => round.status === 'scheduled') ?? interviewRounds[0];
  const scheduledAt = activeRound ? new Date(activeRound.dateTime) : null;
  const isScheduled = activeRound?.status === 'scheduled' || scheduling?.status === 'approved';
  const submittedAddendum = addenda[0];

  const visibleEvidence = evidenceMappings.filter(mapping => mapping.visibility === 'candidate-visible');
  const coveredCount = visibleEvidence.filter(mapping => mapping.status === 'covered').length;
  const partialCount = visibleEvidence.filter(mapping => mapping.status === 'partial').length;
  const gapCount = visibleEvidence.filter(mapping => mapping.status === 'gap').length;
  const unclearCount = visibleEvidence.filter(mapping => mapping.status === 'unclear').length;

  const candidateTimeline = timelineEvents.filter(event => event.candidateVisible);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interviewee workspace</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Good to see you, {firstName}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You are reviewing the shared workflow for <span className="font-semibold text-slate-800">{workflow.jobTitle}</span> at <span className="font-semibold text-slate-800">{workflow.company}</span>. This view shows what was analyzed, what HR can see, and what needs human approval.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
            <Button className="gap-2 bg-slate-950 hover:bg-slate-800" onClick={() => setLocation('/interviewee/prep')}>
              <ScanSearch className="h-4 w-4" />
              Open prep
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setLocation('/interviewee/addendum')}>
              <Paperclip className="h-4 w-4" />
              Add context
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Current stage</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {isScheduled ? 'Interview confirmed' : 'Schedule waiting for HR approval'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {isScheduled
                  ? 'The approved Google Meet details are visible below. The candidate-facing calendar description excludes internal notes.'
                  : 'HR has a scheduling approval card. No calendar event or Meet link is created until a human approves it.'}
              </p>
            </div>
            <StatusChip status={isScheduled ? 'scheduled' : 'pending'} />
          </div>

          <HiringJourney role="interviewee" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Next action</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {isScheduled ? 'Prepare your examples' : 'Wait for approved schedule'}
              </h2>
            </div>
            <CalendarCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Video className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{activeRound?.title ?? 'Interview round'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {scheduledAt
                    ? `${format(scheduledAt, 'EEE, MMM d')} at ${format(scheduledAt, 'h:mm a')} (${activeRound?.timezone})`
                    : 'Time is not confirmed yet.'}
                </p>
                <p className="mt-1 text-xs text-slate-500">{activeRound?.duration ?? 45} minutes with {activeRound?.attendees.join(', ')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full gap-2" onClick={() => setLocation('/interviewee/schedule')}>
              <Calendar className="h-4 w-4" />
              View schedule details
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Evidence summary</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">What was analyzed</h2>
            </div>
            <StatusChip status="candidate-visible" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Covered" value={coveredCount} tone="bg-emerald-500" />
            <MetricCard label="Partial" value={partialCount} tone="bg-amber-400" />
            <MetricCard label="Proof area" value={gapCount} tone="bg-rose-500" />
            <MetricCard label="Unclear" value={unclearCount} tone="bg-slate-300" />
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <span className="font-semibold">Proof to strengthen:</span> customer deployment metrics, post-launch ownership, and enterprise stakeholder examples.
          </div>
          <button className="mt-4 flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800" onClick={() => setLocation('/interviewee/cv-evidence')}>
            Review evidence cards <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Visibility boundary</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">What HR can and cannot see</h2>
            </div>
            <ShieldCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {[
              { icon: FileText, title: 'Candidate-visible', text: 'Your CV evidence map, public role sources, schedule receipt, addendum status, and approved feedback.' },
              { icon: Lock, title: 'Internal-only', text: 'Recruiter notes, private interview plan rationale, provider traces, and unapproved drafts are not shown to you.' },
              { icon: AlertTriangle, title: 'Needs approval', text: 'Calendar events, feedback release, Gmail drafts, and follow-up messages require HR approval first.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Post-interview addendum</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {submittedAddendum ? 'Your context was received' : 'Add context before next steps'}
              </h2>
            </div>
            {submittedAddendum ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Paperclip className="h-5 w-5 text-slate-400" />}
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {submittedAddendum
              ? `Status: ${submittedAddendum.status === 'acknowledged' ? `acknowledged by ${submittedAddendum.acknowledgedBy}` : 'awaiting HR acknowledgement'}. Your addendum remains candidate-supplied and unvalidated until reviewed.`
              : 'After the interview, you can add a clarification, correction, document, voluntary special consideration, or concise follow-up note. It is reviewed by a human and is not an automatic decision override.'}
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setLocation('/interviewee/addendum')}>
            Open addendum flow
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Candidate receipts</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Visible process history</h2>
            </div>
            <Receipt className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {candidateTimeline.slice(-4).map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-teal-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{event.label}</p>
                    <span className="font-mono text-[10px] text-slate-400">TRC-{String(index + 1).padStart(3, '0')}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{event.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
