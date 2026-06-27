import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusChip } from "@/components/evidence/StatusChip";
import type { EvidenceMapping } from "@/types";
import { ArrowRight, FileSearch, ShieldCheck } from "lucide-react";

interface EvidenceGapPanelProps {
  gaps: EvidenceMapping[];
  audience: "hr" | "candidate";
  onAction?: () => void;
}

export function EvidenceGapPanel({ gaps, audience, onAction }: EvidenceGapPanelProps) {
  const emptyCopy = audience === "hr"
    ? "No candidate-visible gaps are currently marked for this round."
    : "Your candidate-visible evidence map does not currently show open proof areas.";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
              <FileSearch className="h-4 w-4 text-teal-700" />
              Evidence gaps for this round
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {audience === "hr"
                ? "Use these as validation focus areas. They are not decision reasons by themselves."
                : "Use these as proof areas to prepare, clarify, or supplement if you choose."}
            </p>
          </div>
          {onAction ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={onAction}>
              {audience === "hr" ? "Review packet" : "Review evidence"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {gaps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {emptyCopy}
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map(gap => (
              <div key={gap.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold leading-5 text-slate-950">{gap.requirement}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{gap.evidence}</p>
                  </div>
                  <StatusChip status={gap.status} size="sm" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-white bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Why it matters</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{gap.whyItMatters}</p>
                  </div>
                  <div className="rounded-md border border-teal-100 bg-teal-50 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {audience === "hr" ? "Validation prompt" : "Proof to prepare"}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-teal-900">{gap.whatToAdd}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
