import { useWorkflow } from "@/context/WorkflowContext";
import { StatusChip } from "@/components/evidence/StatusChip";
import { Globe2, Video, Mail, ArrowRight, ShieldCheck, Paperclip, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function Pipeline() {
  const { workflow, approvalRequests, interviewRounds, addenda, researchArtifacts } = useWorkflow();
  const [, setLocation] = useLocation();

  const pendingApprovals = approvalRequests.filter(request => request.status === 'pending');
  const activeRound = interviewRounds[0];
  const pendingAddenda = addenda.filter(addendum => addendum.status === 'pending');

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">HR pipeline</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">One active candidate workflow</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This queue is optimized for live demo actions: open the candidate packet, approve scheduling, review addenda, and show the audit trail.
            </p>
          </div>
          <Button className="gap-2 bg-slate-950 hover:bg-slate-800" onClick={() => setLocation('/hr/packet')}>
            Open candidate packet
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Pending approvals', value: pendingApprovals.length, icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Research sources', value: researchArtifacts.length, icon: Globe2, tone: 'text-teal-700 bg-teal-50 border-teal-200' },
          { label: 'Addenda awaiting review', value: pendingAddenda.length, icon: Paperclip, tone: 'text-violet-700 bg-violet-50 border-violet-200' },
          { label: 'Candidate-visible receipts', value: 5 + addenda.length, icon: ShieldCheck, tone: 'text-slate-700 bg-slate-50 border-slate-200' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`rounded-xl border p-4 ${tone}`}>
            <Icon className="mb-3 h-5 w-5" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs font-semibold">{label}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button type="button" className="block w-full p-5 text-left" onClick={() => setLocation('/hr/packet')}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-bold text-white">MT</div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">{workflow.candidateName}</h2>
                <p className="mt-1 text-sm text-slate-500">{workflow.candidateEmail} - {workflow.jobTitle}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:w-[520px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Stage</p>
                <div className="mt-1"><StatusChip status={workflow.stage === 'interview_scheduled' ? 'scheduled' : 'pending'} /></div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Next interview</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{format(new Date(activeRound.dateTime), 'MMM d, h:mm a')}</p>
              </div>
              <div className="flex items-center justify-end">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
                  Open packet <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </button>
      </section>

      {pendingApprovals.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-bold text-amber-950">Scheduling approval is waiting</p>
                <p className="mt-1 text-sm leading-6 text-amber-900">Review candidate, interviewer, timezone, duration, provider, and candidate-facing description before creating the Google Meet event.</p>
              </div>
            </div>
            <Button variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100" onClick={() => setLocation('/hr/scheduling')}>
              Review scheduling
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Exa research', detail: 'Cached source cards ready', icon: Globe2 },
          { label: 'Google Calendar / Meet', detail: pendingApprovals.length ? 'Waiting for approval' : 'Fixture event created', icon: Video },
          { label: 'Gmail / automation', detail: 'Draft approval available after feedback', icon: Mail },
        ].map(({ label, detail, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Icon className="mb-3 h-5 w-5 text-slate-400" />
            <p className="text-sm font-bold text-slate-950">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
