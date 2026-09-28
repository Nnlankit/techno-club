import React, { useState, useEffect } from 'react';
import { 
  QrCode, CheckCircle2, XCircle, Users, Calendar, 
  Search, ShieldCheck, CheckCheck, Clock, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Event, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';

export const AttendancePage: React.FC = () => {
  const { hasRole } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Scanner Simulator state
  const [tokenInput, setTokenInput] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [lastScannedAttendee, setLastScannedAttendee] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

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

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !tokenInput.trim()) return;
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <span>Attendance Operations & QR Verification</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Validate event participation via cryptographic QR token scanners or manual coordinator rosters.
        </p>
      </div>

      {/* Event Selector & Stats */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Active Event:</label>
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(Number(e.target.value))}
            className="w-full md:w-96 px-3 py-2 rounded-xl text-sm font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name} ({ev.event_type})</option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="flex items-center space-x-6 text-center">
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{totalRegistered}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Registered</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-600">{totalAttended}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Present</div>
            </div>
            <div>
              <div className="text-xl font-black text-indigo-600">{attendanceRate}%</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Turnout Rate</div>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Live Tool */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900 shadow-md">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>High-Speed Gate Scanner</span>
          </div>
          <h3 className="text-lg font-bold">Fast Check-In Scanner</h3>
          <p className="text-xs text-slate-300 mt-1">
            Scan attendee QR code or type token directly to grant entry and log timestamp to the database.
          </p>

          <form onSubmit={handleScanSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Scan or enter QR token (e.g., QR-4A82F10B7C)"
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono uppercase"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-colors"
            >
              Verify Entry
            </button>
          </form>

          {scanStatus === 'success' && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Verified:</strong> {lastScannedAttendee} has been checked into the event.</span>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-200 text-xs flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendee Roster Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Event Participant Roster ({registrations.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Attendee Name</th>
                <th className="p-3">College ID</th>
                <th className="p-3">Verification Token</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No participants registered for this event yet.
                  </td>
                </tr>
              ) : (
                registrations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.attendee_name}</div>
                      <div className="text-[10px] text-slate-400">{r.attendee_email}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{r.college_id || 'Guest'}</td>
                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">{r.qr_code_token}</td>
                    <td className="p-3">
                      {r.attended ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Registered
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!r.attended && (
                        <button
                          onClick={() => handleManualCheckIn(r)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        >
                          Manual Check-In
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
