import { Badge } from "@/components/ui/badge";
import type { EvidenceMapping } from "@/types";
import { Lightbulb, ListChecks } from "lucide-react";

const answerSteps = [
  {
    label: "Context",
    body: "Name the customer, system, or project setting at a high level without sharing confidential details.",
  },
  {
    label: "Your role",
    body: "Explain the part you owned, the people you worked with, and the constraints you had to manage.",
  },
  {
    label: "Evidence",
    body: "Use concrete artifacts: metrics, launch scope, decision logs, customer feedback, or post-launch ownership.",
  },
  {
    label: "Learning",
    body: "Close with what changed, what you would repeat, and what you would improve next time.",
  },
];

export function AnswerShapeGuide({ proofAreas }: { proofAreas: EvidenceMapping[] }) {
  return (
    <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-teal-950">Answer shape</h2>
          <p className="mt-1 text-sm leading-6 text-teal-900">
            This is a preparation scaffold, not an evaluation formula. Use it to make your evidence easier to follow.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {answerSteps.map((step, index) => (
          <div key={step.label} className="rounded-lg border border-teal-100 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                {index + 1}
              </span>
              <h3 className="text-sm font-bold text-slate-950">{step.label}</h3>
            </div>
            <p className="text-xs leading-5 text-slate-600">{step.body}</p>
          </div>
        ))}
      </div>

      {proofAreas.length ? (
        <div className="mt-4 rounded-lg border border-teal-100 bg-white p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            Proof areas to weave in
          </div>
          <div className="flex flex-wrap gap-2">
            {proofAreas.slice(0, 5).map(area => (
              <Badge key={area.id} variant="outline" className="bg-slate-50 text-slate-700">
                {area.requirement}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
