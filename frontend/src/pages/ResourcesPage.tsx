import React, { useState, useEffect } from 'react';
import { 
  Cpu, HardDrive, Laptop, Layers, Plus, Search, 
  UserCheck, AlertTriangle, CheckCircle, Wrench, Shield, Key,
  Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Resource, Member, Project } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card, Avatar,
  ConfirmationDialog, Toast
} from '../components/ui';
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

  // Edit Resource State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'Physical' | 'Digital'>('Physical');
  const [editResourceType, setEditResourceType] = useState('Hardware Kit');
  const [editIdentifier, setEditIdentifier] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editAvailableQuantity, setEditAvailableQuantity] = useState(1);
  const [editLocation, setEditLocation] = useState('Lab 304 - Locker B');
  const [editStatus, setEditStatus] = useState<'Available' | 'Assigned' | 'Under Maintenance' | 'Lost/Damaged'>('Available');
  const [editNotes, setEditNotes] = useState('');

  // Delete State
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setEditName(res.name);
    setEditCategory(res.category as 'Physical' | 'Digital');
    setEditResourceType(res.resource_type);
    setEditIdentifier(res.identifier);
    setEditQuantity(res.quantity);
    setEditAvailableQuantity(res.available_quantity);
    setEditLocation(res.location || '');
    setEditStatus(res.status as any);
    setEditNotes(res.notes || '');
    setShowEditModal(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    try {
      await api.resources.update(editingResource.id, {
        name: editName,
        category: editCategory,
        resource_type: editResourceType,
        identifier: editIdentifier,
        quantity: Number(editQuantity),
        available_quantity: Number(editAvailableQuantity),
        location: editLocation,
        status: editStatus,
        notes: editNotes,
      });
      setShowEditModal(false);
      setEditingResource(null);
      setToast({ message: `Resource "${editName}" updated successfully`, type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to update resource', type: 'error' });
    }
  };

  const handleReturnResource = async (res: Resource) => {
    try {
      await api.resources.returnResource(res.id);
      setToast({ message: `Resource "${res.name}" returned to available stock`, type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to return resource', type: 'error' });
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      await api.resources.delete(resourceToDelete.id);
      setShowDeleteDialog(false);
      setToast({ message: `Resource "${resourceToDelete.name}" deleted successfully`, type: 'success' });
      setResourceToDelete(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to delete resource', type: 'error' });
    }
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

  const canManageResources = hasRole(['President', 'Vice President', 'Domain Head']);

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Resources"
        description="Physical lab hardware kits, microcontrollers, sensors, server instances, and software license assets."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search equipment by name, serial code, lab location...'
        }}
        filterProps={{
          filters: [
            {
              key: 'category',
              label: 'Category',
              value: categoryFilter,
              onChange: setCategoryFilter as any,
              options: [
                { label: 'All Assets', value: 'All' },
                { label: 'Physical Kits', value: 'Physical' },
                { label: 'Digital Licenses', value: 'Digital' },
              ]
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: 'All Statuses', value: 'All' },
                { label: 'Available', value: 'Available' },
                { label: 'Assigned', value: 'Assigned' },
                { label: 'Under Maintenance', value: 'Under Maintenance' },
                { label: 'Lost/Damaged', value: 'Lost/Damaged' },
              ]
            }
          ]
        }}
        primaryAction={
          canManageResources
            ? {
                label: 'Add Resource',
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
            <span>Physical Hardware Kits</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {physicalCount} Units
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Arduino, Raspberry Pi, Jetson, and sensor modules
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Digital Licenses</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {digitalCount} Seats
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cloud instances, Figma Pro, and IDE subscriptions
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Currently Assigned</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {assignedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Checked out for active member projects
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Maintenance & Repair</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {maintenanceCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Units quarantined for testing or repair
          </p>
        </Card>
      </div>

      {/* Main Grid */}
      {loading ? (
        <LoadingState message="Loading lab equipment and resource inventory..." />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          title="No Resources Found"
          description="No inventory items matched your search criteria."
          action={
            canManageResources
              ? {
                  label: 'Add Resource',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setShowAddModal(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {res.identifier}
                  </span>
                  <Badge status={res.status} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {res.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {res.resource_type} • {res.category}
                  </div>
                </div>

                {res.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {res.notes}
                  </p>
                )}

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {res.available_quantity} / {res.quantity} Available
                    </strong>
                  </div>
                  {res.location && (
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{res.location}</span>
                    </div>
                  )}
                  {res.assigned_to_name && (
                    <div className="flex justify-between text-blue-600 dark:text-blue-400 pt-1">
                      <span>Assigned to:</span>
                      <strong className="truncate">{res.assigned_to_name}</strong>
                    </div>
                  )}
                </div>
              </div>

              {canManageResources && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {res.status === 'Available' ? (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => {
                          setSelectedResource(res);
                          setShowAssignModal(true);
                        }}
                      >
                        Check Out
                      </Button>
                    ) : res.status === 'Assigned' ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleReturnResource(res)}
                      >
                        Return to Stock
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleQuickStatusChange(res.id, 'Available')}
                      >
                        Mark Available
                      </Button>
                    )}

                    <select
                      value={res.status}
                      onChange={(e) => handleQuickStatusChange(res.id, e.target.value)}
                      className="text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Under Maintenance">Maintenance</option>
                      <option value="Lost/Damaged">Lost/Damaged</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(res)}
                      title="Edit Resource"
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setResourceToDelete(res);
                        setShowDeleteDialog(true);
                      }}
                      title="Delete Resource"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Assign Resource Modal */}
      {selectedResource && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedResource(null);
          }}
          title={`Assign ${selectedResource.name}`}
          subtitle={`Tag: ${selectedResource.identifier}`}
          maxWidth="md"
        >
          <form onSubmit={handleAssignResource} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assign to Member
              </label>
              <select
                required
                value={assignMemberId || ''}
                onChange={(e) => setAssignMemberId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.domain_name || 'Member'})</option>
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
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General Project / R&D</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Return Due Date
              </label>
              <input
                type="date"
                required
                value={returnDueDate}
                onChange={(e) => setReturnDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Confirm Checkout
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Resource Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Inventory Equipment / Asset"
        subtitle="Catalog new hardware, kits, or software subscriptions into the club registry"
        maxWidth="md"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resource Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Raspberry Pi 5 8GB Kit #4"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Physical">Physical Hardware</option>
                <option value="Digital">Digital / Software</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Identifier / Tag
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. RPI-005"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lab Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lab 304 - Locker B"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Specifications & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Technical specs, serial numbers, cable accessories included..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              Add Resource
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Resource Modal */}
      {editingResource && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingResource(null);
          }}
          title={`Edit Resource: ${editingResource.name}`}
          subtitle={`Tag: ${editingResource.identifier}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateResource} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resource Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Physical">Physical Hardware</option>
                  <option value="Digital">Digital / Software</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resource Type
                </label>
                <input
                  type="text"
                  required
                  value={editResourceType}
                  onChange={(e) => setEditResourceType(e.target.value)}
                  placeholder="Hardware Kit, Microcontroller, etc."
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  max={editQuantity}
                  required
                  value={editAvailableQuantity}
                  onChange={(e) => setEditAvailableQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Lost/Damaged">Lost/Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lab Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Lab 304 - Locker B"
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specifications & Notes
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Technical specs, serial numbers, cable accessories..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingResource(null);
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
        title="Delete Resource"
        message={`Are you sure you want to permanently delete resource "${resourceToDelete?.name}" (${resourceToDelete?.identifier})? This action cannot be undone.`}
        confirmLabel="Delete Resource"
        confirmVariant="danger"
        onConfirm={handleDeleteResource}
        onCancel={() => {
          setShowDeleteDialog(false);
          setResourceToDelete(null);
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
