import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { WorkflowProvider } from "@/context/WorkflowContext";
import { AppShell } from "@/components/layout/AppShell";
import NotFound from "@/pages/not-found";

import LoginPage from "@/pages/LoginPage";
import IntHome from "@/pages/interviewee/Home";
import IntCVEvidence from "@/pages/interviewee/CVEvidence";
import IntRoleBrief from "@/pages/interviewee/RoleBrief";
import IntInterviewPrep from "@/pages/interviewee/InterviewPrep";
import IntSchedule from "@/pages/interviewee/Schedule";
import IntAddendum from "@/pages/interviewee/PostInterviewAddendum";
import IntFeedback from "@/pages/interviewee/Feedback";
import IntDataConsent from "@/pages/interviewee/DataConsent";
import HRPipeline from "@/pages/hr/Pipeline";
import HRCandidatePacket from "@/pages/hr/CandidatePacket";
import HRResearch from "@/pages/hr/Research";
import HRInterviewPlan from "@/pages/hr/InterviewPlan";
import HRScheduling from "@/pages/hr/Scheduling";
import HRAddendumReview from "@/pages/hr/AddendumReview";
import HRFollowUp from "@/pages/hr/FollowUp";
import HRAudit from "@/pages/hr/Audit";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />

      <Route path="/interviewee">
        <AppShell><IntHome /></AppShell>
      </Route>
      <Route path="/interviewee/cv-evidence">
        <AppShell><IntCVEvidence /></AppShell>
      </Route>
      <Route path="/interviewee/role-brief">
        <AppShell><IntRoleBrief /></AppShell>
      </Route>
      <Route path="/interviewee/prep">
        <AppShell><IntInterviewPrep /></AppShell>
      </Route>
      <Route path="/interviewee/schedule">
        <AppShell><IntSchedule /></AppShell>
      </Route>
      <Route path="/interviewee/addendum">
        <AppShell><IntAddendum /></AppShell>
      </Route>
      <Route path="/interviewee/feedback">
        <AppShell><IntFeedback /></AppShell>
      </Route>
      <Route path="/interviewee/data-consent">
        <AppShell><IntDataConsent /></AppShell>
      </Route>

      <Route path="/hr">
        <AppShell><HRPipeline /></AppShell>
      </Route>
      <Route path="/hr/packet">
        <AppShell><HRCandidatePacket /></AppShell>
      </Route>
      <Route path="/hr/research">
        <AppShell><HRResearch /></AppShell>
      </Route>
      <Route path="/hr/plan">
        <AppShell><HRInterviewPlan /></AppShell>
      </Route>
      <Route path="/hr/scheduling">
        <AppShell><HRScheduling /></AppShell>
      </Route>
      <Route path="/hr/addendum">
        <AppShell><HRAddendumReview /></AppShell>
      </Route>
      <Route path="/hr/follow-up">
        <AppShell><HRFollowUp /></AppShell>
      </Route>
      <Route path="/hr/audit">
        <AppShell><HRAudit /></AppShell>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WorkflowProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </WorkflowProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
