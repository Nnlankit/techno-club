import React, { useState, useEffect } from 'react';
import {
  Users, Layers, Calendar, Award, FolderGit2, CheckSquare,
  CheckCircle2, DollarSign, Handshake, AlertCircle, ArrowUpRight,
  TrendingUp, Clock, Plus, ShieldCheck, ChevronRight, Cpu, Key,
  Wrench, FileText, Download, Filter, ExternalLink, BarChart3,
  Shield, Building2, Sparkles, Check, X, Laptop, BookOpen, Megaphone,
  CheckCircle, ArrowRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  DashboardStats, MemberDashboardStats, DomainDashboardStats, ApprovalProposal, 
  Domain, Project, Task, Expense, Sponsor, Event, Activity, Announcement
} from '../types';
import { 
  Card, Badge, Button, Input, Select, Modal, 
  ProgressBar, Tabs, EmptyState, LoadingState 
} from '../components/ui';
import { WelcomeBanner } from '../components/WelcomeBanner';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const roleName = user?.role.name || 'President';

  // Core Data States
  const [execStats, setExecStats] = useState<DashboardStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberDashboardStats | null>(null);
  const [domainStats, setDomainStats] = useState<DomainDashboardStats | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalProposal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  // Member Tasks tab state
  const [memberTaskTab, setMemberTaskTab] = useState<'all' | 'todo' | 'progress' | 'done'>('all');

  // Quick Action Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState('Workshop');
  const [newEventVenue, setNewEventVenue] = useState('Auditorium B');
  const [newEventDesc, setNewEventDesc] = useState('');

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalType, setProposalType] = useState('Event');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalBudget, setProposalBudget] = useState(500);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const role = user?.role.name || 'President';
      const isLeadership = role === 'President' || role === 'Vice President' || role === 'Faculty Coordinator' || role === 'Treasurer';
      const isDomainHead = role === 'Domain Head' || role === 'Technical Lead';

      const [
        eStats, mStats, dStats, domData, projData, taskData,
        evData, actData, annData, appData, expData, sponData
      ] = await Promise.all([
        isLeadership ? api.reports.getExecutive().catch(() => null) : Promise.resolve(null),
        (role === 'Member' || isDomainHead) ? api.reports.getMemberDashboard().catch(() => null) : Promise.resolve(null),
        isDomainHead ? api.reports.getDomainDashboard(user?.domain_id).catch(() => null) : Promise.resolve(null),
        api.domains.list().catch(() => []),
        api.projects.list().catch(() => []),
        api.tasks.list().catch(() => []),
        api.events.list().catch(() => []),
        api.activities.list().catch(() => []),
        api.announcements.list().catch(() => []),
        (isLeadership || isDomainHead) ? api.approvals.list().catch(() => []) : Promise.resolve([]),
        (role === 'President' || role === 'Treasurer') ? api.finance.getExpenses().catch(() => []) : Promise.resolve([]),
        (role === 'President' || role === 'Treasurer' || role === 'Vice President') ? api.sponsors.list().catch(() => []) : Promise.resolve([])
      ]);

      setExecStats(eStats);
      setMemberStats(mStats);
      setDomainStats(dStats);
      setDomains(domData);
      setProjects(projData);
      setTasks(taskData);
      setEvents(evData);
      setActivities(actData);
      setAnnouncements(annData);
      setPendingApprovals(appData.filter((a: ApprovalProposal) => a.status === 'Under Review' || a.status === 'Submitted'));
      setExpenses(expData);
      setSponsors(sponData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const handleQuickCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

      await api.events.create({
        name: newEventName,
        event_type: newEventType,
        description: newEventDesc || 'Planned technical club session.',
        venue: newEventVenue,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'Registration Open',
        budget: 5000
      });
      setShowEventModal(false);
      setNewEventName('');
      setNewEventDesc('');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleQuickSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.approvals.submit({
        title: proposalTitle,
        proposal_type: proposalType,
        description: proposalDesc,
        requested_budget: Number(proposalBudget),
        priority: 'High'
      });
      setShowProposalModal(false);
      setProposalTitle('');
      setProposalDesc('');
      setProposalBudget(500);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit proposal');
    }
  };

  const handleApproveProposal = async (id: number) => {
    try {
      await api.approvals.executeAction(id, 'Approve', 'Approved via Executive Dashboard quick action');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve proposal');
    }
  };

  if (loading) {
    return <LoadingState message="Loading dashboard data..." type="cards" count={4} />;
  }

  // Active domain object for Domain Head (strictly locked to assigned domain)
  const currentDomain = domains.find(d => d.id === user?.domain_id) || domains[0];
  const domainProjects = projects.filter(p => p.domain_id === currentDomain?.id);
  const domainTasks = tasks.filter(t => t.domain_id === currentDomain?.id);
  const domainEvents = events.filter(e => e.domain_id === currentDomain?.id);
  const domainActivities = activities.filter(a => a.domain_id === currentDomain?.id);
  const domainAnnouncements = announcements.filter(a => !a.domain_id || a.domain_id === currentDomain?.id);

  // Blocked tasks count across club
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const pendingClaims = expenses.filter(e => e.status === 'Pending');
  const pendingClaimsSum = pendingClaims.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. PRESIDENT DASHBOARD (Section 3: Executive Overview)                     */}
      {/* ========================================================================= */}
      {roleName === 'President' && execStats && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner />

          {/* Primary Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              hoverable
              onClick={() => onNavigate('members')}
              icon={Users}
              title="Active Technologists"
              subtitle={`${execStats.total_domains} technical domains`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.active_members} <span className="text-sm font-normal text-slate-400">/ {execStats.total_members}</span>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('projects')}
              icon={FolderGit2}
              title="Active Projects"
              subtitle={`${execStats.completed_projects} delivered to production`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.active_projects}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('events')}
              icon={Calendar}
              title="Flagships & Events"
              subtitle={`${execStats.upcoming_events} scheduled club events`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.upcoming_events}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('approvals')}
              icon={CheckCircle2}
              badge={pendingApprovals.length > 0 ? `${pendingApprovals.length} Urgent` : 'Clear'}
              badgeVariant={pendingApprovals.length > 0 ? 'rose' : 'emerald'}
              title="Pending Approvals"
              subtitle={`${execStats.pending_tasks} open Kanban tasks`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {pendingApprovals.length}
              </div>
            </Card>
          </div>

          {/* Financial Pool Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sanctioned Budget Pool</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹{execStats.total_allocated_budget.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Approved by Executive Council & Dean</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Disbursed Expenses</span>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                ₹{execStats.total_spent_budget.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Reimbursed with invoices & audit logs</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Confirmed Sponsorships</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{execStats.confirmed_sponsorship.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">From Industry Partners & Executed MOUs</p>
            </div>
          </div>

          {/* 2-Column: Executive Approvals Queue & Domain Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pending Approvals (Section 3 & 18) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Pending Sanction Queue</h3>
                  <p className="text-xs text-slate-500">Proposals requiring presidential sign-off</p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigate('approvals')}
                >
                  View All ({pendingApprovals.length})
                </Button>
              </div>

              <div className="space-y-3">
                {pendingApprovals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No proposals currently pending your review. Executive queue is all clear!
                  </div>
                ) : (
                  pendingApprovals.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Proposer: {p.proposer_name || 'Member'} • Budget: <strong>₹{p.requested_budget}</strong>
                          </div>
                        </div>
                        <Badge status={p.status} size="xs" />
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {p.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">
                          Stage: {p.current_stage}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="success"
                            size="xs"
                            icon={Check}
                            onClick={() => handleApproveProposal(p.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onNavigate('approvals', { id: p.id })}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Domain Status (Section 3) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Status</h3>
                  <p className="text-xs text-slate-500">10 Specialized Technical Hubs</p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigate('domains')}
                >
                  Explore Hubs
                </Button>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {execStats.domain_distribution.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => onNavigate('domains', { id: d.id })}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                        <div className="text-[10px] text-slate-500">{d.members} members enrolled</div>
                      </div>
                    </div>
                    <Badge variant="blue" size="xs">
                      {d.projects} Projects
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Projects & Upcoming Events Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects (Section 3) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Projects</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('projects')}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 4).map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => onNavigate('projects', { id: proj.id })}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{proj.name}</div>
                      <Badge status={proj.status} size="xs" />
                    </div>
                    <ProgressBar
                      progress={proj.total_tasks_count > 0 ? Math.round((proj.completed_tasks_count / proj.total_tasks_count) * 100) : 0}
                      size="sm"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Lead: <strong>{proj.lead_name || 'Unassigned'}</strong></span>
                      <span>Domain: {proj.domain_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events (Section 3) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Upcoming Events</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('events')}>
                  Events Calendar
                </Button>
              </div>
              <div className="space-y-3">
                {events.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate('events', { id: ev.id })}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ev.event_type} • {ev.venue} • {new Date(ev.start_time).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge status={ev.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VICE PRESIDENT DASHBOARD (Section 4: Operations & Execution)          */}
      {/* ========================================================================= */}
      {roleName === 'Vice President' && execStats && (
        <div className="space-y-6">
          {/* VP Banner */}
          <WelcomeBanner />

          {/* Operational KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              hoverable
              onClick={() => onNavigate('tasks')}
              icon={TrendingUp}
              title="Execution Velocity"
              subtitle={`${execStats.pending_tasks} in progress across domains`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.completed_tasks} <span className="text-sm font-normal text-slate-400">Done</span>
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('tasks')}
              icon={AlertCircle}
              badge={blockedTasks.length > 0 ? `${blockedTasks.length} Urgent` : 'Smooth'}
              badgeVariant={blockedTasks.length > 0 ? 'rose' : 'emerald'}
              title="Pending / Blocked Tasks"
              subtitle="Tasks needing immediate unblocking"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {blockedTasks.length}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('events')}
              icon={Calendar}
              title="Active & Upcoming Events"
              subtitle="Workshops, seminars & tech talks"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.upcoming_events + execStats.ongoing_events}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('approvals')}
              icon={CheckCircle2}
              badge={pendingApprovals.length > 0 ? 'Pending' : 'Done'}
              badgeVariant={pendingApprovals.length > 0 ? 'amber' : 'emerald'}
              title="Pending Approvals"
              subtitle="Awaiting operational clearance"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {pendingApprovals.length}
              </div>
            </Card>
          </div>

          {/* 2-Column: Event Operations & Blocked Tasks Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Operations Monitor */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Active & Upcoming Events</h3>
                  <p className="text-xs text-slate-500">Live operational status and capacity</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('events')}>
                  Manage
                </Button>
              </div>

              <div className="space-y-3">
                {events.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate('events', { id: ev.id })}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Venue: {ev.venue} • {ev.registered_count} Registered
                      </div>
                    </div>
                    <Badge status={ev.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked Tasks & Engineering Bottlenecks */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Blocked Kanban Items</h3>
                  <p className="text-xs text-slate-500">Engineering hurdles requiring VP intervention</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('tasks')}>
                  Kanban
                </Button>
              </div>

              <div className="space-y-3">
                {blockedTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Zero blocked items! All domain development tracks flowing smoothly.
                  </div>
                ) : (
                  blockedTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onNavigate('tasks', { id: t.id })}
                      className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{t.title}</div>
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                          Domain: {t.domain_name || 'General'} • Assignee: {t.assignee_name || 'Unassigned'}
                        </div>
                      </div>
                      <Badge status={t.status} size="xs" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Domain Activities & Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Activities & Drives</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('activities')}>
                  View Drives
                </Button>
              </div>
              <div className="space-y-2.5">
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</div>
                      <div className="text-[11px] text-slate-500">{act.domain_name} • {act.activity_type}</div>
                    </div>
                    <Badge status={act.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Upcoming Deadlines</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('calendar')}>
                  Club Calendar
                </Button>
              </div>
              <div className="space-y-2.5">
                {tasks.filter(t => t.due_date).slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="text-[11px] text-slate-500">Project: {t.project_name}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {new Date(t.due_date!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DOMAIN HEAD DASHBOARD (Section 5: Domain Overview)                     */}
      {/* ========================================================================= */}
      {(roleName === 'Domain Head' || roleName === 'Technical Lead') && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner domainName={user?.domain_name || currentDomain?.name} />

          {/* 2-Column: Domain Projects & Domain Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain Projects (Section 5) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Projects</h3>
                  <p className="text-xs text-slate-500">Initiatives in active development</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('projects')}>
                  All Projects
                </Button>
              </div>

              <div className="space-y-3">
                {domainProjects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No active projects in this domain. Launch an initiative!
                  </div>
                ) : (
                  domainProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onNavigate('projects', { id: proj.id })}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{proj.name}</div>
                        <Badge status={proj.status} size="xs" />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{proj.description}</p>
                      <ProgressBar
                        progress={proj.total_tasks_count > 0 ? Math.round((proj.completed_tasks_count / proj.total_tasks_count) * 100) : 0}
                        size="sm"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Lead: <strong>{proj.lead_name || 'Unassigned'}</strong></span>
                        <span>Target: {proj.target_date ? new Date(proj.target_date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Domain Tasks (Section 5) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Tasks</h3>
                  <p className="text-xs text-slate-500">Action items assigned to developers</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('tasks')}>
                  Kanban Board
                </Button>
              </div>

              <div className="space-y-2.5">
                {domainTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No open tasks for this domain.
                  </div>
                ) : (
                  domainTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onNavigate('tasks', { id: task.id })}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{task.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Assignee: {task.assignee_name || 'Unassigned'} • Priority: {task.priority}
                        </div>
                      </div>
                      <Badge status={task.status} size="xs" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events & Domain Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Upcoming Domain Events</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('events')}>
                  All Events
                </Button>
              </div>
              <div className="space-y-2.5">
                {(domainEvents.length > 0 ? domainEvents : events).slice(0, 3).map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.name}</div>
                      <div className="text-[11px] text-slate-500">{ev.event_type} • {ev.venue}</div>
                    </div>
                    <Badge status={ev.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Announcements</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('announcements')}>
                  Bulletin Board
                </Button>
              </div>
              <div className="space-y-2.5">
                {domainAnnouncements.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{a.title}</span>
                      <Badge variant="blue" size="xs">{a.priority}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MEMBER DASHBOARD (Section 6: Personal Workspace)                       */}
      {/* ========================================================================= */}
      {(roleName === 'Member' || (!['President', 'Vice President', 'Domain Head', 'Technical Lead', 'Treasurer', 'Faculty Coordinator'].includes(roleName))) && memberStats && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner />

          {/* Member KPI Cards: My Tasks, Active Projects, Upcoming Events, Achievements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              hoverable
              onClick={() => onNavigate('tasks')}
              icon={CheckSquare}
              title="My Tasks"
              subtitle={`${memberStats.pending_tasks_count} pending / ${memberStats.completed_tasks_count} done`}
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {memberStats.assigned_tasks_count}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('projects')}
              icon={FolderGit2}
              title="Active Projects"
              subtitle="Projects you belong to"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {memberStats.my_projects_count}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('events')}
              icon={Calendar}
              title="Upcoming Events"
              subtitle="Workshops & hackathons"
            >
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {memberStats.events_registered_count}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => onNavigate('achievements')}
              icon={Award}
              title="Achievements"
              subtitle="Badges & recognitions"
            >
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {memberStats.achievements_count}
              </div>
            </Card>
          </div>

          {/* Section 6: My Tasks (Todo, In Progress, Completed tabs) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">My Tasks</h3>
                <p className="text-xs text-slate-500">Tasks assigned directly to you across domain projects</p>
              </div>

              {/* Task Tabs: Todo | In Progress | Completed */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(['all', 'todo', 'progress', 'done'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMemberTaskTab(tab)}
                    className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                      memberTaskTab === tab
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab === 'todo' ? 'Todo' : tab === 'progress' ? 'In Progress' : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {memberStats.my_tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tasks assigned yet! You are all caught up.
                </div>
              ) : (
                memberStats.my_tasks
                  .filter((t) => {
                    if (memberTaskTab === 'todo') return t.status === 'Todo';
                    if (memberTaskTab === 'progress') return t.status === 'In Progress';
                    if (memberTaskTab === 'done') return t.status === 'Completed';
                    return true;
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onNavigate('tasks', { id: task.id })}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{task.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {task.project_name || 'General Task'} {task.due_date && `• Due: ${new Date(task.due_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge status={task.status} size="xs" />
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* 2-Column: My Projects & Upcoming Events Member Can Attend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Projects (Section 6) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">My Projects</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('projects')}>
                  All Projects
                </Button>
              </div>

              <div className="space-y-3">
                {memberStats.my_projects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Not currently enrolled in any domain projects. Browse projects to join!
                  </div>
                ) : (
                  memberStats.my_projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onNavigate('projects', { id: proj.id })}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{proj.name}</div>
                        <Badge status={proj.status} size="xs" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Role: <strong className="text-blue-600 dark:text-blue-400">{proj.role}</strong></span>
                        <span>Due: {new Date(proj.target_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events Member Can Attend (Section 6) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Upcoming Events to Attend</h3>
                <Button variant="ghost" size="xs" onClick={() => onNavigate('events')}>
                  Browse Calendar
                </Button>
              </div>

              <div className="space-y-3">
                {events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate('events', { id: ev.id })}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ev.event_type} • {ev.venue} • {new Date(ev.start_time).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="outline" size="xs">
                      Register
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Achievements & Certificates */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Achievements & Credentials</h3>
                <p className="text-xs text-slate-500">Verified club certificates, awards, and recognitions</p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => onNavigate('certificates')}>
                View Certificates
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">TechnoHack 2026 Winner</div>
                  <div className="text-[10px] text-slate-400">1st Place • AI Track</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Cloud Bootcamp Pass</div>
                  <div className="text-[10px] text-slate-400">Verified Certificate</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Star Contributor</div>
                  <div className="text-[10px] text-slate-400">Semester 5 Honor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TREASURER DASHBOARD                                                   */}
      {/* ========================================================================= */}
      {roleName === 'Treasurer' && execStats && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Total Sanctioned Pool" icon={DollarSign}>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹{execStats.total_allocated_budget.toLocaleString()}
              </div>
            </Card>
            <Card title="Disbursed Expenditures" icon={TrendingUp}>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                ₹{execStats.total_spent_budget.toLocaleString()}
              </div>
            </Card>
            <Card title="Pending Claims" icon={Clock} badge={`${pendingClaims.length} Claims`} badgeVariant="amber">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                ₹{pendingClaimsSum.toLocaleString()}
              </div>
            </Card>
            <Card title="Sponsorship Funds" icon={Handshake}>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{execStats.confirmed_sponsorship.toLocaleString()}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FACULTY COORDINATOR DASHBOARD                                         */}
      {/* ========================================================================= */}
      {roleName === 'Faculty Coordinator' && execStats && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <WelcomeBanner />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Enrolled Technologists" icon={Users}>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.total_members}
              </div>
            </Card>
            <Card title="Conducted Workshops" icon={Calendar}>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {execStats.completed_events}
              </div>
            </Card>
            <Card title="Institutional Approvals" icon={CheckCircle2} badge={`${pendingApprovals.length} In Review`} badgeVariant="rose">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {pendingApprovals.length}
              </div>
            </Card>
            <Card title="Executed MOUs" icon={Handshake}>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {sponsors.filter(s => s.mou_signed).length}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ACTION MODALS                                                       */}
      {/* ========================================================================= */}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title="Schedule Club Event / Workshop"
        >
          <form onSubmit={handleQuickCreateEvent} className="space-y-4">
            <Input
              label="Event Name"
              required
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g. Generative AI Hands-on Workshop"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Event Type"
                options={[
                  { value: 'Workshop', label: 'Workshop' },
                  { value: 'Hackathon', label: 'Hackathon' },
                  { value: 'Bootcamp', label: 'Bootcamp' },
                  { value: 'Tech Talk', label: 'Tech Talk' },
                  { value: 'Seminar', label: 'Seminar' },
                ]}
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
              />

              <Input
                label="Venue / Location"
                required
                value={newEventVenue}
                onChange={(e) => setNewEventVenue(e.target.value)}
                placeholder="e.g. Auditorium B or Lab 304"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                rows={3}
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                placeholder="Describe agenda, prerequisites, and learning objectives..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowEventModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Schedule Event
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sanction Proposal Modal */}
      {showProposalModal && (
        <Modal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          title="Sanction Initiative Proposal"
        >
          <form onSubmit={handleQuickSubmitProposal} className="space-y-4">
            <Input
              label="Proposal Title"
              required
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="e.g. Procurement of High-Performance Edge Computing Kits"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Proposal Type"
                options={[
                  { value: 'Event', label: 'Event Sanction' },
                  { value: 'Resource', label: 'Hardware/Digital Resource' },
                  { value: 'Budget', label: 'Fiscal Allocation' },
                  { value: 'Collaboration', label: 'Industry Collaboration' },
                ]}
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
              />

              <Input
                label="Requested Budget (₹)"
                type="number"
                required
                value={proposalBudget}
                onChange={(e) => setProposalBudget(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Justification & Scope
              </label>
              <textarea
                rows={3}
                required
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                placeholder="Explain the student impact, necessity, and deliverables..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowProposalModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit for Sanction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
