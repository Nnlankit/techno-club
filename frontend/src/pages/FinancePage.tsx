import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Receipt, Plus, 
  Download, CheckCircle, XCircle, Clock, Filter, AlertCircle, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Budget, Expense, Event, Domain } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export const FinancePage: React.FC = () => {
  const { hasRole } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // New Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Logistics');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseEventId, setExpenseEventId] = useState<number | undefined>(undefined);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // New Budget Form State
  const [budgetTitle, setBudgetTitle] = useState('');
  const [fiscalYear, setFiscalYear] = useState('2025-2026');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [budgetDomainId, setBudgetDomainId] = useState<number | undefined>(undefined);
  const [budgetEventId, setBudgetEventId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, expData, evData, domData] = await Promise.all([
        api.finance.getBudgets(),
        api.finance.getExpenses(),
        api.events.list(),
        api.domains.list()
      ]);
      setBudgets(bData);
      setExpenses(expData);
      setEvents(evData);
      setDomains(domData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.finance.recordExpense({
        title: expenseTitle,
        category: expenseCategory,
        amount: Number(expenseAmount),
        event_id: expenseEventId,
        date_incurred: expenseDate,
        notes: expenseNotes,
        status: 'Pending'
      });
      setShowExpenseModal(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record expense');
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.finance.createBudget({
        title: budgetTitle,
        fiscal_year: fiscalYear,
        total_allocated: Number(allocatedAmount),
        total_spent: 0,
        remaining_budget: Number(allocatedAmount),
        domain_id: budgetDomainId,
        event_id: budgetEventId,
        status: 'Active'
      });
      setShowBudgetModal(false);
      setBudgetTitle('');
      setAllocatedAmount('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create budget');
    }
  };

  const handleUpdateExpenseStatus = async (expenseId: number, newStatus: string) => {
    try {
      await api.finance.updateExpenseStatus(expenseId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update expense status');
    }
  };

  // Calculations
  const totalAllocated = budgets.reduce((acc, b) => acc + (b.total_allocated || 0), 0);
  const totalSpent = expenses.filter(e => e.status === 'Approved' || e.status === 'Reimbursed').reduce((acc, e) => acc + (e.amount || 0), 0);
  const pendingClaims = expenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + (e.amount || 0), 0);
  const remainingTotal = totalAllocated - totalSpent;

  // Filtered expenses
  const filteredExpenses = expenses.filter(e => {
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Treasury & Financial Operations</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              FY 2025-2026
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Budget allocations, operational expense claims, reimbursements audit, and financial tracking.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={api.reports.exportCsvUrl('expenses')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          {hasRole(['President', 'Vice President', 'Treasurer']) && (
            <button
              onClick={() => setShowBudgetModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Allocation</span>
            </button>
          )}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Claim Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sanctioned Budget"
          value={`$${totalAllocated.toLocaleString()}`}
          subtitle="All approved event & domain allocations"
          icon={<DollarSign className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Disbursed Expenses"
          value={`$${totalSpent.toLocaleString()}`}
          subtitle="Approved and disbursed reimbursements"
          icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
          color="rose"
        />
        <StatCard
          title="Remaining Treasury"
          value={`$${remainingTotal.toLocaleString()}`}
          subtitle="Available for upcoming programs"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          title="Pending Claims in Queue"
          value={`$${pendingClaims.toLocaleString()}`}
          subtitle={`${expenses.filter(e => e.status === 'Pending').length} pending approval by Treasurer`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
      </div>

      {/* Budget Allocation Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const pct = Math.min(100, Math.round(((b.total_spent || 0) / (b.total_allocated || 1)) * 100));
          return (
            <div key={b.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900 dark:text-white truncate pr-2">{b.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {b.fiscal_year}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Spent: <strong className="text-slate-900 dark:text-white">${b.total_spent?.toLocaleString() || 0}</strong></span>
                  <span>Cap: <strong className="text-slate-900 dark:text-white">${b.total_allocated?.toLocaleString() || 0}</strong></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{pct}% utilized</span>
                  <span>Remaining: ${((b.total_allocated || 0) - (b.total_spent || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses Registry Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Disbursements & Expense Claims Log
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Reimbursed">Reimbursed</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Categories</option>
              <option value="Logistics">Logistics</option>
              <option value="Hardware">Hardware / Kits</option>
              <option value="Food & Catering">Food & Catering</option>
              <option value="Marketing">Marketing / Print</option>
              <option value="Prizes & Cash">Prizes & Cash</option>
              <option value="Licenses">Licenses & APIs</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Item & Notes</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Associated Event</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Treasurer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading ledger records...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense claims recorded.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{exp.title}</div>
                      {exp.notes && <div className="text-[11px] text-slate-400">{exp.notes}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        ${exp.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {exp.event_name || 'General Operations'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {exp.date_incurred}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={exp.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasRole(['President', 'Vice President', 'Treasurer']) && exp.status === 'Pending' ? (
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleUpdateExpenseStatus(exp.id, 'Approved')}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-400"
                            title="Approve Claim"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateExpenseStatus(exp.id, 'Rejected')}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-400"
                            title="Reject Claim"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : hasRole(['President', 'Vice President', 'Treasurer']) && exp.status === 'Approved' ? (
                        <button
                          onClick={() => handleUpdateExpenseStatus(exp.id, 'Reimbursed')}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-100"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Submit Operational Expense Claim"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Item Description *
            </label>
            <input
              type="text"
              required
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              placeholder="e.g. Refreshments for Hackathon Mentors or Banner Printing"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Logistics">Logistics & Venue</option>
                <option value="Hardware">Hardware & Equipment</option>
                <option value="Food & Catering">Food & Catering</option>
                <option value="Marketing">Marketing & Banners</option>
                <option value="Prizes & Cash">Prizes & Trophies</option>
                <option value="Licenses">Software & Cloud APIs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ($ USD) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="450.00"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Event
              </label>
              <select
                value={expenseEventId || ''}
                onChange={(e) => setExpenseEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">General Club Treasury</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Incurred
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Receipt / Justification Notes
            </label>
            <textarea
              rows={2}
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Vendor invoice #8892, paid via UPI/Card."
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Budget Modal */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Create Sanctioned Budget Allocation"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Allocation Title *
            </label>
            <input
              type="text"
              required
              value={budgetTitle}
              onChange={(e) => setBudgetTitle(e.target.value)}
              placeholder="e.g. Annual Hackathon Sanction or AI/ML Domain Cloud Budget"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fiscal Year *
              </label>
              <input
                type="text"
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Allocated Cap ($) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                placeholder="5000"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain Association
              </label>
              <select
                value={budgetDomainId || ''}
                onChange={(e) => setBudgetDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">Club-wide Pool</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Association
              </label>
              <select
                value={budgetEventId || ''}
                onChange={(e) => setBudgetEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">None / General</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowBudgetModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Sanction Allocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
