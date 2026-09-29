import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Receipt, Plus, 
  Download, CheckCircle, XCircle, Clock, Filter, AlertCircle, 
  FileText, ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Budget, Expense, Event, Domain } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card, ProgressBar, Table 
} from '../components/ui';
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
  const [searchQuery, setSearchQuery] = useState('');

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
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.event_name && e.event_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchCategory && matchSearch;
  });

  const canManageFinance = hasRole(['President', 'Vice President', 'Treasurer']);

  return (
    <div className="space-y-6">
      {/* Section 9 Common Page Header */}
      <PageHeader
        title="Finance"
        description="Treasury management, budget allocations, operational reimbursement claims, and financial governance."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search expense claims by title, vendor, event...'
        }}
        filterProps={{
          filters: [
            {
              key: 'status',
              label: 'Claim Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: 'All Statuses', value: 'All' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Approved', value: 'Approved' },
                { label: 'Reimbursed', value: 'Reimbursed' },
                { label: 'Rejected', value: 'Rejected' },
              ]
            },
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { label: 'All Categories', value: 'All' },
                { label: 'Logistics', value: 'Logistics' },
                { label: 'Hardware', value: 'Hardware' },
                { label: 'Food & Catering', value: 'Food & Catering' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Prizes & Cash', value: 'Prizes & Cash' },
                { label: 'Licenses', value: 'Licenses' },
              ]
            }
          ]
        }}
        actions={
          <div className="flex items-center space-x-2">
            <a
              href={api.reports.exportCsvUrl('expenses')}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
            </a>
            {canManageFinance && (
              <Button
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowBudgetModal(true)}
              >
                Create Allocation
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              icon={<Receipt className="w-4 h-4" />}
              onClick={() => setShowExpenseModal(true)}
            >
              Claim Expense
            </Button>
          </div>
        }
      />

      {/* KPI Cards (Section 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sanctioned Budget</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{totalAllocated.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total active allocations across events & domains
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Disbursed Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            ₹{totalSpent.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Approved and disbursed reimbursements
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Remaining Treasury</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{remainingTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Available runway for upcoming club programs
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Claims</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            ₹{pendingClaims.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {expenses.filter(e => e.status === 'Pending').length} awaiting Treasurer authorization
          </p>
        </Card>
      </div>

      {/* Budget Allocation Utilization Progress (Section 11) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Budget Allocations & Utilization
          </h2>
          <span className="text-xs text-slate-400 font-medium">{budgets.length} Budget Heads</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(100, Math.round(((b.total_spent || 0) / (b.total_allocated || 1)) * 100));
            return (
              <Card key={b.id} className="p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate pr-2">
                    {b.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {b.fiscal_year}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Spent: <strong className="text-slate-900 dark:text-white">₹{b.total_spent?.toLocaleString() || 0}</strong></span>
                    <span>Cap: <strong className="text-slate-900 dark:text-white">₹{b.total_allocated?.toLocaleString() || 0}</strong></span>
                  </div>
                  <ProgressBar
                    value={pct}
                    color={pct > 85 ? 'danger' : pct > 60 ? 'warning' : 'primary'}
                    size="sm"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{pct}% utilized</span>
                    <span>Remaining: ₹{((b.total_allocated || 0) - (b.total_spent || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Expenses Registry Section (Section 10 Table Design) */}
      <Card className="overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Disbursements & Expense Claims Registry
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredExpenses.length} records shown
          </span>
        </div>

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
                {canManageFinance && <th className="py-3 px-4 text-right">Treasurer Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={canManageFinance ? 7 : 6} className="py-12 text-center text-slate-400">
                    <LoadingState message="Loading financial ledger..." />
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={canManageFinance ? 7 : 6} className="py-12 text-center text-slate-400">
                    No expense claims recorded.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{exp.title}</div>
                      {exp.notes && <div className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {exp.event_name || 'General Club Operations'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {exp.date_incurred}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={exp.status} />
                    </td>
                    {canManageFinance && (
                      <td className="py-3 px-4 text-right">
                        {exp.status === 'Pending' && (
                          <div className="inline-flex items-center space-x-1.5">
                            <Button
                              variant="success"
                              size="xs"
                              onClick={() => handleUpdateExpenseStatus(exp.id, 'Approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleUpdateExpenseStatus(exp.id, 'Rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {exp.status === 'Approved' && (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleUpdateExpenseStatus(exp.id, 'Reimbursed')}
                          >
                            Mark Reimbursed
                          </Button>
                        )}
                        {(exp.status === 'Reimbursed' || exp.status === 'Rejected') && (
                          <span className="text-[11px] text-slate-400">Settled</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Claim Expense Modal (Section 12 Form Design) */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Submit Operational Expense Claim"
        subtitle="Receipts will be audited and routed to Treasurer for disbursement sanction"
        maxWidth="md"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Item Description
            </label>
            <input
              type="text"
              required
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              placeholder="e.g. Refreshments for Workshop 2, Raspberry Pi 5 kits"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Logistics">Logistics</option>
                <option value="Hardware">Hardware / Kits</option>
                <option value="Food & Catering">Food & Catering</option>
                <option value="Marketing">Marketing / Print</option>
                <option value="Prizes & Cash">Prizes & Cash</option>
                <option value="Licenses">Licenses & APIs</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Associated Event (Optional)
              </label>
              <select
                value={expenseEventId || ''}
                onChange={(e) => setExpenseEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General Club Treasury</option>
                {events.map((ev) => (
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
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vendor / Notes / Receipt Memo
            </label>
            <textarea
              rows={2}
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
              placeholder="Vendor invoice number, payment reference, or itemization..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExpenseModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Budget Modal */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Allocate New Budget Head"
        subtitle="Assign sanctioned financial ceiling to a specific domain or flagship program"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Budget Head Title
            </label>
            <input
              type="text"
              required
              value={budgetTitle}
              onChange={(e) => setBudgetTitle(e.target.value)}
              placeholder="e.g. AI/ML Research Grants, Hackathon Food & Venue Cap"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fiscal Year
              </label>
              <input
                type="text"
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Allocation Cap (₹)
              </label>
              <input
                type="number"
                required
                min="100"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign to Domain (Optional)
              </label>
              <select
                value={budgetDomainId || ''}
                onChange={(e) => setBudgetDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Central / Event)</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign to Event (Optional)
              </label>
              <select
                value={budgetEventId || ''}
                onChange={(e) => setBudgetEventId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Central / Domain)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBudgetModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Create Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
