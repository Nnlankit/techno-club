import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, History, Eye, 
  Terminal, User, Clock, ArrowRight, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card, Avatar 
} from '../components/ui';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Log Modal for JSON payload
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const data = await api.audit.list({
        entity: entityFilter !== 'All' ? entityFilter : undefined,
        action: actionFilter !== 'All' ? actionFilter : undefined,
        limit: 100
      });
      setLogs(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter, actionFilter]);

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Audit Logs"
        description="Immutable system audit trail recording governance decisions, state mutations, financial sanctions, and user actions."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search audit records by description, operator, entity...'
        }}
        filterProps={{
          filters: [
            {
              key: 'entity',
              label: 'Entity Target',
              value: entityFilter,
              onChange: setEntityFilter,
              options: [
                { label: 'All Entities', value: 'All' },
                { label: 'Approval Proposal', value: 'ApprovalProposal' },
                { label: 'Event', value: 'Event' },
                { label: 'Hackathon', value: 'Hackathon' },
                { label: 'Project', value: 'Project' },
                { label: 'Task', value: 'Task' },
                { label: 'Expense', value: 'Expense' },
                { label: 'Member', value: 'Member' },
                { label: 'Resource', value: 'Resource' },
                { label: 'Certificate', value: 'Certificate' },
              ]
            },
            {
              key: 'action',
              label: 'Action Performed',
              value: actionFilter,
              onChange: setActionFilter,
              options: [
                { label: 'All Actions', value: 'All' },
                { label: 'CREATE', value: 'CREATE' },
                { label: 'UPDATE', value: 'UPDATE' },
                { label: 'DELETE', value: 'DELETE' },
                { label: 'APPROVE', value: 'APPROVE' },
                { label: 'REJECT', value: 'REJECT' },
                { label: 'SCAN_ATTENDANCE', value: 'SCAN_ATTENDANCE' },
                { label: 'ISSUE_CERT', value: 'ISSUE_CERT' },
              ]
            }
          ]
        }}
      />

      {accessDenied && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Audit Trail Restricted to Club Governance</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Per institutional club policy and compliance guidelines, the global audit ledger is accessible to the <strong>President</strong>, <strong>Vice President</strong>, <strong>Treasurer</strong>, <strong>Faculty Coordinator</strong>, and <strong>Technical Lead</strong>.
          </p>
        </div>
      )}

      {/* Audit Log Table (Section 10) */}
      <Card className="overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              System Audit Ledger
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <LoadingState message="Loading immutable audit trail records..." />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No system audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <Avatar name={log.user_email || 'System'} size="xs" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                            {log.user_email || 'System Daemon'}
                          </div>
                          <div className="text-[10px] text-slate-400">{log.role || 'Service'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                        log.action === 'APPROVE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                        log.action === 'REJECT' || log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.entity} #{log.entity_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.diff_json ? (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span>View State</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* JSON Payload Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event State #${selectedLog.id}`}
          subtitle={`${selectedLog.action} on ${selectedLog.entity} #${selectedLog.entity_id}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div>Operator: <strong>{selectedLog.user_email}</strong> ({selectedLog.role})</div>
              <div>Timestamp: <strong className="font-mono">{new Date(selectedLog.timestamp).toISOString()}</strong></div>
              <div>Event: {selectedLog.description}</div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-1" />
                <span>Captured Mutation Payload (JSON)</span>
              </h4>
              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-80">
                {JSON.stringify(selectedLog.diff_json, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
