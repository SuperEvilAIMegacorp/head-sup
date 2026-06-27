import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Paperclip, Upload, Loader2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function PostInterviewAddendum() {
  const { interviewRounds, addenda, submitAddendum } = useWorkflow();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<string>("clarification");
  const [body, setBody] = useState("");
  const [sensitive, setSensitive] = useState(false);
  const [fakeFile, setFakeFile] = useState<boolean>(false);

  const isInterviewComplete = interviewRounds.some(r => r.status === 'complete');
  const existingAddendum = addenda[0];

  const canSubmit = isInterviewComplete;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Please provide a message body.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitAddendum({
        type: type as any,
        body,
        attachments: fakeFile ? [{ name: "deployment_metrics_note.pdf", size: "1.4 MB" }] : [],
        sensitive
      });
      toast.success("Addendum submitted successfully");
    } catch (error) {
      toast.error("Failed to submit addendum");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canSubmit) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Post-Interview Addendum</h1>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-16 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <Paperclip className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Available after the interview round opens</h3>
            <p className="text-muted-foreground max-w-md">
              The addendum window lets you share context, corrections, additional evidence, or a concise follow-up note before the hiring team finalizes next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingAddendum) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Post-Interview Addendum</h1>
        </div>

        <Card>
          <CardHeader className="border-b border-border bg-muted/10">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="capitalize">{existingAddendum.type.replace('_', ' ')}</span>
                  {existingAddendum.sensitive && (
                     <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 shadow-none">Voluntary sensitive context</Badge>
                  )}
                </CardTitle>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Candidate-supplied</Badge>
                 <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">Unvalidated</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="p-4 bg-muted/20 border border-border rounded-lg text-sm whitespace-pre-wrap">
              {existingAddendum.body}
            </div>
            
            {existingAddendum.attachments.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Attachments</p>
                <div className="flex flex-col gap-2">
                  {existingAddendum.attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-border bg-background w-fit">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm pt-4 border-t border-border">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground mr-2">Status</span>
              {existingAddendum.status === 'acknowledged' ? (
                <div className="flex items-center gap-1.5 text-green-700 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Acknowledged by {existingAddendum.acknowledgedBy} on {existingAddendum.acknowledgedAt?.substring(0,10)}
                </div>
              ) : (
                <span className="text-amber-600 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Awaiting HR acknowledgement
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Post-Interview Addendum</h1>
        <p className="text-muted-foreground">Add anything you want the hiring team to consider before they finalize next steps. This is reviewed by a human and is not an automatic decision override.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Type of Addendum</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 bg-muted/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clarification">Clarification</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="additional_document">Additional evidence or document</SelectItem>
                  <SelectItem value="special_consideration">Special Consideration</SelectItem>
                  <SelectItem value="follow_up_note">Follow-Up Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Message</Label>
              <Textarea 
                placeholder="Example: I want to clarify my answer about post-launch ownership. I owned monitoring dashboards for the rollout and met weekly with the customer success lead for the first month." 
                className="min-h-[160px] resize-none bg-muted/20 p-4"
                value={body}
                onChange={e => setBody(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Attachments</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setFakeFile(true)}
              >
                <Upload className="h-8 w-8 mb-3" />
                <span className="font-medium text-foreground">Click to attach a demo document</span>
                <span className="text-xs mt-1">PDF, DOCX, JPG, PNG (fixture upload for demo)</span>
              </div>
              
              {fakeFile && (
                <div className="flex items-center gap-3 p-3 mt-3 rounded-md border border-border bg-background w-fit">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">deployment_metrics_note.pdf</span>
                  <span className="text-xs text-muted-foreground">- 1.4 MB</span>
                </div>
              )}
            </div>

            <div className="flex items-start space-x-3 p-5 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/30">
              <Checkbox 
                id="sensitive" 
                checked={sensitive} 
                onCheckedChange={(checked) => setSensitive(checked as boolean)}
                className="mt-1 border-rose-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
              />
              <div className="space-y-1.5 leading-none">
                <Label htmlFor="sensitive" className="cursor-pointer font-semibold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Voluntary sensitive context
                </Label>
                <p className="text-sm text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
                  Check this only if you choose to include sensitive context. HR must handle it carefully and the system should not infer protected characteristics from it.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border p-6 flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Addendum
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
