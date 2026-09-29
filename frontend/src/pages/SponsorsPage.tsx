import React, { useState, useEffect } from 'react';
import { 
  Building2, DollarSign, Handshake, Mail, Phone, Globe, 
  Plus, CheckCircle2, ArrowRight, FileCheck2, Clock, Sparkles, Filter,
  Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Sponsor, Event } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

const STAGES: Array<Sponsor['stage']> = [
  'Prospect',
  'Contacted',
  'Proposal Sent',
  'Negotiation',
  'Confirmed',
  'Completed'
];

export const SponsorsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  // Add Sponsor Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tier, setTier] = useState('Platinum');
  const [stage, setStage] = useState<Sponsor['stage']>('Prospect');
  const [amount, setAmount] = useState('');
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const [benefits, setBenefits] = useState('');
  const [mouSigned, setMouSigned] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  // Edit Sponsor Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editTier, setEditTier] = useState('Platinum');
  const [editStage, setEditStage] = useState<Sponsor['stage']>('Prospect');
  const [editAmount, setEditAmount] = useState('');
  const [editEventId, setEditEventId] = useState<number | undefined>(undefined);
  const [editBenefits, setEditBenefits] = useState('');
  const [editMouSigned, setEditMouSigned] = useState(false);
  const [editPaymentStatus, setEditPaymentStatus] = useState('Pending');

  // Delete State
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sponsorsData, eventsData] = await Promise.all([
        api.sponsors.list(),
        api.events.list()
      ]);
      setSponsors(sponsorsData);
      setEvents(eventsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sponsors.create({
        company_name: companyName,
        contact_person: contactPerson,
        email,
        phone,
        website,
        tier,
        stage,
        amount: Number(amount) || 0,
        event_id: eventId,
        benefits,
        mou_signed: mouSigned,
        payment_status: paymentStatus
      });
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add sponsor');
    }
  };

  const handleAdvanceStage = async (sponsor: Sponsor, newStage: Sponsor['stage']) => {
    try {
      await api.sponsors.update(sponsor.id, { stage: newStage });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update sponsor stage');
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setTier('Platinum');
    setStage('Prospect');
    setAmount('');
    setEventId(undefined);
    setBenefits('');
    setMouSigned(false);
    setPaymentStatus('Pending');
  };

  const handleOpenEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setEditCompanyName(sponsor.company_name);
    setEditContactPerson(sponsor.contact_person || '');
    setEditEmail(sponsor.email || '');
    setEditPhone(sponsor.phone || '');
    setEditWebsite(sponsor.website || '');
    setEditTier(sponsor.tier);
    setEditStage(sponsor.stage);
    setEditAmount(sponsor.amount ? String(sponsor.amount) : '');
    setEditEventId(sponsor.event_id);
    setEditBenefits(sponsor.benefits || '');
    setEditMouSigned(sponsor.mou_signed);
    setEditPaymentStatus(sponsor.payment_status || 'Pending');
    setShowEditModal(true);
  };

  const handleUpdateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSponsor) return;
    try {
      await api.sponsors.update(editingSponsor.id, {
        company_name: editCompanyName,
        contact_person: editContactPerson,
        email: editEmail,
        phone: editPhone,
        website: editWebsite,
        tier: editTier,
        stage: editStage,
        amount: Number(editAmount) || 0,
        event_id: editEventId,
        benefits: editBenefits,
        mou_signed: editMouSigned,
        payment_status: editPaymentStatus,
      });
      setShowEditModal(false);
      setEditingSponsor(null);
      setToast({ message: `Partner "${editCompanyName}" updated successfully`, type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to update partner', type: 'error' });
    }
  };

  const handleDeleteSponsor = async () => {
    if (!sponsorToDelete) return;
    try {
      await api.sponsors.delete(sponsorToDelete.id);
      setShowDeleteDialog(false);
      setToast({ message: `Partner "${sponsorToDelete.company_name}" removed successfully`, type: 'success' });
      setSponsorToDelete(null);
      if (selectedSponsor && selectedSponsor.id === sponsorToDelete.id) {
        setSelectedSponsor(null);
      }
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to delete partner', type: 'error' });
    }
  };

  // KPIs
  const totalRaised = sponsors
    .filter(s => s.stage === 'Confirmed' || s.stage === 'Completed')
    .reduce((acc, s) => acc + (s.amount || 0), 0);

  const pipelineValue = sponsors.reduce((acc, s) => acc + (s.amount || 0), 0);
  const confirmedCount = sponsors.filter(s => s.stage === 'Confirmed' || s.stage === 'Completed').length;
  const mouCount = sponsors.filter(s => s.mou_signed).length;

  const filteredSponsors = sponsors.filter((s) => {
    const matchStage = selectedStage === 'All' || s.stage === selectedStage;
    const matchTier = selectedTier === 'All' || s.tier === selectedTier;
    const matchSearch = 
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStage && matchTier && matchSearch;
  });

  const canManageSponsors = hasRole(['President', 'Vice President', 'Treasurer']);

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Sponsors"
        description="Corporate sponsorships, industry relations, brand partnerships, and sponsorship pipeline management."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search partners by company name, contact, email...'
        }}
        filterProps={{
          filters: [
            {
              key: 'stage',
              label: 'Pipeline Stage',
              value: selectedStage,
              onChange: setSelectedStage,
              options: [
                { label: 'All Stages', value: 'All' },
                ...STAGES.map(st => ({ label: st, value: st }))
              ]
            },
            {
              key: 'tier',
              label: 'Sponsorship Tier',
              value: selectedTier,
              onChange: setSelectedTier,
              options: [
                { label: 'All Tiers', value: 'All' },
                { label: 'Title Partner', value: 'Title' },
                { label: 'Platinum Partner', value: 'Platinum' },
                { label: 'Gold Partner', value: 'Gold' },
                { label: 'Silver Partner', value: 'Silver' },
                { label: 'Bronze Partner', value: 'Bronze' },
              ]
            }
          ]
        }}
        primaryAction={
          canManageSponsors
            ? {
                label: 'Add Partner',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => setShowAddModal(true)
              }
            : undefined
        }
      />

      {/* KPI Cards (Section 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Confirmed Capital</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{totalRaised.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Confirmed & signed industry sponsorships
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pipeline Potential</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{pipelineValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total active leads across all negotiation stages
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Confirmed Partners</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {confirmedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Companies locked for upcoming club events
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Executed MOUs</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {mouCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Legal memorandums on file with the college
          </p>
        </Card>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading corporate sponsorship pipeline..." />
      ) : filteredSponsors.length === 0 ? (
        <EmptyState
          title="No Partners Found"
          description="No sponsorship records matched your query. Add a new prospective company or clear filters."
          action={
            canManageSponsors
              ? {
                  label: 'Add Partner',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setShowAddModal(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSponsors.map((s) => {
            const currentStageIdx = STAGES.indexOf(s.stage);
            const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;

            return (
              <Card
                key={s.id}
                className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Tier & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {s.tier} Tier
                    </span>
                    <Badge status={s.stage} />
                  </div>

                  {/* Company Name & Amount */}
                  <div>
                    <h3 
                      onClick={() => setSelectedSponsor(s)}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {s.company_name}
                    </h3>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      ₹{s.amount?.toLocaleString() || 0}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {s.contact_person && (
                      <div className="truncate">
                        Contact: <strong className="text-slate-700 dark:text-slate-300">{s.contact_person}</strong>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center space-x-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>

                  {/* MOU & Payment Indicators */}
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      s.mou_signed 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {s.mou_signed ? 'MOU Signed' : 'MOU Pending'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      s.payment_status === 'Received'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      Payment: {s.payment_status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedSponsor(s)}
                    >
                      View Details
                    </Button>

                    {canManageSponsors && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Partner"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSponsorToDelete(s);
                            setShowDeleteDialog(true);
                          }}
                          title="Delete Partner"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {canManageSponsors && nextStage && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleAdvanceStage(s, nextStage)}
                    >
                      <span>Advance to {nextStage}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sponsor Details Modal */}
      {selectedSponsor && (
        <Modal
          isOpen={!!selectedSponsor}
          onClose={() => setSelectedSponsor(null)}
          title={selectedSponsor.company_name}
          subtitle={`${selectedSponsor.tier} Partner • Stage: ${selectedSponsor.stage}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Committed Amount</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{selectedSponsor.amount?.toLocaleString() || 0}
                </div>
              </div>
              <Badge status={selectedSponsor.stage} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Lead Representative</span>
                <div className="font-semibold text-slate-900 dark:text-white">{selectedSponsor.contact_person || 'Not specified'}</div>
                <div className="text-slate-500">{selectedSponsor.email}</div>
                <div className="text-slate-500">{selectedSponsor.phone || 'No phone'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Legal & Payment Status</span>
                <div>MOU Signed: <strong>{selectedSponsor.mou_signed ? 'Yes (Archived)' : 'No (In Draft)'}</strong></div>
                <div>Payment: <strong>{selectedSponsor.payment_status || 'Pending'}</strong></div>
                <div>Website: {selectedSponsor.website ? <a href={selectedSponsor.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">Visit Link</a> : 'None'}</div>
              </div>
            </div>

            {selectedSponsor.benefits && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Deliverables & Sponsor Benefits
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedSponsor.benefits}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              {canManageSponsors ? (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleOpenEdit(selectedSponsor);
                    }}
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => {
                      setSponsorToDelete(selectedSponsor);
                      setShowDeleteDialog(true);
                    }}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              ) : <div />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSponsor(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Sponsor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Corporate Partner Lead"
        subtitle="Track company sponsorship inquiries, grant pledges, and MOUs"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSponsor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google Cloud, Red Hat, Local Tech Co"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="HR / University Relations Manager"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@company.com"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sponsorship Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Title">Title Partner</option>
                <option value="Platinum">Platinum Partner</option>
                <option value="Gold">Gold Partner</option>
                <option value="Silver">Silver Partner</option>
                <option value="Bronze">Bronze Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STAGES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agreed Deliverables & Benefits
            </label>
            <textarea
              rows={3}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Keynote speech slot, banner placement, student CV access, prize naming..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-700 dark:text-slate-300">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mouSigned}
                onChange={(e) => setMouSigned(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>MOU Formally Signed</span>
            </label>

            <label className="flex items-center space-x-2">
              <span>Payment Status:</span>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Pending">Pending</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Received">Received</option>
              </select>
            </label>
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
              Add Partner
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sponsor Modal */}
      {editingSponsor && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingSponsor(null);
          }}
          title={`Edit Corporate Partner: ${editingSponsor.company_name}`}
          subtitle="Update sponsorship terms, tier, pipeline stage, and payment details"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateSponsor} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  required
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editContactPerson}
                  onChange={(e) => setEditContactPerson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sponsorship Tier
                </label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Title">Title Partner</option>
                  <option value="Platinum">Platinum Partner</option>
                  <option value="Gold">Gold Partner</option>
                  <option value="Silver">Silver Partner</option>
                  <option value="Bronze">Bronze Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STAGES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agreed Deliverables & Benefits
              </label>
              <textarea
                rows={3}
                value={editBenefits}
                onChange={(e) => setEditBenefits(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editMouSigned}
                  onChange={(e) => setEditMouSigned(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>MOU Formally Signed</span>
              </label>

              <label className="flex items-center space-x-2">
                <span>Payment Status:</span>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Received">Received</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSponsor(null);
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
        isOpen={showDeleteDialog}
        title="Remove Corporate Partner"
        message={`Are you sure you want to delete corporate partner "${sponsorToDelete?.company_name}"? All associated pipeline logs will be removed.`}
        confirmLabel="Delete Partner"
        confirmVariant="danger"
        onConfirm={handleDeleteSponsor}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSponsorToDelete(null);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
