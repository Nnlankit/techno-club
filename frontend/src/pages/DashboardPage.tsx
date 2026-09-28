import React, { useState, useEffect } from 'react';
import {
  Users, Layers, Calendar, Award, FolderGit2, CheckSquare,
  CheckCircle2, DollarSign, Handshake, AlertCircle, ArrowUpRight,
  TrendingUp, Clock, Plus, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, MemberDashboardStats, ApprovalProposal } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const roleName = user?.role.name || 'Member';
  const isMember = roleName === 'Member';

  const [execStats, setExecStats] = useState<DashboardStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberDashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalProposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState('Workshop');
  const [newEventVenue, setNewEventVenue] = useState('Lab 4');
  const [newEventDesc, setNewEventDesc] = useState('');

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalType, setProposalType] = useState('Event');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalBudget, setProposalBudget] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isMember) {
        const mStats = await api.reports.getMemberDashboard();
        setMemberStats(mStats);
      } else {
        const eStats = await api.reports.getExecutive();
        setExecStats(eStats);
        const approvals = await api.approvals.list({ status: 'Under Review' });
        setPendingApprovals(approvals);
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
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.approvals.submit({
        title: proposalTitle,
        proposal_type: proposalType,
        description: proposalDesc,
        requested_budget: proposalBudget,
        priority: 'High'
      });
      setShowProposalModal(false);
      setProposalTitle('');
      setProposalDesc('');
      setProposalBudget(0);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MEMBER VIEW (Focused workspace for general club members)
  // -------------------------------------------------------------
  if (isMember && memberStats) {
    return (
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
              Track your domain contributions, project milestones, assigned tasks, and verified certificates all from your personal cockpit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('tasks')}
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold text-xs shadow-md hover:bg-indigo-50 transition-colors flex items-center space-x-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                <span>View My Kanban Tasks</span>
              </button>
              <button
                onClick={() => onNavigate('events')}
                className="px-4 py-2 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center space-x-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Browse Upcoming Events</span>
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
            icon={CheckSquare}
            color="indigo"
            onClick={() => onNavigate('tasks')}
          />
          <StatCard
            title="My Active Projects"
            value={memberStats.my_projects_count}
            subtitle="Domain & cross-domain initiatives"
            icon={FolderGit2}
            color="blue"
            onClick={() => onNavigate('projects')}
          />
          <StatCard
            title="Events Registered"
            value={memberStats.events_registered_count}
            subtitle={`${memberStats.events_attended_count} attended`}
            icon={Calendar}
            color="amber"
            onClick={() => onNavigate('events')}
          />
          <StatCard
            title="Credentials & Badges"
            value={memberStats.certificates_count}
            subtitle={`${memberStats.achievements_count} achievements logged`}
            icon={Award}
            color="emerald"
            onClick={() => onNavigate('certificates')}
          />
        </div>

        {/* 2-Column Grid: My Pending Tasks & My Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">My Pending Tasks</h3>
                <p className="text-xs text-slate-500">Action items assigned to you</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <span>Kanban Board</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {memberStats.my_tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  You have no pending tasks right now. Great job!
                </div>
              ) : (
                memberStats.my_tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onNavigate('tasks', { id: task.id })}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                        <span>{task.project_name || 'General Task'}</span>
                        {task.due_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center text-rose-600 dark:text-rose-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Upcoming Club Events</h3>
                <p className="text-xs text-slate-500">Workshops, hackathons & tech talks</p>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <span>All Events</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {memberStats.upcoming_events.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No upcoming events scheduled right now.
                </div>
              ) : (
                memberStats.upcoming_events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate('events', { id: ev.id })}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {ev.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ev.venue} • {new Date(ev.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {ev.event_type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXECUTIVE & OPERATIONAL DASHBOARD (President, VP, Domain Head, Faculty, Treasurer)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Executive Club Operations Control Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Active • AY 2025-26
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time club health, domain delivery benchmarks, event lifecycles, and pending executive approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowProposalModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Submit Proposal</span>
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      {execStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registered Members"
            value={execStats.total_members}
            subtitle={`${execStats.active_members} active across ${execStats.total_domains} domains`}
            icon={Users}
            color="indigo"
            onClick={() => onNavigate('members')}
          />
          <StatCard
            title="Active Projects"
            value={execStats.active_projects}
            subtitle={`${execStats.completed_projects} completed milestones`}
            icon={FolderGit2}
            color="blue"
            onClick={() => onNavigate('projects')}
          />
          <StatCard
            title="Events & Hackathons"
            value={execStats.upcoming_events + execStats.ongoing_events}
            subtitle={`${execStats.active_hackathons} flagship hackathons live`}
            icon={Award}
            color="amber"
            onClick={() => onNavigate('events')}
          />
          <StatCard
            title="Pending Approvals"
            value={execStats.pending_approvals}
            subtitle={`${execStats.pending_tasks} open tasks on Kanban`}
            icon={CheckCircle2}
            color={execStats.pending_approvals > 0 ? "rose" : "emerald"}
            trend={execStats.pending_approvals > 0 ? { value: 'Requires Review', positive: false } : { value: 'All Clear', positive: true }}
            onClick={() => onNavigate('approvals')}
          />
        </div>
      )}

      {/* Financial Overview Cards */}
      {execStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-800 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Total Allocated Budget</span>
            <div className="text-2xl font-black mt-2 tracking-tight">₹{execStats.total_allocated_budget.toLocaleString()}</div>
            <p className="text-xs text-indigo-300 mt-1">Approved by Faculty & Council</p>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Disbursed Expenses</span>
            <div className="text-2xl font-black mt-2 tracking-tight">₹{execStats.total_spent_budget.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">Verified with receipts & invoices</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-950 to-slate-950 text-white rounded-2xl p-5 border border-emerald-900/60 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Confirmed Sponsorships</span>
            <div className="text-2xl font-black mt-2 tracking-tight text-emerald-400">₹{execStats.confirmed_sponsorship.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">From Industry Partners & MOUs</p>
          </div>
        </div>
      )}

      {/* 2-Column: Pending Approvals & Domain Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Approvals Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Pending Approval Queue</h3>
              <p className="text-xs text-slate-500">Proposals awaiting executive or VP sanction</p>
            </div>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <span>View All ({pendingApprovals.length})</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No proposals currently pending your review. All queues clear!
              </div>
            ) : (
              pendingApprovals.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('approvals', { id: p.id })}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {p.proposal_type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{p.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                    <div className="text-right">
                      {p.requested_budget > 0 && (
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{p.requested_budget.toLocaleString()}
                        </div>
                      )}
                      <span className="inline-block mt-1">
                        <StatusBadge status={p.current_stage} />
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Proposed by: <strong className="text-slate-600 dark:text-slate-300">{p.proposer_name || 'Member'}</strong></span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Domain Distribution Overview (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Domain Performance</h3>
              <p className="text-xs text-slate-500">Member enrollment & active projects</p>
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
            {execStats?.domain_distribution.map((d) => (
              <div
                key={d.id}
                onClick={() => onNavigate('domains', { id: d.id })}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                    <div className="text-[11px] text-slate-400">{d.members} members registered</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {d.projects} {d.projects === 1 ? 'Project' : 'Projects'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Quick Create Event */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Quick Schedule Technical Event"
        subtitle="Schedule workshops, seminars, coding contests, or tech talks"
      >
        <form onSubmit={handleQuickCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Name
            </label>
            <input
              type="text"
              required
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g., Deep Learning with PyTorch Workshop"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Type
              </label>
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Tech Talk">Tech Talk</option>
                <option value="Coding Contest">Coding Contest</option>
                <option value="Project Expo">Project Expo</option>
                <option value="Ideathon">Ideathon</option>
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
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              required
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
              placeholder="Outline event agenda and target participants..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEventModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              Publish Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Submit Proposal */}
      <Modal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        title="Submit New Initiative Proposal"
        subtitle="Follows multi-tier approval workflow (Domain Review -> VP Review -> President Approval)"
      >
        <form onSubmit={handleQuickSubmitProposal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proposal Title
            </label>
            <input
              type="text"
              required
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="e.g., Campus Robotics Arena Construction & Sensor Kits Requisition"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proposal Type
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Event">Event</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Budget">Budget</option>
                <option value="Resource">Resource Procurement</option>
                <option value="Project">Project Authorization</option>
                <option value="Sponsorship">Sponsorship Deal</option>
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
                onChange={(e) => setProposalBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Justification
            </label>
            <textarea
              rows={4}
              required
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
              placeholder="State clear objective, return on investment for student members, and timeline..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowProposalModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              Submit for Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
