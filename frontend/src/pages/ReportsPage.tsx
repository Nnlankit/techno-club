import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, TrendingUp, PieChart, Users, 
  Layers, Calendar, DollarSign, Award, CheckCircle2, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, Domain, Member } from '../types';
import { 
  Button, Badge, PageHeader, EmptyState, LoadingState, Card, ProgressBar 
} from '../components/ui';

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'finance' | 'exports'>('overview');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, domainsData] = await Promise.all([
        api.reports.getExecutive(),
        api.domains.list()
      ]);
      setStats(statsData);
      setDomains(domainsData);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || 'Unable to load executive reports. Access may be restricted to leadership roles.');
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
    { key: 'audit', label: 'System Audit Trail', desc: 'Role mutations, approval overrides, entity modifications' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Data-backed performance analytics, domain benchmarks, financial governance, and instant CSV export hubs."
        />
        <LoadingState message="Compiling organizational reports, metrics, and accreditation telemetry..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Data-backed performance analytics, domain benchmarks, financial governance, and instant CSV export hubs."
        />
        <EmptyState
          title="Unable to Access Executive Reports"
          description={error || "You do not have permission to view institutional telemetry."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Reports"
        description="Data-backed performance analytics, domain benchmarks, financial governance, and instant CSV export hubs."
        actions={
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Club Overview
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'domains'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Domain Benchmarks
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'finance'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Financial Health
            </button>
            <button
              onClick={() => setActiveTab('exports')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'exports'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              CSV Data Hub
            </button>
          </div>
        }
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Membership</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {stats.active_members} / {stats.total_members}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Registered active student technologists</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Projects in Flight</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {stats.active_projects}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{stats.completed_projects} projects deployed & archived</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Events & Hackathons</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {stats.upcoming_events + stats.active_hackathons}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{stats.completed_events} historical programs executed</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Task Execution Velocity</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {stats.completed_tasks} done
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{stats.pending_tasks} in progress across domains</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events by Type */}
            <Card className="p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Events Distribution by Category</span>
              </h2>
              <div className="space-y-3">
                {stats.events_by_type.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">{item.type}</span>
                      <span className="font-mono">{item.count} sessions</span>
                    </div>
                    <ProgressBar
                      value={Math.min(100, item.count * 20)}
                      color="primary"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Task Status Distribution */}
            <Card className="p-5 space-y-4 shadow-xs">
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
                    <ProgressBar
                      value={Math.min(100, item.count * 15)}
                      color={
                        item.status === 'Completed' ? 'success' :
                        item.status === 'In Progress' ? 'primary' :
                        item.status === 'Blocked' ? 'danger' : 'warning'
                      }
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DOMAIN BENCHMARKS */}
      {activeTab === 'domains' && (
        <Card className="overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Technical Domains Benchmark Matrix
            </h2>
            <span className="text-xs text-slate-400">{domains.length} Specialized Hubs</span>
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
                  <th className="py-3 px-3">Task Completion Rate</th>
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
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dom.color || '#2563EB' }} />
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {dom.active_projects_count}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {dom.completed_projects_count ?? 0}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16">
                            <ProgressBar value={rate} color="success" size="sm" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
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
        </Card>
      )}

      {/* TAB 3: FINANCIAL HEALTH */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Sanctioned Budget</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                ₹{stats.total_allocated_budget?.toLocaleString() || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Sanctioned for academic year</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Disbursed Expenses</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                ₹{stats.total_spent_budget?.toLocaleString() || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Operational expenditures settled</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Corporate Grants Raised</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                ₹{stats.confirmed_sponsorship?.toLocaleString() || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Confirmed external sponsor funding</p>
            </Card>
          </div>

          <Card className="p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Treasury Utilization Summary
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The club operates on a dual-source funding model: College Dean of Student Affairs allocation and external tech sponsorship grants (Title, Platinum, Gold tiers). Budget burn is monitored by the Treasurer with strict multi-tier audit approvals.
            </p>
          </Card>
        </div>
      )}

      {/* TAB 4: CSV EXPORTS HUB */}
      {activeTab === 'exports' && (
        <Card className="p-5 space-y-4 shadow-xs">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Instant Data Export & Accreditation Reports (CSV)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Download real-time normalized CSV datasets for accreditation records, internal university auditing, and annual reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {exportEntities.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
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
                >
                  <Button variant="outline" size="xs" icon={<Download className="w-3.5 h-3.5" />}>
                    Export
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
