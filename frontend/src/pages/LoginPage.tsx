import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Loader2, UserCircle, Briefcase, ArrowRight, FileText, ScanSearch,
  Globe2, MessagesSquare, CalendarCheck, Paperclip, ShieldCheck,
  CheckCircle2, AlertTriangle
} from 'lucide-react';

const DEMO_ACCOUNTS = {
  interviewee: {
    email: 'interviewee@demo.supwork.local',
    label: 'Interviewee account',
    name: 'Maya Tan',
    lands: '/interviewee',
    description: 'Evidence, schedule, addendum, feedback, and receipts.',
  },
  hr: {
    email: 'hr@demo.supwork.local',
    label: 'HR account',
    name: 'Alex Lee',
    lands: '/hr',
    description: 'Pipeline, candidate packet, approvals, addendum review, and audit.',
  },
} as const;

const JOURNEY = [
  { label: 'CV evidence', icon: ScanSearch, state: 'complete' },
  { label: 'Role brief', icon: Globe2, state: 'complete' },
  { label: 'Interview plan', icon: MessagesSquare, state: 'complete' },
  { label: 'Schedule approval', icon: CalendarCheck, state: 'active' },
  { label: 'Addendum window', icon: Paperclip, state: 'pending' },
  { label: 'Feedback release', icon: ShieldCheck, state: 'pending' },
];

type DemoRole = keyof typeof DEMO_ACCOUNTS;

function JourneyStatus({ state }: { state: string }) {
  if (state === 'complete') {
    return <span className="text-[10px] font-semibold text-emerald-300">Complete</span>;
  }
  if (state === 'active') {
    return <span className="text-[10px] font-semibold text-amber-300">Needs approval</span>;
  }
  return <span className="text-[10px] font-semibold text-white/35">Pending</span>;
}

export default function LoginPage() {
  const [email, setEmail] = useState<string>(DEMO_ACCOUNTS.interviewee.email);
  const [password, setPassword] = useState('demo');
  const [isLoading, setIsLoading] = useState<DemoRole | 'form' | null>(null);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const routeForEmail = (value: string) => value.toLowerCase().includes('hr@') ? '/hr' : '/interviewee';

  const handleDemoLogin = async (role: DemoRole) => {
    setError('');
    setIsLoading(role);
    try {
      await login(DEMO_ACCOUNTS[role].email, 'demo');
      setLocation(DEMO_ACCOUNTS[role].lands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading('form');
    try {
      await login(email.trim(), password);
      setLocation(routeForEmail(email));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Use one of the demo accounts with password demo.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 font-bold">S</div>
              <div>
                <div className="text-base font-semibold tracking-tight">sup'work</div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Live demo workspace</div>
              </div>
            </div>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/60 sm:inline-flex">
              Fixture-safe backend mode
            </span>
          </div>

          <div className="my-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Two accounts, one shared workflow
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Humane hiring transparency for candidate and HR.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              The candidate sees what was analyzed, what is visible to HR, what needs approval, and what they can add. HR sees source-backed evidence, approval cards, addendum review, and audit receipts.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Shared demo journey</p>
                <p className="mt-1 text-sm font-semibold text-white">Maya Tan - AI Solutions Engineer at Example AI</p>
              </div>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                schedule pending approval
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {JOURNEY.map(({ label, icon: Icon, state }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-900/80 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/8">
                      <Icon className="h-4 w-4 text-teal-200" />
                    </div>
                    <JourneyStatus state={state} />
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-sky-300/15 bg-sky-300/10 p-3 text-xs leading-5 text-sky-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              No AI decisioning is shown here. Scheduling, feedback release, and external communication stay human-approved.
            </div>
          </div>

          <p className="mt-8 text-[11px] text-white/35">
            Synthetic demo data only. Provider calls are routed through the backend contract when live mode is enabled.
          </p>
        </section>

        <section className="flex items-center justify-center bg-slate-50 px-6 py-10 text-slate-950 sm:px-8 lg:px-12">
          <div className="w-full max-w-md space-y-7">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Sign in</p>
              <h2 className="text-2xl font-bold tracking-tight">Open a demo account</h2>
              <p className="text-sm leading-6 text-slate-500">
                Use password <span className="font-mono font-semibold text-slate-700">demo</span>. Each account lands on the right workspace for a two-laptop walkthrough.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="h-10 border-slate-200 text-sm"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="h-10 border-slate-200 text-sm"
                  data-testid="input-password"
                />
              </div>
              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="h-10 w-full gap-2 bg-slate-950 text-sm hover:bg-slate-800" disabled={isLoading !== null}>
                {isLoading === 'form' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Sign in to role workspace
              </Button>
            </form>

            <div className="space-y-3">
              {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map(role => {
                const account = DEMO_ACCOUNTS[role];
                const Icon = role === 'interviewee' ? UserCircle : Briefcase;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleDemoLogin(role)}
                    disabled={isLoading !== null}
                    className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40"
                    data-testid={`button-demo-${role}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-700">
                        {isLoading === role ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-900">{account.label}</p>
                          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-700" />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{account.name} - {account.description}</p>
                        <p className="mt-2 truncate font-mono text-[11px] text-slate-400">{account.email}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <FileText className="mb-2 h-4 w-4 text-slate-400" />
                <p className="font-semibold text-slate-800">Candidate-visible</p>
                <p className="mt-1 leading-5 text-slate-500">Evidence, sources, receipts, and next actions.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-slate-400" />
                <p className="font-semibold text-slate-800">Approval-gated</p>
                <p className="mt-1 leading-5 text-slate-500">Calendar, feedback, and follow-up require HR action.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
