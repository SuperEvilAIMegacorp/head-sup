import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateAddendum, EvidenceMapping, InterviewRound } from "@/types";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ExternalLink, FileText, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { StatusChip } from "./StatusChip";

type Audience = "candidate" | "hr";

interface EvidenceTrailMatrixProps {
  addenda?: CandidateAddendum[];
  audience: Audience;
  candidateName?: string;
  cvFilename?: string;
  mappings: EvidenceMapping[];
  onAddContext?: () => void;
  rounds?: InterviewRound[];
}

const STATUS_COPY: Record<EvidenceMapping["status"], { label: string; candidate: string; hr: string }> = {
  covered: {
    label: "Strong source-backed evidence",
    candidate: "Evidence suggests your CV already supports this requirement.",
    hr: "Strong CV evidence is present. Validate only if it is central to the round.",
  },
  partial: {
    label: "Partial signal",
    candidate: "There is a useful signal here; proof to strengthen would make it clearer.",
    hr: "Partial evidence is present. Interview or candidate addendum can validate specifics.",
  },
  gap: {
    label: "Missing proof",
    candidate: "This is a proof area to strengthen if you have relevant context.",
    hr: "Missing or unavailable CV evidence. Treat as a validation area, not a conclusion.",
  },
  unclear: {
    label: "Unclear evidence",
    candidate: "This may be present, but the source-backed signal is not clear yet.",
    hr: "Evidence is ambiguous. Ask for role-related examples before relying on it.",
  },
};

export function EvidenceTrailMatrix({
  addenda = [],
  audience,
  candidateName,
  cvFilename,
  mappings,
  onAddContext,
  rounds = [],
}: EvidenceTrailMatrixProps) {
  const visibleMappings = audience === "candidate"
    ? mappings.filter(mapping => mapping.visibility === "candidate-visible")
    : mappings;
  const completedRounds = rounds.filter(round => isRoundComplete(round.status));
  const latestAddendum = [...addenda].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const sourceFile = cvFilename ?? `${slugName(candidateName ?? "Candidate")}_CV.pdf`;
  const summary = buildSummary(visibleMappings, addenda, completedRounds);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map(item => (
          <Card key={item.label} className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                <item.icon className={`h-4 w-4 ${item.iconClass}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {audience === "candidate" && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-950">What was used</p>
              <p className="mt-1 text-sm leading-6 text-teal-800">
                These cards use your CV evidence and candidate-visible source labels. Internal reviewer notes are not included here.
              </p>
            </div>
            {onAddContext && (
              <Button size="sm" className="gap-2 bg-teal-700 hover:bg-teal-800" onClick={onAddContext}>
                <MessageSquarePlus className="h-4 w-4" />
                Add context
              </Button>
            )}
          </div>
        </div>
      )}

      {audience === "hr" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <TrailBoundary
              label="Candidate-supplied"
              value={latestAddendum ? latestAddendum.status : "none yet"}
              detail={latestAddendum ? "Addendum context exists, but it is not verified source evidence until HR reviews it." : "No addendum has been submitted for this workflow yet."}
            />
            <TrailBoundary
              label="Interview validation"
              value={completedRounds.length ? "round complete" : "not mapped"}
              detail={completedRounds.length ? "A round is complete; current data does not map notes to individual requirements yet." : "No requirement-level interview validation is available yet."}
            />
            <TrailBoundary
              label="Visibility boundary"
              value="mixed"
              detail="Candidate-visible evidence and recruiter-internal notes are separated before any external action."
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1.1fr_0.8fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 lg:grid">
          <span>Requirement</span>
          <span>Source evidence</span>
          <span>Gap / status</span>
          <span>{audience === "hr" ? "Candidate action / validation" : "What you can add"}</span>
        </div>
        <div className="divide-y divide-slate-200">
          {visibleMappings.map(mapping => (
            <EvidenceTrailRow
              audience={audience}
              key={mapping.id}
              latestAddendum={latestAddendum}
              mapping={mapping}
              roundCompleted={completedRounds.length > 0}
              sourceFile={sourceFile}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function EvidenceTrailRow({
  audience,
  latestAddendum,
  mapping,
  roundCompleted,
  sourceFile,
}: {
  audience: Audience;
  latestAddendum?: CandidateAddendum;
  mapping: EvidenceMapping;
  roundCompleted: boolean;
  sourceFile: string;
}) {
  const preview = sourcePreview(mapping, sourceFile);
  const copy = STATUS_COPY[mapping.status];
  const nonCovered = mapping.status !== "covered";

  return (
    <article className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1.1fr_0.8fr_1fr] lg:items-start">
      <div>
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="min-w-0 text-sm font-bold leading-6 text-slate-950">{mapping.requirement}</h3>
          {audience === "hr" && <StatusChip status={mapping.visibility === "internal" ? "internal" : "candidate-visible"} size="sm" />}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {audience === "candidate" ? copy.candidate : copy.hr}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          <FileText className="h-4 w-4" />
          Source preview
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-slate-900">{preview.filename}</p>
        <p className="mt-1 text-xs text-slate-500">{preview.location}</p>
        <blockquote className="mt-3 border-l-2 border-slate-300 pl-3 text-sm leading-6 text-slate-700">
          {preview.excerpt}
        </blockquote>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          <span className="font-semibold text-slate-600">Rationale:</span> {preview.rationale}
        </p>
      </div>

      <div>
        <StatusChip status={mapping.status} />
        <p className="mt-2 text-sm font-semibold text-slate-900">{copy.label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {mapping.status === "covered"
            ? "Source-backed signal is already available."
            : "This should remain a proof area to validate or clarify."}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold leading-6 text-slate-950">{mapping.whatToAdd || "No candidate action is available yet."}</p>
        {audience === "hr" && nonCovered && (
          <div className="space-y-2">
            <ValidationPill
              tone={latestAddendum ? "teal" : "slate"}
              text={latestAddendum ? `Candidate-supplied: ${latestAddendum.status}` : "No candidate-supplied addendum mapped"}
            />
            <ValidationPill
              tone={roundCompleted ? "emerald" : "amber"}
              text={roundCompleted ? "Interview round complete; validation can be attached" : "Interview validation pending"}
            />
          </div>
        )}
        {audience === "candidate" && nonCovered && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
            Proof to strengthen
          </Badge>
        )}
      </div>
    </article>
  );
}

function TrailBoundary({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function ValidationPill({ text, tone }: { text: string; tone: "amber" | "emerald" | "slate" | "teal" }) {
  const classes = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
  }[tone];

  return (
    <div className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium ${classes}`}>
      <ClipboardCheck className="h-3.5 w-3.5" />
      <span>{text}</span>
    </div>
  );
}

function buildSummary(mappings: EvidenceMapping[], addenda: CandidateAddendum[], completedRounds: InterviewRound[]) {
  const strong = mappings.filter(mapping => mapping.status === "covered").length;
  const partial = mappings.filter(mapping => mapping.status === "partial").length;
  const missing = mappings.filter(mapping => mapping.status === "gap" || mapping.status === "unclear").length;

  return [
    {
      detail: "CV evidence supports the requirement.",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      label: "Strong",
      value: strong,
    },
    {
      detail: "Useful signal, with proof to strengthen.",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
      label: "Partial",
      value: partial,
    },
    {
      detail: "Missing or unclear source-backed proof.",
      icon: ExternalLink,
      iconClass: "text-rose-600",
      label: "Missing",
      value: missing,
    },
    {
      detail: "Candidate-supplied addenda on this workflow.",
      icon: MessageSquarePlus,
      iconClass: "text-teal-700",
      label: "Candidate supplied",
      value: addenda.length,
    },
    {
      detail: "Completed rounds available for validation mapping.",
      icon: ShieldCheck,
      iconClass: "text-blue-700",
      label: "Interview validated",
      value: completedRounds.length,
    },
  ];
}

function sourcePreview(mapping: EvidenceMapping, filename: string) {
  return {
    excerpt: mapping.evidence || "No excerpt is available in the current fixture.",
    filename,
    location: mapping.sourceLocation ?? "CV source location unavailable",
    rationale: mapping.whyItMatters || "Used because this requirement appears in the target role brief.",
  };
}

function slugName(name: string) {
  return name.trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Candidate";
}

function isRoundComplete(status: InterviewRound["status"]) {
  return status === "complete" || status === "completed" || status === "interview_completed" || status === "supplement_submitted" || status === "reviewed";
}
