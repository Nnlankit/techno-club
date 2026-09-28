import React, { useState, useEffect } from 'react';
import { 
  Compass, Plus, Search, Calendar, MapPin, 
  Users, CheckCircle2, DollarSign, Filter, BookOpen, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Activity, Domain, Member } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
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

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Special Initiatives & Club Activities</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {activities.length} Initiatives
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recruitment cycles, orientation bootcamps, open innovation sandboxes, and social impact technical outreach.
          </p>
        </div>
        {hasRole(['President', 'Vice President', 'Domain Head']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Initiative</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Initiatives"
          value={activeCount.toString()}
          subtitle="Currently running across domains"
          icon={<Compass className="w-5 h-5 text-indigo-500" />}
          color="indigo"
        />
        <StatCard
          title="Completed Programs"
          value={completedCount.toString()}
          subtitle="Documented with reports & outcomes"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          title="Campus Footprint"
          value={`${totalParticipants}+`}
          subtitle="Students engaged in open programs"
          icon={<Users className="w-5 h-5 text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {ACTIVITY_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search initiative title, venue..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Loading initiatives catalog...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            No initiatives found matching filters.
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {act.activity_type}
                  </span>
                  <StatusBadge status={act.status} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {act.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {act.description}
                </p>

                {act.outcomes && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-indigo-600 dark:text-indigo-400">Target Outcome:</strong> {act.outcomes}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(act.start_date).toLocaleDateString()}</span>
                  </span>
                  {act.venue && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{act.venue}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>Coordinator: <strong className="text-slate-700 dark:text-slate-300">{act.coordinator_name || 'Assigned'}</strong></span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">${act.budget} Budget</span>
                </div>

                {hasRole(['President', 'Vice President', 'Domain Head']) && act.status === 'Active' && (
                  <button
                    onClick={() => handleUpdateStatus(act.id, 'Completed')}
                    className="w-full mt-2 py-1 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Initiative Completed</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Launch Initiative Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Launch Club Activity / Initiative"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initiative Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fall 2026 Technologist Recruitment & Orientation Drive"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Activity Type *
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {ACTIVITY_TYPES.filter(t => t !== 'All').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Domain
              </label>
              <select
                value={domainId || ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">Club-wide Initiative</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue / Campus Hub
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditorium Hall B"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approved Budget ($)
              </label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, target participants, and execution plan..."
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expected Outcomes & Deliverables
            </label>
            <textarea
              rows={2}
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              placeholder="e.g. Onboard 40 first-year student developers into domain learning tracks."
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Launch Initiative
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
