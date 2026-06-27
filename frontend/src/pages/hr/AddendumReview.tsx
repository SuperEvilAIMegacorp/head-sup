import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function AddendumReview() {
  const { addenda, acknowledgeAddendum } = useWorkflow();
  const { user } = useAuth();
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [internalNote, setInternalNote] = useState("");

  const pendingAddendum = addenda[0];

  const handleAcknowledge = async () => {
    if (!pendingAddendum || !user) return;
    setIsAcknowledging(true);
    try {
      await acknowledgeAddendum(pendingAddendum.id, user.name, internalNote);
      toast.success("Addendum acknowledged successfully.");
    } catch (error) {
      toast.error("Failed to acknowledge addendum.");
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Addendum Review</h1>
        <p className="text-muted-foreground">Candidate-supplied post-interview context must be acknowledged before next-step generation.</p>
      </div>

      {!pendingAddendum ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <Paperclip className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-xl font-medium text-foreground mb-2">No addendum submitted yet</h3>
            <p>Candidates can submit addenda after their interview is complete.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {pendingAddendum.sensitive && (
            <div className="bg-red-500 text-white px-4 py-3 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Voluntary sensitive context - handle carefully and do not infer protected characteristics
            </div>
          )}
          
          <CardHeader className="bg-muted/10 border-b border-border pb-6">
            <div className="flex items-start justify-between">
               <div className="space-y-1.5">
                 <div className="flex items-center gap-3">
                   <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Candidate-supplied</Badge>
                   <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">Unvalidated</Badge>
                 </div>
                 <CardTitle className="text-xl capitalize mt-2">{pendingAddendum.type.replace('_', ' ')}</CardTitle>
                 <div className="text-sm text-muted-foreground">
                   Submitted {format(new Date(pendingAddendum.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                 </div>
               </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            <div>
              <div className="p-5 bg-card border rounded-lg text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                {pendingAddendum.body}
              </div>
            </div>

            {pendingAddendum.attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachments</h4>
                <div className="flex flex-col gap-2">
                  {pendingAddendum.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors w-fit">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium leading-none">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingAddendum.reviewNote && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Persisted HR Review Note</h4>
                <div className="p-4 bg-muted/20 border border-border rounded-lg text-sm whitespace-pre-wrap">
                  {pendingAddendum.reviewNote}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Internal Assessment</h4>
              <Textarea 
                placeholder="Add internal note (not visible to candidate)" 
                className="bg-muted/10 min-h-[100px] border-border"
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                disabled={pendingAddendum.status === 'acknowledged'}
              />
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/20 border-t border-border p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            {pendingAddendum.status === 'acknowledged' ? (
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Acknowledged by {pendingAddendum.acknowledgedBy}
                <span className="text-muted-foreground font-normal ml-1">on {format(new Date(pendingAddendum.acknowledgedAt!), "MMM d")}</span>
                <span className="text-muted-foreground font-normal ml-2">- Candidate has been notified</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Acknowledgement confirms a human reviewed the candidate-supplied context. It does not verify the content or change the workflow automatically.
              </div>
            )}
            
            {!pendingAddendum.status || pendingAddendum.status === 'pending' ? (
               <Button 
                 onClick={handleAcknowledge} 
                 disabled={isAcknowledging}
                 className="w-full sm:w-auto"
               >
                 {isAcknowledging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Acknowledge Addendum
               </Button>
            ) : null}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
