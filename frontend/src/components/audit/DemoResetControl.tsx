import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface DemoResetControlProps {
  backendAvailable: boolean;
  lastResult?: string | null;
  onReset: () => Promise<void>;
  resetting: boolean;
}

export function DemoResetControl({ backendAvailable, lastResult, onReset, resetting }: DemoResetControlProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 8000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const handleClick = async () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    await onReset();
    setArmed(false);
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="text-sm font-bold text-amber-950">Demo reset</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Resets the shared seeded workflow for rehearsal. Login tokens stay valid, but generated schedule, addendum,
              feedback, trace, and audit state return to the clean demo baseline.
            </p>
            {lastResult && <p className="mt-2 text-xs font-semibold text-amber-950">{lastResult}</p>}
          </div>
        </div>
        <Button
          type="button"
          variant={armed ? "destructive" : "outline"}
          className={armed ? "" : "border-amber-300 bg-white text-amber-950"}
          disabled={!backendAvailable || resetting}
          onClick={handleClick}
        >
          <RotateCcw className={resetting ? "animate-spin" : ""} />
          {resetting ? "Resetting" : armed ? "Confirm reset" : "Reset demo"}
        </Button>
      </CardContent>
    </Card>
  );
}
