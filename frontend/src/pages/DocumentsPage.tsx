import React, { useState, useEffect } from 'react';
import { 
  FileText, UploadCloud, Search, Download, Trash2, Edit3,
  Eye, Folder, Filter, Calendar, CheckCircle2, Lock, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { Document, Domain, Event, Project } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Event Proposal',
  'Event Report',
  'Meeting Minutes',
  'Project Documentation',
  'Permission Letter',
  'Budget & Invoice',
  'Sponsorship MOU',
  'Presentation',
  'Other'
];

export const DocumentsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Event Proposal');
  const [uploadDomainId, setUploadDomainId] = useState<number | undefined>(undefined);
  const [uploadEventId, setUploadEventId] = useState<number | undefined>(undefined);
  const [uploadProjectId, setUploadProjectId] = useState<number | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Event Proposal');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editIsPublic, setEditIsPublic] = useState(false);

  // Delete State
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, domData, evData, projData] = await Promise.all([
        api.documents.list(),
        api.domains.list(),
        api.events.list(),
        api.projects.list()
      ]);
      setDocuments(docsData);
      setDomains(domData);
      setEvents(evData);
      setProjects(projData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle || selectedFile.name);
      formData.append('category', uploadCategory);
      if (uploadDomainId) formData.append('domain_id', uploadDomainId.toString());
      if (uploadEventId) formData.append('event_id', uploadEventId.toString());
      if (uploadProjectId) formData.append('project_id', uploadProjectId.toString());
      formData.append('is_public', isPublic ? 'true' : 'false');

      await api.documents.upload(formData);
      setShowUploadModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setUploadTitle('');
    setUploadCategory('Event Proposal');
    setUploadDomainId(undefined);
    setUploadEventId(undefined);
    setUploadProjectId(undefined);
    setIsPublic(false);
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleOpenEdit = (doc: Document) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditDomainId(doc.domain_id);
    setEditIsPublic(doc.is_public);
    setShowEditModal(true);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      await api.documents.update(editingDoc.id, {
        title: editTitle,
        category: editCategory,
        domain_id: editDomainId,
        is_public: editIsPublic,
      });
      setShowEditModal(false);
      setEditingDoc(null);
      setToast({ message: `Document "${editTitle}" updated successfully`, type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to update document', type: 'error' });
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await api.documents.delete(docToDelete.id);
      setShowDeleteDialog(false);
      setToast({ message: `Document "${docToDelete.title}" deleted successfully`, type: 'success' });
      setDocToDelete(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to delete document', type: 'error' });
    }
  };

  const canManageDocs = hasRole(['Super Admin', 'President', 'Vice President', 'Domain Head']);

  const filteredDocs = documents.filter(doc => {
    const matchCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.domain_name && doc.domain_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Documents"
        description="Official club archives, event proposals, faculty permission letters, MOUs, and technical whitepapers."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search documents by title, file name, domain...'
        }}
        filterProps={{
          filters: [
            {
              key: 'category',
              label: 'Category',
              value: selectedCategory,
              onChange: setSelectedCategory,
              options: CATEGORIES.map(c => ({ label: c, value: c }))
            }
          ]
        }}
        primaryAction={{
          label: 'Upload Document',
          icon: <UploadCloud className="w-4 h-4" />,
          onClick: () => setShowUploadModal(true)
        }}
      />

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Loading documents and institutional records..." />
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="No Documents Found"
          description="No files match your search criteria. Upload a new document to start your repository."
          action={{
            label: 'Upload Document',
            icon: <UploadCloud className="w-4 h-4" />,
            onClick: () => setShowUploadModal(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {doc.is_public ? (
                      <span className="flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center text-[11px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Internal
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {doc.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                    {doc.file_name}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <strong className="text-slate-700 dark:text-slate-300">{doc.category}</strong>
                  </div>
                  {doc.domain_name && (
                    <div className="flex justify-between">
                      <span>Domain:</span>
                      <strong className="text-blue-600 dark:text-blue-400">{doc.domain_name}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="font-mono">{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate pr-2">
                  By {doc.uploaded_by_name || 'Member'}
                </span>
                <div className="flex items-center space-x-1.5">
                  <a
                    href={api.getFileUrl(doc.file_path)}
                    target="_blank"
                    rel="noreferrer"
                    download
                  >
                    <Button variant="outline" size="xs" icon={<Download className="w-3.5 h-3.5" />}>
                      Download
                    </Button>
                  </a>
                  {canManageDocs && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        title="Edit Document Info"
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDocToDelete(doc);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete Document"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Official Document"
        subtitle="Secure repository archiving for club assets, proposals, and logs"
        maxWidth="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select File
            </label>
            <input
              type="file"
              required
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                  if (!uploadTitle) setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Display Title
            </label>
            <input
              type="text"
              required
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Annual Technical Symposium Budget Proposal 2026"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain Tag (Optional)
              </label>
              <select
                value={uploadDomainId || ''}
                onChange={(e) => setUploadDomainId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General / Central Club</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Publicly accessible to all registered student participants</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUploading}
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Document Modal */}
      {editingDoc && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDoc(null);
          }}
          title={`Edit Document: ${editingDoc.file_name}`}
          subtitle="Update document title, metadata, category, and visibility"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateDocument} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document Title
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
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain Tag (Optional)
                </label>
                <select
                  value={editDomainId || ''}
                  onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General / Central Club</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Publicly accessible to all registered student participants</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDoc(null);
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
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.title}" (${docToDelete?.file_name})? This file will be removed from club storage.`}
        confirmLabel="Delete Document"
        confirmVariant="danger"
        onConfirm={handleDeleteDocument}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDocToDelete(null);
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
