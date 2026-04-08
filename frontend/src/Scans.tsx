import { useCallback, useMemo, useState } from 'react';
import { Shield, Crosshair, Layers, Zap, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSecurityStore } from '../store';

type ScanType = 'Normal' | 'Quick' | 'Deep' | 'Targeted';

export default function Scans() {
  const { scanResult, loading, errors, runSecurityScan, clearSecurityError } = useSecurityStore();
  const [activeType, setActiveType] = useState<ScanType | null>(null);
  const [displayScanId, setDisplayScanId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const target = useMemo(() => window.location.hostname || '127.0.0.1', []);

  const startScan = useCallback(async (type: ScanType) => {
    if (loading.scan) return;

    setActiveType(type);
    setDisplayScanId(null);
    setShowResult(true);
    clearSecurityError('scan');

    try {
      const result = await runSecurityScan(target);
      setDisplayScanId(result.id);
    } catch {
      setDisplayScanId(null);
    }
  }, [clearSecurityError, loading.scan, runSecurityScan, target]);

  const reset = useCallback(() => {
    setShowResult(false);
    setActiveType(null);
    setDisplayScanId(null);
    clearSecurityError('scan');
  }, [clearSecurityError]);

  const currentScan = scanResult && scanResult.id === displayScanId ? scanResult : null;
  const isRunning = loading.scan;
  const hasError = !!errors.scan && !isRunning;
  const isDone = !!currentScan && !isRunning;
  const phase = isRunning
    ? `Scanning ${target}...`
    : hasError
      ? errors.scan
      : currentScan
        ? `Scan completed for ${currentScan.target}`
        : '';

  const types = [
    { type: 'Normal' as ScanType, icon: Shield, desc: 'Standard check of common areas', time: '~25s', color: '#6366f1' },
    { type: 'Quick' as ScanType, icon: Zap, desc: 'Fast check of critical files', time: '~12s', color: '#22c55e' },
    { type: 'Deep' as ScanType, icon: Layers, desc: 'Full scan including hidden files', time: '~40s', color: '#eab308' },
    { type: 'Targeted' as ScanType, icon: Crosshair, desc: 'Node-by-node scan of 20 areas', time: '~10s', color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-t1">Security Scans</h1>
        <p className="text-sm text-t3 mt-0.5">Choose a scan type to analyze your system</p>
      </motion.div>

      {!showResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {types.map((item, i) => (
            <motion.button key={item.type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => startScan(item.type)}
              className="crd p-5 text-left transition-all group active:scale-[0.98]" style={{ ['--hover-c' as string]: item.color }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-border" style={{ background: `${item.color}08` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-t1">{item.type} Scan</h3>
                  <span className="text-[10px] text-t4">{item.time}</span>
                </div>
              </div>
              <p className="text-xs text-t3 mb-3">{item.desc}</p>
              <span className="text-xs font-semibold" style={{ color: item.color }}>Start Scan →</span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(showResult || isRunning) && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="crd p-6">
            <div className="text-center mb-5">
              {isRunning ? <Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" /> : hasError || (currentScan && currentScan.threats > 0) ? <AlertTriangle size={32} className={hasError ? 'text-danger-l mx-auto mb-3' : 'text-warn mx-auto mb-3'} /> : <CheckCircle size={32} className="text-success mx-auto mb-3" />}
              <h2 className="text-lg font-semibold text-t1">{activeType} Scan {isRunning ? 'Running' : hasError ? 'Failed' : 'Complete'}</h2>
              <p className="text-sm text-t3 mt-1">{phase}</p>
            </div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-3">
              <motion.div className={`h-full rounded-full ${isDone && currentScan && currentScan.threats === 0 ? 'bg-success' : isDone ? 'bg-warn' : hasError ? 'bg-danger' : 'prog'}`}
                initial={{ width: 0 }} animate={{ width: `${isDone ? 100 : 0}%` }} />
            </div>
            <div className="flex justify-between text-xs text-t3 mb-5">
              <span>{isDone ? '100%' : isRunning ? 'Running' : hasError ? 'Failed' : 'Ready'}</span>
              <span>{currentScan ? currentScan.filesScanned.toLocaleString() : 0} files</span>
              <span className={currentScan && currentScan.threats > 0 ? 'text-danger-l font-medium' : ''}>{currentScan ? currentScan.threats : 0} threats</span>
            </div>
            {hasError && (
              <div className="mb-5 flex items-center gap-2 crd-w rounded-xl px-3 py-2 text-xs text-danger-l">
                <AlertTriangle size={12} /> {errors.scan}
              </div>
            )}
            {currentScan?.details.length ? (
              <div className="space-y-1.5 mb-5">
                {currentScan.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2 crd-w rounded-xl px-3 py-2 text-xs text-warn-l"><AlertTriangle size={12} /> {detail}</div>
                ))}
              </div>
            ) : null}
            {!isRunning && <div className="text-center"><button onClick={reset} className="btn btn-p">New Scan</button></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
