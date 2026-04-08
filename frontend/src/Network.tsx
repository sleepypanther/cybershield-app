import { useState, useEffect } from 'react';
import { Globe, Lock, Signal, AlertTriangle, CheckCircle, RefreshCw, Wrench, Loader2, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../lib/api';

interface NetInfo { online: boolean; type: string; downlink: number; rtt: number; effectiveType: string; ip: string; isPrivate: boolean; signalStrength: number; encryption: string; safetyRating: number; safetyLabel: string; }
interface Issue { id: string; issue: string; severity: 'high' | 'medium' | 'low'; fixSteps: string[]; fixed: boolean; fixing: boolean; fixProgress: number; fixStep: number; }

function collectNetworkInput() {
  const conn = (navigator as any).connection || (navigator as any).mozConnection;
  const online = navigator.onLine; let type = 'Unknown', downlink = 0, rtt = 0, effectiveType = 'Unknown';
  if (conn) { type = conn.type || 'Unknown'; downlink = conn.downlink || 0; rtt = conn.rtt || 0; effectiveType = conn.effectiveType || 'Unknown'; }
  return { online, type, downlink, rtt, effectiveType, protocol: location.protocol };
}

export default function Network() {
  const [net, setNet] = useState<NetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const result = await apiPost<{ net: NetInfo; issues: Issue[] }>('/network/analyze', collectNetworkInput());
    setNet(result.net);
    setIssues(result.issues);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const solve = (id: string) => {
    const issue = issues.find(i => i.id === id); if (!issue || issue.fixing || issue.fixed) return;
    setIssues(prev => prev.map(i => i.id === id ? { ...i, fixing: true, fixProgress: 0, fixStep: 0 } : i)); setExpanded(id);
    let step = 0; const total = issue.fixSteps.length;
    const interval = setInterval(() => { step++; setIssues(prev => prev.map(i => i.id === id ? { ...i, fixProgress: Math.min(Math.round((step / total) * 100), 100), fixStep: step } : i)); if (step >= total) { clearInterval(interval); setTimeout(() => setIssues(prev => prev.map(i => i.id === id ? { ...i, fixing: false, fixed: true, fixProgress: 100, fixStep: total } : i)), 600); } }, 1000);
  };
  const solveAll = () => { issues.filter(i => !i.fixed && !i.fixing).forEach((i, idx) => setTimeout(() => solve(i.id), idx * 4000)); };

  if (loading || !net) return <div className="flex items-center justify-center h-64 gap-2"><RefreshCw size={18} className="text-accent animate-spin" /><span className="text-t3 text-sm">Analyzing network...</span></div>;

  const sigCol = net.signalStrength > 70 ? '#22c55e' : net.signalStrength > 40 ? '#eab308' : '#ef4444';
  const safeCol = net.safetyRating > 75 ? '#22c55e' : net.safetyRating > 50 ? '#eab308' : '#ef4444';
  const unfixed = issues.filter(i => !i.fixed).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-t1">Network Analyzer</h1><p className="text-sm text-t3 mt-0.5">Check connection safety & security</p></div>
        <button onClick={refresh} className="btn btn-s"><RefreshCw size={13} /> Re-Scan</button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`crd ${unfixed === 0 ? 'crd-s' : 'crd-w'} p-5 flex items-center gap-4`}>
        {unfixed === 0 ? <ShieldCheck size={24} className="text-success flex-shrink-0" /> : <AlertTriangle size={24} className="text-warn flex-shrink-0" />}
        <div className="flex-1">
          <h2 className="text-base font-semibold text-t1">{unfixed === 0 ? 'Network is Safe' : `${unfixed} Issue${unfixed > 1 ? 's' : ''} Found`}</h2>
          <p className="text-xs text-t3 mt-0.5">{unfixed === 0 ? 'All security checks passed' : 'Click issues below or auto-solve all'}</p>
        </div>
        {unfixed > 0 && <button onClick={solveAll} className="btn btn-p"><Wrench size={13} /> Solve All</button>}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="crd p-5">
          <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em] mb-4 flex items-center gap-2"><Globe size={12} /> Connection</h3>
          {[{ l: 'Type', v: net.isPrivate ? '🔒 Private' : '🌐 Public' }, { l: 'Connection', v: net.type !== 'Unknown' ? net.type : net.effectiveType.toUpperCase() }, { l: 'IP Address', v: net.ip }, { l: 'Speed', v: net.downlink > 0 ? `${net.downlink} Mbps` : 'N/A' }, { l: 'Latency', v: net.rtt > 0 ? `${net.rtt} ms` : 'N/A' }].map((r, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border last:border-0"><span className="text-xs text-t3">{r.l}</span><span className="text-xs font-medium text-t1">{r.v}</span></div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="crd p-5">
          <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em] mb-4 flex items-center gap-2"><Signal size={12} /> Security</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-1.5"><span className="text-xs text-t3">Signal Strength</span><span className="text-xs font-bold" style={{ color: sigCol }}>{net.signalStrength}%</span></div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${net.signalStrength}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: sigCol }} /></div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between mb-1.5"><span className="text-xs text-t3">Safety Rating</span><span className="text-xs font-bold" style={{ color: safeCol }}>{net.safetyRating}/100</span></div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${net.safetyRating}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full rounded-full" style={{ background: safeCol }} /></div>
          </div>
          <div className="flex justify-between py-2 border-t border-border">
            <span className="text-xs text-t3 flex items-center gap-1.5"><Lock size={11} /> Encryption</span>
            <span className={`text-xs font-medium ${net.encryption.includes('TLS') ? 'text-success' : 'text-danger-l'}`}>{net.encryption}</span>
          </div>
        </motion.div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em]">Security Issues ({unfixed} remaining)</h3>
          {issues.map((issue) => {
            const isOpen = expanded === issue.id;
            const sevC = issue.severity === 'high' ? 'text-danger-l' : issue.severity === 'medium' ? 'text-warn-l' : 'text-info';
            return (
              <div key={issue.id} className={`crd overflow-hidden transition-all ${issue.fixed ? 'crd-s' : issue.fixing ? 'border-accent/20' : ''}`}>
                <button onClick={() => setExpanded(isOpen ? null : issue.id)} className="w-full p-4 text-left flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {issue.fixing ? <Loader2 size={15} className="text-accent animate-spin" /> : issue.fixed ? <CheckCircle size={15} className="text-success" /> : <AlertTriangle size={15} className={sevC} />}
                    <span className={`text-sm ${issue.fixed ? 'text-t3 line-through' : 'text-t1'}`}>{issue.issue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.fixing && <span className="text-xs text-accent-l font-bold">{issue.fixProgress}%</span>}
                    <ChevronDown size={14} className={`text-t4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {issue.fixing && <div className="px-4 pb-2"><div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden"><motion.div className="h-full rounded-full prog" initial={{ width: 0 }} animate={{ width: `${issue.fixProgress}%` }} /></div></div>}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        <div className="bg-white/[0.02] rounded-xl p-4 border border-border">
                          <ul className="space-y-2">
                            {issue.fixSteps.map((step, j) => {
                              const done = (issue.fixing && j < issue.fixStep) || issue.fixed;
                              const cur = issue.fixing && j === issue.fixStep;
                              return (
                                <li key={j} className={`text-sm flex items-start gap-2 ${done ? 'text-success' : cur ? 'text-accent-l' : 'text-t3'}`}>
                                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-success/15' : cur ? 'bg-accent/15 anim-pulse' : 'bg-white/[0.04]'}`}>
                                    {done ? '✓' : cur ? '⟳' : j + 1}
                                  </span>{step}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        {!issue.fixed && !issue.fixing && (
                          <button onClick={(e) => { e.stopPropagation(); solve(issue.id); }} className="btn btn-p w-full"><Wrench size={14} /> Auto Solve</button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
