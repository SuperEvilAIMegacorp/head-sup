import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { StatusChip } from "@/components/evidence/StatusChip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

const STATUS_HELP = {
  covered: "Your CV already shows this.",
  partial: "You have a signal here; add specifics.",
  gap: "This is a proof area to strengthen.",
  unclear: "This may be present, but it is not clear yet.",
};

export default function CVEvidence() {
  const { evidenceMappings } = useWorkflow();
  const [, setLocation] = useLocation();
  const visibleEvidence = evidenceMappings.filter(mapping => mapping.visibility === 'candidate-visible');
  const [selectedId, setSelectedId] = useState(visibleEvidence[0]?.id);
  const selectedEvidence = visibleEvidence.find(mapping => mapping.id === selectedId) ?? visibleEvidence[0];

  const counts = {
    covered: visibleEvidence.filter(mapping => mapping.status === 'covered').length,
    partial: visibleEvidence.filter(mapping => mapping.status === 'partial').length,
    gap: visibleEvidence.filter(mapping => mapping.status === 'gap').length,
    unclear: visibleEvidence.filter(mapping => mapping.status === 'unclear').length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">CV evidence review</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Role requirements and your evidence</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is not a score. It is a candidate-visible map of what your uploaded CV supports, what is unclear, and what proof you can add before the hiring team finalizes next steps.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setLocation('/interviewee/addendum')}>
            <MessageSquarePlus className="h-4 w-4" />
            Add context
          </Button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(counts).map(([status, value]) => (
              <Card key={status}>
                <CardContent className="p-3">
                  <div className="mb-2">
                    <StatusChip status={status as keyof typeof counts} size="sm" />
                  </div>
                  <div className="text-2xl font-bold text-slate-950">{value}</div>
                  <div className="text-xs text-slate-500">{STATUS_HELP[status as keyof typeof STATUS_HELP]}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {visibleEvidence.map(mapping => (
              <button
                key={mapping.id}
                type="button"
                className={`mb-1 w-full rounded-lg p-3 text-left transition last:mb-0 ${selectedEvidence?.id === mapping.id ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-slate-50'}`}
                onClick={() => setSelectedId(mapping.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-5 text-slate-900">{mapping.requirement}</p>
                  <StatusChip status={mapping.status} size="sm" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{mapping.whatToAdd}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedEvidence && (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Requirement</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">{selectedEvidence.requirement}</h2>
              </div>
              <StatusChip status={selectedEvidence.status} size="lg" />
            </div>

            <div className="grid gap-4 py-5 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <FileText className="h-4 w-4" />
                  Evidence found
                </div>
                <p className="text-sm leading-6 text-slate-700">{selectedEvidence.evidence}</p>
                <p className="mt-3 rounded-md bg-white px-2 py-1 font-mono text-[11px] text-slate-500">
                  Source: {selectedEvidence.sourceLocation ?? 'Candidate-provided CV'}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <ShieldCheck className="h-4 w-4" />
                  Why it matters
                </div>
                <p className="text-sm leading-6 text-slate-700">{selectedEvidence.whyItMatters}</p>
                <p className="mt-3 text-xs font-semibold text-slate-500">{STATUS_HELP[selectedEvidence.status]}</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">What you can add or correct</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">{selectedEvidence.whatToAdd}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Eye className="mt-0.5 h-4 w-4 text-teal-700" />
                <div>
                  <p className="text-sm font-semibold text-teal-950">Visibility: candidate-visible and recruiter-visible</p>
                  <p className="mt-1 text-xs leading-5 text-teal-800">Internal notes and private deliberation are not included in this evidence card.</p>
                </div>
              </div>
              <Button size="sm" className="bg-teal-700 hover:bg-teal-800" onClick={() => setLocation('/interviewee/addendum')}>
                Add supporting context
              </Button>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
