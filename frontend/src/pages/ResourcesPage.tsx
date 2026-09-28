import React, { useState, useEffect } from 'react';
import { 
  Cpu, HardDrive, Laptop, Layers, Plus, Search, 
  UserCheck, AlertTriangle, CheckCircle, Wrench, Shield, Key
} from 'lucide-react';
import { api } from '../services/api';
import { Resource, Member, Project } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export const ResourcesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Physical' | 'Digital'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Add Resource Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Physical' | 'Digital'>('Physical');
  const [resourceType, setResourceType] = useState('Hardware Kit');
  const [identifier, setIdentifier] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('Lab 304 - Locker B');
  const [status, setStatus] = useState<'Available' | 'Assigned' | 'Under Maintenance' | 'Lost/Damaged'>('Available');
  const [notes, setNotes] = useState('');

  // Assign Form State
  const [assignMemberId, setAssignMemberId] = useState<number | undefined>(undefined);
  const [assignProjectId, setAssignProjectId] = useState<number | undefined>(undefined);
  const [returnDueDate, setReturnDueDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, memData, projData] = await Promise.all([
        api.resources.list(),
        api.members.list(),
        api.projects.list()
      ]);
      setResources(resData);
      setMembers(memData);
      setProjects(projData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.resources.add({
        name,
        category,
        resource_type: resourceType,
        identifier: identifier || `RES-${Date.now().toString().slice(-4)}`,
        quantity: Number(quantity),
        available_quantity: Number(quantity),
        status,
        location,
        notes,
        specifications: { registered_by: 'Club Operations' }
      });
      setShowAddModal(false);
      resetAddForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add resource');
    }
  };

  const handleAssignResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource || !assignMemberId || !returnDueDate) {
      alert('Please fill in all assignment fields');
      return;
    }
    try {
      await api.resources.assign({
        resource_id: selectedResource.id,
        member_id: assignMemberId,
        project_id: assignProjectId,
        return_due_date: new Date(returnDueDate).toISOString()
      });
      setShowAssignModal(false);
      setSelectedResource(null);
      setAssignMemberId(undefined);
      setAssignProjectId(undefined);
      setReturnDueDate('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign resource');
    }
  };

  const handleQuickStatusChange = async (resourceId: number, newStatus: any) => {
    try {
      await api.resources.update(resourceId, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const resetAddForm = () => {
    setName('');
    setCategory('Physical');
    setResourceType('Hardware Kit');
    setIdentifier('');
    setQuantity(1);
    setLocation('Lab 304 - Locker B');
    setStatus('Available');
    setNotes('');
  };

  // Filtered resources
  const filteredResources = resources.filter(res => {
    const matchCat = categoryFilter === 'All' || res.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || res.status === statusFilter;
    const matchSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.location && res.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchStatus && matchSearch;
  });

  // KPI stats
  const physicalCount = resources.filter(r => r.category === 'Physical').reduce((acc, r) => acc + r.quantity, 0);
  const digitalCount = resources.filter(r => r.category === 'Digital').reduce((acc, r) => acc + r.quantity, 0);
  const assignedCount = resources.filter(r => r.status === 'Assigned').length;
  const maintenanceCount = resources.filter(r => r.status === 'Under Maintenance' || r.status === 'Lost/Damaged').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Hardware & Digital Assets Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {resources.length} SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track microcontrollers, sensors, laptops, cloud subscriptions, developer licenses, and custody assignments.
          </p>
        </div>
        {hasRole(['President', 'Vice President', 'Treasurer', 'Technical Lead']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset / License</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Physical Hardware Units"
          value={physicalCount.toString()}
          subtitle="Kits, Boards, Displays, Laptops"
          icon={<Cpu className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Digital Subscriptions"
          value={digitalCount.toString()}
          subtitle="Cloud, APIs, IDE licenses"
          icon={<Key className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Assets in Custody"
          value={assignedCount.toString()}
          subtitle="Issued to members & leads"
          icon={<UserCheck className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Maintenance / Damaged"
          value={maintenanceCount.toString()}
          subtitle="Requires repair or decommission"
          icon={<Wrench className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            {(['All', 'Physical', 'Digital'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  categoryFilter === cat
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat === 'All' ? 'All Assets' : cat === 'Physical' ? 'Physical Hardware' : 'Digital / Licenses'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Lost/Damaged">Lost/Damaged</option>
            </select>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search identifier, name, type..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resources Table / Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Asset / License</th>
                <th className="py-3 px-3">Identifier / Tag</th>
                <th className="py-3 px-3">Category & Type</th>
                <th className="py-3 px-3">Qty (Avail / Tot)</th>
                <th className="py-3 px-3">Location / Portal</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Custody</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading resources catalog...</td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No resources matching current filters.
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-1.5 rounded-lg ${res.category === 'Physical' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'}`}>
                          {res.category === 'Physical' ? <Cpu className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{res.name}</div>
                          {res.notes && <div className="text-[11px] text-slate-400 truncate max-w-xs">{res.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {res.identifier}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{res.resource_type}</span>
                        <span className="text-[10px] text-slate-400">{res.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{res.available_quantity}</span>
                      <span className="text-slate-400"> / {res.quantity}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {res.location || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="py-3 px-3">
                      {res.assigned_to_name ? (
                        <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{res.assigned_to_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        {res.available_quantity > 0 && hasRole(['President', 'Vice President', 'Treasurer', 'Technical Lead']) && (
                          <button
                            onClick={() => {
                              setSelectedResource(res);
                              setShowAssignModal(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 font-medium text-[11px] transition-colors"
                          >
                            Checkout
                          </button>
                        )}
                        {hasRole(['President', 'Vice President', 'Treasurer', 'Technical Lead']) && (
                          <select
                            value={res.status}
                            onChange={(e) => handleQuickStatusChange(res.id, e.target.value)}
                            className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-600 dark:text-slate-300"
                          >
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Under Maintenance">Maintenance</option>
                            <option value="Lost/Damaged">Lost/Damaged</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resource Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Resource / License"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Asset / Tool Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Raspberry Pi 4 Model B 8GB or JetBrains All Products License"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Physical">Physical Hardware</option>
                <option value="Digital">Digital / License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resource Type *
              </label>
              <input
                type="text"
                required
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                placeholder="e.g. Microcontroller, Camera, Cloud Credit"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tag / Serial / License ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. RPI-4B-008"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Storage Location / Link
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lab 304, AWS IAM Console"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Specifications
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes power supply, 32GB SD card, and official case."
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
              Save Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign / Checkout Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Checkout Resource: ${selectedResource?.name}`}
      >
        <form onSubmit={handleAssignResource} className="space-y-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-xs text-indigo-800 dark:text-indigo-300">
            <div className="font-semibold">{selectedResource?.name}</div>
            <div className="mt-0.5 font-mono text-[11px]">Identifier: {selectedResource?.identifier} | Available: {selectedResource?.available_quantity}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Member Custodian *
            </label>
            <select
              required
              value={assignMemberId || ''}
              onChange={(e) => setAssignMemberId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">Select Member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.name} ({m.college_id}) - {m.domain_name || 'General Member'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Associated Project (Optional)
            </label>
            <select
              value={assignProjectId || ''}
              onChange={(e) => setAssignProjectId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">None (Individual Research / Prep)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.domain_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Return Due Date *
            </label>
            <input
              type="date"
              required
              value={returnDueDate}
              onChange={(e) => setReturnDueDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Confirm Checkout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
