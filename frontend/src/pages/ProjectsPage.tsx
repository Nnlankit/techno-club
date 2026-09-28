import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, Plus, GitBranch, ExternalLink, Calendar, 
  CheckCircle2, Clock, Users, CheckSquare, Search, Filter 
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Domain, Member } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const ProjectsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [leadId, setLeadId] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState('High');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  useEffect(() => {
    loadProjects();
  }, [selectedDomain, selectedStatus]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [projData, domainsData, membersData] = await Promise.all([
        api.projects.list({
          domain_id: selectedDomain,
          status: selectedStatus || undefined,
          search: search || undefined
        }),
        api.domains.list(),
        api.members.list()
      ]);
      setProjects(projData);
      setDomains(domainsData);
      setMembers(membersData);
      if (membersData.length > 0 && !leadId) {
        setLeadId(membersData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;
    try {
      const now = new Date();
      const target = new Date(now.getTime() + 60 * 24 * 3600000);
      await api.projects.create({
        name,
        description,
        objective,
        domain_id: domainId,
        project_lead_id: leadId,
        start_date: now.toISOString(),
        target_date: target.toISOString(),
        priority,
        status: 'Active',
        repository_url: repoUrl,
        demo_url: demoUrl,
        milestones: [
          { id: 1, title: 'Architecture & Schema Definition', completed: true },
          { id: 2, title: 'Core Functionality & Integration', completed: false },
          { id: 3, title: 'Testing, Deployment & Documentation', completed: false }
        ]
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setObjective('');
      setRepoUrl('');
      setDemoUrl('');
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Technical Projects & Deliverables</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {projects.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student-driven software, autonomous hardware, research prototypes, and club infrastructure.
          </p>
        </div>

        {hasRole(['President', 'Vice President', 'Domain Head', 'Technical Lead']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Initiate Project</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadProjects(); }}
            placeholder="Search projects by name or technology..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Domain Filter */}
          <select
            value={selectedDomain || ''}
            onChange={(e) => setSelectedDomain(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Domains</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No projects found matching selected filters.
          </div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {p.domain_name || 'Central Initiative'}
                  </span>
                  <StatusBadge status={p.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Lead and Target date */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 space-y-1">
                  <div>Project Lead: <strong className="text-slate-700 dark:text-slate-200">{p.lead_name || 'Unassigned'}</strong></div>
                  <div className="flex items-center text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Target: {new Date(p.target_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Footer stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {p.members?.length || 1}
                  </span>
                  <span className="flex items-center">
                    <CheckSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {p.completed_tasks_count} / {p.total_tasks_count} tasks
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {p.repository_url && <GitBranch className="w-3.5 h-3.5 text-slate-400" />}
                  {p.demo_url && <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.name}
          subtitle={`Lead: ${selectedProject.lead_name || 'Unassigned'} • Domain: ${selectedProject.domain_name || 'Cross-Domain'}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <StatusBadge status={selectedProject.status} />
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Priority: {selectedProject.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  Start: {new Date(selectedProject.start_date).toLocaleDateString()} • Target: {new Date(selectedProject.target_date).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {selectedProject.repository_url && (
                  <a
                    href={selectedProject.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 flex items-center space-x-1 text-xs font-semibold"
                  >
                    <GitBranch className="w-4 h-4 mr-1" />
                    <span>Repo</span>
                  </a>
                )}
                {selectedProject.demo_url && (
                  <a
                    href={selectedProject.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center space-x-1 text-xs font-semibold"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <span>Demo</span>
                  </a>
                )}
              </div>
            </div>

            {/* Description & Objectives */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Architecture & Purpose</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedProject.description}
                </p>
              </div>
              {selectedProject.objective && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Core Objectives & Milestones</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedProject.objective}
                  </p>
                </div>
              )}
            </div>

            {/* Milestones Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Milestones Roadmap</h4>
              <div className="space-y-2">
                {selectedProject.milestones?.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      m.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center">
                      <CheckCircle2 className={`w-4 h-4 mr-2 ${m.completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <strong className={m.completed ? 'line-through opacity-80' : ''}>{m.title}</strong>
                    </span>
                    <span className="text-[11px] font-semibold">{m.completed ? 'Complete' : 'In Progress'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Team Members */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Team Members ({selectedProject.members?.length || 1})</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedProject.members?.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-2.5"
                  >
                    <img
                      src={mem.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mem.member_name}`}
                      alt="Member"
                      className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{mem.member_name}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400">{mem.role_in_project}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Initiate New Technical Project"
        subtitle="Establish cross-domain software, hardware, or research initiative"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Campus Autonomous Navigation Rover"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain
              </label>
              <select
                value={domainId || ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Cross-Domain</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Lead
              </label>
              <select
                value={leadId || ''}
                onChange={(e) => setLeadId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Description
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Architecture, technology stack, and features..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Repository Link (GitHub/GitLab)
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/technoclub/..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Live Prototype / Demo URL
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Initiate Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
