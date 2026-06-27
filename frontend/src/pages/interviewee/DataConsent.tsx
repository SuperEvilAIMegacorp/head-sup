import { useWorkflow } from "@/context/WorkflowContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Database,
  FileCheck2,
  FileText,
  Lock,
  PencilLine,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

function InfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
          <Icon className="h-4 w-4 text-teal-700" />
        </span>
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      </div>
      <div className="text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

export default function DataConsent() {
  const [, setLocation] = useLocation();
  const {
    addenda,
    approvalRequests,
    evidenceMappings,
    researchArtifacts,
    syncState,
    timelineEvents,
    workflow,
  } = useWorkflow();

  const candidateEvidence = evidenceMappings.filter(item => item.visibility === "candidate-visible");
  const internalEvidenceCount = evidenceMappings.length - candidateEvidence.length;
  const publicSources = researchArtifacts.filter(source => source.candidateSafe !== false);
  const approvals = approvalRequests.filter(request => request.status === "approved");
  const pendingApprovals = approvalRequests.filter(request => request.status === "pending");
  const candidateReceipts = timelineEvents.filter(event => event.candidateVisible);
  const latestReceipt = candidateReceipts[candidateReceipts.length - 1];
  const addendum = addenda[0];

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Data & consent</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Your data use and visibility center</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This page summarizes what sup'work uses for the {workflow.jobTitle} process, what HR can see, what you can correct or add, and which external actions require human approval first.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 text-teal-800">
            {syncState.dataSource === "backend" ? "Backend-synced" : "Fixture-safe demo"}
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoBlock icon={Database} title="Data used">
          <ul className="space-y-2">
            <li>CV evidence you provided: {candidateEvidence.length} candidate-visible items.</li>
            <li>Target role details for {workflow.company} and public role/company context.</li>
            <li>Interview schedule status, addendum receipt, and approved follow-up status.</li>
          </ul>
        </InfoBlock>

        <InfoBlock icon={ShieldCheck} title="What HR can see">
          <ul className="space-y-2">
            <li>Candidate-visible evidence cards and gaps that need proof to strengthen.</li>
            <li>Public source-backed research cards: {publicSources.length} currently visible.</li>
            <li>Post-interview addendum status and any voluntary context you submit.</li>
          </ul>
        </InfoBlock>

        <InfoBlock icon={Lock} title="What stays internal">
          <ul className="space-y-2">
            <li>Recruiter-only notes, unapproved drafts, and raw provider traces are not shown to you.</li>
            <li>{internalEvidenceCount} internal-only evidence item{internalEvidenceCount === 1 ? "" : "s"} remain outside the candidate projection.</li>
            <li>Sensitive addendum content is restricted review material and should not be turned into unsupported inferences.</li>
          </ul>
        </InfoBlock>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Correction and add-on rights</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">What you can correct or add</h2>
            </div>
            <PencilLine className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {[
              {
                title: "Evidence gaps",
                text: "Use CV Evidence to see proof areas such as missing metrics, ownership details, or stakeholder examples.",
                action: "Review CV Evidence",
                path: "/interviewee/cv-evidence",
              },
              {
                title: "Post-interview context",
                text: addendum
                  ? `Your addendum is ${addendum.status}; HR must acknowledge it before it is treated as reviewed context.`
                  : "After the interview round is complete, you can submit a clarification, correction, document note, or concise follow-up.",
                action: "Open Addendum",
                path: "/interviewee/addendum",
              },
            ].map(item => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setLocation(item.path)}>
                  {item.action}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Approval gates</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Actions that need human approval</h2>
            </div>
            <CalendarCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{approvals.length} approved external action{approvals.length === 1 ? "" : "s"}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Google Calendar / Meet scheduling and candidate follow-up only execute after HR approval.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-950">{pendingApprovals.length} approval pending</p>
                <p className="mt-1 text-sm leading-6 text-amber-900">No external calendar event, email draft, tracker update, or reminder should run without a human-approved payload.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Provider and automation receipts</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">What happened, and through what system</h2>
            </div>
            <ReceiptText className="h-5 w-5 text-slate-400" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Evidence analysis", detail: "Backend-mediated model or fixture synthesis; source fields stay labelled.", icon: Sparkles },
              { label: "Public research", detail: `${publicSources.length} Exa-backed or cached source cards shown when candidate-safe.`, icon: FileText },
              { label: "Calendar and Meet", detail: "Google Calendar / Meet action requires approval before event creation.", icon: CalendarCheck },
              { label: "Automation", detail: "Workato-style tracker/reminder actions are represented only as approved backend receipts in this demo.", icon: FileCheck2 },
            ].map(({ icon: Icon, label, detail }) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Icon className="mb-2 h-4 w-4 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
          {latestReceipt && (
            <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-950">
              Latest candidate-visible receipt: <span className="font-semibold">{latestReceipt.label}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Demo retention</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">How long demo data is kept</h2>
            </div>
            <Database className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              This hackathon demo uses seeded or fixture-safe workflow data unless the hosted backend is explicitly connected. Demo reset can return the workflow to its starting state for rehearsal.
            </p>
            <p>
              Do not upload private resumes, secrets, legal documents, or live sensitive records into the demo environment. Use sample documents or redacted notes.
            </p>
            <p>
              Candidate feedback is follow-up and practice feedback. sup'work is a transparency and coordination layer, not an automated hiring decision engine.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
