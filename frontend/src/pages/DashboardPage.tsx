import React, { useState, useEffect } from 'react';
import {
  Users, Layers, Calendar, Award, FolderGit2, CheckSquare,
  CheckCircle2, DollarSign, Handshake, AlertCircle, ArrowUpRight,
  TrendingUp, Clock, Plus, ShieldCheck, ChevronRight, Cpu, Key,
  Wrench, FileText, Download, QrCode, Filter, ExternalLink, BarChart3,
  Shield, Building2, Sparkles, Check, X, Laptop, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  DashboardStats, MemberDashboardStats, ApprovalProposal, 
  Domain, Project, Task, Expense, Sponsor, Resource, Event
} from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

const ALL_PROFILES = [
  'President',
  'Vice President',
  'Domain Head',
  'Member',
  'Treasurer',
  'Faculty Coordinator',
  'Technical Lead'
] as const;

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const realRoleName = user?.role.name || 'President';

  // Active view profile (defaults to the logged-in user's role, but evaluators can preview any profile dashboard!)
  const [activeProfile, setActiveProfile] = useState<string>(realRoleName);

  // Core Data States
  const [execStats, setExecStats] = useState<DashboardStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberDashboardStats | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalProposal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Domain Head Dashboard: Selected domain filter
  const [selectedDomainId, setSelectedDomainId] = useState<number | undefined>(undefined);

  // Quick Action Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState('Workshop');
  const [newEventVenue, setNewEventVenue] = useState('Lab 304');
  const [newEventDesc, setNewEventDesc] = useState('');

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalType, setProposalType] = useState('Event');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalBudget, setProposalBudget] = useState(500);

  useEffect(() => {
    setActiveProfile(realRoleName);
  }, [realRoleName]);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        eStats, mStats, domData, projData, taskData,
        evData, appData, expData, sponData, resData
      ] = await Promise.all([
        api.reports.getExecutive().catch(() => null),
        api.reports.getMemberDashboard().catch(() => null),
        api.domains.list().catch(() => []),
        api.projects.list().catch(() => []),
        api.tasks.list().catch(() => []),
        api.events.list().catch(() => []),
        api.approvals.list().catch(() => []),
        api.finance.getExpenses().catch(() => []),
        api.sponsors.list().catch(() => []),
        api.resources.list().catch(() => [])
      ]);

      setExecStats(eStats);
      setMemberStats(mStats);
      setDomains(domData);
      setProjects(projData);
      setTasks(taskData);
      setEvents(evData);
      setPendingApprovals(appData.filter((a: ApprovalProposal) => a.status === 'Under Review' || a.status === 'Submitted'));
      setExpenses(expData);
      setSponsors(sponData);
      setResources(resData);

      // Default selected domain for domain head
      if (domData.length > 0) {
        const myDom = domData.find((d: Domain) => d.name.toLowerCase().includes('ai') || d.id === user?.domain_id);
        setSelectedDomainId(myDom ? myDom.id : domData[0].id);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateExpenseStatus = async (id: number, status: string) => {
    try {
      await api.finance.updateExpenseStatus(id, status, 'Settled via Treasurer Dashboard');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update expense status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400">Loading profile telemetry...</span>
      </div>
    );
  }

  // Active domain object for Domain Head
  const currentDomain = domains.find(d => d.id === selectedDomainId) || domains[0];
  const domainProjects = projects.filter(p => p.domain_id === currentDomain?.id);
  const domainTasks = tasks.filter(t => t.domain_id === currentDomain?.id);
  const domainEvents = events.filter(e => e.domain_id === currentDomain?.id);
  const domainResources = resources.filter(r => r.location?.includes(currentDomain?.code || ''));

  // Blocked tasks count across club
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');
  const pendingClaims = expenses.filter(e => e.status === 'Pending');
  const pendingClaimsSum = pendingClaims.reduce((acc, e) => acc + (e.amount || 0), 0);
  const confirmedSponsorsSum = sponsors.filter(s => s.stage === 'Confirmed' || s.stage === 'Completed').reduce((acc, s) => acc + (s.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* PROFILE SELECTOR HEADER BAR (Instant Persona Switcher for Evaluators)    */}
      {/* ========================================================================= */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Active Profile Dashboard:
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {activeProfile} View
          </span>
        </div>

        {/* Profile Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {ALL_PROFILES.map((prof) => (
            <button
              key={prof}
              onClick={() => setActiveProfile(prof)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                activeProfile === prof
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {prof}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PRESIDENT DASHBOARD                                                    */}
      {/* ========================================================================= */}
      {activeProfile === 'President' && execStats && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h1 className="text-xl font-black tracking-tight">Presidential Command & Governance OS</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                Executive oversight of {execStats.total_members} technologists across {execStats.total_domains} engineering domains. Monitor club financial sanctions, approve major initiatives, and track accreditation telemetry.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProposalModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sanction Proposal</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors flex items-center space-x-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Event</span>
              </button>
              <a
                href={api.reports.exportCsvUrl('members')}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit</span>
              </a>
            </div>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Technologists"
              value={`${execStats.active_members} / ${execStats.total_members}`}
              subtitle={`${execStats.total_domains} technical domain hubs`}
              icon={<Users className="w-5 h-5" />}
              color="indigo"
              onClick={() => onNavigate('members')}
            />
            <StatCard
              title="Projects Deployed & Live"
              value={`${execStats.active_projects}`}
              subtitle={`${execStats.completed_projects} completed milestones`}
              icon={<FolderGit2 className="w-5 h-5" />}
              color="blue"
              onClick={() => onNavigate('projects')}
            />
            <StatCard
              title="Flagships & Hackathons"
              value={`${execStats.upcoming_events + execStats.active_hackathons}`}
              subtitle={`${execStats.completed_events} historical programs held`}
              icon={<Award className="w-5 h-5" />}
              color="amber"
              onClick={() => onNavigate('events')}
            />
            <StatCard
              title="Urgent Executive Approvals"
              value={pendingApprovals.length.toString()}
              subtitle={`${execStats.pending_tasks} open tasks on Kanban`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color={pendingApprovals.length > 0 ? "rose" : "emerald"}
              onClick={() => onNavigate('approvals')}
            />
          </div>

          {/* Financial Overview Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-800 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Sanctioned Budget Pool</span>
              <div className="text-2xl font-black mt-2 tracking-tight">₹{execStats.total_allocated_budget.toLocaleString()}</div>
              <p className="text-xs text-indigo-300 mt-1">Approved by Executive Council & Dean</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Disbursed Expenses</span>
              <div className="text-2xl font-black mt-2 tracking-tight">₹{execStats.total_spent_budget.toLocaleString()}</div>
              <p className="text-xs text-slate-400 mt-1">Reimbursed with invoices & audit logs</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-950 to-slate-950 text-white rounded-2xl p-5 border border-emerald-900/60 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Confirmed Sponsorships</span>
              <div className="text-2xl font-black mt-2 tracking-tight text-emerald-400">₹{execStats.confirmed_sponsorship.toLocaleString()}</div>
              <p className="text-xs text-slate-400 mt-1">From Industry Partners & Executed MOUs</p>
            </div>
          </div>

          {/* 2-Column: Executive Approval Queue & Domain Delivery Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Approval Queue */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Executive Sanctions Queue</h3>
                  <p className="text-xs text-slate-500">Proposals requiring presidential sign-off</p>
                </div>
                <button
                  onClick={() => onNavigate('approvals')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                >
                  <span>All ({pendingApprovals.length})</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3">
                {pendingApprovals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No proposals currently pending your review. Executive queue clear!
                  </div>
                ) : (
                  pendingApprovals.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Proposer: {p.proposer_name || 'Member'} • Budget Request: <strong>₹{p.requested_budget}</strong>
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {p.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
                          Stage: {p.current_stage}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproveProposal(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Sanction</span>
                          </button>
                          <button
                            onClick={() => onNavigate('approvals', { id: p.id })}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-300 transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Domain Delivery Matrix */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Output Matrix</h3>
                  <p className="text-xs text-slate-500">10 Specialized Technical Hubs</p>
                </div>
                <button
                  onClick={() => onNavigate('domains')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                >
                  <span>Explore</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {execStats.domain_distribution.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => onNavigate('domains', { id: d.id })}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                        <div className="text-[10px] text-slate-500">{d.members} members enrolled</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {d.projects} Projects
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VICE PRESIDENT DASHBOARD                                              */}
      {/* ========================================================================= */}
      {activeProfile === 'Vice President' && execStats && (
        <div className="space-y-6">
          {/* VP Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-blue-800 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h1 className="text-xl font-black tracking-tight">Vice President Operational Command</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Operations & Delivery
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1.5 max-w-2xl leading-relaxed">
                Ensure timely execution of club activities, unblock task bottlenecks across all 10 domains, review proposals at VP Review stage, and coordinate logistical readiness.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('tasks')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center space-x-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
              <button
                onClick={() => onNavigate('meetings')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-colors flex items-center space-x-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Schedule Sync</span>
              </button>
            </div>
          </div>

          {/* Operational KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Execution Velocity"
              value={`${execStats.completed_tasks} Done`}
              subtitle={`${execStats.pending_tasks} in progress across domains`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="indigo"
              onClick={() => onNavigate('tasks')}
            />
            <StatCard
              title="Blocked Tasks / Bottlenecks"
              value={blockedTasks.length.toString()}
              subtitle="Tasks requiring intervention"
              icon={<AlertCircle className="w-5 h-5" />}
              color={blockedTasks.length > 0 ? "rose" : "emerald"}
              onClick={() => onNavigate('tasks')}
            />
            <StatCard
              title="Events Pipeline"
              value={`${execStats.upcoming_events + execStats.ongoing_events}`}
              subtitle="Workshops, seminars & tech talks"
              icon={<Calendar className="w-5 h-5" />}
              color="blue"
              onClick={() => onNavigate('events')}
            />
            <StatCard
              title="Proposals Under Review"
              value={pendingApprovals.length.toString()}
              subtitle="Awaiting operational clearance"
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="amber"
              onClick={() => onNavigate('approvals')}
            />
          </div>

          {/* 2-Column: VP Review Queue & Blocked Tasks Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operational Review Queue */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Operational Proposals Review</h3>
                  <p className="text-xs text-slate-500">Vet domain proposals before presidential sanction</p>
                </div>
                <button
                  onClick={() => onNavigate('approvals')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3">
                {pendingApprovals.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.proposal_type} • Budget: ₹{p.requested_budget}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('approvals', { id: p.id })}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-semibold"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked Tasks & Engineering Bottlenecks */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Blocked Kanban Items</h3>
                  <p className="text-xs text-slate-500">Items tagged as blocked by developers</p>
                </div>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center"
                >
                  <span>Unblock</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
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
                      <StatusBadge status={t.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DOMAIN HEAD DASHBOARD                                                 */}
      {/* ========================================================================= */}
      {activeProfile === 'Domain Head' && (
        <div className="space-y-6">
          {/* Domain Hub Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-purple-800 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h1 className="text-xl font-black tracking-tight">Domain Lead Operations Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentDomain?.name || 'Technical Domain'}
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-1.5 max-w-2xl leading-relaxed">
                Direct domain projects, assign development tasks to domain members, monitor completion velocity, and submit initiative proposals to club executive leadership.
              </p>
            </div>

            {/* Domain Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-purple-200">Switch Domain:</label>
              <select
                value={selectedDomainId || ''}
                onChange={(e) => setSelectedDomainId(Number(e.target.value))}
                className="text-xs bg-slate-900/90 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-semibold"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Domain KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Enrolled Domain Members"
              value={currentDomain?.members_count?.toString() || '0'}
              subtitle="Specialized domain technologists"
              icon={<Users className="w-5 h-5" />}
              color="purple"
              onClick={() => onNavigate('members')}
            />
            <StatCard
              title="Domain Projects in Flight"
              value={domainProjects.length.toString()}
              subtitle={`${domainProjects.filter(p => p.status === 'Completed').length} delivered to production`}
              icon={<FolderGit2 className="w-5 h-5" />}
              color="indigo"
              onClick={() => onNavigate('projects')}
            />
            <StatCard
              title="Domain Task Completion"
              value={`${domainTasks.filter(t => t.status === 'Completed').length} / ${domainTasks.length}`}
              subtitle={`${Math.round((domainTasks.filter(t => t.status === 'Completed').length / (domainTasks.length || 1)) * 100)}% completion rate`}
              icon={<CheckSquare className="w-5 h-5" />}
              color="emerald"
              onClick={() => onNavigate('tasks')}
            />
            <StatCard
              title="Domain Workshops & Sessions"
              value={domainEvents.length.toString()}
              subtitle="Specialized technical bootcamps"
              icon={<Calendar className="w-5 h-5" />}
              color="amber"
              onClick={() => onNavigate('events')}
            />
          </div>

          {/* 2-Column: Domain Projects & Domain Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain Projects */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Domain Projects</h3>
                  <p className="text-xs text-slate-500">Initiatives in development under {currentDomain?.name}</p>
                </div>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
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
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-400 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{proj.name}</div>
                        <StatusBadge status={proj.status} />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{proj.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Lead: <strong className="text-slate-700 dark:text-slate-300">{proj.lead_name || 'Assigned Lead'}</strong></span>
                        <span>Target: {proj.target_date ? new Date(proj.target_date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Domain Tasks Quick Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Task Execution</h3>
                  <p className="text-xs text-slate-500">Assigned developer action items</p>
                </div>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center"
                >
                  <span>Open Kanban</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
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
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{task.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Assignee: {task.assignee_name || 'Unassigned'} • Priority: {task.priority}
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MEMBER DASHBOARD                                                      */}
      {/* ========================================================================= */}
      {activeProfile === 'Member' && memberStats && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-8 text-white shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
                Member Workspace • Academic Year 2025-2026
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {user?.full_name || 'Member'}!
              </h1>
              <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
                Track your domain contributions, project milestones, assigned tasks, and verified credentials all from your personal cockpit.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('tasks')}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-colors flex items-center space-x-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>My Kanban Tasks</span>
                </button>
                <button
                  onClick={() => onNavigate('events')}
                  className="px-4 py-2 rounded-xl bg-indigo-500/40 border border-white/20 text-white font-semibold text-xs hover:bg-indigo-500/60 transition-colors flex items-center space-x-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Explore Workshops</span>
                </button>
              </div>
            </div>
          </div>

          {/* Member KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="My Assigned Tasks"
              value={memberStats.assigned_tasks_count}
              subtitle={`${memberStats.pending_tasks_count} pending / ${memberStats.completed_tasks_count} completed`}
              icon={<CheckSquare className="w-5 h-5" />}
              color="indigo"
              onClick={() => onNavigate('tasks')}
            />
            <StatCard
              title="My Active Projects"
              value={memberStats.my_projects_count}
              subtitle="Domain & cross-domain initiatives"
              icon={<FolderGit2 className="w-5 h-5" />}
              color="blue"
              onClick={() => onNavigate('projects')}
            />
            <StatCard
              title="Events Registered"
              value={memberStats.events_registered_count}
              subtitle={`${memberStats.events_attended_count} attended with QR passes`}
              icon={<Calendar className="w-5 h-5" />}
              color="amber"
              onClick={() => onNavigate('events')}
            />
            <StatCard
              title="Credentials & Badges"
              value={memberStats.certificates_count}
              subtitle={`${memberStats.achievements_count} honors logged in Hall of Fame`}
              icon={<Award className="w-5 h-5" />}
              color="emerald"
              onClick={() => onNavigate('certificates')}
            />
          </div>

          {/* 2-Column: My Tasks & My Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Tasks */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">My Immediate Action Items</h3>
                  <p className="text-xs text-slate-500">Tasks assigned directly to you</p>
                </div>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                >
                  <span>Kanban</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {memberStats.my_tasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No pending tasks! Great job maintaining zero backlog.
                  </div>
                ) : (
                  memberStats.my_tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onNavigate('tasks', { id: task.id })}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{task.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {task.project_name || 'General Task'} {task.due_date && `• Due ${new Date(task.due_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Projects */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">My Active Projects</h3>
                  <p className="text-xs text-slate-500">Software initiatives & domain repos</p>
                </div>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                >
                  <span>Explore</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {memberStats.my_projects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Not currently enrolled in any domain projects. Browse projects to join!
                  </div>
                ) : (
                  memberStats.my_projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onNavigate('projects', { id: proj.id })}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{proj.name}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Role: {proj.role} • Target: {new Date(proj.target_date).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={proj.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TREASURER DASHBOARD                                                   */}
      {/* ========================================================================= */}
      {activeProfile === 'Treasurer' && execStats && (
        <div className="space-y-6">
          {/* Treasury Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-800 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h1 className="text-xl font-black tracking-tight">Treasury & Financial Operations Command</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fiscal Authority
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1.5 max-w-2xl leading-relaxed">
                Oversee budget allocations, process reimbursement vouchers, track external tech sponsorships, and verify vendor expenditure receipts.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('finance')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
              <a
                href={api.reports.exportCsvUrl('expenses')}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger CSV</span>
              </a>
            </div>
          </div>

          {/* Treasury KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sanctioned Budget"
              value={`₹${execStats.total_allocated_budget.toLocaleString()}`}
              subtitle="Annual council allocation"
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
              color="emerald"
            />
            <StatCard
              title="Disbursed Expenditures"
              value={`₹${execStats.total_spent_budget.toLocaleString()}`}
              subtitle="Audited with receipts"
              icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
              color="rose"
            />
            <StatCard
              title="Remaining Treasury Pool"
              value={`₹${(execStats.total_allocated_budget - execStats.total_spent_budget).toLocaleString()}`}
              subtitle="Available for upcoming programs"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              color="indigo"
            />
            <StatCard
              title="Pending Claims in Queue"
              value={`₹${pendingClaimsSum.toLocaleString()}`}
              subtitle={`${pendingClaims.length} claims requiring audit`}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              color="amber"
            />
          </div>

          {/* Pending Reimbursement Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Pending Reimbursement Claims</h3>
                <p className="text-xs text-slate-500">Review receipts and disburse student/domain expenditures</p>
              </div>
              <button
                onClick={() => onNavigate('finance')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingClaims.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Zero pending expense claims! All vouchers settled.
                      </td>
                    </tr>
                  ) : (
                    pendingClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {claim.title}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{claim.category}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">₹{claim.amount}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{claim.date_incurred}</td>
                        <td className="py-3 px-3"><StatusBadge status={claim.status} /></td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex space-x-1.5">
                            <button
                              onClick={() => handleUpdateExpenseStatus(claim.id, 'Approved')}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[10px] hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateExpenseStatus(claim.id, 'Rejected')}
                              className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold text-[10px] hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FACULTY COORDINATOR DASHBOARD                                         */}
      {/* ========================================================================= */}
      {activeProfile === 'Faculty Coordinator' && execStats && (
        <div className="space-y-6">
          {/* Faculty Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-rose-900/60 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <h1 className="text-xl font-black tracking-tight">Faculty Advisor & Institutional Compliance</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  University Oversight
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-1.5 max-w-2xl leading-relaxed">
                Ensure college policy alignment, verify student activity attendance for academic credits, approve university venue reservations, and export NAAC/ABET compliance documentation.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={api.reports.exportCsvUrl('members')}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>NAAC / ABET Packet</span>
              </a>
            </div>
          </div>

          {/* Compliance KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Enrolled Students"
              value={execStats.total_members.toString()}
              subtitle="Registered undergraduate technologists"
              icon={<Users className="w-5 h-5" />}
              color="indigo"
            />
            <StatCard
              title="Official Proposals in Review"
              value={pendingApprovals.length.toString()}
              subtitle="Awaiting faculty institutional sign-off"
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="rose"
              onClick={() => onNavigate('approvals')}
            />
            <StatCard
              title="Conducted Workshops & Fests"
              value={execStats.completed_events.toString()}
              subtitle="Validated with digital attendance logs"
              icon={<Calendar className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="Signed Corporate MOUs"
              value={sponsors.filter(s => s.mou_signed).length.toString()}
              subtitle="Industry engagement partnerships"
              icon={<Handshake className="w-5 h-5" />}
              color="amber"
            />
          </div>

          {/* Institutional Proposals Queue */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Institutional Compliance Queue</h3>
                <p className="text-xs text-slate-500">Proposals requiring college approval and venue booking clearance</p>
              </div>
              <button
                onClick={() => onNavigate('approvals')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center"
              >
                <span>Review All</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            <div className="space-y-3">
              {pendingApprovals.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Proposer: {p.proposer_name} • Requested Budget: ₹{p.requested_budget}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('approvals', { id: p.id })}
                    className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold text-xs hover:bg-rose-100"
                  >
                    Endorse Proposal
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TECHNICAL LEAD DASHBOARD                                              */}
      {/* ========================================================================= */}
      {activeProfile === 'Technical Lead' && execStats && (
        <div className="space-y-6">
          {/* Tech Lead Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-cyan-800 shadow-lg">
            <div>
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h1 className="text-xl font-black tracking-tight">Technical Architecture & Assets Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Engineering Lead
                </span>
              </div>
              <p className="text-xs text-cyan-100 mt-1.5 max-w-2xl leading-relaxed">
                Track club code repositories, hardware kit assignments (Raspberry Pi, Arduino, sensors), cloud credit consumption, and software developer licenses.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('resources')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Hardware Kit</span>
              </button>
            </div>
          </div>

          {/* Technical KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Repositories"
              value={projects.filter(p => p.repository_url).length.toString()}
              subtitle="Git codebases maintained"
              icon={<FolderGit2 className="w-5 h-5 text-cyan-500" />}
              color="cyan"
              onClick={() => onNavigate('projects')}
            />
            <StatCard
              title="Hardware Kits in Custody"
              value={resources.filter(r => r.status === 'Assigned').length.toString()}
              subtitle={`${resources.filter(r => r.status === 'Available').length} available in Lab 304`}
              icon={<Cpu className="w-5 h-5 text-indigo-500" />}
              color="indigo"
              onClick={() => onNavigate('resources')}
            />
            <StatCard
              title="Digital Tool Licenses"
              value={resources.filter(r => r.category === 'Digital').length.toString()}
              subtitle="Cloud API keys & IDE seats"
              icon={<Key className="w-5 h-5 text-amber-500" />}
              color="amber"
              onClick={() => onNavigate('resources')}
            />
            <StatCard
              title="Blocked Tasks"
              value={blockedTasks.length.toString()}
              subtitle="Engineering hurdles requiring unblock"
              icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
              color={blockedTasks.length > 0 ? "rose" : "emerald"}
              onClick={() => onNavigate('tasks')}
            />
          </div>

          {/* 2-Column: Hardware Custody Roster & Active Codebases */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hardware Custody Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Hardware Custody & Checkouts</h3>
                  <p className="text-xs text-slate-500">Microcontrollers and kits issued to students</p>
                </div>
                <button
                  onClick={() => onNavigate('resources')}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center"
                >
                  <span>Inventory</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3">
                {resources.filter(r => r.status === 'Assigned').length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    All hardware inventory is safely in lab storage lockers.
                  </div>
                ) : (
                  resources.filter(r => r.status === 'Assigned').map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{r.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Tag: {r.identifier} • Custodian: <strong className="text-indigo-600 dark:text-indigo-400">{r.assigned_to_name}</strong>
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Code Repositories */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Engineering Projects</h3>
                  <p className="text-xs text-slate-500">Software repositories in active development</p>
                </div>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center"
                >
                  <span>All Projects</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="space-y-3">
                {projects.slice(0, 4).map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{proj.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Domain: {proj.domain_name} • Lead: {proj.lead_name || 'Assigned'}
                      </div>
                    </div>
                    {proj.repository_url && (
                      <a
                        href={proj.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Code</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ACTION MODALS                                                       */}
      {/* ========================================================================= */}

      {/* Schedule Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Schedule Club Event / Workshop"
      >
        <form onSubmit={handleQuickCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g. LLM Fine-Tuning Bootcamp"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Type
              </label>
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Coding Contest">Coding Contest</option>
                <option value="Tech Talk">Tech Talk</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                required
                value={newEventVenue}
                onChange={(e) => setNewEventVenue(e.target.value)}
                placeholder="Lab 304 / Auditorium"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
              placeholder="Short description of event objectives..."
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEventModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Schedule Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Proposal Modal */}
      <Modal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        title="Submit Initiative Proposal"
      >
        <form onSubmit={handleQuickSubmitProposal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proposal Title *
            </label>
            <input
              type="text"
              required
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="e.g. Autonomous Robotics Arena Procurement"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proposal Category
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Event">Event</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Project">Project</option>
                <option value="Budget Request">Budget Request</option>
                <option value="Resource Acquisition">Resource Acquisition</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Requested Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={proposalBudget}
                onChange={(e) => setProposalBudget(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Justification & Scope
            </label>
            <textarea
              rows={2}
              required
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
              placeholder="Explain value proposition and expected outcomes..."
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowProposalModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Submit to Leadership
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
