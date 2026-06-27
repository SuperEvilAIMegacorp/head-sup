import { ResearchArtifact } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SourceCard({ artifact }: { artifact: ResearchArtifact }) {
  return (
    <Card className="hover:border-primary/50 transition-colors bg-card">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-start justify-between space-y-0 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
            <a href={artifact.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1.5">
              {artifact.title}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-mono tracking-wide">{artifact.source}</Badge>
            <span className="font-mono text-[10px] truncate max-w-[200px]">{artifact.url}</span>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 font-normal text-[10px] flex items-center gap-1 bg-muted/30">
          <Clock className="h-3 w-3" />
          {artifact.freshness}
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-sm text-muted-foreground leading-snug">
          "{artifact.snippet}"
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-[10px]">
            {artifact.candidateSafe ? 'candidate-safe context' : 'recruiter context'}
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">
            public source
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
