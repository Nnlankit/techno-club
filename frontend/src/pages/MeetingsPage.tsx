import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Calendar, MapPin, Users, CheckCircle2, 
  ExternalLink, FileText, ChevronRight 
} from 'lucide-react';
import { api } from '../services/api';
import { Meeting, Domain, Member } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const MeetingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const updated = await api.meetings.update(selectedMeeting.id, {
        minutes_of_meeting: momText,
        decisions: decisionsText
      });
      setSelectedMeeting(updated);
      loadMeetings();
      alert('Meeting notes updated successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const meetingTypes = [
    'Executive Leadership', 'Domain Sync', 'Core Team', 
    'Project Standup', 'Event Briefing', 'General Body'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Meeting Governance & Minutes (MoM)</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {meetings.length} Recorded
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain institutional memory, strategic agendas, actionable decisions, and follow-ups.
          </p>
        </div>

        {hasRole(['President', 'Vice President', 'Domain Head']) && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading scheduled meetings...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No meetings scheduled yet.
          </div>
        ) : (
          meetings.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                setSelectedMeeting(m);
                setMomText(m.minutes_of_meeting || '');
                setDecisionsText(m.decisions || '');
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {m.meeting_type}
                  </span>
                  <StatusBadge status={m.status} />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {m.agenda}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>{new Date(m.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span className="truncate">{m.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] text-slate-400">
                  By: {m.organizer_name || 'Leadership'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center">
                  <span>Minutes (MoM)</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Meeting Detail & MoM Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          title={selectedMeeting.title}
          subtitle={`${selectedMeeting.meeting_type} • ${new Date(selectedMeeting.scheduled_at).toLocaleString()}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Location / Platform</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedMeeting.location}</p>
              </div>
              {selectedMeeting.meeting_link && (
                <a
                  href={selectedMeeting.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Join Link</span>
                </a>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Agenda Items</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedMeeting.agenda}
              </p>
            </div>

            {/* Minutes of Meeting Editor / Viewer */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Minutes of Meeting (MoM)</h4>
              <textarea
                rows={4}
                value={momText}
                onChange={(e) => setMomText(e.target.value)}
                placeholder="Enter discussion summaries, attendance notes, and presentations..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Decisions Made</h4>
              <textarea
                rows={3}
                value={decisionsText}
                onChange={(e) => setDecisionsText(e.target.value)}
                placeholder="Key council consensus and approved motions..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            {hasRole(['President', 'Vice President', 'Domain Head']) && (
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleUpdateNotes}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                >
                  Save Meeting Minutes
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Council or Domain Meeting"
        subtitle="Notifies attendees and syncs with the unified club calendar"
        maxWidth="lg"
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
              placeholder="e.g., Bi-Weekly Core Operations Sync"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {meetingTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain (Optional)
              </label>
              <select
                value={domainId || ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Executive / All Domains</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lab 4 / Boardroom"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Virtual Meeting Link (Zoom / Meet)
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting Agenda
            </label>
            <textarea
              rows={3}
              required
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="1. Review domain sprint velocity&#10;2. Equipment signouts..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Schedule Meeting
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
