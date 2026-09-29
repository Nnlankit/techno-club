import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  CheckSquare, Plus, MessageSquare, Clock, Users, CheckCircle2, 
  AlertCircle, ChevronRight, LayoutGrid, List, Send, Filter,
  ArrowRight, Search, Check, Calendar, Edit3, Trash2, Archive
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Project, Domain, Member } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PageHeader, Card, Badge, Avatar, Button, Input, 
  Select, Table, Column, Modal, EmptyState, LoadingState, ErrorState,
  ConfirmationDialog, Toast
} from '../components/ui';

export const TasksPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { id: paramTaskId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // View Mode: Kanban vs List from URL (preserved across navigation)
  const viewMode = (searchParams.get('view') as 'kanban' | 'list') || 'kanban';

  // Filters from URL Search Params
  const search = searchParams.get('q') || '';
  const filterProject = searchParams.get('project') ? Number(searchParams.get('project')) : undefined;
  const filterDomain = searchParams.get('domain') ? Number(searchParams.get('domain')) : undefined;
  const filterPriority = searchParams.get('priority') || '';

  // Modals & Detail
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const updateFilters = (updates: { q?: string; project?: number | null; domain?: number | null; priority?: string | null; view?: string }) => {
    const next = new URLSearchParams(searchParams);
    if (updates.q !== undefined) {
      if (updates.q) next.set('q', updates.q); else next.delete('q');
    }
    if (updates.project !== undefined) {
      if (updates.project) next.set('project', String(updates.project)); else next.delete('project');
    }
    if (updates.domain !== undefined) {
      if (updates.domain) next.set('domain', String(updates.domain)); else next.delete('domain');
    }
    if (updates.priority !== undefined) {
      if (updates.priority) next.set('priority', updates.priority); else next.delete('priority');
    }
    if (updates.view !== undefined) {
      if (updates.view === 'list') next.set('view', 'list'); else next.delete('view');
    }
    setSearchParams(next);
  };

  // Synchronize route paramTaskId with selectedTask
  useEffect(() => {
    if (!paramTaskId) {
      setSelectedTask(null);
      return;
    }
    const tid = Number(paramTaskId);
    const existing = tasks.find((t) => t.id === tid);
    if (existing) {
      setSelectedTask(existing);
    } else {
      api.tasks.get(tid)
        .then((t) => setSelectedTask(t))
        .catch((err) => console.error('Failed to load task by id:', err));
    }
  }, [paramTaskId, tasks]);

  // Create Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [subtaskTitles, setSubtaskTitles] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Management (President, VP, Domain Head, Admin)
  const canManage = hasRole(['Super Admin', 'President', 'Vice President', 'Domain Head']);

  // Edit Task State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProjectId, setEditProjectId] = useState<number | undefined>(undefined);
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editAssigneeId, setEditAssigneeId] = useState<number | undefined>(undefined);
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [editStatus, setEditStatus] = useState<'Todo' | 'In Progress' | 'Review' | 'Completed' | 'Blocked'>('Todo');
  const [editDueDate, setEditDueDate] = useState('');

  // Delete Task State
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditProjectId(task.project_id || undefined);
    setEditDomainId(task.domain_id || undefined);
    setEditAssigneeId(task.assignee_id || undefined);
    setEditPriority(task.priority);
    setEditStatus(task.status as any);
    setEditDueDate(task.due_date ? task.due_date.slice(0, 10) : '');
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setSubmitting(true);
    try {
      const updated = await api.tasks.update(editingTask.id, {
        title: editTitle,
        description: editDescription,
        project_id: editProjectId,
        domain_id: editDomainId,
        assignee_id: editAssigneeId,
        priority: editPriority,
        status: editStatus,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      });

      setShowEditModal(false);
      setEditingTask(null);
      setToast({
        type: 'success',
        title: 'Task Updated',
        message: `"${editTitle}" updated successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadTasks();
      if (selectedTask?.id === editingTask.id) {
        setSelectedTask(updated);
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update task'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.tasks.delete(taskToDelete.id, false);
      setToast({
        type: 'info',
        title: 'Task Deleted',
        message: `"${taskToDelete.title}" was deleted.`
      });
      setTimeout(() => setToast(null), 4000);
      setTaskToDelete(null);
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }
      loadTasks();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete task'
      });
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterProject, filterDomain, filterPriority]);

  const loadTasks = async () => {
    setLoading(true);
    setError(false);
    try {
      const [tasksData, projData, domainsData, membersData] = await Promise.all([
        api.tasks.list({
          project_id: filterProject,
          domain_id: filterDomain,
          priority: filterPriority || undefined,
        }),
        api.projects.list().catch(() => []),
        api.domains.list().catch(() => []),
        api.members.list().catch(() => []),
      ]);
      setTasks(tasksData);
      setProjects(projData);
      setDomains(domainsData);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const subtasksArray = subtaskTitles
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t, idx) => ({ id: String(idx + 1), title: t, completed: false }));

      await api.tasks.create({
        title,
        description,
        project_id: projectId,
        domain_id: domainId,
        assignee_id: assigneeId,
        priority,
        status: 'Todo',
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        subtasks: subtasksArray,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSubtaskTitles('');
      loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (task: Task, newStatus: Task['status']) => {
    try {
      const updated = await api.tasks.update(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    try {
      const updated = await api.tasks.update(task.id, { subtasks: updatedSubtasks });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setCommenting(true);
    try {
      const comment = await api.tasks.addComment(selectedTask.id, newComment.trim());
      setSelectedTask({
        ...selectedTask,
        comments: [...selectedTask.comments, comment],
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.project_name && t.project_name.toLowerCase().includes(q)) ||
      (t.assignee_name && t.assignee_name.toLowerCase().includes(q))
    );
  });

  // Kanban Columns (Section 16: TODO | IN PROGRESS | REVIEW | DONE)
  const KANBAN_COLUMNS: Array<{ id: Task['status']; label: string; dotColor: string }> = [
    { id: 'Todo', label: 'TODO', dotColor: 'bg-slate-400' },
    { id: 'In Progress', label: 'IN PROGRESS', dotColor: 'bg-blue-600' },
    { id: 'Review', label: 'REVIEW', dotColor: 'bg-amber-500' },
    { id: 'Completed', label: 'DONE', dotColor: 'bg-emerald-500' },
  ];

  // List View Columns
  const listColumns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Task Title',
      render: (t) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
          <div className="text-xs text-slate-400">
            {t.project_name || 'General Task'} {t.domain_name && `• ${t.domain_name}`}
          </div>
        </div>
      ),
    },
    {
      key: 'assignee_name',
      header: 'Assignee',
      render: (t) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {t.assignee_name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (t) => (
        <span className="text-xs font-mono text-slate-500">
          {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No deadline'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => <Badge status={t.priority} size="xs" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <Badge status={t.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="xs" onClick={() => navigate(`/tasks/${t.id}${location.search || ''}`)}>
            Inspect
          </Button>
          {canManage && (
            <>
              <button
                onClick={() => handleOpenEditTask(t)}
                className="p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Task"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTaskToDelete(t)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header (Section 9 & 16) */}
      <PageHeader
        title="Tasks"
        description="Track developer assignments, sprint action items, and task pipelines."
        actions={
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle: Kanban | List (Section 16) */}
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <button
                onClick={() => updateFilters({ view: 'kanban' })}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Kanban Board"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-xs">Kanban</span>
              </button>
              <button
                onClick={() => updateFilters({ view: 'list' })}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="text-xs">List</span>
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              New Task
            </Button>
          </div>
        }
      >
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search tasks, assignees, projects..."
              value={search}
              onChange={(e) => updateFilters({ q: e.target.value })}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterProject || ''}
              onChange={(e) => updateFilters({ project: e.target.value ? Number(e.target.value) : null })}
              aria-label="Filter by Project"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Project: All</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterDomain || ''}
              onChange={(e) => updateFilters({ domain: e.target.value ? Number(e.target.value) : null })}
              aria-label="Filter by Domain"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Domain: All</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => updateFilters({ priority: e.target.value || null })}
              aria-label="Filter by Priority"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Priority: All</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {(search || filterProject || filterDomain || filterPriority) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => updateFilters({ q: '', project: null, domain: null, priority: null })}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState type="cards" count={4} />
      ) : error ? (
        <ErrorState onRetry={loadTasks} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="There are currently no tasks matching your active filters."
          actionText="Create New Task"
          onAction={() => setShowCreateModal(true)}
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <Table<Task>
          columns={listColumns}
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => navigate(`/tasks/${t.id}${location.search || ''}`)}
        />
      ) : (
        /* Section 16 Kanban Board: TODO | IN PROGRESS | REVIEW | DONE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 min-h-[420px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards (Section 16: Keep cards compact and readable) */}
                <div className="space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Empty column
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}${location.search || ''}`)}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {task.title}
                          </span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <Badge status={task.priority} size="xs" />
                            {canManage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditTask(task);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-amber-600 transition-colors"
                                title="Edit Task"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {task.project_name && (
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                            {task.project_name}
                          </div>
                        )}

                        {/* Subtask count */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <CheckSquare className="w-3 h-3" />
                            <span>
                              {task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length} subtasks
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                          <div className="flex items-center space-x-1.5 truncate">
                            <Avatar name={task.assignee_name || 'U'} size="xs" />
                            <span className="truncate">{task.assignee_name || 'Unassigned'}</span>
                          </div>
                          {task.due_date && (
                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => navigate(`/tasks${location.search || ''}`)}
          title={selectedTask.title}
          subtitle={`Project: ${selectedTask.project_name || 'General'} • Assignee: ${selectedTask.assignee_name || 'Unassigned'}`}
        >
          <div className="space-y-5">
            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <Badge status={selectedTask.status} />
                <Badge status={selectedTask.priority} />
                {canManage && (
                  <div className="flex items-center space-x-1.5 ml-2">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Edit3}
                      onClick={() => handleOpenEditTask(selectedTask)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Trash2}
                      onClick={() => setTaskToDelete(selectedTask)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Status Switcher Buttons */}
              <div className="flex items-center gap-1">
                {(['Todo', 'In Progress', 'Review', 'Completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedTask, st)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      selectedTask.status === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {selectedTask.description && (
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedTask.description}
              </div>
            )}

            {/* Subtasks Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Checklist & Subtasks ({selectedTask.subtasks?.length || 0})
              </h4>
              <div className="space-y-1.5">
                {(!selectedTask.subtasks || selectedTask.subtasks.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No checklist items defined.</p>
                ) : (
                  selectedTask.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(selectedTask, st.id)}
                      className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                        {st.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments Feed */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Activity Comments ({selectedTask.comments?.length || 0})
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedTask.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                      <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{c.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Post comment or update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
                <Button variant="primary" size="sm" type="submit" loading={commenting}>
                  Send
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Task"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Input
              label="Task Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assign to Project"
                options={[
                  { value: '', label: 'General / No Project' },
                  ...projects.map((p) => ({ value: p.id.toString(), label: p.name })),
                ]}
                value={projectId !== undefined ? projectId.toString() : ''}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Assignee"
                options={[
                  { value: '', label: 'Unassigned' },
                  ...members.map((m) => ({ value: m.id.toString(), label: m.full_name })),
                ]}
                value={assigneeId !== undefined ? assigneeId.toString() : ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Domain"
                options={[
                  { value: '', label: 'All Domains' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={domainId !== undefined ? domainId.toString() : ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Priority"
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' },
                ]}
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              />
            </div>

            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Checklist Subtasks (one per line)
              </label>
              <textarea
                rows={3}
                value={subtaskTitles}
                onChange={(e) => setSubtaskTitles(e.target.value)}
                placeholder="Database migration&#10;Service method&#10;Unit tests"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting}>
                Create Task
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          title={`Edit Task: ${editingTask.title}`}
          subtitle="Update task details, ownership, deadline, and priority"
        >
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <Input
              label="Task Title"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assign to Project"
                options={[
                  { value: '', label: 'General / No Project' },
                  ...projects.map((p) => ({ value: p.id.toString(), label: p.name })),
                ]}
                value={editProjectId !== undefined ? editProjectId.toString() : ''}
                onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Assignee"
                options={[
                  { value: '', label: 'Unassigned' },
                  ...members.map((m) => ({ value: m.id.toString(), label: m.full_name })),
                ]}
                value={editAssigneeId !== undefined ? editAssigneeId.toString() : ''}
                onChange={(e) => setEditAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Domain"
                options={[
                  { value: '', label: 'All Domains' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={editDomainId !== undefined ? editDomainId.toString() : ''}
                onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Priority"
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' },
                ]}
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
              />

              <Select
                label="Task Status"
                options={[
                  { value: 'Todo', label: 'Todo' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Review', label: 'Review' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Blocked', label: 'Blocked' },
                ]}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
              />

              <Input
                label="Due Date"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Task Description
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Technical instructions and deliverables..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? Completed sprint tasks should ideally be retained for velocity tracking.`}
        confirmLabel="Delete Task"
        confirmVariant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
};
