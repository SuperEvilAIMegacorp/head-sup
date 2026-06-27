import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LockKeyhole, Mail, RefreshCw, Search, Server, Video, Workflow, Zap } from "lucide-react";

interface ProviderStatusPanelProps {
  status: Record<string, unknown> | null;
  workflowProviderMode?: string;
}

const PROVIDERS = [
  { key: "model", label: "Model", icon: Server },
  { key: "exa", label: "Exa", icon: Search },
  { key: "googleCalendar", label: "Google Calendar", icon: Video },
  { key: "gmail", label: "Gmail", icon: Mail },
  { key: "workato", label: "Workato", icon: Zap },
  { key: "database", label: "Database", icon: Database },
  { key: "auth", label: "Auth", icon: LockKeyhole },
  { key: "storage", label: "Storage", icon: Workflow },
] as const;

export function ProviderStatusPanel({ status, workflowProviderMode }: ProviderStatusPanelProps) {
  const mode = stringValue(status?.mode) ?? workflowProviderMode ?? "fixture";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-slate-500" />
          Provider Status
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Runtime mode and integration readiness are shown without credentials, tokens, or webhook URLs.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-semibold text-slate-700">Workflow mode</span>
          <Badge className={modeClass(mode)}>{mode}</Badge>
          <span className="text-xs text-slate-500">Live means configured providers can execute after approval; fixture/mock stays local.</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PROVIDERS.map(({ key, label, icon: Icon }) => {
            const item = objectValue(status?.[key]);
            const provider = stringValue(item?.provider) ?? label;
            const readiness = stringValue(item?.status) ?? stringValue(item?.mode) ?? (item?.configured ? "ready" : "fixture");
            const configured = booleanValue(item?.configured);

            return (
              <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <Badge variant="outline" className={`rounded ${readinessClass(readiness, configured)}`}>
                    {readiness}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-950">{label}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{provider}</p>
                <p className="mt-2 text-xs font-medium text-slate-600">
                  {configured ? "Configured" : key === "workato" ? "Disabled for direct Google path" : "Fixture or demo mode"}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function modeClass(mode: string) {
  if (mode === "live") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (mode === "mock") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  return "bg-slate-100 text-slate-800 hover:bg-slate-100";
}

function readinessClass(readiness: string, configured: boolean) {
  if (readiness.includes("disabled")) return "border-slate-200 bg-slate-100 text-slate-600";
  if (configured || readiness === "ready" || readiness === "live") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (readiness === "demo" || readiness === "fixture" || readiness === "mock") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}
