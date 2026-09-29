import React from 'react';
import {
  LayoutDashboard, Users, Layers, Calendar, Award, FolderGit2,
  CheckSquare, CheckCircle2, CalendarDays, Clock, Megaphone,
  DollarSign, Handshake, FileText, BarChart3,
  History, Settings, UserCheck, Sparkles,
  FileCheck, Trophy, X, ChevronRight, Terminal, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  params?: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const roleName = user?.role?.name || 'President';

  // Build role-tailored navigation without resources across all profiles
  const getNavSections = (): NavSection[] => {
    // 1. PRESIDENT UI
    if (roleName === 'President') {
      return [
        {
          title: 'Main',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'domains', label: 'Domains', icon: Layers },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'projects', label: 'Projects', icon: FolderGit2 },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'approvals', label: 'Approvals', icon: CheckCircle2, badge: 'Urgent' },
          ],
        },
        {
          title: 'Operations',
          items: [
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'meetings', label: 'Meetings', icon: Clock },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ],
        },
        {
          title: 'Management',
          items: [
            { id: 'finance', label: 'Finance', icon: DollarSign },
            { id: 'sponsors', label: 'Sponsors', icon: Handshake },
            { id: 'documents', label: 'Documents', icon: FileText },
          ],
        },
        {
          title: 'Insights',
          items: [
            { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
            { id: 'audit', label: 'Audit Logs', icon: History },
          ],
        },
        {
          title: 'System',
          items: [
            { id: 'profile', label: 'Settings', icon: Settings },
          ],
        },
      ];
    }

    // 2. VICE PRESIDENT UI
    if (roleName === 'Vice President') {
      return [
        {
          title: 'Operations Hub',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'domains', label: 'Domains', icon: Layers },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'projects', label: 'Projects', icon: FolderGit2 },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'approvals', label: 'Approvals', icon: CheckCircle2 },
          ],
        },
        {
          title: 'Execution & Coordination',
          items: [
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'meetings', label: 'Meetings', icon: Clock },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'activities', label: 'Domain Activities', icon: Sparkles },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
          ],
        },
        {
          title: 'System',
          items: [
            { id: 'profile', label: 'Settings', icon: Settings },
          ],
        },
      ];
    }

    // 3. DOMAIN HEAD UI
    if (roleName === 'Domain Head' || roleName === 'Technical Lead') {
      const domainName = user?.domain_name || 'My Domain';
      return [
        {
          title: domainName,
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'projects', label: 'Projects', icon: FolderGit2 },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'activities', label: 'Activities', icon: Sparkles },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ],
        },
        {
          title: 'Insights',
          items: [
            { id: 'reports', label: 'Domain Reports', icon: BarChart3 },
          ],
        },
        {
          title: 'Profile',
          items: [
            { id: 'profile', label: 'Settings', icon: Settings },
          ],
        },
      ];
    }

    // 4. MEMBER UI
    if (roleName === 'Member') {
      return [
        {
          title: 'My Workspace',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
            { id: 'projects', label: 'My Projects', icon: FolderGit2 },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ],
        },
        {
          title: 'My Activity',
          items: [
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'certificates', label: 'Certificates', icon: FileCheck },
          ],
        },
        {
          title: 'Profile',
          items: [
            { id: 'profile', label: 'My Profile', icon: UserCheck },
            { id: 'profile', label: 'Settings', icon: Settings, params: { tab: 'security' } },
          ],
        },
      ];
    }

    // 5. TREASURER UI
    if (roleName === 'Treasurer') {
      return [
        {
          title: 'Financial Management',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'finance', label: 'Finance & Ledger', icon: DollarSign },
            { id: 'sponsors', label: 'Sponsorships', icon: Handshake },
            { id: 'approvals', label: 'Budget Approvals', icon: CheckCircle2 },
            { id: 'documents', label: 'Invoices & Vault', icon: FileText },
            { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
            { id: 'notifications', label: 'Notifications', icon: Bell },
          ],
        },
        {
          title: 'System',
          items: [
            { id: 'profile', label: 'Settings', icon: Settings },
          ],
        },
      ];
    }

    // 6. FACULTY COORDINATOR UI
    if (roleName === 'Faculty Coordinator') {
      return [
        {
          title: 'Governance & Institutional',
          items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'approvals', label: 'Governance Approvals', icon: CheckCircle2 },
            { id: 'members', label: 'Students & Roster', icon: Users },
            { id: 'domains', label: 'Domain Oversight', icon: Layers },
            { id: 'events', label: 'Club Events', icon: Calendar },
            { id: 'meetings', label: 'Official Meetings', icon: Clock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'reports', label: 'Institutional Reports', icon: BarChart3 },
            { id: 'audit', label: 'Compliance Audit', icon: History },
          ],
        },
        {
          title: 'System',
          items: [
            { id: 'profile', label: 'Settings', icon: Settings },
          ],
        },
      ];
    }

    // Fallback standard navigation
    return [
      {
        title: 'Operations',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'projects', label: 'Projects', icon: FolderGit2 },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ],
      },
      {
        title: 'Account',
        items: [
          { id: 'profile', label: 'Profile', icon: Settings },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const handleItemClick = (id: string, params?: any) => {
    onNavigate(id, params);
    if (onCloseMobile) onCloseMobile();
  };

  const userInitial = user?.full_name?.trim() ? user.full_name.trim().charAt(0).toUpperCase() : 'U';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-700 flex items-center justify-center text-white shadow-sm shadow-amber-600/20 ring-1 ring-white/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                TECHNO CLUB
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100/80 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Operations & Management</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links with custom scrollbar */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navSections.map((section, idx) => (
          <div key={section.title || idx}>
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={`${section.title}-${item.label}-${item.id}`}
                    onClick={() => handleItemClick(item.id, item.params)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group select-none ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 text-white shadow-xs shadow-amber-600/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-700 dark:group-hover:text-amber-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Active Persona / Profile Footer Card */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
        <button
          onClick={() => handleItemClick('profile')}
          className="w-full flex items-center space-x-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700/50 hover:shadow-xs transition-all text-left group"
        >
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User'}
                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-700 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {userInitial}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
              {user?.full_name || 'Club Member'}
            </p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
              <span>{roleName}</span>
              {user?.domain_name && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">{user.domain_name.replace(/\s+domain$/i, '')}</span>
                </>
              )}
            </p>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar extending top-to-bottom of viewport */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
