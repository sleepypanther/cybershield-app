import { CheckCircle, AlertTriangle, Trash2, FileDown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScanHistory } from '../store';
import { jsPDF } from 'jspdf';

export default function ScanHistory() {
  const { history, deleteScan, clearAll } = useScanHistory();

  const exportPDF = (scan: typeof history[0]) => {
    const doc = new jsPDF(); doc.setFontSize(16); doc.text('CyberShield — Scan Report', 20, 25);
    doc.setFontSize(10); doc.text(`Type: ${scan.type}`, 20, 40); doc.text(`Date: ${scan.date}`, 20, 50);
    doc.text(`Duration: ${scan.duration}`, 20, 60); doc.text(`Status: ${scan.status}`, 20, 70);
    doc.text(`Files: ${scan.filesScanned.toLocaleString()}`, 20, 80); doc.text(`Threats: ${scan.threats}`, 20, 90);
    if (scan.details.length > 0) { doc.text('Details:', 20, 105); scan.details.forEach((d, i) => doc.text(`  ${i + 1}. ${d}`, 20, 115 + i * 10)); }
    doc.save(`CyberShield_${scan.id}.pdf`);
  };

  const exportAll = () => {
    if (!history.length) return; const doc = new jsPDF();
    doc.setFontSize(16); doc.text('CyberShield — Full History', 20, 25);
    doc.setFontSize(8); doc.text(`${history.length} scans | ${new Date().toLocaleString()}`, 20, 33);
    let y = 45; history.forEach((s, i) => { if (y > 260) { doc.addPage(); y = 25; } doc.setFontSize(10); doc.text(`${i + 1}. ${s.type} — ${s.date}`, 20, y); doc.setFontSize(8); doc.text(`   ${s.status} | ${s.filesScanned} files | ${s.threats} threats | ${s.duration}`, 20, y + 7); y += 18; });
    doc.save('CyberShield_History.pdf');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-t1">Scan History</h1><p className="text-sm text-t3 mt-0.5">Past scan results & PDF export</p></div>
        {history.length > 0 && (
          <div className="flex gap-2">
            <button onClick={exportAll} className="btn btn-p text-xs"><FileDown size={13} /> Export All PDF</button>
            <button onClick={clearAll} className="btn btn-d text-xs"><Trash2 size={13} /> Clear All</button>
          </div>
        )}
      </motion.div>

      {history.length === 0 ? (
        <div className="crd p-16 text-center"><p className="text-t3">No scan history yet. Run a scan first.</p></div>
      ) : (
        <div className="space-y-2">
          {history.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`crd p-4 ${s.status === 'Clean' ? '' : 'crd-w'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {s.status === 'Clean' ? <CheckCircle size={16} className="text-success" /> : <AlertTriangle size={16} className="text-warn" />}
                  <div>
                    <h3 className="text-sm font-medium text-t1">{s.type} Scan</h3>
                    <p className="text-[10px] text-t3">{s.date} · {s.duration} · {s.filesScanned.toLocaleString()} files</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`badge ${s.status === 'Clean' ? 'badge-s' : 'badge-w'}`}>{s.status === 'Clean' ? '✅ Clean' : `⚠ ${s.threats}`}</span>
                  <button onClick={() => exportPDF(s)} className="p-1.5 text-t4 hover:text-accent-l rounded transition-colors" title="Export PDF"><FileDown size={14} /></button>
                  <button onClick={() => deleteScan(s.id)} className="p-1.5 text-t4 hover:text-danger-l rounded transition-colors" title="Delete"><X size={14} /></button>
                </div>
              </div>
              {s.details.length > 0 && <div className="mt-2 ml-7 space-y-0.5">{s.details.map((d, j) => <p key={j} className="text-[10px] text-t3">• {d}</p>)}</div>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
