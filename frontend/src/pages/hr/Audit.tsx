import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  LogIn, FileCheck, Search, Calendar, FileText, Check, Zap, Video, Activity 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Audit() {
  const { auditEvents } = useWorkflow();
  const [filter, setFilter] = useState("all");

  const getEventIcon = (type: string) => {
    if (type.includes('login')) return <LogIn className="h-4 w-4" />;
    if (type.includes('mapped')) return <FileCheck className="h-4 w-4" />;
    if (type.includes('search')) return <Search className="h-4 w-4" />;
    if (type.includes('approval')) return <Check className="h-4 w-4" />;
    if (type.includes('meet')) return <Video className="h-4 w-4" />;
    if (type.includes('submitted')) return <FileText className="h-4 w-4" />;
    if (type.includes('acknowledged')) return <Check className="h-4 w-4" />;
    if (type.includes('workato')) return <Zap className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getEventColor = (type: string) => {
    if (type.includes('auth')) return 'bg-slate-100 text-slate-700';
    if (type.includes('exa') || type.includes('workato') || type.includes('google')) return 'bg-blue-100 text-blue-700';
    if (type.includes('candidate')) return 'bg-amber-100 text-amber-700';
    if (type.includes('approval')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-violet-100 text-violet-700';
  };

  // Sort newest first
  const sortedEvents = [...auditEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const filteredEvents = filter === "all" ? sortedEvents : sortedEvents.filter(e => e.eventType.startsWith(filter));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Immutable record of system events, actions, and third-party API calls.</p>
        </div>
        <div className="w-[180px]">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="candidate">Candidate Actions</SelectItem>
              <SelectItem value="approval">Approvals</SelectItem>
              <SelectItem value="exa">Integrations (Exa)</SelectItem>
              <SelectItem value="google">Integrations (Google)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredEvents.map(event => (
              <div key={event.id} className="p-5 flex gap-4 hover:bg-muted/30 transition-colors bg-card">
                <div className="shrink-0 mt-1">
                  {getEventIcon(event.eventType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <Badge variant="secondary" className={`text-[10px] font-mono uppercase tracking-wider rounded px-1.5 shadow-none ${getEventColor(event.eventType)}`}>
                      {event.eventType}
                    </Badge>
                    <span className="font-bold text-sm text-foreground">{event.actor}</span>
                    <span className="text-xs text-muted-foreground sm:ml-auto">
                      {format(new Date(event.timestamp), "MMM d, yyyy - h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{event.summary}</p>
                  
                  {event.provider && (
                    <div className="mt-3 inline-flex items-center gap-1.5 border border-border bg-muted/50 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
                      Provider: <span className="text-foreground">{event.provider}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
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
