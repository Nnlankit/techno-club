import React, { useState, useEffect } from 'react';
import { 
  QrCode, CheckCircle2, XCircle, Users, Calendar, 
  Search, ShieldCheck, CheckCheck, Clock, UserCheck, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Event, EventRegistration } from '../types';
import { 
  Button, Badge, PageHeader, EmptyState, LoadingState, Card, Avatar 
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

export const AttendancePage: React.FC = () => {
  const { hasRole } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Scanner Simulator state
  const [tokenInput, setTokenInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [lastScannedAttendee, setLastScannedAttendee] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.events.list();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async (eventId: number) => {
    try {
      const data = await api.events.getRegistrations(eventId);
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !tokenInput.trim()) return;
    setScanning(true);
    try {
      const res = await api.events.scanAttendance(selectedEventId, tokenInput.trim());
      setScanStatus('success');
      setScanMessage('Participant verified and marked attended successfully.');
      setLastScannedAttendee(res.attendee_name);
      setTokenInput('');
      loadRegistrations(selectedEventId);
    } catch (err: any) {
      setScanStatus('error');
      setScanMessage(err.response?.data?.detail || 'Invalid QR code token or attendance already marked.');
    } finally {
      setScanning(false);
    }
  };

  const handleManualCheckIn = async (reg: EventRegistration) => {
    if (!selectedEventId || reg.attended) return;
    try {
      await api.events.manualAttendance(selectedEventId, reg.member_id, reg.id);
      loadRegistrations(selectedEventId);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Manual check-in failed');
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const totalRegistered = registrations.length;
  const totalAttended = registrations.filter(r => r.attended).length;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

  const filteredRegistrations = registrations.filter((r) => {
    const matchSearch = 
      r.attendee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.attendee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.qr_code_token && r.qr_code_token.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Attendance"
        description="Event gate check-in operations, cryptographic QR token verification, and real-time attendance rosters."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search attendees by name, email, QR token...'
        }}
        actions={
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-500 hidden sm:inline">Event:</label>
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.event_type})</option>
              ))}
            </select>
          </div>
        }
      />

      {/* KPI Stats (Section 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Registered</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalRegistered}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed student registrations</p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Verified Present</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalAttended}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Attendees checked in at the gate</p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Turnout Rate</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {attendanceRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Conversion from registration to arrival</p>
        </Card>
      </div>

      {/* QR Scanner Live Gate Tool */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>High-Speed Gate Scanner</span>
          </div>
          <h3 className="text-lg font-bold">Fast Check-In Scanner</h3>
          <p className="text-xs text-slate-300 mt-1">
            Scan attendee QR code or enter token directly to grant entry and automatically timestamp verification.
          </p>

          <form onSubmit={handleScanSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Scan or paste 16-char token (e.g., 9a8b7c6d5e4f3a2b)"
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={scanning}
            >
              Verify Entry
            </Button>
          </form>

          {scanStatus === 'success' && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{lastScannedAttendee}</strong> verified successfully! Attendance marked.
              </span>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-300 text-xs flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendee Roster Table (Section 10) */}
      <Card className="overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Participant Verification Roster
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredRegistrations.length} attendees listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-3">QR Token</th>
                <th className="py-3 px-3">Registration Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Check-In Timestamp</th>
                <th className="py-3 px-4 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <LoadingState message="Loading event participant roster..." />
                  </td>
                </tr>
              ) : filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No registered participants found for this event.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar name={reg.attendee_name} size="xs" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{reg.attendee_name}</div>
                          <div className="text-[11px] text-slate-400">{reg.attendee_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {reg.qr_code_token || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(reg.registered_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={reg.attended ? 'Completed' : 'Pending'} />
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {(reg as any).check_in_time ? new Date((reg as any).check_in_time).toLocaleTimeString() : reg.attended ? 'Present' : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {reg.attended ? (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Checked In
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleManualCheckIn(reg)}
                        >
                          Manual Check-In
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
