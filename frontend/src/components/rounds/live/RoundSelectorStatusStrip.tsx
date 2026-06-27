import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Lock,
  type LucideIcon,
  Radio,
  ShieldAlert,
} from "lucide-react";

export type LiveRoundStatus = "complete" | "active" | "scheduled" | "waiting" | "locked" | "needs_action";

export interface LiveRoundSelectorItem {
  id: string;
  roundNumber: 1 | 2 | 3;
  title: string;
  description?: string;
  status: LiveRoundStatus;
  statusLabel?: string;
  meta?: string;
  disabled?: boolean;
}

export interface RoundSelectorStatusStripProps {
  rounds: LiveRoundSelectorItem[];
  activeRoundId?: string;
  onSelectRound?: (roundId: string) => void;
  className?: string;
}

const statusMeta: Record<
  LiveRoundStatus,
  { label: string; icon: LucideIcon; className: string; badgeClassName: string }
> = {
  complete: {
    label: "Complete",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    badgeClassName: "border-emerald-200 bg-white/75 text-emerald-800",
  },
  active: {
    label: "Live",
    icon: Radio,
    className: "border-teal-200 bg-teal-50 text-teal-950",
    badgeClassName: "border-teal-200 bg-white/75 text-teal-800",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock3,
    className: "border-sky-200 bg-sky-50 text-sky-950",
    badgeClassName: "border-sky-200 bg-white/75 text-sky-800",
  },
  waiting: {
    label: "Waiting",
    icon: Circle,
    className: "border-slate-200 bg-white text-slate-700",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-600",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    className: "border-slate-200 bg-slate-50 text-slate-500",
    badgeClassName: "border-slate-200 bg-white text-slate-500",
  },
  needs_action: {
    label: "Needs action",
    icon: ShieldAlert,
    className: "border-amber-200 bg-amber-50 text-amber-950",
    badgeClassName: "border-amber-200 bg-white/75 text-amber-800",
  },
};

export function RoundSelectorStatusStrip({
  rounds,
  activeRoundId,
  onSelectRound,
  className,
}: RoundSelectorStatusStripProps) {
  return (
    <div className={["grid gap-3 md:grid-cols-3", className].filter(Boolean).join(" ")}>
      {rounds.map((round) => {
        const meta = statusMeta[round.status];
        const Icon = meta.icon;
        const isActive = activeRoundId === round.id;
        const isDisabled = round.disabled || round.status === "locked";

        return (
          <Button
            key={round.id}
            type="button"
            variant="ghost"
            disabled={isDisabled}
            aria-pressed={isActive}
            onClick={() => onSelectRound?.(round.id)}
            className={[
              "h-auto min-h-0 justify-start rounded-lg border p-4 text-left shadow-none",
              "whitespace-normal transition-colors",
              meta.className,
              isActive ? "ring-2 ring-teal-500 ring-offset-2" : "",
              isDisabled ? "opacity-70" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="w-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">R{round.roundNumber}</span>
                </div>
                <Badge variant="outline" className={["shrink-0 gap-1.5", meta.badgeClassName].join(" ")}>
                  {round.statusLabel ?? meta.label}
                </Badge>
              </div>
              <div className="mt-3 space-y-1">
                <h3 className="text-sm font-bold leading-5">{round.title}</h3>
                {round.description ? <p className="text-xs leading-5 opacity-80">{round.description}</p> : null}
                {round.meta ? <p className="text-xs font-medium opacity-70">{round.meta}</p> : null}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
