import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Search, ShieldCheck, Download, Plus, 
  ExternalLink, QrCode, CheckCircle2, XCircle, Award 
} from 'lucide-react';
import { api } from '../services/api';
import { Certificate, Event, Hackathon, Member } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const CertificatesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification state
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Issue Certificate Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certType, setCertType] = useState('Winner');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const [certsData, eventsData, membersData] = await Promise.all([
        api.certificates.list(),
        api.events.list(),
        api.members.list()
      ]);
      setCertificates(certsData);
      setEvents(eventsData);
      setMembers(membersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.certificates.verify(verifyInput.trim());
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.certificates.issue({
        title: certTitle,
        certificate_type: certType,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        event_id: selectedEventId
      });
      setShowIssueModal(false);
      setCertTitle('');
      setRecipientName('');
      setRecipientEmail('');
      loadCertificates();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to issue certificate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Certificates & Verification Registry</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {certificates.length} Issued
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-proof verifiable credentials with embedded cryptographic tokens and QR validation codes.
          </p>
        </div>

        {hasRole(['President', 'Vice President', 'Domain Head']) && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Certificate</span>
          </button>
        )}
      </div>

      {/* Online Verification Tool Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-indigo-800 shadow-md">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public Credential Verification Portal</span>
          </div>
          <h3 className="text-lg font-bold">Validate Credential Authenticity</h3>
          <p className="text-xs text-slate-300 mt-1">
            Enter the Certificate ID (e.g., <strong>TC-2026-WIN-001</strong>) or 32-character verification hash from any certificate to verify validity against official club records.
          </p>

          <form onSubmit={handleVerify} className="mt-4 flex gap-2">
            <input
              type="text"
              required
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="e.g., 8f92a10b4c6e4d28a3f120e87b9c1d34 or TC-2026-WIN-001"
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-colors"
            >
              {isVerifying ? 'Checking...' : 'Verify Credential'}
            </button>
          </form>

          {verificationResult && (
            <div className={`mt-4 p-4 rounded-xl border text-xs ${
              verificationResult.valid
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/60 border-rose-700 text-rose-200'
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                {verificationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Valid & Authenticated Official Credential</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Verification Failed</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-slate-300">{verificationResult.verification_message}</p>
              {verificationResult.valid && (
                <div className="mt-2 pt-2 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>ID: <strong>{verificationResult.certificate_id}</strong></div>
                  <div>Recipient: <strong>{verificationResult.recipient_name}</strong></div>
                  <div>Category: <strong>{verificationResult.certificate_type}</strong></div>
                  <div>Event: <strong>{verificationResult.event_name}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Issued Certificates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Issued Credentials Archive</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Certificate ID</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Award Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Download PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {certificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.certificate_id}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    {c.recipient_name}
                    <div className="text-[10px] text-slate-400 font-normal">{c.recipient_email}</div>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{c.title}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {c.certificate_type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(c.issue_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3 text-right">
                    {c.file_url ? (
                      <a
                        href={`http://localhost:8000${c.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Generated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Certificate */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Verifiable Certificate"
        subtitle="Generates vector PDF certificate with embedded QR validation code"
        maxWidth="md"
      >
        <form onSubmit={handleIssueCertificate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Certificate Title
            </label>
            <input
              type="text"
              required
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              placeholder="e.g., Certificate of Excellence - 1st Place"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Winner">Winner</option>
                <option value="Runner-Up">Runner-Up</option>
                <option value="Participation">Participation</option>
                <option value="Speaker">Speaker</option>
                <option value="Organizer">Organizer</option>
                <option value="Core Team">Core Team</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Linked Event
              </label>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">General Club Award</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient Full Name
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g., Rohan Verma"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g., rohan@technoclub.org"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Generate Certificate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
