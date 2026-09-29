import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, Search, Filter, Plus, QrCode, CheckCircle2, 
  MapPin, Clock, Users, DollarSign, Download, Sparkles, 
  Grid, List, CalendarDays, ExternalLink, ArrowRight, X,
  Edit3, Copy, Trash2, Archive, Ban
} from 'lucide-react';
import { api } from '../services/api';
import { Event, Domain, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PageHeader, Card, Badge, Button, Input, Select, 
  Table, Column, Modal, EmptyState, LoadingState, ErrorState,
  ConfirmationDialog, Toast
} from '../components/ui';

export const EventsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { id: paramEventId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState<Event[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // View mode switcher: List | Grid | Calendar (Section 14)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');

  // Filters (Section 14: [Search] [Type] [Domain] [Status])
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Registration modal state
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null);
  const [registeredResult, setRegisteredResult] = useState<EventRegistration | null>(null);
  const [registering, setRegistering] = useState(false);

  // Scanner modal state
  const [scanToken, setScanToken] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);

  // Event creation form state
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('Workshop');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [venue, setVenue] = useState('Main Auditorium');
  const [capacity, setCapacity] = useState(120);
  const [budget, setBudget] = useState(10000);
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [submitting, setSubmitting] = useState(false);

  // Attendee Roster
  const [eventAttendees, setEventAttendees] = useState<EventRegistration[]>([]);

  // Management (President, VP, Admin)
  const canCreate = hasRole(['President', 'Vice President', 'Domain Head', 'Faculty Coordinator']);
  const canManage = hasRole(['Super Admin', 'President', 'Vice President']);

  // Edit Event State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Workshop');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editVenue, setEditVenue] = useState('Main Auditorium');
  const [editCapacity, setEditCapacity] = useState(120);
  const [editBudget, setEditBudget] = useState(10000);
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editStatus, setEditStatus] = useState('Upcoming');

  // Deletion / Archive Confirmation State
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToArchive, setEventToArchive] = useState<Event | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const handleOpenEditModal = (ev: Event) => {
    setEditingEvent(ev);
    setEditName(ev.name);
    setEditType(ev.event_type);
    setEditDomainId(ev.domain_id || undefined);
    setEditVenue(ev.venue);
    setEditCapacity(ev.capacity);
    setEditBudget(ev.budget);
    setEditDescription(ev.description || '');
    const fmtDate = (dStr?: string) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
    };
    setEditStartTime(fmtDate(ev.start_time));
    setEditEndTime(fmtDate(ev.end_time));
    setEditStatus(ev.status);
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    try {
      await api.events.update(editingEvent.id, {
        name: editName,
        event_type: editType,
        domain_id: editDomainId,
        venue: editVenue,
        capacity: editCapacity,
        budget: editBudget,
        description: editDescription,
        start_time: editStartTime ? new Date(editStartTime).toISOString() : undefined,
        end_time: editEndTime ? new Date(editEndTime).toISOString() : undefined,
        status: editStatus,
      });
      setShowEditModal(false);
      setEditingEvent(null);
      setToast({
        type: 'success',
        title: 'Event Updated',
        message: `"${editName}" details were successfully updated.`
      });
      setTimeout(() => setToast(null), 4000);
      loadEvents();
      if (selectedEvent && selectedEvent.id === editingEvent.id) {
        api.events.get(editingEvent.id).then(setSelectedEvent).catch(() => {});
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update event'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicateEvent = async (ev: Event) => {
    try {
      const duplicated = await api.events.duplicate(ev.id);
      setToast({
        type: 'success',
        title: 'Event Cloned',
        message: `Duplicated as "${duplicated.name}" in Draft status.`
      });
      setTimeout(() => setToast(null), 4000);
      loadEvents();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Duplicate Failed',
        message: err.response?.data?.detail || 'Failed to clone event'
      });
    }
  };

  const handleArchiveEvent = async (ev: Event) => {
    try {
      await api.events.delete(ev.id, true);
      setToast({
        type: 'info',
        title: 'Event Archived',
        message: `"${ev.name}" marked as archived.`
      });
      setTimeout(() => setToast(null), 4000);
      setEventToArchive(null);
      loadEvents();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.response?.data?.detail || 'Failed to archive event'
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await api.events.delete(eventToDelete.id, false);
      setToast({
        type: 'info',
        title: 'Event Deleted',
        message: `"${eventToDelete.name}" was removed.`
      });
      setTimeout(() => setToast(null), 4000);
      setEventToDelete(null);
      if (selectedEvent?.id === eventToDelete.id) {
        setSelectedEvent(null);
      }
      loadEvents();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete event'
      });
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedType, selectedDomain, selectedStatus]);

  const loadEvents = async () => {
    setLoading(true);
    setError(false);
    try {
      const [eventsData, domainsData] = await Promise.all([
        api.events.list({
          event_type: selectedType || undefined,
          domain_id: selectedDomain,
          status: selectedStatus || undefined,
          search: search || undefined,
        }),
        api.domains.list().catch(() => []),
      ]);
      setEvents(eventsData);
      setDomains(domainsData);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEvents();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const now = new Date();
      const start = startTime ? new Date(startTime).toISOString() : new Date(now.getTime() + 7 * 86400000).toISOString();
      const end = endTime ? new Date(endTime).toISOString() : new Date(now.getTime() + 7 * 86400000 + 4 * 3600000).toISOString();

      await api.events.create({
        name,
        event_type: eventType,
        domain_id: domainId,
        venue,
        capacity,
        budget,
        description,
        start_time: start,
        end_time: end,
        status: status || 'Upcoming',
      });
      setShowCreateModal(false);
      resetForm();
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCapacity(120);
    setBudget(10000);
    setStartTime('');
    setEndTime('');
    setStatus('Upcoming');
  };

  const handleOpenEventDetail = async (ev: Event) => {
    setSelectedEvent(ev);
    try {
      const regs = await api.events.getRegistrations(ev.id);
      setEventAttendees(regs);
    } catch (err) {
      console.error('Failed to load attendees:', err);
    }
  };

  // Synchronize route paramEventId with selectedEvent
  useEffect(() => {
    if (!paramEventId) {
      setSelectedEvent(null);
      setEventAttendees([]);
      return;
    }
    const eid = Number(paramEventId);
    const existing = events.find((e) => e.id === eid);
    if (existing) {
      handleOpenEventDetail(existing);
    } else {
      api.events.get(eid)
        .then((ev) => handleOpenEventDetail(ev))
        .catch((err) => console.error('Failed to load event by id:', err));
    }
  }, [paramEventId, events]);

  const handleRegisterMe = async (ev: Event) => {
    setRegistrationEvent(ev);
    setRegisteredResult(null);
    setShowRegisterModal(true);
    setRegistering(true);
    try {
      const reg = await api.events.register(ev.id, {
        member_id: user?.member_id,
        guest_name: user?.full_name,
        guest_email: user?.email,
      });
      setRegisteredResult(reg);
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete registration');
      setShowRegisterModal(false);
    } finally {
      setRegistering(false);
    }
  };

  const handleScanAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !scanToken.trim()) return;
    setScanning(true);
    setScanResult(null);
    setScanError('');
    try {
      const res = await api.events.scanAttendance(selectedEvent.id, scanToken.trim());
      setScanResult(res);
      setScanToken('');
      const regs = await api.events.getRegistrations(selectedEvent.id);
      setEventAttendees(regs);
    } catch (err: any) {
      setScanError(err.response?.data?.detail || 'Invalid or already scanned QR code ticket');
    } finally {
      setScanning(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ev.name.toLowerCase().includes(q) ||
      ev.venue.toLowerCase().includes(q) ||
      ev.event_type.toLowerCase().includes(q) ||
      (ev.domain_name && ev.domain_name.toLowerCase().includes(q))
    );
  });

  // Table Columns for List View
  const listColumns: Column<Event>[] = [
    {
      key: 'name',
      header: 'Event Name',
      render: (ev) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{ev.name}</div>
          <div className="text-xs text-slate-400">{ev.event_type} • {ev.venue}</div>
        </div>
      ),
    },
    {
      key: 'domain_name',
      header: 'Domain',
      render: (ev) => <span>{ev.domain_name || 'Club-Wide'}</span>,
    },
    {
      key: 'start_time',
      header: 'Date & Time',
      render: (ev) => (
        <span className="font-mono text-xs">
          {new Date(ev.start_time).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'registered_count',
      header: 'Registered',
      render: (ev) => (
        <span>
          <strong>{ev.registered_count}</strong> / {ev.capacity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (ev) => <Badge status={ev.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (ev) => (
        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="xs" onClick={() => navigate(`/events/${ev.id}${location.search || ''}`)}>
            View
          </Button>
          <Button variant="outline" size="xs" onClick={() => handleRegisterMe(ev)}>
            Register
          </Button>
          {canManage && (
            <>
              <button
                onClick={() => handleOpenEditModal(ev)}
                className="p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Event"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDuplicateEvent(ev)}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Duplicate Event"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEventToArchive(ev)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Archive Event"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEventToDelete(ev)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete Event"
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
      {/* Page Header (Section 14) */}
      <PageHeader
        title="Events & Workshops"
        description="Flagship summits, technical workshops, hackathons, and guest seminars."
        actions={
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle: List | Grid | Calendar (Section 14) */}
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Calendar View"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>

            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              >
                Create Event
              </Button>
            )}
          </div>
        }
      >
        {/* Search & Filters Row (Section 14: [Search] [Type] [Domain] [Status]) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, workshops, venues..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by Event Type"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Type: All</option>
              <option value="Workshop">Workshop</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Bootcamp">Bootcamp</option>
              <option value="Tech Talk">Tech Talk</option>
              <option value="Seminar">Seminar</option>
            </select>

            <select
              value={selectedDomain || ''}
              onChange={(e) => setSelectedDomain(e.target.value ? Number(e.target.value) : undefined)}
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
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Status: All</option>
              <option value="Registration Open">Registration Open</option>
              <option value="Registration Closed">Registration Closed</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>

            {(search || selectedType || selectedDomain || selectedStatus) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearch('');
                  setSelectedType('');
                  setSelectedDomain(undefined);
                  setSelectedStatus('');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState type="cards" count={6} />
      ) : error ? (
        <ErrorState onRetry={loadEvents} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming events"
          description="There are no events scheduled yet matching your criteria."
          actionText={canCreate ? 'Create Event' : undefined}
          onAction={canCreate ? () => setShowCreateModal(true) : undefined}
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <Table<Event>
          columns={listColumns}
          data={filteredEvents}
          keyExtractor={(ev) => ev.id}
          onRowClick={(ev) => navigate(`/events/${ev.id}${location.search || ''}`)}
        />
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Club Event Schedule</h3>
            <span className="text-xs text-slate-400">September - December 2026</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}${location.search || ''}`)}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(ev.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ev.name}</h4>
                <p className="text-xs text-slate-500">{ev.venue} • {ev.event_type}</p>
                <Badge status={ev.status} size="xs" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Grid View (Section 14: Event Card layout) */
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Events & Workshops ({filteredEvents.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}${location.search || ''}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <Badge variant="blue" size="xs">
                        {ev.event_type}
                      </Badge>
                      <Badge status={ev.status} size="xs" />
                    </div>
                    {canManage && (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateEvent(ev)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Duplicate Event"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEventToArchive(ev)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Archive Event"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEventToDelete(ev)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {ev.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(ev.start_time).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ev.venue}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ev.registered_count} Registered ({ev.capacity} Capacity)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${ev.id}${location.search || ''}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegisterMe(ev);
                    }}
                  >
                    Register
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => navigate(`/events${location.search || ''}`)}
          title={selectedEvent.name}
          subtitle={`${selectedEvent.event_type} • ${selectedEvent.venue}`}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2">
                <Badge status={selectedEvent.status} />
                <span className="text-xs text-slate-500">
                  Domain: <strong>{selectedEvent.domain_name || 'Club-Wide'}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => handleRegisterMe(selectedEvent)}
                >
                  Register Now
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Edit3}
                      onClick={() => handleOpenEditModal(selectedEvent)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Copy}
                      onClick={() => handleDuplicateEvent(selectedEvent)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Archive}
                      onClick={() => setEventToArchive(selectedEvent)}
                    >
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Trash2}
                      onClick={() => setEventToDelete(selectedEvent)}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {canCreate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    icon={QrCode}
                    onClick={() => setShowScannerModal(true)}
                  >
                    Scan Attendance QR
                  </Button>
                )}
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedEvent.description}
            </div>

            {/* Attendance Roster Table */}
            {canCreate && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registered Attendees ({eventAttendees.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Attended: {eventAttendees.filter(a => a.attended).length}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {eventAttendees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No attendees registered yet.
                    </div>
                  ) : (
                    eventAttendees.map((reg) => (
                      <div key={reg.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {reg.attendee_name || 'Participant'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Pass: {reg.qr_code_token}
                          </div>
                        </div>
                        <Badge variant={reg.attended ? 'emerald' : 'slate'} size="xs">
                          {reg.attended ? 'Attended' : 'Registered'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Register Confirmation Modal */}
      {showRegisterModal && (
        <Modal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title="Event Registration Pass"
        >
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Successfully Registered!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your registration pass for <strong>{registrationEvent?.name}</strong> is confirmed.
            </p>

            {registeredResult && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 inline-block text-center space-y-2">
                <QrCode className="w-20 h-20 text-slate-800 dark:text-slate-200 mx-auto" />
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {registeredResult.qr_code_token}
                </div>
                <p className="text-[10px] text-slate-400">Present this QR code ticket at the entrance</p>
              </div>
            )}

            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowRegisterModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Scanner Attendance Modal */}
      {showScannerModal && selectedEvent && (
        <Modal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          title={`Scan Attendance • ${selectedEvent.name}`}
        >
          <form onSubmit={handleScanAttendance} className="space-y-4">
            <p className="text-xs text-slate-500">
              Enter or scan the attendee's alphanumeric pass token:
            </p>

            <Input
              label="QR Code Token"
              required
              autoFocus
              value={scanToken}
              onChange={(e) => setScanToken(e.target.value)}
              placeholder="e.g. TC-EVT-9281-PASS"
            />

            {scanResult && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Attendance validated and recorded for participant!</span>
              </div>
            )}

            {scanError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {scanError}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowScannerModal(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={scanning}>
                Check-In Attendee
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Techno Club Event"
        >
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <Input
              label="Event Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechnoHack 2026 Hackathon"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Event Type"
                options={[
                  { value: 'Workshop', label: 'Workshop' },
                  { value: 'Hackathon', label: 'Hackathon' },
                  { value: 'Bootcamp', label: 'Bootcamp' },
                  { value: 'Tech Talk', label: 'Tech Talk' },
                  { value: 'Seminar', label: 'Seminar' },
                ]}
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              />

              <Select
                label="Host Domain"
                options={[
                  { value: '', label: 'Club-Wide / Core' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={domainId !== undefined ? domainId.toString() : ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Event Status"
                options={[
                  { value: 'Upcoming', label: 'Upcoming' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Registration Open', label: 'Registration Open' },
                ]}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />

              <Input
                label="Venue / Hall"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Main Auditorium"
              />

              <Input
                label="Seating Capacity"
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />

              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <Input
                label="End Date & Time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event Description & Learning Plan
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline syllabus, guest mentors, rules, and expectations..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting}>
                Publish Event
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          title={`Edit Event: ${editingEvent.name}`}
          subtitle="Update schedule, capacity, venue, and status"
        >
          <form onSubmit={handleUpdateEvent} className="space-y-4">
            <Input
              label="Event Name"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Event Type"
                options={[
                  { value: 'Workshop', label: 'Workshop' },
                  { value: 'Hackathon', label: 'Hackathon' },
                  { value: 'Bootcamp', label: 'Bootcamp' },
                  { value: 'Tech Talk', label: 'Tech Talk' },
                  { value: 'Seminar', label: 'Seminar' },
                ]}
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
              />

              <Select
                label="Host Domain"
                options={[
                  { value: '', label: 'Club-Wide / Core' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={editDomainId !== undefined ? editDomainId.toString() : ''}
                onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />

              <Select
                label="Event Status"
                options={[
                  { value: 'Upcoming', label: 'Upcoming' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Registration Open', label: 'Registration Open' },
                  { value: 'Registration Closed', label: 'Registration Closed' },
                  { value: 'Ongoing', label: 'Ongoing' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                  { value: 'Archived', label: 'Archived' },
                ]}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              />

              <Input
                label="Venue / Hall"
                required
                value={editVenue}
                onChange={(e) => setEditVenue(e.target.value)}
              />

              <Input
                label="Seating Capacity"
                type="number"
                required
                value={editCapacity}
                onChange={(e) => setEditCapacity(Number(e.target.value))}
              />

              <Input
                label="Budget (₹)"
                type="number"
                required
                value={editBudget}
                onChange={(e) => setEditBudget(Number(e.target.value))}
              />

              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />

              <Input
                label="End Date & Time"
                type="datetime-local"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Event Description & Learning Plan
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
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEvent(null);
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

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!eventToArchive}
        title="Archive Event"
        message={`Are you sure you want to archive "${eventToArchive?.name}"? The event will be closed to new registrations and preserved in the club archives.`}
        confirmLabel="Archive Event"
        onConfirm={() => {
          if (eventToArchive) return handleArchiveEvent(eventToArchive);
        }}
        onCancel={() => setEventToArchive(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!eventToDelete}
        title="Delete Event"
        message={`Are you sure you want to permanently delete "${eventToDelete?.name}"? Completed events with registered attendees should typically be archived instead.`}
        confirmLabel="Delete Event"
        confirmVariant="danger"
        onConfirm={handleDeleteEvent}
        onCancel={() => setEventToDelete(null)}
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
