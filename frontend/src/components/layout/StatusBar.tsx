import { useAuth } from '@/context/AuthContext';
import { useWorkflow } from '@/context/WorkflowContext';
import { Menu, Globe2, Video, Zap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

const STAGE_LABELS: Record<string, string> = {
  applied:             'Applied',
  evidence_review:     'Evidence Review',
  interview_scheduled: 'Interview Scheduled',
  interview_complete:  'Interview Complete',
  follow_up:           'Follow Up',
  closed:              'Closed',
};

const INTEGRATIONS = [
  { label: 'Exa',         icon: Globe2, color: 'bg-emerald-500' },
  { label: 'Google Meet', icon: Video,  color: 'bg-emerald-500' },
  { label: 'Workato',     icon: Zap,    color: 'bg-emerald-500' },
  { label: 'Gmail',       icon: Mail,   color: 'bg-emerald-500' },
];

export function StatusBar() {
  const { user } = useAuth();
  const { workflow } = useWorkflow();

  if (!user) return null;

  const stageLabel = STAGE_LABELS[workflow.stage] ?? workflow.stage;

  return (
    <header className="h-11 border-b border-border bg-card flex items-center px-4 sticky top-0 z-50 shrink-0 gap-4">

      {/* Mobile: hamburger + wordmark */}
      <div className="md:hidden flex items-center gap-2 shrink-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-56 border-r-0">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-foreground">sup'work</span>
      </div>

      {/* Center: job title + stage chip */}
      <div className="hidden md:flex flex-1 items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {workflow.jobTitle} - {workflow.company}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
          {stageLabel}
        </span>
      </div>

      {/* Right: mock mode + integrations + avatar */}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        {/* Mock mode */}
        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
          Provider: Fixture-safe
        </span>

        {/* Integration pills */}
        <div className="hidden md:flex items-center gap-1.5">
          {INTEGRATIONS.map(({ label, color }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 bg-white"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${color} inline-block`} />
              {label}
            </span>
          ))}
        </div>

        {/* User avatar */}
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: 'hsl(221 83% 53%)' }}
        >
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
