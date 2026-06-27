import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock3, Lock, Radio } from "lucide-react";

export type RoundRailState = "done" | "current" | "upcoming" | "blocked";

export interface RoundRailItem {
  label: string;
  description: string;
  state: RoundRailState;
  meta?: string;
}

const stateStyles: Record<RoundRailState, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  current: "border-teal-200 bg-teal-50 text-teal-900",
  upcoming: "border-slate-200 bg-white text-slate-600",
  blocked: "border-amber-200 bg-amber-50 text-amber-900",
};

const icons = {
  done: CheckCircle2,
  current: Radio,
  upcoming: Circle,
  blocked: Lock,
};

export function RoundStatusRail({ items }: { items: RoundRailItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {items.map((item, index) => {
        const Icon = icons[item.state];
        return (
          <div key={item.label} className={`rounded-lg border p-3 ${stateStyles[item.state]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-[0.14em]">R{index + 1}</span>
              </div>
              {item.meta ? (
                <Badge variant="outline" className="h-5 bg-white/70 px-1.5 text-[10px] font-semibold">
                  {item.meta}
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-3 text-sm font-bold leading-5">{item.label}</h3>
            <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export function RoundStateBadge({ state }: { state: RoundRailState }) {
  const Icon = state === "done" ? CheckCircle2 : state === "current" ? Clock3 : state === "blocked" ? Lock : Circle;
  const label = state === "done" ? "Complete" : state === "current" ? "Current" : state === "blocked" ? "Waiting" : "Upcoming";
  return (
    <Badge variant="outline" className={`${stateStyles[state]} gap-1.5`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
