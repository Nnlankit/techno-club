import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertCircle, Clock, Plus, 
  History, ArrowRight, ShieldCheck, UserCheck, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { ApprovalProposal } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const ApprovalsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [proposals, setProposals] = useState<ApprovalProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [selectedProposal, setSelectedProposal] = useState<ApprovalProposal | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [actionComments, setActionComments] = useState('');
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | 'Request Revision' | null>(null);

  // Submit Form
  const [title, setTitle] = useState('');
  const [proposalType, setProposalType] = useState('Event');
  const [budget, setBudget] = useState(0);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');

  useEffect(() => {
    loadProposals();
  }, [selectedStatus]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await api.approvals.list({ status: selectedStatus || undefined });
      setProposals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.approvals.submit({
        title,
        proposal_type: proposalType,
        description,
        requested_budget: budget,
        priority
      });
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      setBudget(0);
      loadProposals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit proposal');
    }
  };

  const handleExecuteAction = async (action: 'Approve' | 'Reject' | 'Request Revision') => {
    if (!selectedProposal) return;
    try {
      const updated = await api.approvals.executeAction(
        selectedProposal.id,
        action,
        actionComments || undefined
      );
      setSelectedProposal(updated);
      setActionComments('');
      setActionType(null);
      loadProposals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Multi-Tier Approval Workflow</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {proposals.length} Proposals
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Democratized and accountable governance: Domain Review → Vice President Review → President Sanction.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit Proposal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { label: 'All Proposals', value: '' },
          { label: 'Under Review', value: 'Under Review' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Revision Required', value: 'Revision Required' },
          { label: 'Rejected', value: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading approval workflow...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No proposals found in this stage.
          </div>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProposal(p)}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {p.proposal_type}
                  </span>
                  <StatusBadge status={p.status} />
                  <span className="text-[11px] font-semibold text-slate-400">
                    Stage: <strong>{p.current_stage}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                  <span>Proposer: <strong className="text-slate-700 dark:text-slate-300">{p.proposer_name || 'Member'}</strong></span>
                  <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                  <span>Priority: <strong className={p.priority === 'High' ? 'text-rose-600' : 'text-slate-600'}>{p.priority}</strong></span>
                </div>
              </div>

              {/* Right: Budget & History count */}
              <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                {p.requested_budget > 0 && (
                  <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{p.requested_budget.toLocaleString()}
                  </div>
                )}
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center md:justify-end">
                  <span>Audit History ({p.history?.length || 0})</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Proposal Detail & Multi-Tier Review Modal */}
      {selectedProposal && (
        <Modal
          isOpen={!!selectedProposal}
          onClose={() => {
            setSelectedProposal(null);
            setActionType(null);
            setActionComments('');
          }}
          title={selectedProposal.title}
          subtitle={`Proposal #${selectedProposal.id} • ${selectedProposal.proposal_type}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Current Stage</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedProposal.current_stage}</div>
              </div>
              <StatusBadge status={selectedProposal.status} />
              {selectedProposal.requested_budget > 0 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Requested Budget</span>
                  <div className="text-base font-black text-emerald-600">₹{selectedProposal.requested_budget.toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Detailed Proposal & Objective</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedProposal.description}
              </p>
            </div>

            {/* Historical Audit Trail */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <History className="w-3.5 h-3.5 mr-1" />
                <span>Approval Lifecycle History</span>
              </h4>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {selectedProposal.history?.map((h, idx) => (
                  <div key={idx} className="relative pl-8 text-xs">
                    <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900"></div>
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                        <span>{h.stage}</span>
                        <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                        Action: <strong>{h.action}</strong> by {h.reviewer_name} ({h.reviewer_role})
                      </div>
                      {h.comments && (
                        <p className="mt-1 text-slate-500 italic">"{h.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leadership Actions (President, VP, Domain Head) */}
            {hasRole(['President', 'Vice President', 'Domain Head', 'Faculty Coordinator']) && selectedProposal.status === 'Under Review' && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Executive Action</h4>
                
                <textarea
                  rows={2}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  placeholder="Enter endorsement, comments, or revision feedback..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => handleExecuteAction('Reject')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Reject Proposal
                  </button>
                  <button
                    onClick={() => handleExecuteAction('Request Revision')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => handleExecuteAction('Approve')}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                  >
                    Approve & Endorse
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Submit Proposal Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit New Initiative Proposal"
        subtitle="Follows multi-tier approval workflow (Domain Review -> VP Review -> President Approval)"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitProposal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proposal Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Campus Robotics Arena Construction & Sensor Kits Requisition"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Event">Event</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Budget">Budget</option>
                <option value="Resource">Resource Requisition</option>
                <option value="Project">Project Charter</option>
                <option value="Sponsorship">Sponsorship Deal</option>
              </select>
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
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Scope & Deliverables
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State clear student benefits, resource allocation breakdown, and expected results..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Submit for Multi-Tier Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
