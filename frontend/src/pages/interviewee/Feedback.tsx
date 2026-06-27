import { useEffect, useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { useAuth } from "@/context/AuthContext";
import { getCandidateWorkflow } from "@/api/supworkClient";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, Clock, Paperclip, FileText, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Feedback() {
  const { accessToken, backendAvailable } = useAuth();
  const { addenda, evidenceMappings, researchArtifacts, timelineEvents } = useWorkflow();
  const [releasedFeedback, setReleasedFeedback] = useState<{ body: string; status: string; subject?: string } | null>(null);
  const [feedbackSyncError, setFeedbackSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!backendAvailable || !accessToken) {
      setReleasedFeedback(null);
      setFeedbackSyncError(null);
      return;
    }

    let cancelled = false;
    const token = accessToken;
    async function loadReleasedFeedback() {
      try {
        const view = await getCandidateWorkflow(token, "wf_demo");
        if (cancelled) return;
        const feedback = view.feedback;
        if (feedback?.body && isReleasedFeedbackStatus(feedback.status)) {
          setReleasedFeedback({
            body: feedback.body,
            status: feedback.status,
            subject: feedback.subject,
          });
        } else {
          setReleasedFeedback(null);
        }
        setFeedbackSyncError(null);
      } catch (error) {
        if (!cancelled) {
          setFeedbackSyncError(error instanceof Error ? error.message : "Unable to sync feedback.");
        }
      }
    }

    void loadReleasedFeedback();
    return () => {
      cancelled = true;
    };
  }, [accessToken, backendAvailable]);

  const followUpApproved = timelineEvents.some(event => event.type === 'follow_up_sent' || event.type === 'gmail.draft.created' || event.type === 'gmail.message.sent');
  const addendum = addenda[0];
  const visibleEvidence = evidenceMappings.filter(mapping => mapping.visibility === 'candidate-visible');
  const visibleSources = researchArtifacts.filter(source => source.candidateSafe !== false);
  const canShowReleasedBody = Boolean(releasedFeedback?.body);
  const showReleasedState = followUpApproved || canShowReleasedBody;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Candidate feedback</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Approved, candidate-safe feedback</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Feedback appears here only after HR reviews the draft, checks visibility, and approves release. Internal notes and raw deliberation are not shown.
        </p>
      </section>

      {!showReleasedState ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Clock className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-950">Feedback is not released yet</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              The hiring team may prepare a draft after interview notes and any addendum are reviewed. You will see only approved, candidate-safe content.
            </p>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">Visibility check pending</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Blocks internal notes, protected-characteristic references, and unsupported claims.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <Paperclip className="mb-2 h-4 w-4 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">Addendum status</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {addendum ? `Submitted and ${addendum.status === 'acknowledged' ? 'acknowledged' : 'awaiting HR acknowledgement'}.` : 'No addendum submitted yet.'}
                </p>
              </div>
            </div>
            {feedbackSyncError && (
              <p className="mt-5 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                Backend feedback sync is unavailable right now, so this page is showing fixture-safe status only.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            HR approved this candidate-safe feedback for release.
          </div>

          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Released feedback</h2>
                  {releasedFeedback?.subject && (
                    <p className="mt-1 text-sm text-slate-500">{releasedFeedback.subject}</p>
                  )}
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {releasedFeedback?.status === "sent" ? "Sent" : "Approved"}
                </Badge>
              </div>

              {canShowReleasedBody ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Approved message</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {releasedFeedback?.body}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-bold text-amber-950">Approved status received; message body not synced</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    The workflow shows that HR approved a candidate-safe follow-up, but this frontend session does not yet have the approved backend body. It will appear here after the candidate workflow includes `feedback.body`.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <FileText className="mb-3 h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold text-slate-900">Materials considered</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {visibleEvidence.length} candidate-visible evidence items, {visibleSources.length} public source cards, interview notes, and addendum status where available.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Paperclip className="mb-3 h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold text-slate-900">Addendum boundary</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {addendum ? `Your addendum is ${addendum.status}. Sensitive context is handled as restricted review material.` : "No addendum was included in this feedback cycle."}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <ReceiptText className="mb-3 h-4 w-4 text-teal-700" />
              <p className="text-sm font-semibold text-slate-900">Safety boundary</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                This is follow-up and practice feedback. It is not an automated hiring decision or guarantee of outcome.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function isReleasedFeedbackStatus(status: string | undefined) {
  return status === "draft_created" || status === "sent" || status === "released" || status === "approved";
}
