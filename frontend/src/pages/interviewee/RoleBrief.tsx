import { useWorkflow } from "@/context/WorkflowContext";
import { SourceCard } from "@/components/research/SourceCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe2, Info, ShieldCheck } from "lucide-react";

export default function RoleBrief() {
  const { workflow, researchArtifacts } = useWorkflow();

  const companyResearch = researchArtifacts.filter(artifact => artifact.type === 'company');
  const marketResearch = researchArtifacts.filter(artifact => artifact.type === 'role-market');

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Candidate-safe role brief</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{workflow.company} - {workflow.jobTitle}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Public research is shown separately from your CV evidence. These source-backed signals are meant to help you prepare, not to make claims about you.
            </p>
          </div>
          <Badge variant="outline" className="w-fit bg-teal-50 text-teal-800 border-teal-200">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            candidate-safe
          </Badge>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-teal-700" />
              <h2 className="text-lg font-bold text-slate-950">Role context</h2>
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-700">
              <p>
                Evidence suggests this role centers on customer-facing AI implementation: discovery, API integration, LLM evaluation, launch support, and translation between technical and business teams.
              </p>
              <p>
                For preparation, focus on concrete examples with implementation constraints, customer outcomes, post-launch ownership, and how you handled uncertainty during deployment.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-bold text-amber-950">Do not over-index on</h2>
            </div>
            <p className="text-sm leading-6 text-amber-900">
              Public company context is useful, but it is not candidate evidence. The strongest prep is still your own proof: what you built, what changed, what you owned, and what you learned.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Exa-backed context</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Company and role sources</h2>
          </div>
          <Badge variant="outline" className="bg-white text-slate-600">cached fixture sources</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {companyResearch.map(artifact => <SourceCard key={artifact.id} artifact={artifact} />)}
          {marketResearch.map(artifact => <SourceCard key={artifact.id} artifact={artifact} />)}
        </div>
      </section>
    </div>
  );
}
