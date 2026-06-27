import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/evidence/StatusChip";
import { Lightbulb, MessagesSquare, Network, Users, Wrench, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const prepThemes = [
  {
    title: 'Customer AI deployment',
    icon: Network,
    text: 'Prepare a story about moving from prototype to customer-ready workflow, including constraints and rollout decisions.',
  },
  {
    title: 'Evaluation and reliability',
    icon: Wrench,
    text: 'Explain how you measured model behavior, handled failure cases, and decided when output quality was acceptable.',
  },
  {
    title: 'Stakeholder communication',
    icon: Users,
    text: 'Show how you translated technical risk for non-technical teams and kept customers aligned after launch.',
  },
];

export default function InterviewPrep() {
  const { evidenceMappings } = useWorkflow();
  const [, setLocation] = useLocation();
  const proofAreas = evidenceMappings.filter(mapping => mapping.visibility === 'candidate-visible' && mapping.status !== 'covered');

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview prep</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Practice from your candidate-visible evidence map</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          These are prep themes, not private interviewer notes. They are derived from the same candidate-visible evidence cards you can review and correct.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {prepThemes.map(({ title, icon: Icon, text }) => (
          <Card key={title}>
            <CardContent className="p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Proof to strengthen</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Turn gaps into answer material</h2>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setLocation('/interviewee/cv-evidence')}>
            Review evidence
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {proofAreas.map(area => (
            <div key={area.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">{area.requirement}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{area.whatToAdd}</p>
                </div>
                <StatusChip status={area.status} size="sm" />
              </div>
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Practice prompt
                </div>
                <p className="text-sm leading-6 text-amber-900">
                  Tell the story with context, your role, concrete action, evidence of impact, and what you would do differently next time.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <div className="flex items-start gap-3">
          <MessagesSquare className="mt-0.5 h-5 w-5 text-teal-700" />
          <div>
            <h2 className="text-base font-bold text-teal-950">Candidate agency reminder</h2>
            <p className="mt-1 text-sm leading-6 text-teal-900">
              If the evidence map misses something important, add context before or after the interview. The system labels it as candidate-supplied until HR reviews it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
