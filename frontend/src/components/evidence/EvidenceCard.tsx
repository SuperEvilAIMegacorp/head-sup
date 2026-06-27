import { EvidenceMapping } from "@/types";
import { StatusChip } from "./StatusChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceCardProps {
  mapping: EvidenceMapping;
  isHRView?: boolean;
}

export function EvidenceCard({ mapping, isHRView = false }: EvidenceCardProps) {
  const Icon = {
    covered: CheckCircle2,
    partial: AlertTriangle,
    gap: XCircle,
    unclear: HelpCircle,
  }[mapping.status];

  const iconColors = {
    covered: "text-green-600 dark:text-green-400",
    partial: "text-amber-600 dark:text-amber-400",
    gap: "text-red-600 dark:text-red-400",
    unclear: "text-gray-500 dark:text-gray-400",
  }[mapping.status];

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-md",
      mapping.visibility === 'internal' && !isHRView ? "hidden" : ""
    )}>
      <div className="flex flex-col sm:flex-row border-b border-border bg-muted/30 px-4 py-3 sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", iconColors)} />
          <h3 className="font-semibold text-foreground">{mapping.requirement}</h3>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip status={mapping.status} />
          {isHRView && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
              {mapping.visibility === 'internal' ? (
                <><EyeOff className="h-3.5 w-3.5" /> Internal only</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> Candidate visible</>
              )}
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-4 space-y-4 bg-background">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Evidence Found</h4>
              <p className="text-sm">{mapping.evidence || "No relevant evidence located in provided materials."}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Why It Matters</h4>
              <p className="text-sm text-muted-foreground">{mapping.whyItMatters}</p>
            </div>
          </div>
          
          <div className="p-4 bg-primary/5 dark:bg-primary/10">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">What To Add</h4>
            <p className="text-sm text-foreground/90 font-medium">{mapping.whatToAdd}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
