import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';
import {
  Globe2, CalendarCheck, LayoutDashboard,
  ScanSearch, MessagesSquare, Paperclip, Send,
  FolderOpen, ShieldCheck, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const isHR = user.role === 'hr';
  const root  = isHR ? '/hr' : '/interviewee';

  const intervieweeLinks = [
    { href: '/interviewee',             label: 'Home',           icon: LayoutDashboard },
    { href: '/interviewee/cv-evidence', label: 'CV Evidence',    icon: ScanSearch      },
    { href: '/interviewee/role-brief',  label: 'Role Brief',     icon: Globe2          },
    { href: '/interviewee/prep',        label: 'Interview Prep', icon: MessagesSquare  },
    { href: '/interviewee/schedule',    label: 'Schedule',       icon: CalendarCheck   },
    { href: '/interviewee/addendum',    label: 'Addendum',       icon: Paperclip       },
    { href: '/interviewee/feedback',    label: 'Feedback',       icon: Send            },
  ];

  const hrLinks = [
    { href: '/hr',            label: 'Pipeline',         icon: LayoutDashboard },
    { href: '/hr/packet',     label: 'Candidate Packet', icon: FolderOpen      },
    { href: '/hr/research',   label: 'Research',         icon: Globe2          },
    { href: '/hr/plan',       label: 'Interview Plan',   icon: MessagesSquare  },
    { href: '/hr/scheduling', label: 'Scheduling',       icon: CalendarCheck   },
    { href: '/hr/addendum',   label: 'Addendum Review',  icon: Paperclip       },
    { href: '/hr/follow-up',  label: 'Follow-Up',        icon: Send            },
    { href: '/hr/audit',      label: 'Audit Log',        icon: ShieldCheck     },
  ];

  const links = isHR ? hrLinks : intervieweeLinks;

  return (
    <div
      className={cn(
        "shrink-0 select-none",
        mobile ? "flex h-full w-56 flex-col" : "hidden h-screen w-[155px] flex-col md:flex sticky top-0"
      )}
      style={{ background: 'hsl(222 47% 10%)', borderRight: '1px solid hsl(222 47% 16%)' }}
    >
      {/* Logo */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div
          className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'hsl(185 85% 32%)' }}
        >
          <span className="text-white font-bold text-[10px]">S</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">sup'work</span>
      </div>

      {/* Role label */}
      <div className="px-4 pb-2">
        <p
          className="text-[9px] font-bold tracking-[0.14em] uppercase"
          style={{ color: 'hsl(216 20% 40%)' }}
        >
          {isHR ? 'HR Workspace' : 'Interviewee'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-1 space-y-0.5">
        {links.map((link) => {
          const active =
            location === link.href ||
            (link.href !== root && location.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href} className="block">
              <div
                className={cn(
                  'flex items-center gap-2 px-2.5 py-[7px] rounded-md text-[12px] font-medium transition-colors cursor-pointer',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/65 hover:bg-white/5'
                )}
              >
                <link.icon
                  className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-blue-400' : 'opacity-70')}
                />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div
        className="px-3 py-3"
        style={{ borderTop: '1px solid hsl(222 47% 16%)' }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: 'hsl(221 83% 45%)' }}
          >
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white/80 truncate leading-tight">{user.name}</p>
            <p className="text-[9px] truncate leading-tight" style={{ color: 'hsl(216 20% 38%)' }}>
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            setLocation('/');
          }}
          className="flex items-center gap-1.5 text-[11px] font-medium transition-colors w-full text-left"
          style={{ color: 'hsl(216 20% 38%)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'hsl(216 20% 60%)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'hsl(216 20% 38%)')}
        >
          <LogOut className="h-3 w-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
