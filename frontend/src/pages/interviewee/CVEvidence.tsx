import { useWorkflow } from "@/context/WorkflowContext";
import { EvidenceTrailMatrix } from "@/components/evidence/EvidenceTrailMatrix";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import { useLocation } from "wouter";

export default function CVEvidence() {
  const { addenda, evidenceMappings, interviewRounds, workflow } = useWorkflow();
  const [, setLocation] = useLocation();
  const cvFilename = `${workflow.candidateName.replace(/[^a-z0-9]+/gi, "_")}_CV.pdf`;

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

      <EvidenceTrailMatrix
        addenda={addenda}
        audience="candidate"
        candidateName={workflow.candidateName}
        cvFilename={cvFilename}
        mappings={evidenceMappings}
        onAddContext={() => setLocation('/interviewee/addendum')}
        rounds={interviewRounds}
      />
    </div>
  );
}
