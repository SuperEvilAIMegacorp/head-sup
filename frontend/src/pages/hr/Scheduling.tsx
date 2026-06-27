import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, Video, CheckCircle2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Scheduling() {
  const { approvalRequests, approveScheduling } = useWorkflow();
  const [isApproving, setIsApproving] = useState(false);

  const pendingRequest = approvalRequests.find(r => r.type === 'scheduling');

  const handleApprove = async () => {
    if (!pendingRequest) return;
    setIsApproving(true);
    try {
      await approveScheduling(pendingRequest.id);
      toast.success("Interview scheduled successfully.");
    } catch (error) {
      toast.error("Failed to schedule interview.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Scheduling Approvals</h1>
        <p className="text-muted-foreground">Review the exact candidate-facing payload before the backend creates a Google Calendar event with a Meet link.</p>
      </div>

      {!pendingRequest ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <Calendar className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-foreground mb-1">No approvals pending</h3>
            <p>You're all caught up.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className={`overflow-hidden transition-all ${pendingRequest.status === 'approved' ? 'border-green-200' : 'border-blue-200 shadow-md'}`}>
          <CardHeader className={`pb-6 border-b border-border ${pendingRequest.status === 'approved' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                   {pendingRequest.status === 'approved' ? (
                     <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-transparent shadow-none gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Scheduled
                     </Badge>
                   ) : (
                     <Badge className="bg-blue-500 text-white hover:bg-blue-600 shadow-none border-transparent animate-pulse">Needs Approval</Badge>
                   )}
                </div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Customer AI deployment interview
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground font-medium">Proposed schedule for {pendingRequest.candidateEmail}</CardDescription>
              </div>
              <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center border border-border shrink-0 shadow-sm">
                <Video className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-muted/50 rounded flex items-center justify-center shrink-0">
                     <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Date</p>
                    <p className="font-bold text-lg">{format(new Date(pendingRequest.dateTime), "EEEE, MMMM do, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-muted/50 rounded flex items-center justify-center shrink-0">
                     <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Time</p>
                    <div className="flex items-baseline gap-2">
                       <p className="font-bold text-lg">{format(new Date(pendingRequest.dateTime), "h:mm a")}</p>
                       <span className="text-sm text-muted-foreground">({pendingRequest.duration} mins)</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{pendingRequest.timezone}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6 md:border-l md:border-border md:pl-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Candidate-facing attendees</p>
                  <p className="font-medium text-base">{pendingRequest.interviewerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Candidate-facing description</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    First-round conversation about customer AI deployment, evaluation habits, and post-launch ownership. Internal notes are excluded.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Integration Provider</p>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit bg-muted/30 font-mono text-xs font-medium py-1 px-2.5">
                       <Video className="h-3 w-3 mr-1.5 text-blue-500" /> Google Meet
                    </Badge>
                    <Badge variant="outline" className="w-fit bg-muted/30 font-mono text-xs font-medium py-1 px-2.5">
                       <CalendarDays className="h-3 w-3 mr-1.5 text-blue-500" /> Google Calendar
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {pendingRequest.status === 'approved' && pendingRequest.googleMeetLink && (
              <div className="mt-8 p-5 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-800 dark:text-green-300 block mb-1">Meeting Link</span>
                    <a href={pendingRequest.googleMeetLink} className="font-medium text-green-700 hover:underline flex items-center gap-1.5">
                       <Video className="h-4 w-4" /> {pendingRequest.googleMeetLink}
                    </a>
                  </div>
                  <div className="text-xs text-green-700/70 dark:text-green-400/70 font-mono bg-background px-3 py-1.5 rounded-md border border-green-200">
                    Event ID: {pendingRequest.googleCalendarEventId}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-muted/10 border-t border-border p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            {pendingRequest.status === 'approved' ? (
               <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Added to audit log and sent to candidate
               </p>
            ) : (
               <p className="text-sm text-muted-foreground">
                  Approving sends this approved payload to the backend integration route. Internal-only fields stay excluded.
               </p>
            )}
            <Button 
              onClick={handleApprove} 
              disabled={isApproving || pendingRequest.status !== 'pending'}
              className="w-full sm:w-auto min-w-[200px] h-12 text-base"
              size="lg"
            >
              {isApproving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {!isApproving && pendingRequest.status === 'pending' ? 'Approve & Schedule' : ''}
              {!isApproving && pendingRequest.status === 'approved' ? <><CheckCircle2 className="mr-2 h-5 w-5" /> Scheduled</> : ''}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
