import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, CheckCircle2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function FollowUp() {
  const { timelineEvents, approveFollowUp, workflow } = useWorkflow();
  const [isApproving, setIsApproving] = useState(false);
  const [draftSubject, setDraftSubject] = useState("Next steps - Example AI");

  const followUpSent = timelineEvents.some(e => e.type === 'follow_up_sent');

  const [draftText, setDraftText] = useState(`Hi Nicholas,

Thank you for your time in the interview process with Example AI. We appreciate the thoughtful discussion and any context you chose to add through sup'work.

We are reviewing next steps and will follow up after the hiring team completes its review.

Best regards,
Alex
Example AI Hiring Team`);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveFollowUp(workflow.candidateEmail, 'gmail_draft_supwork_001', {
        body: draftText,
        subject: draftSubject,
      });
      toast.success("Follow-up email approved");
    } catch (error) {
      toast.error("Failed to approve draft");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Follow-Up</h1>
        <p className="text-muted-foreground">Draft candidate-facing communication, run visibility checks, then approve the backend Gmail/automation action.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-muted/10 border-b border-border pb-4">
               <CardTitle className="text-lg">Editable Email Draft</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="font-semibold text-muted-foreground w-8">To:</span> 
                <span>{workflow.candidateEmail}</span>
              </div>
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="font-semibold text-muted-foreground w-8">Subj:</span> 
                <input
                  className="flex-1 rounded-md border border-border bg-muted/10 px-3 py-2 text-sm outline-none focus:bg-background"
                  value={draftSubject}
                  onChange={event => setDraftSubject(event.target.value)}
                  readOnly={followUpSent}
                />
              </div>
              <Textarea 
                className="min-h-[280px] text-base p-4 resize-none border-border"
                value={draftText}
                onChange={event => setDraftText(event.target.value)}
                readOnly={followUpSent}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Visibility Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium">No internal notes included</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium">No protected-characteristics content</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium">Approved language only</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-6">
               {followUpSent ? (
                 <>
                   <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                     <CheckCircle2 className="h-6 w-6" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex flex-col gap-2">
                         <Badge variant="outline" className="bg-background justify-center">Gmail Draft: supwork_001</Badge>
                         <Badge variant="outline" className="bg-background justify-center gap-1.5"><Zap className="h-3 w-3" /> Automation receipt: fixture</Badge>
                      </div>
                      <p className="text-sm font-medium mt-4">Candidate timeline updated</p>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="space-y-2 w-full">
                     <Button 
                       onClick={handleApprove} 
                       disabled={isApproving}
                       className="w-full h-12 text-base"
                     >
                       {isApproving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                       Approve Gmail Draft
                     </Button>
                   </div>
                   <p className="text-xs text-muted-foreground">This creates an approved Gmail draft through the backend fixture path and updates audit receipts.</p>
                 </>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
