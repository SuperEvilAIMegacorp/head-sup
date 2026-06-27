import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = 'covered' | 'partial' | 'gap' | 'unclear' | 'pending' | 'approved' | 'scheduled' | 'internal' | 'candidate-visible';

interface StatusChipProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusChip({ status, className, size = 'md' }: StatusChipProps) {
  // emerald = covered, amber = partial, rose = gap, slate = unclear, blue = approved/primary, violet = internal
  const variants: Record<StatusType, string> = {
    covered: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
    partial: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
    gap: "bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200",
    unclear: "bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200",
    pending: "bg-sky-100 text-sky-800 hover:bg-sky-100 border-sky-200",
    approved: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
    scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
    internal: "bg-violet-100 text-violet-800 hover:bg-violet-100 border-violet-200",
    'candidate-visible': "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  };

  const labels: Record<StatusType, string> = {
    covered: "Covered",
    partial: "Partial",
    gap: "Gap",
    unclear: "Unclear",
    pending: "Pending",
    approved: "Approved",
    scheduled: "Scheduled",
    internal: "Internal Only",
    'candidate-visible': "Candidate-Visible",
  };

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge variant="outline" className={cn("font-medium shadow-none whitespace-nowrap", variants[status], sizeClasses[size], className)}>
      {labels[status]}
    </Badge>
  );
}
