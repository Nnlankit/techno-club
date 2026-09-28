import React, { useState, useEffect } from 'react';
import { 
  Building2, DollarSign, Handshake, Mail, Phone, Globe, 
  Plus, CheckCircle2, ArrowRight, FileCheck2, Clock, Sparkles, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { Sponsor, Event } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
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

  // KPIs
  const totalRaised = sponsors
    .filter(s => s.stage === 'Confirmed' || s.stage === 'Completed')
    .reduce((acc, s) => acc + (s.amount || 0), 0);

  const pipelineValue = sponsors.reduce((acc, s) => acc + (s.amount || 0), 0);
  const confirmedCount = sponsors.filter(s => s.stage === 'Confirmed' || s.stage === 'Completed').length;
  const mouCount = sponsors.filter(s => s.mou_signed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Corporate Sponsorship & Partner Pipeline</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {sponsors.length} Corporate Partners
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track industry relations, MOUs, brand deliverables, tier deliverables, and payment milestones.
          </p>
        </div>
        {hasRole(['President', 'Vice President', 'Treasurer']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner / Lead</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Confirmed Sponsorship"
          value={`$${totalRaised.toLocaleString()}`}
          subtitle="Signed MOUs & committed grants"
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          title="Total Pipeline Potential"
          value={`$${pipelineValue.toLocaleString()}`}
          subtitle="All active leads & proposals"
          icon={<Handshake className="w-5 h-5 text-indigo-500" />}
          color="indigo"
        />
        <StatCard
          title="Confirmed Partners"
          value={confirmedCount.toString()}
          subtitle="Title, Gold, Silver & Community"
          icon={<Building2 className="w-5 h-5 text-cyan-500" />}
          color="cyan"
        />
        <StatCard
          title="Signed MOUs"
          value={mouCount.toString()}
          subtitle="Legal agreements executed"
          icon={<FileCheck2 className="w-5 h-5 text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Pipeline Stages Grid (Kanban Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5">
        {STAGES.map((currentStage, stageIdx) => {
          const stageSponsors = sponsors.filter(s => s.stage === currentStage);
          const stageAmount = stageSponsors.reduce((acc, s) => acc + (s.amount || 0), 0);

          return (
            <div
              key={currentStage}
              className="flex flex-col bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentStage}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {stageSponsors.length}
                </span>
              </div>

              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                ${stageAmount.toLocaleString()}
              </div>

              {/* Sponsor Cards in Stage */}
              <div className="space-y-2.5 flex-1 min-h-[140px]">
                {stageSponsors.map(sponsor => (
                  <div
                    key={sponsor.id}
                    className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {sponsor.company_name}
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        sponsor.tier === 'Title' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        sponsor.tier === 'Platinum' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        sponsor.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {sponsor.tier}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ${sponsor.amount.toLocaleString()}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="truncate font-medium">{sponsor.contact_person}</div>
                      {sponsor.event_name && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                          Event: {sponsor.event_name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                      <span className={sponsor.mou_signed ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}>
                        {sponsor.mou_signed ? '✓ MOU Signed' : 'MOU Pending'}
                      </span>
                      <span className="font-mono text-slate-500">
                        {sponsor.payment_status}
                      </span>
                    </div>

                    {/* Stage shift actions */}
                    {hasRole(['President', 'Vice President', 'Treasurer']) && stageIdx < STAGES.length - 1 && (
                      <button
                        onClick={() => handleAdvanceStage(sponsor, STAGES[stageIdx + 1])}
                        className="w-full mt-1.5 py-1 px-2 rounded bg-slate-50 dark:bg-slate-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-semibold flex items-center justify-center space-x-1 transition-colors"
                      >
                        <span>Move to {STAGES[stageIdx + 1]}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Sponsor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Corporate Partner / Sponsor"
      >
        <form onSubmit={handleCreateSponsor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google Cloud, GitHub, Red Hat"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. John Doe (University Relations)"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@company.com"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                placeholder="+1 555 123 4567"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sponsorship Tier *
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Title">Title Sponsor</option>
                <option value="Platinum">Platinum ($5,000+)</option>
                <option value="Gold">Gold ($2,500)</option>
                <option value="Silver">Silver ($1,000)</option>
                <option value="Community">Community / Swag</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pipeline Stage *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Committed Amount ($) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Flagship Event
              </label>
              <select
                value={eventId || ''}
                onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">Club-wide Annual Partnership</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Pending">Pending Invoice</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Partial">Partial Received</option>
                <option value="Received">Received / Cleared</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mouCheck"
              checked={mouSigned}
              onChange={(e) => setMouSigned(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="mouCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Formal Memorandum of Understanding (MOU) executed & signed
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agreed Deliverables & Brand Perks
            </label>
            <textarea
              rows={2}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="e.g. Logo on hackathon merchandise, key opening address, recruitment access to participant resume drop."
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
              Save Partner
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
