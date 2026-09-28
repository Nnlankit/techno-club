import React from 'react';
import {
  LayoutDashboard, Users, Layers, Calendar, Award, FolderGit2,
  CheckSquare, Sparkles, CheckCircle2, Clock, QrCode, FileCheck,
  Trophy, Wrench, DollarSign, Handshake, FileText, BarChart3,
  History, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user, hasRole } = useAuth();
  const roleName = user?.role.name || 'Member';

  // Define nav items with role visibility
  const navSections = [
    {
      title: 'Operations Hub',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['All'] },
        { id: 'members', label: 'Member Directory', icon: Users, roles: ['President', 'Vice President', 'Domain Head', 'Faculty Coordinator', 'Treasurer'] },
        { id: 'domains', label: 'Domains & Hubs', icon: Layers, roles: ['President', 'Vice President', 'Domain Head', 'Member', 'Faculty Coordinator'] },
        { id: 'events', label: 'Events & Workshops', icon: Calendar, roles: ['All'] },
        { id: 'hackathons', label: 'Hackathon Engine', icon: Award, roles: ['All'] },
        { id: 'projects', label: 'Club Projects', icon: FolderGit2, roles: ['All'] },
        { id: 'tasks', label: 'Task Kanban', icon: CheckSquare, roles: ['All'] },
        { id: 'activities', label: 'Initiatives & Drives', icon: Sparkles, roles: ['President', 'Vice President', 'Domain Head', 'Faculty Coordinator'] },
      ]
    },
    {
      title: 'Governance & Approvals',
      items: [
        { id: 'approvals', label: 'Approval Workflow', icon: CheckCircle2, roles: ['President', 'Vice President', 'Domain Head', 'Treasurer', 'Faculty Coordinator'] },
        { id: 'attendance', label: 'Attendance & QR Scanner', icon: QrCode, roles: ['All'] },
        { id: 'meetings', label: 'Meetings & Minutes', icon: Clock, roles: ['President', 'Vice President', 'Domain Head', 'Faculty Coordinator', 'Treasurer'] },
        { id: 'certificates', label: 'Certificates & Verify', icon: FileCheck, roles: ['All'] },
        { id: 'achievements', label: 'Hall of Fame', icon: Trophy, roles: ['All'] },
      ]
    },
    {
      title: 'Resources & Corporate',
      items: [
        { id: 'resources', label: 'Hardware & Digital Inventory', icon: Wrench, roles: ['President', 'Vice President', 'Domain Head', 'Treasurer', 'Technical Lead'] },
        { id: 'finance', label: 'Finance & Expenses', icon: DollarSign, roles: ['President', 'Vice President', 'Treasurer', 'Faculty Coordinator'] },
        { id: 'sponsors', label: 'Sponsorship CRM', icon: Handshake, roles: ['President', 'Vice President', 'Treasurer'] },
        { id: 'documents', label: 'Document Vault', icon: FileText, roles: ['All'] },
      ]
    },
    {
      title: 'Intelligence & Audit',
      items: [
        { id: 'calendar', label: 'Unified Calendar', icon: Calendar, roles: ['All'] },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['President', 'Vice President', 'Domain Head', 'Treasurer', 'Faculty Coordinator'] },
        { id: 'audit', label: 'Immutable Audit Trail', icon: History, roles: ['President', 'Vice President', 'Faculty Coordinator'] },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-[calc(100vh-61px)] overflow-y-auto">
      <div className="p-4 space-y-6">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => {
            if (item.roles.includes('All')) return true;
            return item.roles.includes(roleName) || (user?.is_superuser);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title || idx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role footer badge */}
      <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">Active RBAC: <strong>{roleName}</strong></span>
        </div>
      </div>
    </aside>
  );
};
