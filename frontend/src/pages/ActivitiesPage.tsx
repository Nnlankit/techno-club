import React, { useState, useEffect } from 'react';
import { 
  Compass, Plus, Search, Calendar, MapPin, 
  Users, CheckCircle2, DollarSign, Filter, BookOpen, Sparkles,
  Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Activity, Domain, Member } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card, Avatar,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_TYPES = [
  'All',
  'Recruitment Drive',
  'Campus Awareness Campaign',
  'Internal Training Program',
  'Research & Whitepaper',
  'Outreach & CSR Program',
  'Inter-College Delegation',
  'Innovation Sandbox'
];

export const ActivitiesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Add Form State
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('Recruitment Drive');
  const [description, setDescription] = useState('');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [coordinatorId, setCoordinatorId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('Auditorium Hall B');
  const [budget, setBudget] = useState('500');
  const [outcomes, setOutcomes] = useState('');

  // Edit Activity State
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('Recruitment Drive');
  const [editDescription, setEditDescription] = useState('');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editCoordinatorId, setEditCoordinatorId] = useState<number | undefined>(undefined);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editVenue, setEditVenue] = useState('Auditorium Hall B');
  const [editBudget, setEditBudget] = useState('500');
  const [editStatus, setEditStatus] = useState('Active');
  const [editOutcomes, setEditOutcomes] = useState('');

  // Delete State
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setEditTitle(act.title);
    setEditType(act.activity_type);
    setEditDescription(act.description);
    setEditDomainId(act.domain_id || undefined);
    setEditCoordinatorId(act.coordinator_id || undefined);
    setEditStartDate(act.start_date ? act.start_date.slice(0, 10) : '');
    setEditEndDate(act.end_date ? act.end_date.slice(0, 10) : '');
    setEditVenue(act.venue || '');
    setEditBudget(String(act.budget || 0));
    setEditStatus(act.status);
    setEditOutcomes(act.outcomes || '');
    setShowEditModal(true);
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    try {
      await api.activities.update(editingActivity.id, {
        title: editTitle,
        activity_type: editType,
        description: editDescription,
        domain_id: editDomainId,
        coordinator_id: editCoordinatorId,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        end_date: editEndDate ? new Date(editEndDate).toISOString() : undefined,
        venue: editVenue,
        budget: Number(editBudget) || 0,
        status: editStatus,
        outcomes: editOutcomes,
      });

      setShowEditModal(false);
      setEditingActivity(null);
      setToast({
        type: 'success',
        title: 'Activity Updated',
        message: `"${editTitle}" updated successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadData();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update activity'
      });
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    try {
      await api.activities.delete(activityToDelete.id);
      setToast({
        type: 'info',
        title: 'Activity Removed',
        message: `"${activityToDelete.title}" initiative was deleted.`
      });
      setTimeout(() => setToast(null), 4000);
      setActivityToDelete(null);
      loadData();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete activity'
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [actData, domData, memData] = await Promise.all([
        api.activities.list(),
        api.domains.list(),
        api.members.list()
      ]);
      setActivities(actData);
      setDomains(domData);
      setMembers(memData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.activities.create({
        title,
        activity_type: activityType,
        description,
        domain_id: domainId,
        coordinator_id: coordinatorId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate || startDate).toISOString(),
        venue,
        budget: Number(budget) || 0,
        status: 'Active',
        outcomes
      });
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create activity');
    }
  };

  const handleUpdateStatus = async (activityId: number, newStatus: string) => {
    try {
      await api.activities.update(activityId, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update activity status');
    }
  };

  const resetForm = () => {
    setTitle('');
    setActivityType('Recruitment Drive');
    setDescription('');
    setDomainId(undefined);
    setCoordinatorId(undefined);
    setStartDate('');
    setEndDate('');
    setVenue('Auditorium Hall B');
    setBudget('500');
    setOutcomes('');
  };

  const filteredActivities = activities.filter(act => {
    const matchType = selectedType === 'All' || act.activity_type === selectedType;
    const matchSearch = act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.venue && act.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  // KPIs
  const activeCount = activities.filter(a => a.status === 'Active').length;
  const completedCount = activities.filter(a => a.status === 'Completed').length;
  const totalParticipants = activities.reduce((acc, a) => acc + (a.participants_count || 0), 0);

  const canManageActivities = hasRole(['President', 'Vice President', 'Domain Head']);

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Activities"
        description="Recruitment drives, internal training programs, open innovation sandboxes, and social impact outreach."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search initiatives by title, venue, outcomes...'
        }}
        filterProps={{
          filters: [
            {
              key: 'type',
              label: 'Initiative Type',
              value: selectedType,
              onChange: setSelectedType,
              options: ACTIVITY_TYPES.map(t => ({ label: t, value: t }))
            }
          ]
        }}
        primaryAction={
          canManageActivities
            ? {
                label: 'Create Activity',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => setShowAddModal(true)
              }
            : undefined
        }
      />

      {/* KPI Cards (Section 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Initiatives</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bootcamps & drives in progress</p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Completed Programs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {completedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Successfully concluded club initiatives</p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Participants</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {totalParticipants}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Engaged student technologist headcount</p>
        </Card>
      </div>

      {/* Main Grid */}
      {loading ? (
        <LoadingState message="Loading club activities and outreach programs..." />
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          title="No Activities Found"
          description="No club initiatives matched your search. Plan a new drive or campaign."
          action={
            canManageActivities
              ? {
                  label: 'Create Activity',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setShowAddModal(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActivities.map((act) => (
            <Card
              key={act.id}
              className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {act.activity_type}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <Badge status={act.status} />
                    {canManageActivities && (
                      <div className="flex items-center space-x-1 ml-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(act)}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors"
                          title="Edit Activity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActivityToDelete(act)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(act.start_date).toLocaleDateString()} — {new Date(act.end_date).toLocaleDateString()}</span>
                  </div>
                  {act.venue && (
                    <div className="flex items-center space-x-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{act.venue}</span>
                    </div>
                  )}
                  {act.coordinator_name && (
                    <div className="flex items-center space-x-2 pt-1">
                      <Avatar name={act.coordinator_name} size="xs" />
                      <div>
                        <span className="text-[11px] text-slate-400">Lead:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">{act.coordinator_name}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {canManageActivities && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Status Control:</span>
                  <select
                    value={act.status}
                    onChange={(e) => handleUpdateStatus(act.id, e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Activity Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Plan New Club Initiative"
        subtitle="Schedules bootcamps, recruitment drives, whitepapers, or community workshops"
        maxWidth="md"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initiative Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fall 2026 Core Technologist Recruitment Drive"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Activity Type
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ACTIVITY_TYPES.filter(t => t !== 'All').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain (Optional)
              </label>
              <select
                value={domainId || ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Club Wide / Cross-Domain</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditorium Hall B"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Budget Allocation (₹)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Target attendees, expected deliverables, student recruitment goals..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Schedule Initiative
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Activity Modal */}
      {showEditModal && editingActivity && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingActivity(null);
          }}
          title={`Edit Initiative: ${editingActivity.title}`}
          subtitle="Modify initiative dates, venue, budget, or outcomes"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateActivity} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initiative Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACTIVITY_TYPES.filter(t => t !== 'All').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain (Optional)
                </label>
                <select
                  value={editDomainId || ''}
                  onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Club Wide / Cross-Domain</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Budget Allocation (₹)
                </label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Planned">Planned</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Coordinator
                </label>
                <select
                  value={editCoordinatorId || ''}
                  onChange={(e) => setEditCoordinatorId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None / Open</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description & Objectives
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Outcomes & Impact
              </label>
              <textarea
                rows={2}
                value={editOutcomes}
                onChange={(e) => setEditOutcomes(e.target.value)}
                placeholder="Key takeaways, attendees reached, achievements..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingActivity(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!activityToDelete}
        title="Delete Initiative"
        message={`Are you sure you want to delete "${activityToDelete?.title}"? Completed activities should typically remain recorded in club records.`}
        confirmLabel="Delete Initiative"
        confirmVariant="danger"
        onConfirm={handleDeleteActivity}
        onCancel={() => setActivityToDelete(null)}
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
