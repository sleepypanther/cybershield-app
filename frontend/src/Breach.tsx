import { useState, useEffect } from 'react';
import { ShieldAlert, Search, ChevronDown, Loader2, ShieldCheck, Wrench, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPatch, apiPost } from '../lib/api';

interface Breach { id: string; service: string; date: string; exposedData: string[]; affectedUsers: string; severity: 'critical' | 'high' | 'medium'; howItHappened: string; whatToDo: string[]; fixed: boolean; fixing: boolean; fixProgress: number; fixStep: number; }

const SEV: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#ef4444', bg: 'badge-d', label: 'Critical' },
  high: { color: '#f97316', bg: 'badge-w', label: 'High' },
  medium: { color: '#eab308', bg: 'badge-w', label: 'Medium' },
};

export default function Breach() {
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Breach[]>('/breaches').then(setBreaches).catch(() => setBreaches([]));
  }, []);

  const autoSolve = (id: string) => {
    const b = breaches.find(x => x.id === id); if (!b || b.fixing || b.fixed) return;
    setBreaches(prev => prev.map(x => x.id === id ? { ...x, fixing: true, fixProgress: 0, fixStep: 0 } : x));
    setExpanded(id);
    const total = b.whatToDo.length; let step = 0;
    const interval = setInterval(() => {
      step++;
      setBreaches(prev => prev.map(x => x.id === id ? { ...x, fixProgress: Math.min(Math.round((step / total) * 100), 100), fixStep: step } : x));
      if (step >= total) {
        clearInterval(interval);
        setTimeout(async () => {
          const updated = await apiPatch<Breach>(`/breaches/${id}`, { fixed: true });
          setBreaches(prev => prev.map(x => x.id === id ? { ...updated, fixing: false, fixProgress: 100, fixStep: total } : x));
        }, 800);
      }
    }, 1200);
  };

  const autoSolveAll = () => { breaches.filter(b => !b.fixed && !b.fixing).forEach((b, i) => setTimeout(() => autoSolve(b.id), i * 4000)); };
  const unfixed = breaches.filter(b => !b.fixed).length;

  const checkEmail = () => {
    apiPost<{ status: string; message: string }>('/breaches/check-email', { email })
      .then((response) => setResult(`${response.status}:${response.message}`))
      .catch((error: Error) => setResult(`error:${error.message}`));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-t1">Breach Analysis</h1>
        <p className="text-sm text-t3 mt-0.5">Understand breaches & auto-resolve them</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="crd p-5">
        <h3 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em] mb-3 flex items-center gap-2"><Search size={12} /> Check Your Email</h3>
        <div className="flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkEmail()}
            placeholder="Enter your email..." className="inp flex-1" />
          <button onClick={checkEmail} className="btn btn-p">Check</button>
        </div>
        {result && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-xl text-sm ${result.startsWith('warn') ? 'crd-w' : result.startsWith('safe') ? 'crd-s' : 'crd-d'} ${result.startsWith('warn') ? 'text-warn-l' : result.startsWith('safe') ? 'text-success-l' : 'text-danger-l'}`}>
            {result.split(':').slice(1).join(':')}
          </motion.div>
        )}
      </motion.div>

      {unfixed > 0 && (
        <button onClick={autoSolveAll} className="btn btn-p w-full py-3"><Wrench size={16} /> Auto-Solve All {unfixed} Breaches</button>
      )}

      <div className="space-y-2.5">
        {breaches.map((b, i) => {
          const s = SEV[b.severity]; const open = expanded === b.id;
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`crd overflow-hidden transition-all ${b.fixed ? 'crd-s' : b.fixing ? 'border-accent/20' : ''}`}>

              <button onClick={() => setExpanded(open ? null : b.id)} className="w-full p-4 text-left flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-border ${b.fixing ? 'bg-accent/8' : b.fixed ? 'bg-success/8' : 'bg-white/[0.03]'}`}>
                    {b.fixing ? <Loader2 size={16} className="text-accent animate-spin" /> : b.fixed ? <ShieldCheck size={16} className="text-success" /> : <ShieldAlert size={16} style={{ color: s.color }} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-semibold ${b.fixed ? 'text-t3 line-through' : 'text-t1'} truncate`}>{b.service}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${s.bg}`}>{s.label}</span>
                      <span className="text-[10px] text-t4">{b.date} · {b.affectedUsers} users</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {b.fixing && <span className="text-xs text-accent-l font-bold">{b.fixProgress}%</span>}
                  <ChevronDown size={14} className={`text-t4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {b.fixing && <div className="px-4 pb-3"><div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden"><motion.div className="h-full rounded-full prog" initial={{ width: 0 }} animate={{ width: `${b.fixProgress}%` }} /></div></div>}

              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-5 space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {b.exposedData.map((d, j) => <span key={j} className="badge badge-d">{d}</span>)}
                      </div>
                      <div className="bg-white/[0.02] rounded-xl p-5 space-y-4 border border-border">
                        <div>
                          <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-warn-l mb-1.5">How It Happened</h4>
                          <p className="text-sm text-t2 leading-relaxed">{b.howItHappened}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-success mb-2">Steps to Resolve</h4>
                          <ul className="space-y-2">
                            {b.whatToDo.map((step, j) => {
                              const done = (b.fixing && j < b.fixStep) || b.fixed;
                              const cur = b.fixing && j === b.fixStep;
                              return (
                                <li key={j} className={`text-sm flex items-start gap-2.5 transition-all ${done ? 'text-success' : cur ? 'text-accent-l' : 'text-t3'}`}>
                                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-success/15' : cur ? 'bg-accent/15 anim-pulse' : 'bg-white/[0.04]'}`}>
                                    {done ? '✓' : cur ? '⟳' : j + 1}
                                  </span>{step}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {!b.fixed && !b.fixing && (
                          <button onClick={(e) => { e.stopPropagation(); autoSolve(b.id); }}
                            className="btn btn-p flex-1 min-w-[200px] py-3"><Wrench size={15} /> Auto-Solve This</button>
                        )}
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          const updated = await apiPatch<Breach>(`/breaches/${b.id}`, { fixed: !b.fixed });
                          setBreaches(prev => prev.map(x => x.id === b.id ? updated : x));
                        }}
                          className={`btn ${b.fixed ? 'btn-s' : 'btn-g'} py-3`}>
                          <CheckCircle size={15} /> {b.fixed ? 'Mark Unresolved' : 'Mark Resolved'}
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
    </div>
  );
}
