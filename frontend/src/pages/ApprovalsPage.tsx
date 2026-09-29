import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, AlertCircle, Clock, Plus, 
  History, ArrowRight, ShieldCheck, UserCheck, MessageSquare,
  FileText, DollarSign, Filter, Sparkles, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { ApprovalProposal } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Avatar, Card 
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

const WORKFLOW_STAGES = [
  { key: 'Domain Head Approval', label: '1. Domain Head Review', desc: 'Technical feasibility & domain alignment' },
  { key: 'Vice President Review', label: '2. Vice President Review', desc: 'Operational clearance & logistics vetting' },
  { key: 'President Sanction', label: '3. President Sanction', desc: 'Final executive authorization & fund sanction' },
];

export const ApprovalsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { id: paramApprovalId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<ApprovalProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action
  const [selectedProposal, setSelectedProposal] = useState<ApprovalProposal | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [actionComments, setActionComments] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Submit Form State
  const [title, setTitle] = useState('');
  const [proposalType, setProposalType] = useState('Event');
  const [budget, setBudget] = useState(0);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');

  useEffect(() => {
    loadProposals();
  }, []);

  // Synchronize route paramApprovalId with selectedProposal
  useEffect(() => {
    if (!paramApprovalId) {
      setSelectedProposal(null);
      return;
    }
    const pid = Number(paramApprovalId);
    const existing = proposals.find((p) => p.id === pid);
    if (existing) {
      setSelectedProposal(existing);
    } else {
      api.approvals.get(pid)
        .then((p) => setSelectedProposal(p))
        .catch((err) => console.error('Failed to load proposal by id:', err));
    }
  }, [paramApprovalId, proposals]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const data = await api.approvals.list();
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
        requested_budget: Number(budget) || 0,
        priority
      });
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      setBudget(0);
      setPriority('Normal');
      loadProposals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit proposal');
    }
  };

  const handleExecuteAction = async (proposalId: number, action: 'Approve' | 'Reject' | 'Request Revision') => {
    setSubmittingAction(true);
    try {
      const updated = await api.approvals.executeAction(
        proposalId,
        action,
        actionComments || undefined
      );
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal(updated);
      }
      setActionComments('');
      await loadProposals();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;
    const matchType = selectedType === 'All' || p.proposal_type === selectedType;
    const matchSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.proposer_name && p.proposer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((p as any).domain_name && (p as any).domain_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchType && matchSearch;
  });

  const canReview = hasRole(['President', 'Vice President', 'Domain Head', 'Faculty Coordinator']);

  const getWorkflowStepStatus = (proposal: ApprovalProposal, stageIndex: number) => {
    const stageNames = ['Domain Head Approval', 'Vice President Review', 'President Sanction'];
    const currentIdx = stageNames.indexOf(proposal.current_stage);
    
    if (proposal.status === 'Approved') return 'completed';
    if (proposal.status === 'Rejected') {
      return stageIndex === currentIdx ? 'rejected' : stageIndex < currentIdx ? 'completed' : 'pending';
    }
    if (stageIndex < currentIdx) return 'completed';
    if (stageIndex === currentIdx) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Approvals"
        description="Multi-tier proposal governance and budget sanction workflow: Domain Review → Vice President Review → President Sanction."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search proposals by title, proposer, domain...'
        }}
        filterProps={{
          filters: [
            {
              key: 'status',
              label: 'Status',
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: [
                { label: 'All Statuses', value: 'All' },
                { label: 'Under Review', value: 'Under Review' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Revision Required', value: 'Revision Required' },
                { label: 'Rejected', value: 'Rejected' },
              ]
            },
            {
              key: 'type',
              label: 'Category',
              value: selectedType,
              onChange: setSelectedType,
              options: [
                { label: 'All Categories', value: 'All' },
                { label: 'Event', value: 'Event' },
                { label: 'Hackathon', value: 'Hackathon' },
                { label: 'Budget', value: 'Budget' },
                { label: 'Resource', value: 'Resource' },
                { label: 'Project', value: 'Project' },
                { label: 'Sponsorship', value: 'Sponsorship' },
              ]
            }
          ]
        }}
        primaryAction={{
          label: 'Submit Proposal',
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setShowSubmitModal(true)
        }}
      />

      {/* Governance Multi-Tier Banner */}
      <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Multi-Tier Accountability Pipeline</div>
            <div className="text-slate-500 dark:text-slate-400">All student proposals progress democratically through technical, operational, and financial sanctions.</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-400 font-medium">
          <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            Domain Head Approval
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
          <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            Vice President Review
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
          <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            President Sanction
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading governance proposals and review stages..." />
      ) : filteredProposals.length === 0 ? (
        <EmptyState
          title="No Proposals Found"
          description="There are currently no proposals matching your filter criteria. Create a new proposal to get started."
          action={{
            label: 'Submit Proposal',
            onClick: () => setShowSubmitModal(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const isUnderReview = proposal.status === 'Under Review';
            const userCanTakeAction = canReview && isUnderReview;

            return (
              <Card 
                key={proposal.id} 
                className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Proposal Details (Section 18 layout) */}
                  <div className="space-y-3 flex-1">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {proposal.proposal_type}
                      </span>
                      <Badge status={proposal.status} />
                      <Badge 
                        status={
                          proposal.priority === 'Urgent' ? 'Urgent' : 
                          proposal.priority === 'High' ? 'Critical' : 'Normal'
                        } 
                      />
                      {(proposal as any).domain_name && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {(proposal as any).domain_name}
                        </span>
                      )}
                    </div>

                    {/* Proposal Title */}
                    <div>
                      <h3 
                        onClick={() => navigate(`/approvals/${proposal.id}`)}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                      >
                        {proposal.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {proposal.description}
                      </p>
                    </div>

                    {/* Metadata: Submitter, Domain, Budget */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center space-x-2">
                        <Avatar
                          name={proposal.proposer_name || 'Member'}
                          src={(proposal as any).proposer_avatar}
                          size="xs"
                        />
                        <span>
                          Submitter: <strong className="text-slate-700 dark:text-slate-200">{proposal.proposer_name || 'Member'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted {new Date(proposal.created_at).toLocaleDateString()}</span>
                      </div>

                      {proposal.requested_budget > 0 ? (
                        <div className="flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>Budget:</span>
                          <span className="text-sm font-bold">₹{proposal.requested_budget.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No Budget Requested</span>
                      )}
                    </div>

                    {/* Workflow Stepper Bar (Section 18) */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Approval Workflow Progress
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {WORKFLOW_STAGES.map((stage, sIdx) => {
                          const state = getWorkflowStepStatus(proposal, sIdx);
                          return (
                            <div 
                              key={stage.key}
                              className={`p-2.5 rounded-lg border text-xs flex items-center space-x-2.5 transition-colors ${
                                state === 'completed'
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                  : state === 'current'
                                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold ring-1 ring-blue-500/20'
                                  : state === 'rejected'
                                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-400'
                              }`}
                            >
                              {state === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : state === 'current' ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0 ml-0.5" />
                              ) : state === 'rejected' ? (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-0.5" />
                              )}
                              <div className="truncate">
                                <div className="truncate font-medium">{stage.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:block">
                                  {state === 'current' ? 'Awaiting Decision' : state === 'completed' ? 'Cleared' : 'Pending'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions (Section 18: [View Details], [Reject], [Approve]) */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/approvals/${proposal.id}`)}
                      className="w-full sm:w-auto"
                    >
                      View Details
                    </Button>

                    {userCanTakeAction && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={submittingAction}
                          onClick={() => {
                            navigate(`/approvals/${proposal.id}`);
                            setActionComments('');
                          }}
                          className="w-full sm:w-auto"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          disabled={submittingAction}
                          onClick={() => handleExecuteAction(proposal.id, 'Approve')}
                          className="w-full sm:w-auto"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Proposal Detail & Multi-Tier Review Modal */}
      {selectedProposal && (
        <Modal
          isOpen={!!selectedProposal}
          onClose={() => {
            navigate('/approvals');
            setActionComments('');
          }}
          title={selectedProposal.title}
          subtitle={`Proposal #${selectedProposal.id} • ${selectedProposal.proposal_type}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Current Governance Stage</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedProposal.current_stage}</div>
              </div>
              <Badge status={selectedProposal.status} />
              {selectedProposal.requested_budget > 0 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Sanctioned Budget</span>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ₹{selectedProposal.requested_budget.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Proposal Scope & Deliverables
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedProposal.description}
              </p>
            </div>

            {/* Historical Audit Trail */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                <History className="w-3.5 h-3.5 mr-1 text-blue-500" />
                <span>Approval Lifecycle & Endorsements</span>
              </h4>

              {(!selectedProposal.history || selectedProposal.history.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  Awaiting review comments from committee members.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {selectedProposal.history.map((h, idx) => (
                    <div key={idx} className="relative pl-8 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                          <span>{h.stage}</span>
                          <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          Action: <strong>{h.action}</strong> by {h.reviewer_name} ({h.reviewer_role})
                        </div>
                        {h.comments && (
                          <p className="mt-1 text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            "{h.comments}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviewer Action Box */}
            {canReview && selectedProposal.status === 'Under Review' && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Take Executive Review Action
                  </h4>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Acting as {user?.role_title}
                  </span>
                </div>
                
                <textarea
                  rows={2}
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  placeholder="Enter endorsement rationale, conditional terms, or required revision notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={submittingAction}
                    onClick={() => handleExecuteAction(selectedProposal.id, 'Reject')}
                  >
                    Reject Proposal
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={submittingAction}
                    onClick={() => handleExecuteAction(selectedProposal.id, 'Request Revision')}
                  >
                    Request Revision
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submittingAction}
                    onClick={() => handleExecuteAction(selectedProposal.id, 'Approve')}
                  >
                    Approve & Endorse Stage
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Submit Proposal Modal (Section 12 Form Design) */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit New Initiative Proposal"
        subtitle="Enters multi-tier review: Domain Head → Vice President → President"
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
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Requested Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Scope, Justification & Deliverables
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State clear student benefits, resource allocation breakdown, and expected results..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Submit for Multi-Tier Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
