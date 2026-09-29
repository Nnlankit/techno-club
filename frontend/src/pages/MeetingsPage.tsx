import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Calendar, MapPin, Users, CheckCircle2, 
  ExternalLink, FileText, ChevronRight, MessageSquare,
  Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Meeting, Domain, Member } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

export const MeetingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Modals
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('Executive Leadership');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMins, setDurationMins] = useState(60);
  const [location, setLocation] = useState('Club Room / Lab 4');
  const [meetingLink, setMeetingLink] = useState('');
  const [agenda, setAgenda] = useState('');

  // Meeting notes & action items form
  const [momText, setMomText] = useState('');
  const [decisionsText, setDecisionsText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Leadership checks
  const canSchedule = hasRole(['President', 'Vice President', 'Domain Head']);
  const canManage = hasRole(['Super Admin', 'President', 'Vice President', 'Domain Head']);

  // Edit Meeting State
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('Executive Leadership');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editLocation, setEditLocation] = useState('Club Room / Lab 4');
  const [editLink, setEditLink] = useState('');
  const [editAgenda, setEditAgenda] = useState('');

  // Delete Meeting State
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const fmtDate = (dStr?: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
  };

  const handleOpenEdit = (m: Meeting) => {
    setEditingMeeting(m);
    setEditTitle(m.title);
    setEditType(m.meeting_type);
    setEditDomainId(m.domain_id || undefined);
    setEditScheduledAt(fmtDate(m.scheduled_at));
    setEditDuration(m.duration_minutes);
    setEditLocation(m.location || '');
    setEditLink(m.meeting_link || '');
    setEditAgenda(m.agenda || '');
    setShowEditModal(true);
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    try {
      const updated = await api.meetings.update(editingMeeting.id, {
        title: editTitle,
        meeting_type: editType,
        domain_id: editDomainId,
        scheduled_at: editScheduledAt ? new Date(editScheduledAt).toISOString() : undefined,
        duration_minutes: editDuration,
        location: editLocation,
        meeting_link: editLink || undefined,
        agenda: editAgenda,
      });

      setShowEditModal(false);
      setEditingMeeting(null);
      setToast({
        type: 'success',
        title: 'Meeting Updated',
        message: `"${editTitle}" updated successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadMeetings();
      if (selectedMeeting?.id === editingMeeting.id) {
        setSelectedMeeting(updated);
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update meeting'
      });
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;
    try {
      await api.meetings.delete(meetingToDelete.id);
      setToast({
        type: 'info',
        title: 'Meeting Cancelled',
        message: `"${meetingToDelete.title}" was cancelled and removed.`
      });
      setTimeout(() => setToast(null), 4000);
      setMeetingToDelete(null);
      if (selectedMeeting?.id === meetingToDelete.id) {
        setSelectedMeeting(null);
      }
      loadMeetings();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to cancel meeting'
      });
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const [mList, dList, memList] = await Promise.all([
        api.meetings.list(),
        api.domains.list(),
        api.members.list()
      ]);
      setMeetings(mList);
      setDomains(dList);
      setMembers(memList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.meetings.schedule({
        title,
        meeting_type: meetingType,
        domain_id: domainId,
        scheduled_at: scheduledAt || new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: durationMins,
        location,
        meeting_link: meetingLink || undefined,
        agenda
      });
      setShowScheduleModal(false);
      setTitle('');
      setAgenda('');
      loadMeetings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to schedule meeting');
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedMeeting) return;
    setSavingNotes(true);
    try {
      const updated = await api.meetings.update(selectedMeeting.id, {
        minutes_of_meeting: momText,
        decisions: decisionsText
      });
      setSelectedMeeting(updated);
      await loadMeetings();
      alert('Meeting notes updated successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const meetingTypes = [
    'Executive Leadership', 'Domain Sync', 'Core Team', 
    'Project Standup', 'Event Briefing', 'General Body'
  ];

  const filteredMeetings = meetings.filter((m) => {
    const matchType = selectedType === 'All' || m.meeting_type === selectedType;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.agenda && m.agenda.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.domain_name && m.domain_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Meetings"
        description="Meeting governance, strategic agendas, institutional memory, minutes of meeting (MoM), and actionable decisions."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search meetings by title, agenda, location...'
        }}
        filterProps={{
          filters: [
            {
              key: 'type',
              label: 'Meeting Type',
              value: selectedType,
              onChange: setSelectedType,
              options: [
                { label: 'All Types', value: 'All' },
                ...meetingTypes.map(t => ({ label: t, value: t }))
              ]
            }
          ]
        }}
        primaryAction={
          canSchedule
            ? {
                label: 'Schedule Meeting',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => setShowScheduleModal(true)
              }
            : undefined
        }
      />

      {/* Meetings List */}
      {loading ? (
        <LoadingState message="Loading scheduled meetings and MoM notes..." />
      ) : filteredMeetings.length === 0 ? (
        <EmptyState
          title="No Meetings Scheduled"
          description="There are currently no meetings matching your criteria."
          action={
            canSchedule
              ? {
                  label: 'Schedule Meeting',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setShowScheduleModal(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((m) => {
            const hasNotes = Boolean(m.minutes_of_meeting || m.decisions);
            return (
              <Card
                key={m.id}
                onClick={() => {
                  setSelectedMeeting(m);
                  setMomText(m.minutes_of_meeting || '');
                  setDecisionsText(m.decisions || '');
                }}
                className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between group shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {m.meeting_type}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <Badge status={hasNotes ? 'Completed' : 'Active'} />
                      {canManage && (
                        <div className="flex items-center space-x-1 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors"
                            title="Edit Meeting"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMeetingToDelete(m)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Cancel / Delete Meeting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {m.title}
                    </h3>
                    {m.agenda && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {m.agenda}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(m.scheduled_at).toLocaleDateString()} at {new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duration: {m.duration_minutes} minutes</span>
                    </div>
                    {m.location && (
                      <div className="flex items-center space-x-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{m.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{hasNotes ? 'Review MoM & Action Items' : 'Draft Minutes'}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meeting Details & MoM Editor Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          title={selectedMeeting.title}
          subtitle={`${selectedMeeting.meeting_type} • ${new Date(selectedMeeting.scheduled_at).toLocaleDateString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Date & Time</span>
                <strong className="text-slate-900 dark:text-white">
                  {new Date(selectedMeeting.scheduled_at).toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Venue / Room</span>
                <strong className="text-slate-900 dark:text-white">{selectedMeeting.location || 'Club Room'}</strong>
              </div>
            </div>

            {selectedMeeting.agenda && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Meeting Agenda
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedMeeting.agenda}
                </p>
              </div>
            )}

            {/* Minutes of Meeting (MoM) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-blue-500" />
                <span>Minutes of Meeting (MoM)</span>
              </h4>
              <textarea
                rows={4}
                value={momText}
                onChange={(e) => setMomText(e.target.value)}
                placeholder="Log discussion points, topics covered, and updates from domains..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Action Items & Decisions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                <span>Key Decisions & Next Steps</span>
              </h4>
              <textarea
                rows={3}
                value={decisionsText}
                onChange={(e) => setDecisionsText(e.target.value)}
                placeholder="1. Domain lead will finalize syllabus by Friday&#10;2. Treasurer approved ₹5,000 for equipment..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    onClick={() => {
                      handleOpenEdit(selectedMeeting);
                    }}
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      setMeetingToDelete(selectedMeeting);
                    }}
                  >
                    Cancel Meeting
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMeeting(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={savingNotes}
                onClick={handleUpdateNotes}
              >
                Save Minutes & Decisions
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Governance Meeting"
        subtitle="Invites council members and sets up strategic agenda"
        maxWidth="md"
      >
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Executive Sprint Sync"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meeting Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {meetingTypes.map(t => (
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
                <option value="">Executive / All Domains</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Venue
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Club Room / Lab 4"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Virtual Link (Optional)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agenda Topics
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Key discussion topics, demo checkpoints, and blockers to review..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Meeting Modal */}
      {showEditModal && editingMeeting && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingMeeting(null);
          }}
          title={`Edit Meeting: ${editingMeeting.title}`}
          subtitle="Modify meeting details, schedule, venue, and agenda"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateMeeting} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meeting Title
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
                  Meeting Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {meetingTypes.map((t) => (
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
                  <option value="">Executive / All Domains</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editScheduledAt}
                  onChange={(e) => setEditScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Virtual Link (Optional)
                </label>
                <input
                  type="url"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agenda Topics
              </label>
              <textarea
                rows={3}
                value={editAgenda}
                onChange={(e) => setEditAgenda(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMeeting(null);
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
        isOpen={!!meetingToDelete}
        title="Cancel Meeting"
        message={`Are you sure you want to cancel "${meetingToDelete?.title}"? All participants will be notified and recorded MoM notes will be removed.`}
        confirmLabel="Cancel Meeting"
        confirmVariant="danger"
        onConfirm={handleDeleteMeeting}
        onCancel={() => setMeetingToDelete(null)}
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
