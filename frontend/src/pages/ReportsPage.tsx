import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, TrendingUp, PieChart, Users, 
  Layers, Calendar, DollarSign, Award, CheckCircle2, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, Domain, Member } from '../types';
import { StatCard } from '../components/StatCard';

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'finance' | 'exports'>('overview');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [statsData, domainsData] = await Promise.all([
        api.reports.getExecutive(),
        api.domains.list()
      ]);
      setStats(statsData);
      setDomains(domainsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportEntities = [
    { key: 'members', label: 'Members Roster & Profile Details', desc: 'College IDs, departments, domains, roles, skills, and statuses' },
    { key: 'events', label: 'Events Registry & Metrics', desc: 'Workshops, hackathons, dates, budget, registered, attended' },
    { key: 'projects', label: 'Engineering Projects Ledger', desc: 'Domain initiatives, milestones, repository links, lead engineers' },
    { key: 'tasks', label: 'Task Execution & Kanban Items', desc: 'Assignees, due dates, priority tiers, statuses, hours' },
    { key: 'expenses', label: 'Disbursement & Expense Records', desc: 'Receipts, vendor claims, approvals, associated events' },
    { key: 'sponsors', label: 'Corporate Partners & Grants', desc: 'Tiers, pipeline stages, committed funding, MOU status' },
    { key: 'attendance', label: 'Event Attendance Logs', desc: 'QR code scans, check-in timestamps, participant emails' },
    { key: 'audit', label: 'System Audit Trail', desc: 'Role mutations, approval overrides, entity modifications' }
  ];

  if (loading || !stats) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Compiling organizational reports and telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Organizational Analytics & Intelligence</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Live Club Telemetry
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data-backed performance metrics, domain KPIs, financial governance, and instant CSV data export pipelines.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Club Overview
          </button>
          <button
            onClick={() => setActiveTab('domains')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'domains'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Domain Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'finance'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Financial Health
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'exports'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            CSV Data Hub
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Membership"
              value={`${stats.active_members} / ${stats.total_members}`}
              subtitle="Registered active student technologists"
              icon={<Users className="w-5 h-5 text-indigo-500" />}
              color="indigo"
            />
            <StatCard
              title="Projects in Flight"
              value={`${stats.active_projects}`}
              subtitle={`${stats.completed_projects} projects deployed & archived`}
              icon={<Layers className="w-5 h-5 text-cyan-500" />}
              color="cyan"
            />
            <StatCard
              title="Events & Hackathons"
              value={`${stats.upcoming_events + stats.active_hackathons}`}
              subtitle={`${stats.completed_events} historical programs executed`}
              icon={<Calendar className="w-5 h-5 text-emerald-500" />}
              color="emerald"
            />
            <StatCard
              title="Task Velocity"
              value={`${stats.completed_tasks} done`}
              subtitle={`${stats.pending_tasks} in progress across domains`}
              icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events by Type */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Events Distribution by Category</span>
              </h2>
              <div className="space-y-3">
                {stats.events_by_type.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">{item.type}</span>
                      <span className="font-mono">{item.count} sessions</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${Math.min(100, item.count * 20)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Status Distribution */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Kanban Task Workflow Health</span>
              </h2>
              <div className="space-y-3">
                {stats.task_status_distribution.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">{item.status}</span>
                      <span className="font-mono">{item.count} tasks</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.status === 'Completed' ? 'bg-emerald-500' :
                          item.status === 'In Progress' ? 'bg-blue-500' :
                          item.status === 'Review' ? 'bg-purple-500' :
                          item.status === 'Blocked' ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, item.count * 15)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOMAIN BENCHMARKS */}
      {activeTab === 'domains' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Technical Domains Benchmark Matrix
            </h2>
            <span className="text-xs text-slate-500">{domains.length} Specialized Hubs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Domain Hub</th>
                  <th className="py-3 px-3">Domain Head</th>
                  <th className="py-3 px-3">Members</th>
                  <th className="py-3 px-3">Active Projects</th>
                  <th className="py-3 px-3">Completed Projects</th>
                  <th className="py-3 px-3">Tasks Rate</th>
                  <th className="py-3 px-3 text-right">Health Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {domains.map((dom) => {
                  const completedTasks = dom.completed_tasks_count || 0;
                  const rate = dom.tasks_count > 0 ? Math.round((completedTasks / dom.tasks_count) * 100) : 100;
                  return (
                    <tr key={dom.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dom.color || '#6366f1' }} />
                          <span>{dom.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({dom.code})</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {dom.head_name || 'Vacant / Assigned'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {dom.member_count ?? dom.members_count ?? 0}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {dom.active_projects_count}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {dom.completed_projects_count ?? 0}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>High Output</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL HEALTH */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Approved Budget"
              value={`$${stats.total_allocated_budget?.toLocaleString() || 0}`}
              subtitle="Sanctioned for academic year"
              icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
              color="indigo"
            />
            <StatCard
              title="Disbursed Expenses"
              value={`$${stats.total_spent_budget?.toLocaleString() || 0}`}
              subtitle="Operational expenditures settled"
              icon={<BarChart3 className="w-5 h-5 text-rose-500" />}
              color="rose"
            />
            <StatCard
              title="Corporate Grants Raised"
              value={`$${stats.confirmed_sponsorship?.toLocaleString() || 0}`}
              subtitle="Confirmed external sponsor funding"
              icon={<Award className="w-5 h-5 text-emerald-500" />}
              color="emerald"
            />
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Treasury Utilization Summary
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The club operates on a dual-source funding model: College Dean of Student Affairs allocation and external tech sponsorship grants (Title, Platinum, Gold tiers). Budget burn is monitored by the Treasurer with strict multi-tier audit approvals.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: CSV EXPORTS HUB */}
      {activeTab === 'exports' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-5 space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Instant Data Export & Accreditation Reports (CSV)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Download real-time normalized CSV datasets for NAAC / ABET accreditation records, internal university auditing, and annual reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {exportEntities.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">{item.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                </div>

                <a
                  href={api.reports.exportCsvUrl(item.key)}
                  target="_blank"
                  rel="noreferrer"
                  download={`${item.key}_export.csv`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
