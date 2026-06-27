import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Bot, CheckCircle2, ExternalLink, RefreshCw, Route, Wrench } from "lucide-react";

export interface AgentTracePayload {
  workflowId?: string;
  agentRuns?: AgentRun[];
  approvals?: TraceApproval[];
  integrationEvents?: IntegrationEvent[];
  auditEvents?: TraceAuditEvent[];
}

interface AgentRun {
  id?: string;
  traceId?: string;
  agentName?: string;
  operation?: string;
  mode?: string;
  provider?: string;
  inputSummary?: unknown;
  outputSummary?: unknown;
  status?: string;
  humanApprovalStatus?: string;
  relatedApprovalId?: string;
  relatedToolCallId?: string;
  createdAt?: string;
}

interface TraceApproval {
  id?: string;
  actionType?: string;
  provider?: string;
  status?: string;
  createdAt?: string;
}

interface IntegrationEvent {
  id?: string;
  provider?: string;
  operation?: string;
  externalId?: string | null;
  status?: string;
  traceId?: string | null;
  createdAt?: string;
}

interface TraceAuditEvent {
  id?: string;
  eventType?: string;
  summary?: string;
  traceId?: string | null;
  createdAt?: string;
}

interface AgentTracePanelProps {
  error?: string | null;
  loading: boolean;
  onRefresh: () => void;
  trace: AgentTracePayload | null;
}

export function AgentTracePanel({ error, loading, onRefresh, trace }: AgentTracePanelProps) {
  const runs = [...(trace?.agentRuns ?? [])].sort((a, b) => dateMs(b.createdAt) - dateMs(a.createdAt));
  const approvals = trace?.approvals ?? [];
  const integrationEvents = trace?.integrationEvents ?? [];
  const auditEvents = trace?.auditEvents ?? [];

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-slate-500" />
            Agent Trace
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            AI runs, generated summaries, approval links, and provider/tool receipts for this workflow.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh trace
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-4">
          <TraceCount label="Agent runs" value={runs.length} />
          <TraceCount label="Approvals" value={approvals.length} />
          <TraceCount label="Tool receipts" value={integrationEvents.length} />
          <TraceCount label="Audit events" value={auditEvents.length} />
        </div>

        {runs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground">
            No agent trace has been recorded yet. Generate evidence, research, questions, or follow-up to create trace rows.
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run, index) => {
              const traceId = run.traceId;
              const relatedTools = integrationEvents.filter(event => traceId && event.traceId === traceId);
              const relatedAudit = auditEvents.filter(event => traceId && event.traceId === traceId);
              const relatedApprovals = approvals.filter(approval => approval.id === run.relatedApprovalId);
              const operation = run.operation ?? run.mode ?? run.agentName ?? "agent.run";

              return (
                <article key={run.id ?? traceId ?? index} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded bg-slate-50 font-mono text-[10px] uppercase tracking-wider">
                          {operation}
                        </Badge>
                        <Badge className={statusClass(run.status)} variant="secondary">
                          {run.status ?? "recorded"}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-950">{run.agentName ?? "sup'work agent"}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{summaryText(run.inputSummary)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {run.createdAt ? format(new Date(run.createdAt), "MMM d, h:mm a") : "time unavailable"}
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 md:grid-cols-3">
                    <TraceField label="Provider" value={run.provider ?? "fixture"} />
                    <TraceField label="Mode" value={run.mode ?? run.operation ?? "generated"} />
                    <TraceField label="Trace ID" value={traceId ?? "not linked"} monospace />
                  </dl>

                  <div className="mt-4 rounded-md bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Output summary</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{summaryText(run.outputSummary)}</p>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    <RelatedHint icon={CheckCircle2} label="Related approvals" value={relatedApprovals.length || approvalHintCount(approvals, operation)} />
                    <RelatedHint icon={Wrench} label="Related tools" value={relatedTools.length} />
                    <RelatedHint icon={Route} label="Trace audit events" value={relatedAudit.length} />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {integrationEvents.length > 0 && (
          <div className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 p-3 text-sm font-semibold text-slate-950">Provider/tool receipts</div>
            <div className="divide-y divide-slate-100">
              {integrationEvents.slice(0, 5).map((event, index) => (
                <div key={event.id ?? index} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_1fr_auto] md:items-center">
                  <span className="font-medium text-slate-800">{event.provider ?? "provider"} / {event.operation ?? "operation"}</span>
                  <span className="font-mono text-xs text-slate-500">{event.externalId ?? event.traceId ?? "no external id"}</span>
                  <Badge variant="outline" className="w-fit rounded bg-slate-50">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    {event.status ?? "recorded"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TraceCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-2xl font-bold text-slate-950">{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function TraceField({ label, monospace = false, value }: { label: string; monospace?: boolean; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className={`mt-1 truncate text-sm font-semibold text-slate-800 ${monospace ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function RelatedHint({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-slate-600">{label}</span>
      <span className="ml-auto font-bold text-slate-950">{value}</span>
    </div>
  );
}

function approvalHintCount(approvals: TraceApproval[], operation: string) {
  if (operation.includes("feedback")) return approvals.filter(approval => approval.actionType?.includes("gmail")).length;
  if (operation.includes("schedule")) return approvals.filter(approval => approval.actionType?.includes("schedule")).length;
  return 0;
}

function statusClass(status?: string) {
  if (status === "completed" || status === "succeeded") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (status === "failed" || status === "blocked") return "bg-rose-100 text-rose-800 hover:bg-rose-100";
  return "bg-blue-100 text-blue-800 hover:bg-blue-100";
}

function summaryText(value: unknown) {
  if (value === null || value === undefined || value === "") return "No summary provided.";
  if (typeof value === "string") return redact(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isSensitiveKey(key))
      .slice(0, 5)
      .map(([key, item]) => `${humanize(key)}: ${compactValue(item)}`);
    return entries.length ? entries.join("; ") : "Structured output recorded.";
  }
  return "Summary unavailable.";
}

function compactValue(value: unknown) {
  if (value === null || value === undefined) return "none";
  if (typeof value === "string") return redact(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return "structured";
  return "value";
}

function redact(value: string) {
  return value.replace(/(token|secret|password|api[_-]?key)\s*[:=]\s*[^,\s;]+/gi, "$1: [redacted]");
}

function isSensitiveKey(key: string) {
  return /token|secret|password|api[_-]?key|authorization/i.test(key);
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll(".", " ");
}

function dateMs(value?: string) {
  return value ? new Date(value).getTime() : 0;
}
