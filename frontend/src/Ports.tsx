import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Lock, Unlock, RefreshCw, Loader2, Shield, Wrench, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSecurityStore } from '../store';

export default function Ports() {
  const { ports, loading, errors, refreshPorts, clearSecurityError } = useSecurityStore();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    refreshPorts().catch(() => undefined);
  }, [refreshPorts]);

  const scan = async () => {
    setActionError(null);
    clearSecurityError('ports');
    try {
      await refreshPorts(true);
    } catch {
      return;
    }
  };

  const solvePort = (port: number) => {
    setExpanded(port);
    setActionError('Auto remediation is not available from the current backend API.');
  };

  const solveAll = () => {
    setActionError('Auto remediation is not available from the current backend API.');
  };

  const risky = ports.filter((port) => port.status === 'open' && port.riskLevel !== 'safe').length;
  const ST = { open: { c: 'text-success', icon: Unlock, l: 'Open' }, closed: { c: 'text-t4', icon: Lock, l: 'Closed' }, filtered: { c: 'text-warn', icon: Shield, l: 'Filtered' } };
  const RK = { safe: { c: 'text-success', l: 'Safe' }, warning: { c: 'text-warn', l: 'Caution' }, danger: { c: 'text-danger-l', l: 'Danger' } };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-t1">Ports & Firewall</h1><p className="text-sm text-t3 mt-0.5">Scan ports & secure vulnerabilities</p></div>
        <div className="flex gap-2">
          {risky > 0 && <button onClick={solveAll} className="btn btn-p"><Wrench size={13} /> Solve {risky}</button>}
          <button onClick={scan} disabled={loading.ports} className="btn btn-s disabled:opacity-50">
            {loading.ports ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} {loading.ports ? 'Loading...' : 'Scan Ports'}
          </button>
        </div>
      </motion.div>

      {(errors.ports || actionError) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="crd crd-d p-4 flex items-center gap-2 text-sm text-danger-l">
          <AlertTriangle size={14} /> {errors.ports || actionError}
        </motion.div>
      )}

      {!loading.ports && (
        <div className="grid grid-cols-3 gap-3">
          {[{ l: 'Checked', v: ports.length, c: '#a1a1aa' }, { l: 'Open', v: ports.filter(port => port.status === 'open').length, c: '#22c55e' }, { l: 'Risky', v: risky, c: risky > 0 ? '#ef4444' : '#22c55e' }].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="crd p-3 text-center">
              <div className="text-xl font-bold" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[9px] text-t4 uppercase tracking-wider">{s.l}</div>
            </motion.div>
          ))}
        </div>
      )}

      {loading.ports && ports.length === 0 ? (
        <div className="crd p-8 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-2">
          {ports.map((port, i) => {
            const sc = ST[port.status];
            const rk = RK[port.riskLevel];
            const Icon = sc.icon;
            const isOpen = expanded === port.port;

            return (
              <motion.div key={port.port} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="crd overflow-hidden transition-all">
                <button onClick={() => setExpanded(isOpen ? null : port.port)} className="w-full p-4 text-left flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-border">
                      <Icon size={14} className={sc.c} />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-t1">:{port.port}</span>
                      <span className="text-xs text-t3 ml-2">{port.name} — {port.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium ${rk.c}`}>{rk.l}</span>
                    <ChevronDown size={14} className={`text-t4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        <div className="bg-white/[0.02] rounded-xl p-4 border border-border">
                          <p className="text-xs text-t2 mb-3">💡 {port.recommendation}</p>
                          <ul className="space-y-2">
                            {port.fixSteps.map((step, j) => (
                              <li key={j} className="text-sm flex items-start gap-2 text-t3">
                                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-white/[0.04]">{j + 1}</span>{step}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {port.riskLevel !== 'safe' && port.status === 'open' && (
                          <button onClick={(e) => { e.stopPropagation(); solvePort(port.port); }} className="btn btn-p w-full"><Wrench size={14} /> Auto Solve</button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="crd p-5">
        <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em] mb-3">Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-t2">
          {['Keep firewall always enabled', 'Close unused ports', 'Never expose Telnet or RDP', 'Use VPN for remote access'].map((t, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-border">
              {i < 2 ? <CheckCircle size={12} className="text-success flex-shrink-0" /> : <AlertTriangle size={12} className="text-warn flex-shrink-0" />} {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
