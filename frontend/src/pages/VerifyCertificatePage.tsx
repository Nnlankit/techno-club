import React, { useState } from 'react';
import { 
  ShieldCheck, Search, Award, CheckCircle2, XCircle, 
  Download, ArrowLeft, Terminal, Calendar, User, FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui';

export const VerifyCertificatePage: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const data = await api.certificates.verify(query.trim());
      setResult(data);
    } catch (err: any) {
      setResult({ valid: false, message: err.response?.data?.detail || 'Certificate not found in registry' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center space-y-3">
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Management OS</span>
          </button>
        )}

        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Techno Club Public Credential Verification Portal
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Cryptographically verify the authenticity and metadata of certificates, awards, and event credentials issued by Techno Club leadership.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 shadow-2xl rounded-2xl space-y-6">
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Certificate Serial ID or Cryptographic Verification Hash
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. CERT-2026-AIML-001 or 32-char hash"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-white font-mono placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Verify
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Try sample seed ID: <code className="text-blue-400 font-mono">CERT-2026-AIML-001</code>
            </p>
          </form>

          {/* Verification Result Display */}
          {searched && !loading && (
            <div className="pt-4 border-t border-slate-800">
              {result && result.valid ? (() => {
                const cert = result.certificate || result;
                return (
                  <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Official Verified Credential
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {cert.title || 'Certificate of Excellence'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-emerald-900/40">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recipient</span>
                        <strong className="text-white font-medium">{cert.recipient_name}</strong>
                        {cert.recipient_email && (
                          <span className="block text-[11px] text-slate-400">{cert.recipient_email}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Issue Date</span>
                        <strong className="text-white font-medium">
                          {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Credential Type</span>
                        <strong className="text-white font-medium">{cert.certificate_type}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Associated Program</span>
                        <strong className="text-white font-medium">{cert.event_name || 'Flagship Event'}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 font-mono text-[10px] text-slate-400 space-y-0.5 border border-slate-800">
                      <div>Serial: <span className="text-emerald-400">{cert.certificate_id}</span></div>
                      <div>Hash: <span className="text-slate-300">{cert.verification_code}</span></div>
                      <div>Issuer: <span className="text-slate-300">Techno Club Executive Council & Dean of Student Affairs</span></div>
                    </div>

                    {cert.file_url && (
                      <div className="pt-2">
                        <a
                          href={api.getFileUrl(cert.file_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Certified Vector PDF</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-rose-500/20 text-rose-400">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Unverified Credential
                    </div>
                    <div className="text-xs text-rose-200 mt-0.5">
                      {result?.message || 'Certificate record could not be matched against current cryptographic registry.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
