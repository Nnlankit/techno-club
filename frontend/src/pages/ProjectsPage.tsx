import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  FolderGit2, Plus, GitBranch, ExternalLink, Calendar, 
  CheckCircle2, Clock, Users, CheckSquare, Search, Filter,
  ArrowRight, FileText, Check, ChevronRight, Terminal, Layers,
  Edit3, UserPlus, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Domain, Member, Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PageHeader, Card, Badge, Button, Input, Select, 
  Tabs, ProgressBar, Modal, EmptyState, LoadingState, ErrorState 
} from '../components/ui';

export const ProjectsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { id: paramProjectId, subTab: paramSubTab } = useParams<{ id?: string; subTab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters from URL Search Params (preserves state on Back/Forward)
  const search = searchParams.get('q') || '';
  const selectedDomain = searchParams.get('domain') ? Number(searchParams.get('domain')) : undefined;
  const selectedStatus = searchParams.get('status') || '';

  // Selected project for detailed project management view (Section 15)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projectTab = (paramSubTab as 'overview' | 'tasks' | 'members' | 'milestones' | 'files') || 'overview';

  // Modals
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
  const [submitting, setSubmitting] = useState(false);

  // Edit Project State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editLeadId, setEditLeadId] = useState<number | undefined>(undefined);
  const [editStatus, setEditStatus] = useState('Planning');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editDemoUrl, setEditDemoUrl] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);

  // Add Member to Project State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMemberIdToAdd, setSelectedMemberIdToAdd] = useState<number | undefined>(undefined);
  const [memberRoleInProject, setMemberRoleInProject] = useState('Contributor');
  const [addingMember, setAddingMember] = useState(false);

  const canCreate = hasRole(['Super Admin', 'President', 'Vice President', 'Domain Head', 'Technical Lead']);
  const canDeleteProject = hasRole(['Super Admin', 'President', 'Vice President']);
  const canManageProject = hasRole(['Super Admin', 'President', 'Vice President']) || 
    (selectedProject !== null && (
      selectedProject.project_lead_id === user?.member_id ||
      (hasRole(['Domain Head', 'Technical Lead']) && user?.domain_id === selectedProject.domain_id)
    ));

  useEffect(() => {
    loadProjects();
  }, [selectedDomain, selectedStatus, search]);

  // Synchronize route paramProjectId with selectedProject
  useEffect(() => {
    if (!paramProjectId) {
      setSelectedProject(null);
      return;
    }
    const pid = Number(paramProjectId);
    const existing = projects.find((p) => p.id === pid);
    if (existing) {
      setSelectedProject(existing);
    } else {
      api.projects.get(pid)
        .then((p) => setSelectedProject(p))
        .catch((err) => console.error('Failed to load project by id:', err));
    }
  }, [paramProjectId, projects]);

  const updateFilters = (newSearch?: string, newDomain?: number, newStatus?: string) => {
    const next = new URLSearchParams(searchParams);
    if (newSearch !== undefined) {
      if (newSearch) next.set('q', newSearch); else next.delete('q');
    }
    if (newDomain !== undefined) {
      if (newDomain) next.set('domain', String(newDomain)); else next.delete('domain');
    }
    if (newStatus !== undefined) {
      if (newStatus) next.set('status', newStatus); else next.delete('status');
    }
    setSearchParams(next);
  };

  const loadProjects = async () => {
    setLoading(true);
    setError(false);
    try {
      const [projData, domainsData, membersData, tasksData] = await Promise.all([
        api.projects.list({
          domain_id: selectedDomain,
          status: selectedStatus || undefined,
          search: search || undefined,
        }),
        api.domains.list().catch(() => []),
        api.members.list().catch(() => []),
        api.tasks.list().catch(() => []),
      ]);
      setProjects(projData);
      setDomains(domainsData);
      setMembers(membersData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
        milestones: [],
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setObjective('');
      setDomainId(undefined);
      setLeadId(undefined);
      setRepoUrl('');
      setDemoUrl('');
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditName(proj.name);
    setEditDescription(proj.description || '');
    setEditDomainId(proj.domain_id);
    setEditLeadId(proj.project_lead_id);
    setEditStatus(proj.status || 'Planning');
    setEditPriority(proj.priority || 'Medium');
    setEditRepoUrl(proj.repository_url || '');
    setEditDemoUrl(proj.demo_url || '');
    setEditTargetDate(proj.target_date ? new Date(proj.target_date).toISOString().split('T')[0] : '');
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setUpdatingProject(true);
    try {
      const updated = await api.projects.update(selectedProject.id, {
        name: editName,
        description: editDescription,
        domain_id: editDomainId,
        project_lead_id: editLeadId,
        status: editStatus,
        priority: editPriority,
        repository_url: editRepoUrl,
        demo_url: editDemoUrl,
        target_date: editTargetDate ? new Date(editTargetDate).toISOString() : undefined,
      });
      setSelectedProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update project');
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleDeleteProject = async (proj: Project) => {
    if (!confirm(`Are you sure you want to permanently delete project '${proj.name}'?`)) return;
    try {
      await api.projects.delete(proj.id);
      setSelectedProject(null);
      setProjects((prev) => prev.filter((p) => p.id !== proj.id));
      navigate('/projects');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete project');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !selectedMemberIdToAdd) return;
    setAddingMember(true);
    try {
      const updated = await api.projects.addMember(selectedProject.id, selectedMemberIdToAdd, memberRoleInProject);
      setSelectedProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setShowAddMemberModal(false);
      setSelectedMemberIdToAdd(undefined);
      setMemberRoleInProject('Contributor');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add member to project');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!selectedProject) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;
    try {
      const updated = await api.projects.removeMember(selectedProject.id, memberId);
      setSelectedProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove member from project');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.lead_name && p.lead_name.toLowerCase().includes(q)) ||
      (p.domain_name && p.domain_name.toLowerCase().includes(q))
    );
  });

  const getProjectProgress = (p: Project) => {
    if (p.total_tasks_count > 0) {
      return Math.round((p.completed_tasks_count / p.total_tasks_count) * 100);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Section 9 & 15) */}
      <PageHeader
        title="Projects"
        description="Professional project tracking, technical milestones, repository deliveries, and task trees."
        actions={
          canCreate ? (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              New Project
            </Button>
          ) : undefined
        }
      >
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search projects, leads, domains..."
              value={search}
              onChange={(e) => updateFilters(e.target.value, undefined, undefined)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDomain || ''}
              onChange={(e) => updateFilters(undefined, e.target.value ? Number(e.target.value) : undefined, undefined)}
              aria-label="Filter by Domain"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Domain: All</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => updateFilters(undefined, undefined, e.target.value)}
              aria-label="Filter by Status"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Status: All</option>
              <option value="Active">Active</option>
              <option value="Planning">Planning</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>

            {(search || selectedDomain || selectedStatus) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => updateFilters('', undefined, '')}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Main Layout: If a project is selected -> Full Project Management View (Section 15); Else Grid */}
      {selectedProject ? (
        /* Section 15: Dedicated Project Management Workspace */
        <div className="space-y-6">
          {/* Back button and Project Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/projects' + (location.search || ''))}
              >
                ← Back to Projects List
              </Button>
              <div className="flex items-center gap-2">
                {canManageProject && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEditModal(selectedProject)}
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Edit Project
                  </Button>
                )}
                {canDeleteProject && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleDeleteProject(selectedProject)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                )}
                <Badge status={selectedProject.status} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedProject.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Lead: <strong className="text-slate-800 dark:text-slate-200">{selectedProject.lead_name || 'Unassigned'}</strong></span>
                  <span>•</span>
                  <span>Domain: <strong className="text-blue-600 dark:text-blue-400">{selectedProject.domain_name || 'General Domain'}</strong></span>
                  <span>•</span>
                  <span>Target: {selectedProject.target_date ? new Date(selectedProject.target_date).toLocaleDateString() : 'TBD'}</span>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-1">
                <ProgressBar
                  progress={getProjectProgress(selectedProject)}
                  label="Delivery Progress"
                  size="md"
                />
              </div>
            </div>

            {/* Section 15 Tabs: Overview | Tasks | Members | Milestones | Files */}
            {(() => {
              const projectTasks = tasks.filter((t) => t.project_id === selectedProject.id);
              const projectMembers = selectedProject.members || [];
              const projectMilestones = selectedProject.milestones || [];

              return (
                <div className="pt-2">
                  <Tabs
                    tabs={[
                      { id: 'overview', label: 'Overview' },
                      { id: 'tasks', label: 'Tasks', count: projectTasks.length },
                      { id: 'members', label: 'Members', count: projectMembers.length },
                      { id: 'milestones', label: 'Milestones', count: projectMilestones.length },
                      { id: 'files', label: 'Files & Code' },
                    ]}
                    activeTab={projectTab}
                    onChange={(tabId) => navigate(`/projects/${selectedProject.id}/${tabId}${location.search || ''}`)}
                  />
                </div>
              );
            })()}
          </div>

          {/* Tab 1: Overview */}
          {projectTab === 'overview' && (() => {
            const projectTasks = tasks.filter((t) => t.project_id === selectedProject.id);
            const completedCount = projectTasks.filter((t) => t.status === 'Completed').length;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card title="Project Scope & Architecture">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedProject.description || 'No detailed description provided.'}
                    </p>

                    {selectedProject.objective && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">
                          Core Objective
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {selectedProject.objective}
                        </p>
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card title="Project Meta">
                    <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      <div className="py-2.5 flex justify-between">
                        <dt className="text-slate-400">Status</dt>
                        <dd><Badge status={selectedProject.status} size="xs" /></dd>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <dt className="text-slate-400">Priority</dt>
                        <dd><Badge variant="rose" size="xs">{selectedProject.priority || 'Medium'}</Badge></dd>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <dt className="text-slate-400">Total Tasks</dt>
                        <dd className="font-semibold text-slate-800 dark:text-slate-200">{projectTasks.length}</dd>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <dt className="text-slate-400">Completed Tasks</dt>
                        <dd className="font-semibold text-emerald-600">{completedCount}</dd>
                      </div>
                    </dl>
                  </Card>
                </div>
              </div>
            );
          })()}

          {/* Tab 2: Tasks Tree / Checklist */}
          {projectTab === 'tasks' && (() => {
            const projectTasks = tasks.filter((t) => t.project_id === selectedProject.id);

            return (
              <Card
                title="Project Tasks Breakdown"
                subtitle="Engineering work packages and task dependencies"
              >
                {projectTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No tasks created for this project yet.</p>
                    <p className="mt-1 text-slate-400">Tasks can be created and assigned individually from the Tasks management page.</p>
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5 font-sans">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                        <FolderGit2 className="w-4 h-4 text-blue-600" />
                        <span>Tasks ({projectTasks.length})</span>
                      </div>

                      <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-800 text-xs">
                        {projectTasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400 font-mono">├──</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-[11px] text-slate-400">{t.assignee_name || 'Unassigned'}</span>
                              <Badge status={t.status} size="xs" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Tab 3: Members */}
          {projectTab === 'members' && (() => {
            const projectMembers = selectedProject.members || [];

            return (
              <Card 
                title="Assigned Team Members" 
                subtitle="Engineers contributing to this project repository"
                action={
                  canManageProject ? (
                    <Button 
                      variant="primary" 
                      size="xs" 
                      onClick={() => setShowAddMemberModal(true)}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Add Member
                    </Button>
                  ) : undefined
                }
              >
                {projectMembers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No members allotted to this project yet.</p>
                    <p className="mt-1 text-slate-400">Leadership and Project Leads can add members as work packages develop.</p>
                    {canManageProject && (
                      <div className="mt-4">
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => setShowAddMemberModal(true)}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Add Member to Project
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {projectMembers.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                        <div className="flex items-center space-x-3 truncate">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {(m.member_name || 'M').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{m.member_name}</div>
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate">{m.role_in_project || 'Contributor'}</div>
                          </div>
                        </div>
                        {canManageProject && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.member_id, m.member_name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-2 shrink-0"
                            title="Remove member from project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Tab 4: Milestones */}
          {projectTab === 'milestones' && (() => {
            const projectMilestones = selectedProject.milestones || [];

            return (
              <Card title="Delivery Milestones & Roadmap">
                {projectMilestones.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No delivery milestones defined yet.</p>
                    <p className="mt-1 text-slate-400">Milestones can be added as technical phases are established.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectMilestones.map((m: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${m.completed ? 'bg-emerald-500 text-white' : 'border border-slate-300'}`}>
                            {m.completed && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-xs font-semibold ${m.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.title}
                          </span>
                        </div>
                        <Badge variant={m.completed ? 'emerald' : 'amber'} size="xs">
                          {m.completed ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Tab 5: Files & Repos */}
          {projectTab === 'files' && (
            <Card title="Repository & Documentation Vault">
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GitBranch className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Git Code Repository</div>
                      <div className="text-[11px] text-slate-500 font-mono">{selectedProject.repository_url || 'https://github.com/technoclub/ai-research-platform'}</div>
                    </div>
                  </div>
                  <a href={selectedProject.repository_url || '#'} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="xs" icon={ExternalLink}>
                      GitHub
                    </Button>
                  </a>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Live Staging Demo</div>
                      <div className="text-[11px] text-slate-500 font-mono">{selectedProject.demo_url || 'https://demo.technoclub.org/ai-research'}</div>
                    </div>
                  </div>
                  <a href={selectedProject.demo_url || '#'} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="xs" icon={ExternalLink}>
                      Live Demo
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Projects List / Grid */
        <div>
          {loading ? (
            <LoadingState type="cards" count={6} />
          ) : error ? (
            <ErrorState onRetry={loadProjects} />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No projects found"
              description="No active technical projects match your search query."
              actionText={canCreate ? 'Initiate Project' : undefined}
              onAction={canCreate ? () => setShowCreateModal(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}${location.search || ''}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {p.domain_name || 'General Domain'}
                      </span>
                      <Badge status={p.status} size="xs" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      {p.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <ProgressBar progress={getProjectProgress(p)} size="sm" />

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span>Lead: <strong className="text-slate-800 dark:text-slate-200">{p.lead_name || 'Unassigned'}</strong></span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center">
                        <span>Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Initiate Technical Project"
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              label="Project Title"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Autonomous Campus Delivery Rover"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Domain"
                options={[
                  { value: '', label: 'Select Domain' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={domainId !== undefined ? domainId.toString() : ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Project Lead (Optional)"
                options={[
                  { value: '', label: '-- None / Unassigned (Optional) --' },
                  ...members.map((m) => ({ value: m.id.toString(), label: m.full_name })),
                ]}
                value={leadId !== undefined ? leadId.toString() : ''}
                onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Input
                label="GitHub Repository URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
              />

              <Input
                label="Demo / Staging URL"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://demo..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Project Scope & Deliverables
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize high-level objectives and technical roadmap..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting}>
                Launch Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member to Project Modal */}
      {showAddMemberModal && selectedProject && (
        <Modal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          title={`Add Member to ${selectedProject.name}`}
        >
          <form onSubmit={handleAddMember} className="space-y-4">
            <Select
              label="Select Club Member *"
              options={[
                { value: '', label: '-- Choose Member --' },
                ...members
                  .filter((m) => !(selectedProject.members || []).some((pm) => pm.member_id === m.id))
                  .map((m) => ({
                    value: m.id.toString(),
                    label: `${m.full_name} (${m.domain_name || 'General'} - ${m.role_title || m.role_name || 'Member'})`
                  }))
              ]}
              value={selectedMemberIdToAdd !== undefined ? selectedMemberIdToAdd.toString() : ''}
              onChange={(e) => setSelectedMemberIdToAdd(e.target.value ? Number(e.target.value) : undefined)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role in Project *
              </label>
              <Select
                options={[
                  { value: 'Contributor', label: 'Contributor' },
                  { value: 'Frontend Lead', label: 'Frontend Lead' },
                  { value: 'Backend Lead', label: 'Backend Lead' },
                  { value: 'Full-Stack Developer', label: 'Full-Stack Developer' },
                  { value: 'AI/ML Engineer', label: 'AI/ML Engineer' },
                  { value: 'Research Specialist', label: 'Research Specialist' },
                  { value: 'UI/UX Designer', label: 'UI/UX Designer' },
                  { value: 'QA / Test Engineer', label: 'QA / Test Engineer' },
                  { value: 'DevOps / Cloud Specialist', label: 'DevOps / Cloud Specialist' },
                ]}
                value={memberRoleInProject}
                onChange={(e) => setMemberRoleInProject(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={addingMember} disabled={!selectedMemberIdToAdd}>
                Allot Member
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit Project: ${selectedProject.name}`}
        >
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <Input
              label="Project Title *"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Domain"
                options={[
                  { value: '', label: 'Select Domain' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={editDomainId !== undefined ? editDomainId.toString() : ''}
                onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Project Lead (Optional)"
                options={[
                  { value: '', label: '-- None / Unassigned (Optional) --' },
                  ...members.map((m) => ({ value: m.id.toString(), label: m.full_name })),
                ]}
                value={editLeadId !== undefined ? editLeadId.toString() : ''}
                onChange={(e) => setEditLeadId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Status"
                options={[
                  { value: 'Planning', label: 'Planning' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Review', label: 'Review' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Archived', label: 'Archived' },
                ]}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              />

              <Select
                label="Priority"
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' },
                ]}
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              />

              <Input
                label="Target Completion Date"
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
              />

              <Input
                label="GitHub Repository URL"
                value={editRepoUrl}
                onChange={(e) => setEditRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
              />

              <Input
                label="Demo / Staging URL"
                value={editDemoUrl}
                onChange={(e) => setEditDemoUrl(e.target.value)}
                placeholder="https://demo..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Project Scope & Deliverables
              </label>
              <textarea
                rows={3}
                required
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={updatingProject}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
