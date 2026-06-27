import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, Clock, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Feedback() {
  const { addenda, timelineEvents } = useWorkflow();
  const followUpApproved = timelineEvents.some(event => event.type === 'follow_up_sent');
  const addendum = addenda[0];

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Candidate feedback</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Approved, candidate-safe feedback</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Feedback appears here only after HR reviews the draft, checks visibility, and approves release. Internal notes and raw deliberation are not shown.
        </p>
      </section>

      {!followUpApproved ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Clock className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-950">Feedback is not released yet</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              The hiring team may prepare a draft after interview notes and any addendum are reviewed. You will see only approved, candidate-safe content.
            </p>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">Visibility check pending</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Blocks internal notes, protected-characteristic references, and unsupported claims.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <Paperclip className="mb-2 h-4 w-4 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">Addendum status</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {addendum ? `Submitted and ${addendum.status === 'acknowledged' ? 'acknowledged' : 'awaiting HR acknowledgement'}.` : 'No addendum submitted yet.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            HR approved this candidate-safe feedback for release.
          </div>

          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-950">Released feedback</h2>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Approved</Badge>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Observed evidence</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  <li>Evidence suggests strong Python, API integration, and LLM evaluation experience.</li>
                  <li>The interview discussion clarified customer deployment steps and monitoring ownership.</li>
                  <li>Enterprise stakeholder examples could still be made more concrete.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Interviewer interpretation</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  The discussion indicates practical implementation depth. The team would benefit from one more concrete example of managing enterprise stakeholders through launch risk.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Recommended next step</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-800">
                  HR may request a focused follow-up on post-launch ownership and stakeholder communication.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
