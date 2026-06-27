import { useCallback, useEffect, useMemo, useState } from "react";
import { getAgentTrace, getProviderStatus, resetDemo } from "@/api/supworkClient";
import { AgentTracePanel, type AgentTracePayload } from "@/components/audit/AgentTracePanel";
import { DemoResetControl } from "@/components/audit/DemoResetControl";
import { ProviderStatusPanel } from "@/components/audit/ProviderStatusPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { format } from "date-fns";
import { Activity, Bot, Calendar, Check, FileCheck, FileText, LogIn, RefreshCw, Search, ShieldCheck, Video, Zap } from "lucide-react";

type AuditFilter = "all" | "agent" | "approval" | "provider" | "candidate" | "workflow";

export default function Audit() {
  const { accessToken, backendAvailable } = useAuth();
  const { auditEvents, refreshWorkflow, syncState, workflow } = useWorkflow();
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [trace, setTrace] = useState<AgentTracePayload | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, unknown> | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const loadTrace = useCallback(async () => {
    if (!backendAvailable || !accessToken) {
      setTrace(null);
      setTraceError("Agent trace is available after HR logs in through the backend.");
      return;
    }
    setTraceLoading(true);
    setTraceError(null);
    try {
      setTrace(await getAgentTrace(accessToken, workflow.id) as AgentTracePayload);
    } catch (error) {
      setTrace(null);
      setTraceError(error instanceof Error ? error.message : "Could not load agent trace.");
    } finally {
      setTraceLoading(false);
    }
  }, [accessToken, backendAvailable, workflow.id]);

  const loadProviderStatus = useCallback(async () => {
    try {
      setProviderStatus(await getProviderStatus());
    } catch {
      setProviderStatus(null);
    }
  }, []);

  useEffect(() => {
    void loadTrace();
    void loadProviderStatus();
  }, [loadProviderStatus, loadTrace]);

  const handleReset = async () => {
    if (!accessToken) return;
    setResetting(true);
    setResetResult(null);
    try {
      const result = await resetDemo(accessToken);
      await refreshWorkflow();
      await Promise.all([loadTrace(), loadProviderStatus()]);
      const ids = Array.isArray(result.workflowIds) ? result.workflowIds.join(", ") : workflow.id;
      setResetResult(`Reset complete. Workflow baseline: ${ids}.`);
    } catch (error) {
      setResetResult(error instanceof Error ? error.message : "Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const sortedEvents = useMemo(
    () => [...auditEvents].sort((a, b) => dateMs(b.timestamp) - dateMs(a.timestamp)),
    [auditEvents],
  );
  const filteredEvents = filter === "all" ? sortedEvents : sortedEvents.filter(event => eventGroup(event.eventType) === filter);
  const groupCounts = useMemo(() => ({
    agent: sortedEvents.filter(event => eventGroup(event.eventType) === "agent").length,
    approval: sortedEvents.filter(event => eventGroup(event.eventType) === "approval").length,
    provider: sortedEvents.filter(event => eventGroup(event.eventType) === "provider").length,
    candidate: sortedEvents.filter(event => eventGroup(event.eventType) === "candidate").length,
  }), [sortedEvents]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">HR audit</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Audit, Trace, And Provider Status</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Show what AI generated, what HR approved, which provider executed, and whether the current demo is live, fixture, or mock-backed.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Badge variant="outline" className="w-fit rounded bg-slate-50">
            Data: {syncState.dataSource}
          </Badge>
          <Badge variant="outline" className="w-fit rounded bg-slate-50">
            Provider: {workflow.providerMode ?? "fixture"}
          </Badge>
        </div>
      </div>

      <DemoResetControl
        backendAvailable={backendAvailable && Boolean(accessToken)}
        lastResult={resetResult}
        onReset={handleReset}
        resetting={resetting}
      />

      <ProviderStatusPanel status={providerStatus} workflowProviderMode={workflow.providerMode} />

      <AgentTracePanel
        error={traceError}
        loading={traceLoading}
        onRefresh={loadTrace}
        trace={trace}
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <EventCount label="AI runs" value={groupCounts.agent} tone="bg-blue-50 text-blue-800 border-blue-200" />
        <EventCount label="Human approvals" value={groupCounts.approval} tone="bg-emerald-50 text-emerald-800 border-emerald-200" />
        <EventCount label="Provider/tool events" value={groupCounts.provider} tone="bg-teal-50 text-teal-800 border-teal-200" />
        <EventCount label="Candidate actions" value={groupCounts.candidate} tone="bg-amber-50 text-amber-800 border-amber-200" />
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Audit events</h2>
              <p className="text-sm text-muted-foreground">Grouped by AI run, human approval, provider/tool, candidate action, or workflow event.</p>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={filter} onValueChange={(value) => setFilter(value as AuditFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  <SelectItem value="agent">AI runs</SelectItem>
                  <SelectItem value="approval">Human approvals</SelectItem>
                  <SelectItem value="provider">Provider/tool calls</SelectItem>
                  <SelectItem value="candidate">Candidate actions</SelectItem>
                  <SelectItem value="workflow">Workflow events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="divide-y divide-border">
            {filteredEvents.map(event => {
              const group = eventGroup(event.eventType);
              const Icon = eventIcon(event.eventType);
              return (
                <div key={event.id} className="flex gap-4 bg-card p-5 transition-colors hover:bg-muted/30">
                  <div className="mt-1 shrink-0">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Badge variant="secondary" className={`rounded px-1.5 font-mono text-[10px] uppercase tracking-wider shadow-none ${eventColor(group)}`}>
                        {groupLabel(group)}
                      </Badge>
                      <span className="break-all font-mono text-xs text-muted-foreground">{event.eventType}</span>
                      <span className="text-sm font-bold text-foreground sm:ml-auto">{event.actor}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{event.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="rounded bg-slate-50">
                        {safeDateLabel(event.timestamp)}
                      </Badge>
                      {event.provider && (
                        <Badge variant="outline" className="rounded bg-slate-50">
                          Provider: {event.provider}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                No audit events match the selected filter.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EventCount({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-semibold">{label}</div>
    </div>
  );
}

function eventGroup(type: string): AuditFilter {
  if (type.startsWith("agent.")) return "agent";
  if (type.startsWith("approval.")) return "approval";
  if (type.startsWith("candidate.")) return "candidate";
  if (
    type.startsWith("exa.") ||
    type.startsWith("google_") ||
    type.startsWith("gmail.") ||
    type.startsWith("workato.") ||
    type.includes("provider") ||
    type.includes("integration")
  ) return "provider";
  return "workflow";
}

function groupLabel(group: AuditFilter) {
  const labels: Record<AuditFilter, string> = {
    agent: "AI run",
    all: "All",
    approval: "Human approval",
    candidate: "Candidate action",
    provider: "Provider/tool",
    workflow: "Workflow",
  };
  return labels[group];
}

function eventIcon(type: string) {
  if (type.includes("login")) return LogIn;
  if (type.startsWith("agent.")) return Bot;
  if (type.includes("mapped")) return FileCheck;
  if (type.includes("search") || type.includes("research")) return Search;
  if (type.includes("approval")) return Check;
  if (type.includes("meet") || type.includes("calendar")) return Video;
  if (type.includes("submitted") || type.includes("addendum")) return FileText;
  if (type.includes("workato") || type.includes("gmail")) return Zap;
  if (type.includes("schedule")) return Calendar;
  if (type.includes("candidate")) return ShieldCheck;
  return Activity;
}

function eventColor(group: AuditFilter) {
  if (group === "agent") return "bg-blue-100 text-blue-700";
  if (group === "approval") return "bg-emerald-100 text-emerald-700";
  if (group === "provider") return "bg-teal-100 text-teal-700";
  if (group === "candidate") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function safeDateLabel(value: string) {
  const ms = dateMs(value);
  return ms ? format(new Date(ms), "MMM d, yyyy - h:mm a") : "time unavailable";
}

function dateMs(value: string) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}
