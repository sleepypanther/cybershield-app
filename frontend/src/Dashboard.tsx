import { useState, useEffect, useRef, useCallback } from 'react';
import { Cpu, HardDrive, MemoryStick, Monitor, Activity, ChevronRight, Zap, Globe, Volume2, VolumeX, Bell, Bug, ShieldAlert, Server, Loader2, AlertTriangle } from 'lucide-react';
import { getDeviceInfo, getPerformanceMetrics, getStorageInfo, useSecurityStore } from '../store';
import { motion } from 'framer-motion';
import { getDashboardSummary, type DashboardSummary } from '../services/api';

const fade = (d: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: d, ease: 'easeOut' as const } });

class BeepEngine {
  private ctx: AudioContext | null = null;
  private on = true;
  private last = 0;
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  setOn(v: boolean) { this.on = v; }
  beep(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
    if (!this.on || !this.ctx) return;
    const now = performance.now(); if (now - this.last < 120) return; this.last = now;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(this.ctx.currentTime); o.stop(this.ctx.currentTime + dur);
    } catch {}
  }
  alarm() { this.beep(1200, 0.06, 0.12, 'square'); setTimeout(() => this.beep(1500, 0.05, 0.10, 'square'), 80); setTimeout(() => this.beep(1800, 0.04, 0.08, 'square'), 160); }
  ping() { this.beep(1400, 0.04, 0.08, 'square'); }
}
const beep = new BeepEngine();

let lastNotif = 0;
function notify(msg: string) {
  if (Date.now() - lastNotif < 30000) return; lastNotif = Date.now();
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') try { new Notification('⚠ CyberShield Warning', { body: msg, tag: 'cs-warn' }); } catch {}
  else if (Notification.permission !== 'denied') Notification.requestPermission();
}

interface Threat {
  level: 'normal' | 'warning' | 'critical';
  score: number;
  sources: string[];
  vulns: number;
  breaches: number;
  threats: number;
  ports: number;
}

function buildThreat(counts: { vulnerabilities: number; breaches: number; scanThreats: number; openPorts: number }): Threat {
  let score = 0; const sources: string[] = [];
  const vulns = counts.vulnerabilities;
  const breaches = counts.breaches;
  const threats = counts.scanThreats;
  const ports = counts.openPorts;

  if (vulns > 0) { score += Math.min(vulns * 8, 40); sources.push(`${vulns} vulnerabilities`); }
  if (breaches > 0) { score += Math.min(breaches * 10, 40); sources.push(`${breaches} breaches`); }
  if (ports > 2) { score += Math.min((ports - 2) * 6, 20); sources.push(`${ports} open ports`); }
  if (threats > 0) { score += Math.min(threats * 5, 30); sources.push(`${threats} scan threats`); }

  return { level: score >= 50 ? 'critical' : score >= 20 ? 'warning' : 'normal', score: Math.min(score, 100), sources, vulns, breaches, threats, ports };
}

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { counts, refreshSecurityData, loading: securityLoading } = useSecurityStore();
  const [device] = useState(getDeviceInfo());
  const [perf, setPerf] = useState(getPerformanceMetrics());
  const [storage, setStorage] = useState({ used: 0, total: 0 });
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const [soundOn, setSoundOn] = useState(false);
  const beepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLevel = useRef<string>('normal');

  const summaryCounts = {
    vulnerabilities: counts.vulnerabilities || dashboard?.totals.vulnerabilitiesCount || 0,
    breaches: dashboard?.ui.breaches || 0,
    scanThreats: counts.totalThreats || dashboard?.ui.threatsFound || 0,
    openPorts: counts.openPorts || dashboard?.totals.openPorts || 0,
  };
  const threat = buildThreat(summaryCounts);

  useEffect(() => { const init = () => { beep.init(); document.removeEventListener('click', init); }; document.addEventListener('click', init); return () => document.removeEventListener('click', init); }, []);
  const toggleSound = () => { beep.init(); const n = !soundOn; setSoundOn(n); beep.setOn(n); if (n) beep.ping(); };

  useEffect(() => {
    getStorageInfo().then(setStorage);
    setPerf(getPerformanceMetrics());
    const interval = setInterval(() => {
      getStorageInfo().then(setStorage);
      setPerf(getPerformanceMetrics());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    const sync = async (silent = false) => {
      if (!silent) {
        setDashboardLoading(true);
      }

      try {
        const [dashboardData] = await Promise.all([
          getDashboardSummary(),
          refreshSecurityData(silent),
        ]);

        if (!active) return;
        setDashboard(dashboardData);
        setDashboardError(null);
      } catch (error) {
        if (!active) return;
        setDashboardError(error instanceof Error ? error.message : 'Unable to load dashboard data');
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    };

    sync().catch(() => undefined);
    const interval = setInterval(() => {
      sync(true).catch(() => undefined);
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshSecurityData]);

  useEffect(() => {
    if (threat.level !== prevLevel.current) {
      if (threat.level === 'critical') beep.alarm();
      if (threat.level === 'warning' && threat.sources.length > 0) notify(threat.sources.join(', '));
      prevLevel.current = threat.level;
    }
  }, [threat]);

  useEffect(() => {
    if (beepTimer.current) clearInterval(beepTimer.current);
    if (threat.level === 'critical') beepTimer.current = setInterval(() => beep.ping(), 500);
    return () => { if (beepTimer.current) clearInterval(beepTimer.current); };
  }, [threat.level]);

  const isCrit = threat.level === 'critical';
  const isWarn = threat.level === 'warning';
  const lineColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e';
  const glowColor = isCrit ? 'rgba(239,68,68,0.2)' : isWarn ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)';

  const waveform = useCallback((t: number): number => {
    const amp = isCrit ? 0.42 : isWarn ? 0.35 : 0.28;
    if (t < 0.08) return 0.5 - Math.sin((t / 0.08) * Math.PI) * amp * 0.12;
    if (t < 0.12) return 0.5;
    if (t < 0.15) return 0.5 + ((t - 0.12) / 0.03) * amp * 0.08;
    if (t < 0.19) { const x = (t - 0.15) / 0.04; return x < 0.5 ? 0.5 + amp * 0.08 - x * 2 * (amp * 0.08 + amp) : 0.5 - amp + (x - 0.5) * 2 * (amp + amp * 0.15); }
    if (t < 0.23) { const x = (t - 0.19) / 0.04; return 0.5 + amp * 0.15 * (1 - x); }
    if (t < 0.32) return 0.5 - amp * 0.015;
    if (t < 0.48) return 0.5 - Math.sin(((t - 0.32) / 0.16) * Math.PI) * amp * 0.18;
    return 0.5;
  }, [isCrit, isWarn]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    const speed = isCrit ? 3.5 : isWarn ? 2.0 : 1.0;
    const cycle = isCrit ? 140 : isWarn ? 200 : 280;
    let last = 0;
    const draw = (ts: number) => {
      if (ts - last < 16) { animRef.current = requestAnimationFrame(draw); return; }
      last = ts; offsetRef.current += speed;
      ctx.fillStyle = '#050507'; ctx.fillRect(0, 0, W, H);
      const pts: { x: number; y: number }[] = [];
      for (let px = 0; px <= W; px++) { const wX = px + offsetRef.current; const t = ((wX % cycle) + cycle) % cycle / cycle; pts.push({ x: px, y: 6 + waveform(t) * (H - 12) }); }
      ctx.beginPath(); ctx.strokeStyle = glowColor; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let i = 0; i < pts.length; i++) { i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y); } ctx.stroke();
      ctx.beginPath(); ctx.strokeStyle = lineColor; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let i = 0; i < pts.length; i++) { i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y); } ctx.stroke();
      ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.8;
      for (let i = 0; i < pts.length; i++) { i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y); } ctx.stroke();
      const ty = pts[pts.length - 1].y;
      ctx.beginPath(); ctx.arc(W - 1, ty, 5, 0, Math.PI * 2); ctx.fillStyle = glowColor; ctx.fill();
      ctx.beginPath(); ctx.arc(W - 1, ty, 2.5, 0, Math.PI * 2); ctx.fillStyle = lineColor; ctx.fill();
      ctx.beginPath(); ctx.arc(W - 1, ty, 1, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [waveform, isCrit, isWarn, lineColor, glowColor]);

  const optimizeResource = (type: string) => {
    setOptimizing(type);
    setTimeout(() => {
      setOptimized(prev => ({ ...prev, [type]: true })); setOptimizing(null);
      if (type === 'memory') try { document.querySelectorAll('img[src^="data:"]').forEach(img => img.remove()); } catch {}
      if (type === 'storage') { if ('caches' in window) caches.keys().then(names => names.forEach(name => caches.delete(name))); getStorageInfo().then(setStorage); }
    }, 2500);
  };

  const cpuLoad = dashboard?.ui.cpuUsage || 0;
  const ramUsage = dashboard?.ui.ramUsage || (perf.memoryTotal > 0 ? Math.round((perf.memoryUsed / perf.memoryTotal) * 100) : 0);
  const health = dashboard?.ui.deviceHealth || Math.max(0, 100 - threat.score);
  const hc = health > 70 ? '#22c55e' : health > 40 ? '#eab308' : '#ef4444';
  const adjMem = optimized['memory'] ? Math.max(5, ramUsage - 20) : ramUsage;
  const stoPct = storage.total > 0 ? Math.min((storage.used / storage.total) * 100, 100) : 20;
  const adjSto = optimized['storage'] ? Math.max(3, stoPct - 10) : stoPct;
  const totalThreats = threat.vulns + threat.breaches + threat.ports;

  const barColor = (v: number) => v > 80 ? '#ef4444' : v > 55 ? '#eab308' : '#22c55e';

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">Dashboard</h1>
          <p className="text-sm text-t3 mt-0.5">System overview & health monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          {(dashboardLoading || securityLoading.ports || securityLoading.vulnerabilities) && <Loader2 size={14} className="text-accent animate-spin" />}
          <span className={`badge ${threat.level === 'normal' ? 'badge-s' : threat.level === 'warning' ? 'badge-w' : 'badge-d'}`}>
            {threat.level === 'normal' ? '● Secure' : threat.level === 'warning' ? '● Warning' : '● Critical'}
          </span>
        </div>
      </motion.div>

      {dashboardError && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="crd crd-d p-4 flex items-center gap-2 text-sm text-danger-l">
          <AlertTriangle size={14} /> {dashboardError}
        </motion.div>
      )}

      {threat.level !== 'normal' && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className={`crd ${isCrit ? 'crd-d' : 'crd-w'} p-4 flex items-center justify-between gap-3 flex-wrap`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full anim-pulse ${isCrit ? 'bg-danger' : 'bg-warn'}`} />
            <div>
              <p className={`text-sm font-semibold ${isCrit ? 'text-danger-l' : 'text-warn-l'}`}>
                {isCrit ? 'Critical — Beep Active' : 'Warning — Notification Sent'}
              </p>
              <p className="text-xs text-t3 mt-0.5">{threat.sources.join(' · ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {threat.vulns > 0 && <button onClick={() => onNavigate('vulnerabilities')} className="btn btn-d text-xs">Fix Vulns</button>}
            {threat.breaches > 0 && <button onClick={() => onNavigate('breach')} className="btn btn-d text-xs">Fix Breaches</button>}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div {...fade(0.05)} className="crd p-5">
          <h2 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em] mb-4 flex items-center gap-2"><Monitor size={13} /> Device Info</h2>
          {[{ l: 'OS', v: device.os }, { l: 'Device', v: device.device }, { l: 'Browser', v: device.browser }, { l: 'Platform', v: device.platform }, { l: 'CPU Cores', v: device.cores ? `${device.cores}` : 'N/A' }, { l: 'RAM', v: device.ram ? `${device.ram} GB` : 'N/A' }, { l: 'Status', v: device.online ? '● Online' : '○ Offline' }].map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-xs text-t3">{item.l}</span>
              <span className="text-xs font-medium text-t1">{item.v}</span>
            </div>
          ))}
        </motion.div>

        <motion.div {...fade(0.1)} className="crd p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-2" style={{ color: lineColor }}>
              <Activity size={13} /> Live Pulse
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={toggleSound} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${soundOn ? 'bg-danger/10 text-danger-l' : 'bg-white/[0.03] text-t3 hover:text-t2'}`}>
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button onClick={() => { if ('Notification' in window) Notification.requestPermission(); }} className="w-8 h-8 rounded-lg bg-white/[0.03] text-t3 hover:text-t2 flex items-center justify-center transition-colors">
                <Bell size={14} />
              </button>
              <div className="relative w-11 h-11">
                <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                  <circle cx="24" cy="24" r="19" fill="none" stroke={hc} strokeWidth="3" strokeDasharray={`${health * 1.194} 120`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold" style={{ color: hc }}>{Math.round(health)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-border" style={{ background: '#050507' }}>
            <canvas ref={canvasRef} className="w-full" style={{ height: '120px', display: 'block' }} />
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] font-medium flex items-center gap-2" style={{ color: lineColor }}>
              <span className="w-1.5 h-1.5 rounded-full anim-pulse" style={{ backgroundColor: lineColor }} />
              {isCrit ? 'CRITICAL — IMMEDIATE ACTION NEEDED' : isWarn ? 'WARNING — ISSUES DETECTED' : 'ALL SYSTEMS SECURE'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 mt-3">
            {[
              { label: 'Total', value: totalThreats, icon: ShieldAlert, c: totalThreats > 0 ? '#ef4444' : '#22c55e' },
              { label: 'Vulns', value: threat.vulns, icon: Bug, c: threat.vulns > 0 ? '#f87171' : '#22c55e' },
              { label: 'Breaches', value: threat.breaches, icon: ShieldAlert, c: threat.breaches > 0 ? '#eab308' : '#22c55e' },
              { label: 'Ports', value: threat.ports, icon: Server, c: threat.ports > 2 ? '#facc15' : '#22c55e' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-2.5 text-center bg-white/[0.02] border border-border">
                <item.icon size={13} className="mx-auto mb-1" style={{ color: item.c }} />
                <div className="text-base font-bold" style={{ color: item.c }}>{item.value}</div>
                <div className="text-[9px] text-t4 uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'CPU Load', value: cpuLoad, icon: Cpu, key: 'cpu', sub: dashboard ? `${dashboard.tools?.nmap?.name || 'Backend'} metrics` : 'Loading backend metrics', btn: 'Reduce Load' },
          { label: 'Memory', value: Math.round(adjMem), icon: MemoryStick, key: 'memory', sub: perf.memoryTotal > 0 ? `${perf.memoryUsed}/${perf.memoryTotal} MB` : 'Backend RAM telemetry', btn: 'Free Memory' },
          { label: 'Storage', value: Math.round(adjSto), icon: HardDrive, key: 'storage', sub: storage.total > 0 ? `${Math.round(storage.used / 1024)}/${Math.round(storage.total / 1024)} GB` : 'Checking...', btn: 'Clean Up' },
        ].map((m, i) => (
          <motion.div key={m.label} {...fade(0.15 + i * 0.05)} className="crd p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-border flex items-center justify-center">
                  <m.icon size={16} style={{ color: barColor(m.value) }} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-t1">{m.label}</span>
                  <p className="text-[11px] text-t3">{m.sub}</p>
                </div>
              </div>
              <span className="text-xl font-bold" style={{ color: barColor(m.value) }}>{m.value}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: barColor(m.value) }} />
            </div>
            <button onClick={() => !optimizing && !optimized[m.key] && optimizeResource(m.key)} disabled={!!optimizing || optimized[m.key]}
              className={`w-full mt-4 btn text-xs ${
                optimized[m.key] ? 'btn-g' : optimizing === m.key ? 'btn-s opacity-70' : 'btn-s'
              }`}>
              {optimized[m.key] ? <>✓ Optimized</> : optimizing === m.key ? <><Zap size={12} className="animate-spin" /> Working...</> : <><Zap size={12} /> {m.btn}</>}
            </button>
          </motion.div>
        ))}
      </div>

      <motion.div {...fade(0.3)} className="crd p-5">
        <h2 className="text-xs font-semibold text-t3 uppercase tracking-[0.12em] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Run Scan', page: 'scans', icon: '🔍' },
            { label: 'Check Files', page: 'files', icon: '📁' },
            { label: 'Network', page: 'network', icon: '📡' },
            { label: 'History', page: 'history', icon: '📋' },
          ].map((a) => (
            <button key={a.page} onClick={() => onNavigate(a.page)}
              className="group crd p-4 text-left hover:border-accent/20 transition-all active:scale-[0.97]">
              <div className="text-xl mb-2">{a.icon}</div>
              <div className="text-sm font-medium text-t1 flex items-center justify-between">
                {a.label} <ChevronRight size={14} className="text-t4 group-hover:text-accent-l group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade(0.35)} className="crd p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-border flex items-center justify-center"><Globe size={16} className="text-info" /></div>
            <div><span className="text-sm font-medium text-t1">Network</span><p className="text-xs text-t3">{device.online ? 'Connected & secure' : 'Offline'}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${device.online ? 'bg-success anim-pulse' : 'bg-danger'}`} />
            <span className={`text-xs font-semibold ${device.online ? 'text-success' : 'text-danger'}`}>{device.online ? 'SECURE' : 'OFFLINE'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
