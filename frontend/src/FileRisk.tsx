import { useState, useRef } from 'react';
import { FileUp, AlertTriangle, CheckCircle, Trash2, X, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUpload } from '../lib/api';

interface FileResult { name: string; size: number; type: string; status: 'safe' | 'risky' | 'large' | 'suspicious'; details: string[]; score: number }

const SC: Record<string, { color: string; label: string; cls: string }> = {
  safe: { color: '#22c55e', label: 'Safe', cls: 'crd-s' },
  risky: { color: '#ef4444', label: 'Risky', cls: 'crd-d' },
  suspicious: { color: '#eab308', label: 'Suspicious', cls: 'crd-w' },
  large: { color: '#eab308', label: 'Large File', cls: 'crd-w' },
};

export default function FileRisk() {
  const [results, setResults] = useState<FileResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return; setScanning(true);
    try {
      const analyzed = await apiUpload<FileResult[]>('/files/analyze', Array.from(files));
      setResults(prev => [...analyzed, ...prev]);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-t1">File Risk Analyzer</h1>
        <p className="text-sm text-t3 mt-0.5">Upload files to check for malware, phishing & risks</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`crd p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-accent/30 bg-accent/[0.02]' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {scanning ? (
          <div><Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" /><p className="text-t1 font-medium">Analyzing files...</p></div>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/8 flex items-center justify-center border border-accent/10"><FileUp size={24} className="text-accent-l" /></div>
            <h3 className="text-base font-semibold text-t1 mb-1">Drop files here or click to browse</h3>
            <p className="text-sm text-t3 mb-4">Checks for malware, phishing, suspicious code & more</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Malware', 'Phishing', 'File Size', 'Code Analysis'].map(t => <span key={t} className="badge badge-a">{t}</span>)}
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-t1">Results ({results.length})</h2>
              <button onClick={() => setResults([])} className="text-xs text-t3 hover:text-danger-l transition-colors flex items-center gap-1"><Trash2 size={12} /> Clear all</button>
            </div>
            {results.map((r, i) => {
              const cfg = SC[r.status];
              return (
                <motion.div key={`${r.name}-${i}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`${cfg.cls} crd p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {r.status === 'safe' ? <CheckCircle size={18} style={{ color: cfg.color }} /> : r.status === 'risky' ? <AlertTriangle size={18} style={{ color: cfg.color }} /> : <Shield size={18} style={{ color: cfg.color }} />}
                      <div><h3 className="text-sm font-medium text-t1">{r.name}</h3><p className="text-[10px] text-t3">{(r.size / 1024).toFixed(1)} KB · Score: {r.score}/100</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge" style={{ color: cfg.color, background: `${cfg.color}12`, borderColor: `${cfg.color}20` }}>{cfg.label}</span>
                      <button onClick={() => setResults(prev => prev.filter((_, j) => j !== i))} className="text-t4 hover:text-danger-l transition-colors"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-0.5 pl-7">{r.details.map((d, j) => <p key={j} className="text-xs text-t2">{d}</p>)}</div>
                  <div className="mt-2 pl-7"><div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, background: r.score > 70 ? '#22c55e' : r.score > 40 ? '#eab308' : '#ef4444' }} /></div></div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
