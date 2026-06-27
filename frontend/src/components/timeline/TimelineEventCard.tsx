import { TimelineEvent } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function TimelineEventCard({ event }: { event: TimelineEvent }) {
  return (
    <div className="flex gap-4 py-3 group">
      <div className="flex flex-col items-center mt-1.5 shrink-0">
        <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
        <div className="w-[1px] h-full bg-border mt-2 group-last:hidden" />
      </div>
      <div className="flex flex-col gap-1 pb-2 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-foreground">{event.label}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(event.timestamp), "MMM d, h:mm a")}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 font-normal">
            {event.actor}
          </Badge>
          {event.candidateVisible && (
            <Badge variant="outline" className="text-[10px] px-1.5 font-normal border-green-200 text-green-700 bg-green-50">
              Visible to Candidate
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
