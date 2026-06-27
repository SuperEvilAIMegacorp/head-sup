import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { EvidenceTrailMatrix } from "@/components/evidence/EvidenceTrailMatrix";
import { StatusChip } from "@/components/evidence/StatusChip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, EyeOff, CheckCircle2, Globe2, MessageSquare, ArrowRight, Loader2, UploadCloud } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CandidatePacket() {
  const { workflow, evidenceMappings, researchArtifacts, approvalRequests, addenda, interviewRounds, sourceArtifacts, uploadCvAnalysis } = useWorkflow();
  const [, setLocation] = useLocation();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  const gaps = evidenceMappings.filter(mapping => mapping.status === 'gap' || mapping.status === 'partial' || mapping.status === 'unclear');
  const visibleToCandidate = evidenceMappings.filter(mapping => mapping.visibility === 'candidate-visible');
  const pendingSchedule = approvalRequests.find(request => request.type === 'scheduling' && request.status === 'pending');
  const pendingAddendum = addenda.find(addendum => addendum.status === 'pending');
  const latestCv = sourceArtifacts.find(artifact => artifact.contentType === "application/pdf" || artifact.filename.toLowerCase().endsWith(".pdf"));
  const cvFilename = latestCv?.filename ?? `${workflow.candidateName.replace(/[^a-z0-9]+/gi, "_")}_CV.pdf`;

  const handleCvUpload = async () => {
    if (!cvFile) {
      toast.error("Choose a PDF CV first.");
      return;
    }
    setIsUploadingCv(true);
    try {
      await uploadCvAnalysis(cvFile, `${workflow.jobTitle}, ${workflow.company}, ${workflow.region}`);
      setCvFile(null);
      toast.success("CV parsed and evidence refreshed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse CV.");
    } finally {
      setIsUploadingCv(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-slate-200 bg-slate-50 p-5 lg:w-80 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-4 lg:flex-col lg:text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl font-bold text-white">
            {workflow.candidateName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">{workflow.candidateName}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 lg:justify-center">
              <Mail className="h-3.5 w-3.5" />
              {workflow.candidateEmail}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Applied</span>
            <span className="font-medium text-slate-800">{format(new Date(workflow.createdAt), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Role</span>
            <span className="text-right font-medium text-slate-800">{workflow.jobTitle}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Region</span>
            <span className="font-medium text-slate-800">{workflow.region}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Stage</span>
            <StatusChip status={workflow.stage === 'interview_scheduled' ? 'scheduled' : 'pending'} size="sm" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Button className="w-full justify-start gap-2 bg-slate-950 hover:bg-slate-800" onClick={() => setLocation('/hr/scheduling')} disabled={!pendingSchedule}>
            <Calendar className="h-4 w-4" />
            {pendingSchedule ? 'Approve schedule' : 'Schedule approved'}
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setLocation('/hr/research')}>
            <Globe2 className="h-4 w-4" />
            Open research
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setLocation('/hr/addendum')}>
            <MessageSquare className="h-4 w-4" />
            {pendingAddendum ? 'Review addendum' : 'Addendum review'}
          </Button>
        </div>
      </aside>

      <main className="flex-1 space-y-8 p-5 lg:p-8">
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Candidate packet</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Evidence-backed review surface</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Separate candidate evidence, public research, AI synthesis, human notes, and candidate-safe copy before approving any external action.
              </p>
            </div>
            <Badge variant="outline" className="w-fit bg-teal-50 text-teal-800 border-teal-200">
              {visibleToCandidate.length} candidate-visible evidence cards
            </Badge>
          </div>

          <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-bold text-teal-950">Live CV parsing</h2>
                <p className="mt-1 text-sm leading-6 text-teal-900">
                  Upload a PDF to replace the placeholder TalentFlow CV extract with backend-parsed evidence and source labels.
                </p>
                <p className="mt-1 text-xs text-teal-700">
                  Current source: {cvFilename}{latestCv?.parser ? ` via ${latestCv.parser}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="max-w-full rounded-md border border-teal-200 bg-white px-3 py-2 text-sm text-slate-700"
                  onChange={event => setCvFile(event.target.files?.[0] ?? null)}
                />
                <Button className="gap-2 bg-teal-700 hover:bg-teal-800" onClick={handleCvUpload} disabled={isUploadingCv}>
                  {isUploadingCv ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  Parse CV
                </Button>
              </div>
            </div>
          </div>

          <EvidenceTrailMatrix
            addenda={addenda}
            audience="hr"
            candidateName={workflow.candidateName}
            cvFilename={cvFilename}
            mappings={evidenceMappings}
            rounds={interviewRounds}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-bold text-amber-950">Evidence to validate in interview</h2>
            <div className="mt-4 space-y-3">
              {gaps.map(gap => (
                <div key={gap.id} className="rounded-lg border border-amber-200 bg-white p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{gap.requirement}</p>
                    <StatusChip status={gap.status} size="sm" />
                  </div>
                  <p className="text-xs leading-5 text-slate-600">{gap.whyItMatters}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <EyeOff className="h-5 w-5 text-slate-400" />
              Internal-only reviewer note
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Candidate has strong implementation evidence. Interview should validate customer deployment metrics, post-launch ownership, and stakeholder communication. Do not expose this private note to the candidate.
            </p>
            <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs font-medium leading-5 text-violet-900">
              Boundary: candidate can see evidence labels and source-backed prep themes, not private interviewer rationale.
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Candidate-visible summary</h2>
              <p className="mt-1 text-sm text-slate-500">This is the boundary of what {workflow.candidateName} can inspect from their account.</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setLocation('/hr/plan')}>
              Open interview plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">Evidence labels</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Covered, partial, gap, and unclear statuses are visible.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Globe2 className="mb-2 h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold text-slate-900">Public sources</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{researchArtifacts.length} source cards are available as role context.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Calendar className="mb-2 h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-900">Approval receipts</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">External actions show who approved them and what was sent.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
