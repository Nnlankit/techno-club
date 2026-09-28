import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Plus, QrCode, CheckCircle2, 
  MapPin, Clock, Users, DollarSign, Download, Sparkles, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Event, Domain, EventRegistration } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const EventsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Registration modal state
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null);
  const [registeredResult, setRegisteredResult] = useState<EventRegistration | null>(null);

  // Scanner modal state
  const [scanToken, setScanToken] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');

  // Event creation form state
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('Workshop');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [venue, setVenue] = useState('Turing Lab (Lab 4)');
  const [capacity, setCapacity] = useState(100);
  const [budget, setBudget] = useState(10000);
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Attendee Roster
  const [eventAttendees, setEventAttendees] = useState<EventRegistration[]>([]);

  useEffect(() => {
    loadEvents();
  }, [selectedType, selectedDomain, selectedStatus]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [eventsData, domainsData] = await Promise.all([
        api.events.list({
          event_type: selectedType || undefined,
          domain_id: selectedDomain,
          status: selectedStatus || undefined,
          search: search || undefined
        }),
        api.domains.list()
      ]);
      setEvents(eventsData);
      setDomains(domainsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.events.create({
        name,
        event_type: eventType,
        domain_id: domainId,
        venue,
        capacity,
        budget,
        description,
        start_time: startTime || new Date().toISOString(),
        end_time: endTime || new Date(Date.now() + 4 * 3600000).toISOString(),
        status: 'Registration Open'
      });
      setShowCreateModal(false);
      resetForm();
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCapacity(100);
    setBudget(10000);
  };

  const handleOpenEventDetail = async (ev: Event) => {
    setSelectedEvent(ev);
    try {
      const regs = await api.events.getRegistrations(ev.id);
      setEventAttendees(regs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterMe = async (ev: Event) => {
    setRegistrationEvent(ev);
    setRegisteredResult(null);
    setShowRegisterModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!registrationEvent) return;
    try {
      const reg = await api.events.register(registrationEvent.id, {
        member_id: user?.member_id
      });
      setRegisteredResult(reg);
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Registration failed');
    }
  };

  const handleScanAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setScanResult(null);
    setScanError('');
    try {
      const res = await api.events.scanAttendance(selectedEvent.id, scanToken.trim());
      setScanResult(res);
      setScanToken('');
      const updated = await api.events.getRegistrations(selectedEvent.id);
      setEventAttendees(updated);
    } catch (err: any) {
      setScanError(err.response?.data?.detail || 'Invalid or duplicate QR code token');
    }
  };

  const eventTypes = [
    'Workshop', 'Seminar', 'Coding Contest', 'Hackathon', 
    'Tech Talk', 'Ideathon', 'Project Expo', 'Technical Fest', 
    'Orientation', 'Training Program'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Event Management & Life Cycle</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {events.length} Events
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Workshops, hackathons, seminars, coding sprints, and project expos with QR-based attendance tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={api.reports.exportCsvUrl('events')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          {hasRole(['President', 'Vice President', 'Domain Head']) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadEvents(); }}
            placeholder="Search events by title, venue, or description..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Event Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Event Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

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
            <option value="Draft">Draft</option>
            <option value="Proposal">Proposal</option>
            <option value="Approved">Approved</option>
            <option value="Registration Open">Registration Open</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No events found matching your filter criteria.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Banner or Header */}
                <div className="relative h-36 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-slate-900 overflow-hidden">
                  {ev.banner_url ? (
                    <img
                      src={ev.banner_url}
                      alt={ev.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-200/40">
                      <Calendar className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-indigo-700 dark:text-indigo-300 backdrop-blur-md shadow-sm">
                      {ev.event_type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={ev.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {ev.domain_name || 'Techno Club Central'}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {ev.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                      <span>{new Date(ev.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                      <span>{ev.registered_count} / {ev.capacity} registered ({ev.attended_count} attended)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEventDetail(ev)}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  View Details & Roster
                </button>

                <div className="flex items-center space-x-2">
                  {ev.status === 'Registration Open' && (
                    <button
                      onClick={() => handleRegisterMe(ev)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Register</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Detail & Attendance Roster Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.name}
          subtitle={`${selectedEvent.event_type} • ${selectedEvent.venue}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Highlights Header */}
            <div className="grid grid-cols-4 gap-3 text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{selectedEvent.registered_count}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Registered</div>
              </div>
              <div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{selectedEvent.attended_count}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Attended</div>
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{selectedEvent.capacity}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Capacity</div>
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">₹{selectedEvent.budget.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Budget</div>
              </div>
            </div>

            {/* Attendance Scanner Button */}
            {hasRole(['President', 'Vice President', 'Domain Head', 'Technical Lead']) && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Event Check-In & Scanner</h4>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300">Scan participant QR registration token or check in manually</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScannerModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Open QR Scanner
                </button>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Event Description & Agenda</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedEvent.description}
              </p>
            </div>

            {/* Registrations List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Participants ({eventAttendees.length})</h4>
              </div>
              {eventAttendees.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No registrations recorded yet.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">Participant</th>
                        <th className="p-2.5">College ID</th>
                        <th className="p-2.5">Token</th>
                        <th className="p-2.5 text-right">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {eventAttendees.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                            {a.attendee_name}
                            <div className="text-[10px] text-slate-400">{a.attendee_email}</div>
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{a.college_id || 'N/A'}</td>
                          <td className="p-2.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{a.qr_code_token}</td>
                          <td className="p-2.5 text-right">
                            {a.attended ? (
                              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Checked In
                              </span>
                            ) : (
                              <span className="text-slate-400">Absent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Register Confirmation Modal */}
      {showRegisterModal && registrationEvent && (
        <Modal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title={`Register for: ${registrationEvent.name}`}
          subtitle="Generate your event pass & cryptographic QR attendance code"
          maxWidth="md"
        >
          {registeredResult ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registration Confirmed!</h3>
              <p className="text-xs text-slate-500">
                Show this unique QR verification token at the event venue to mark attendance:
              </p>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {registeredResult.qr_code_token}
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You are registering as <strong>{user?.full_name}</strong> ({user?.email}). An event registration pass will be created and tied to your member profile.
              </p>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRegistration}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Confirm Registration
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* QR Attendance Scanner Modal */}
      {showScannerModal && selectedEvent && (
        <Modal
          isOpen={showScannerModal}
          onClose={() => {
            setShowScannerModal(false);
            setScanResult(null);
            setScanError('');
          }}
          title={`Scan Attendance: ${selectedEvent.name}`}
          subtitle="Instant QR token verification for participants"
          maxWidth="md"
        >
          <div className="space-y-4">
            <form onSubmit={handleScanAttendance} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter QR Token (or scan with camera reader)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  placeholder="e.g., QR-4A82F10B7C"
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
              >
                Verify & Mark Attendance
              </button>
            </form>

            {scanResult && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                  Attendance Verified Successfully!
                </div>
                <div>Participant: <strong>{scanResult.attendee_name}</strong> ({scanResult.attendee_email})</div>
                <div className="text-[10px] text-emerald-600">Marked at: {new Date(scanResult.marked_at).toLocaleTimeString()}</div>
              </div>
            )}

            {scanError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
                <span>{scanError}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Technical Event"
        subtitle="Workshop, seminar, contest, tech talk, or ideathon"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Autonomous Edge AI Workshop"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organizing Domain
              </label>
              <select
                value={domainId || ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Club-Wide (All Domains)</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Detailed Agenda
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline objectives, prerequisites, and session milestones..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
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
    </div>
  );
};
