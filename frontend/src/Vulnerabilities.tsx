import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, Loader2, Wrench, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSecurityStore } from '../store';

const SEV: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#ef4444', bg: 'badge-d', label: 'Critical' },
  high: { color: '#f97316', bg: 'badge-w', label: 'High' },
  medium: { color: '#eab308', bg: 'badge-w', label: 'Medium' },
  low: { color: '#3b82f6', bg: 'badge-i', label: 'Low' },
};

export default function Vulnerabilities() {
  const { vulnerabilities, loading, errors, refreshVulnerabilities, clearSecurityError } = useSecurityStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    refreshVulnerabilities().catch(() => undefined);
  }, [refreshVulnerabilities]);

  const autoSolve = (id: string) => {
    setExpanded(id);
    setActionError('Auto remediation is not available from the current backend API.');
  };

  const autoSolveAll = () => {
    setActionError('Auto remediation is not available from the current backend API.');
  };

  const filtered = vulnerabilities.filter(vulnerability => filter === 'all' || vulnerability.severity === filter);
  const unfixed = vulnerabilities.length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-t1">Vulnerabilities</h1>
        <p className="text-sm text-t3 mt-0.5">Find weaknesses & auto-solve them step by step</p>
      </motion.div>

      {(errors.vulnerabilities || actionError) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="crd crd-d p-4 flex items-center gap-2 text-sm text-danger-l">
          <AlertTriangle size={14} /> {errors.vulnerabilities || actionError}
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Total', v: vulnerabilities.length, c: '#a1a1aa' },
          { l: 'Unfixed', v: unfixed, c: unfixed > 0 ? '#f87171' : '#22c55e' },
          { l: 'Fixed', v: 0, c: '#22c55e' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="crd p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px] text-t4 uppercase tracking-wider mt-0.5">{s.l}</div>
          </motion.div>
        ))}
      </div>

      {unfixed > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button onClick={autoSolveAll} className="btn btn-p w-full py-3"><Wrench size={16} /> Auto Solve All {unfixed} Vulnerabilities</button>
        </motion.div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', 'critical', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => { setActionError(null); clearSecurityError('vulnerabilities'); setFilter(f); }}
            className={`btn text-xs ${filter === f ? 'btn-p' : 'btn-s'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading.vulnerabilities && vulnerabilities.length === 0 ? (
        <div className="crd p-8 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((vulnerability, i) => {
            const severity = SEV[vulnerability.severity];
            const open = expanded === vulnerability.id;

            return (
              <motion.div key={vulnerability.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="crd overflow-hidden transition-all">

                <button onClick={() => setExpanded(open ? null : vulnerability.id)} className="w-full p-4 text-left flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-border bg-white/[0.03]">
                      <AlertTriangle size={16} style={{ color: severity.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-t1 truncate">{vulnerability.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${severity.bg}`}>{severity.label}</span>
                        <span className="text-[10px] text-t4">{vulnerability.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ChevronDown size={14} className={`text-t4 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="px-4 pb-5 space-y-4">
                        <div className="bg-white/[0.02] rounded-xl p-5 space-y-4 border border-border">
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-info mb-1.5">Why This Happens</h4>
                            <p className="text-sm text-t2 leading-relaxed">{vulnerability.cause}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-danger-l mb-1.5">What Can Go Wrong</h4>
                            <p className="text-sm text-t2 leading-relaxed">{vulnerability.impact}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-success mb-2">Fix Steps</h4>
                            <ul className="space-y-2">
                              {vulnerability.howToFix.map((step, j) => (
                                <li key={j} className="text-sm flex items-start gap-2.5 transition-all text-t3">
                                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/[0.04]">
                                    {j + 1}
                                  </span>{step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                          <button onClick={(e) => { e.stopPropagation(); autoSolve(vulnerability.id); }}
                            className="btn btn-p flex-1 min-w-[200px] py-3"><Wrench size={15} /> Auto Solve This</button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setActionError('Write actions are not exposed by the current backend API.');
                          }}
                            className="btn btn-g py-3">
                            <CheckCircle size={15} /> Mark Fixed
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
