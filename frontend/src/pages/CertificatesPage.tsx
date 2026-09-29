import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Search, ShieldCheck, Download, Plus, 
  ExternalLink, QrCode, CheckCircle2, XCircle, Award,
  Edit3, Trash2, Ban
} from 'lucide-react';
import { api } from '../services/api';
import { Certificate, Event, Hackathon, Member } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card, Avatar,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

export const CertificatesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

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

  // Leadership checks
  const canManage = hasRole(['Super Admin', 'President', 'Vice President']);

  // Edit Certificate State
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('Winner');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientEmail, setEditRecipientEmail] = useState('');
  const [editEventId, setEditEventId] = useState<number | undefined>(undefined);

  // Revoke & Delete State
  const [certToRevoke, setCertToRevoke] = useState<Certificate | null>(null);
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const handleOpenEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setEditTitle(cert.title);
    setEditType(cert.certificate_type);
    setEditRecipientName(cert.recipient_name);
    setEditRecipientEmail(cert.recipient_email || '');
    setEditEventId(cert.event_id || undefined);
    setShowEditModal(true);
  };

  const handleUpdateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    try {
      await api.certificates.update(editingCert.id, {
        title: editTitle,
        certificate_type: editType,
        recipient_name: editRecipientName,
        recipient_email: editRecipientEmail,
        event_id: editEventId,
      });

      setShowEditModal(false);
      setEditingCert(null);
      setToast({
        type: 'success',
        title: 'Certificate Updated',
        message: `Credential for ${editRecipientName} updated.`
      });
      setTimeout(() => setToast(null), 4000);
      loadCertificates();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update certificate'
      });
    }
  };

  const handleRevokeCert = async () => {
    if (!certToRevoke) return;
    try {
      await api.certificates.revoke(certToRevoke.id);
      setToast({
        type: 'warning',
        title: 'Certificate Revoked',
        message: `Credential ${certToRevoke.certificate_id} has been revoked.`
      });
      setTimeout(() => setToast(null), 4000);
      setCertToRevoke(null);
      loadCertificates();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Revocation Failed',
        message: err.response?.data?.detail || 'Failed to revoke certificate'
      });
    }
  };

  const handleDeleteCert = async () => {
    if (!certToDelete) return;
    try {
      await api.certificates.delete(certToDelete.id);
      setToast({
        type: 'info',
        title: 'Certificate Deleted',
        message: `Credential ${certToDelete.certificate_id} was removed.`
      });
      setTimeout(() => setToast(null), 4000);
      setCertToDelete(null);
      loadCertificates();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete certificate'
      });
    }
  };

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
    } catch (err: any) {
      setVerificationResult({ valid: false, message: err.response?.data?.detail || 'Invalid credential hash' });
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

  const filteredCertificates = certificates.filter(cert => {
    const matchType = selectedType === 'All' || cert.certificate_type === selectedType;
    const matchSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cert.verification_code && cert.verification_code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const canIssue = hasRole(['President', 'Vice President', 'Domain Head']);

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Certificates"
        description="Tamper-proof verifiable credentials with embedded cryptographic tokens, serial identifiers, and QR validation."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search certificates by recipient, title, serial ID...'
        }}
        filterProps={{
          filters: [
            {
              key: 'type',
              label: 'Credential Type',
              value: selectedType,
              onChange: setSelectedType,
              options: [
                { label: 'All Types', value: 'All' },
                { label: 'Winner', value: 'Winner' },
                { label: 'Participant', value: 'Participant' },
                { label: 'Organizer', value: 'Organizer' },
                { label: 'Mentor', value: 'Mentor' },
              ]
            }
          ]
        }}
        primaryAction={
          canIssue
            ? {
                label: 'Issue Certificate',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => setShowIssueModal(true)
              }
            : undefined
        }
      />

      {/* Online Verification Tool Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public Credential Verification Portal</span>
          </div>
          <h3 className="text-lg font-bold">Validate Credential Authenticity</h3>
          <p className="text-xs text-slate-300 mt-1">
            Enter the Certificate Serial ID (e.g. <strong>CERT-2026-AIML-001</strong>) or 32-character verification hash from any certificate to verify validity against official club records.
          </p>

          <form onSubmit={handleVerify} className="mt-4 flex gap-2">
            <input
              type="text"
              required
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="e.g. CERT-2026-AIML-001 or 32-char verification hash"
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isVerifying}
            >
              Verify Credential
            </Button>
          </form>

          {verificationResult && (
            <div className={`mt-4 p-4 rounded-xl border text-xs ${
              verificationResult.valid
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/60 border-rose-700 text-rose-200'
            }`}>
              <div className="flex items-center space-x-2 font-bold">
                {verificationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {verificationResult.valid ? 'Verified Authentic Credential' : 'Verification Failed'}
                </span>
              </div>
              {verificationResult.valid ? (
                <div className="mt-2 space-y-1 text-slate-300">
                  <div>Title: <strong>{verificationResult.certificate?.title || verificationResult.title}</strong></div>
                  <div>Recipient: <strong>{verificationResult.certificate?.recipient_name || verificationResult.recipient_name}</strong></div>
                  <div>Event: <strong>{verificationResult.certificate?.event_name || verificationResult.event_name}</strong></div>
                  <div>Serial ID: <strong className="font-mono text-emerald-400">{verificationResult.certificate?.certificate_id || verificationResult.certificate_id}</strong></div>
                </div>
              ) : (
                <p className="mt-1 text-rose-300">{verificationResult.message || verificationResult.verification_message || 'No matching credential found.'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certificates List */}
      {loading ? (
        <LoadingState message="Loading issued certificates..." />
      ) : filteredCertificates.length === 0 ? (
        <EmptyState
          title="No Certificates Found"
          description="No credentials match your filter criteria."
          action={
            canIssue
              ? {
                  label: 'Issue Certificate',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setShowIssueModal(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCertificates.map((cert) => (
            <Card
              key={cert.id}
              className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {cert.certificate_id}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <Badge status={cert.certificate_type === 'Winner' ? 'Completed' : 'Active'} />
                    {canManage && (
                      <div className="flex items-center space-x-1 ml-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(cert)}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors"
                          title="Edit Certificate"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCertToRevoke(cert)}
                          className="p-1 rounded text-slate-400 hover:text-amber-700 transition-colors"
                          title="Revoke Certificate"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCertToDelete(cert)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Certificate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {cert.title}
                  </h3>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                    {cert.event_name || 'Flagship Club Program'}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Avatar name={cert.recipient_name} size="xs" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">{cert.recipient_name}</strong>
                      <div className="text-[11px] text-slate-400">{cert.recipient_email}</div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Issued:</span>
                    <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verification Hash:</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {cert.verification_code ? `${cert.verification_code.slice(0, 8)}...` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verified
                </span>

                {cert.file_url && (
                  <a
                    href={api.getFileUrl(cert.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                  >
                    <Button variant="outline" size="xs" icon={<Download className="w-3.5 h-3.5" />}>
                      Download PDF
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Certificate Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue Official Verifiable Credential"
        subtitle="Generates cryptographically signed certificate with instant verification hash"
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
              placeholder="e.g. 1st Place - TechnoHack 2026 AI Track"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credential Type
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Winner">Winner / Champion</option>
                <option value="Participant">Participation / Attendee</option>
                <option value="Organizer">Organizer / Volunteer</option>
                <option value="Mentor">Speaker / Mentor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Event
              </label>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General Club Recognition</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Full Name
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Student Name"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="student@college.edu"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowIssueModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Issue Credential
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Certificate Modal */}
      {showEditModal && editingCert && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingCert(null);
          }}
          title={`Edit Credential: ${editingCert.certificate_id}`}
          subtitle="Modify recipient info, credential classification, and associated event"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateCert} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Certificate Title
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
                  Credential Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Winner">Winner / Champion</option>
                  <option value="Participant">Participation / Attendee</option>
                  <option value="Organizer">Organizer / Volunteer</option>
                  <option value="Mentor">Speaker / Mentor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Event
                </label>
                <select
                  value={editEventId || ''}
                  onChange={(e) => setEditEventId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General Club Recognition</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editRecipientName}
                  onChange={(e) => setEditRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={editRecipientEmail}
                  onChange={(e) => setEditRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCert(null);
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

      {/* Revoke Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!certToRevoke}
        title="Revoke Credential"
        message={`Are you sure you want to revoke credential "${certToRevoke?.certificate_id}" for ${certToRevoke?.recipient_name}? This will invalidate public verification while preserving the audit record.`}
        confirmLabel="Revoke Certificate"
        confirmVariant="danger"
        onConfirm={handleRevokeCert}
        onCancel={() => setCertToRevoke(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!certToDelete}
        title="Delete Certificate"
        message={`Are you sure you want to permanently delete credential "${certToDelete?.certificate_id}"? Certificates should generally be revoked rather than deleted.`}
        confirmLabel="Delete Certificate"
        confirmVariant="danger"
        onConfirm={handleDeleteCert}
        onCancel={() => setCertToDelete(null)}
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
