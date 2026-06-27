import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Info, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const groups = [
  {
    title: "Customer deployment proof",
    questions: [
      {
        text: "Walk through a customer AI deployment you helped move from prototype to production. What changed between demo and launch?",
        gap: "Customer-facing AI deployment",
        rationale: "Evidence is partial: the CV mentions rollouts but not deployment size, customer type, or ownership.",
        signal: "Clear implementation steps, constraint handling, customer communication, and measurable launch outcome.",
        type: "situational",
      },
      {
        text: "After launch, what did you own? Monitoring, documentation, customer success handoff, incidents, or iteration?",
        gap: "Post-launch ownership",
        rationale: "The CV suggests launch involvement but ongoing ownership is unclear.",
        signal: "Specific post-launch responsibility and evidence of operational maturity.",
        type: "competency",
      },
    ],
  },
  {
    title: "Evaluation and stakeholder communication",
    questions: [
      {
        text: "Describe an LLM evaluation workflow where the results changed your implementation plan.",
        gap: "LLM evaluation and quality measurement",
        rationale: "Covered evidence should still be validated with a concrete decision example.",
        signal: "Uses evaluation to manage risk rather than treating model output as inherently reliable.",
        type: "technical",
      },
      {
        text: "Tell me about a time you explained technical risk to a business stakeholder or customer sponsor.",
        gap: "Enterprise stakeholder communication",
        rationale: "The evidence map marks this as a proof area to strengthen.",
        signal: "Accurate translation of constraints, careful expectations, and collaborative next steps.",
        type: "behavioral",
      },
    ],
  },
];

export default function InterviewPlan() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview plan</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Evidence-backed questions for HR review</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              These questions are proposed from the evidence map. Recruiters remain responsible for what is asked and how answers are interpreted.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4 text-teal-700" />
            Regenerate fixture plan
          </Button>
        </div>
      </section>

      <div className="space-y-6">
        {groups.map(group => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">{group.title}</h2>
            {group.questions.map(question => (
              <Card key={question.text}>
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-base font-bold leading-6 text-slate-950">{question.text}</h3>
                    <Badge variant="outline" className="w-fit bg-slate-50 capitalize">{question.type}</Badge>
                  </div>
                  <div className="mb-4 inline-flex rounded-md bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                    Addresses: {question.gap}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Info className="h-4 w-4" />
                        Rationale
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{question.rationale}</p>
                    </div>
                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-900">
                        <ShieldCheck className="h-4 w-4" />
                        Expected signal
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-teal-900">{question.signal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-slate-500" />
          <p className="text-sm leading-6 text-slate-600">
            Safety notice: do not ask about protected characteristics, private life, health, family status, or unsupported assumptions. Candidate prep sees themes only, not this private question plan.
          </p>
        </div>
      </section>
    </div>
  );
}
