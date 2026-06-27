import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { SourceCard } from "@/components/research/SourceCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe2, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Research() {
  const { researchArtifacts, runExaResearch } = useWorkflow();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const companyResearch = researchArtifacts.filter(a => a.type === 'company');
  const marketResearch = researchArtifacts.filter(a => a.type === 'role-market');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await runExaResearch();
      toast.success("Research refreshed from backend fixture");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Source-Backed Research</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
            <Clock className="h-4 w-4" />
            Backend-mediated Exa context - {companyResearch.length > 0 && companyResearch[0].freshness === 'just now' ? 'refreshed just now' : 'cached fixture sources'}
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-primary hover:bg-primary/90">
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe2 className="mr-2 h-4 w-4" />}
          Refresh research
        </Button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="market">Role-Market</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-6">
          {isRefreshing ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Skeleton className="h-[140px] w-full rounded-xl" />
               <Skeleton className="h-[140px] w-full rounded-xl" />
               <Skeleton className="h-[140px] w-full rounded-xl" />
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {companyResearch.map(artifact => (
                 <SourceCard key={artifact.id} artifact={artifact} />
               ))}
               {companyResearch.length === 0 && (
                 <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-lg">
                   No company research artifacts available. Refresh research to load source cards.
                 </div>
               )}
             </div>
          )}
        </TabsContent>
        
        <TabsContent value="market" className="space-y-6">
          {isRefreshing ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Skeleton className="h-[140px] w-full rounded-xl" />
               <Skeleton className="h-[140px] w-full rounded-xl" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketResearch.map(artifact => (
                <SourceCard key={artifact.id} artifact={artifact} />
              ))}
              {marketResearch.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-lg">
                  No market research artifacts available. Refresh research to load source cards.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
