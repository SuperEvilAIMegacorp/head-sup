import { useWorkflow } from "@/context/WorkflowContext";
import { useAuth } from "@/context/AuthContext";
import { 
  FileText, ScanSearch, Globe2, MessagesSquare, 
  CalendarCheck, CheckCircle2, Paperclip, Send 
} from "lucide-react";

interface HiringJourneyProps {
  role: 'interviewee' | 'hr';
  compact?: boolean;
}

const STAGES = [
  { id: 'intake',        label: 'Intake',              icon: FileText,       hrDesc: 'Candidate packet created',         candidateDesc: 'CV received, role selected'        },
  { id: 'evidence',      label: 'Evidence',             icon: ScanSearch,     hrDesc: 'Full evidence map & gaps',         candidateDesc: 'Requirements mapped to your CV'    },
  { id: 'research',      label: 'Research Ready',       icon: Globe2,         hrDesc: 'Exa research with sources',        candidateDesc: 'Candidate-safe role brief ready'   },
  { id: 'planning',      label: 'Interview Planning',   icon: MessagesSquare, hrDesc: 'Questions & rationale generated',  candidateDesc: 'Prep themes ready'                 },
  { id: 'scheduled',     label: 'Interview Scheduled',  icon: CalendarCheck,  hrDesc: 'Approval & Calendar metadata',     candidateDesc: 'Time, timezone & Meet link'        },
  { id: 'complete',      label: 'Interview Complete',   icon: CheckCircle2,   hrDesc: 'Notes & transcript area',          candidateDesc: 'Addendum window open'              },
  { id: 'addendum',      label: 'Addendum Review',      icon: Paperclip,      hrDesc: 'Addendum review card',             candidateDesc: 'Submitted clarification/context'   },
  { id: 'followup',      label: 'Follow-Up',            icon: Send,           hrDesc: 'Gmail/Workato approval + receipt', candidateDesc: 'Approved next-step message'        },
];

function getStageIndex(stageId: string): number {
  switch (stageId) {
    case 'applied': return 0;
    case 'evidence_review': return 1;
    case 'interview_scheduled': return 4;
    case 'interview_complete': return 5;
    case 'follow_up': return 7;
    case 'closed': return 8; // Past the end
    default: return 0;
  }
}

export function HiringJourney({ role, compact = false }: HiringJourneyProps) {
  const { workflow } = useWorkflow();
  const currentIndex = getStageIndex(workflow.stage);

  return (
    <div className={`w-full ${compact ? 'overflow-x-auto py-2' : 'overflow-x-auto py-4'}`}>
      <div className="flex items-start min-w-max px-2">
        {STAGES.map((stage, i) => {
          const isComplete = i < currentIndex;
          const isActive = i === currentIndex;
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.id} className="flex items-start flex-1 min-w-[120px]">
              <div className="flex flex-col items-center w-full relative">
                {/* Node */}
                <div className="relative z-10 flex items-center justify-center">
                  {isComplete && (
                    <div className={`${compact ? 'h-6 w-6' : 'h-10 w-10'} rounded-full bg-primary flex items-center justify-center shadow-sm`}>
                      <stage.icon className={`${compact ? 'h-3 w-3' : 'h-5 w-5'} text-primary-foreground`} />
                    </div>
                  )}
                  {isActive && (
                    <div className={`${compact ? 'h-6 w-6' : 'h-10 w-10'} rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center shadow-sm ring-4 ring-primary/15`}>
                      <stage.icon className={`${compact ? 'h-3 w-3' : 'h-5 w-5'} text-primary`} />
                    </div>
                  )}
                  {!isComplete && !isActive && (
                    <div className={`${compact ? 'h-6 w-6' : 'h-10 w-10'} rounded-full border-2 border-border bg-muted/40 flex items-center justify-center`}>
                      <stage.icon className={`${compact ? 'h-3 w-3' : 'h-5 w-5'} text-muted-foreground/40`} />
                    </div>
                  )}

                  {/* Active pulse ring */}
                  {isActive && !compact && (
                    <span className="absolute inline-flex h-10 w-10 rounded-full bg-primary/20 animate-ping opacity-40" />
                  )}
                </div>

                {/* Label */}
                <div className={`mt-2 text-center px-1 max-w-[140px] ${compact ? 'mt-1.5' : 'mt-3'}`}>
                  <p className={`font-semibold leading-tight ${compact ? 'text-[10px]' : 'text-xs'} ${
                    isComplete ? "text-primary" :
                    isActive ? "text-foreground" :
                    "text-muted-foreground"
                  }`}>
                    {stage.label}
                  </p>
                  {!compact && (
                    <p className={`text-[10px] leading-tight mt-1 ${
                      isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                    }`}>
                      {role === 'hr' ? stage.hrDesc : stage.candidateDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={`flex items-center w-full px-1 shrink-0 absolute ${compact ? 'mt-3' : 'mt-5'} left-[50%] -z-0`}>
                  <div className={`h-[2px] w-full transition-colors ${
                    isComplete ? "bg-primary" : "bg-border"
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
