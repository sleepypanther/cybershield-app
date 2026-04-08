import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Lock, Wifi, Clock, Monitor, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppSettings, useSchedules, type SettingsState } from '../store';
import { apiGet, apiPost } from '../lib/api';

type Tab = 'general' | 'notifications' | 'privacy' | 'network' | 'scheduling';
const TABS: { id: Tab; label: string; icon: typeof SettingsIcon }[] = [
  { id: 'general', label: 'General', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'network', label: 'Network', icon: Wifi },
  { id: 'scheduling', label: 'Scan Schedule', icon: Clock },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('general');
  const { schedules, addSchedule, removeSchedule, toggleSchedule, refresh: refreshSchedules } = useSchedules();
  const { settings, patchSettings, refresh: refreshSettings } = useAppSettings();
  const [schedType, setSchedType] = useState('Deep');
  const [schedFreq, setSchedFreq] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom'>('Daily');
  const [schedTime, setSchedTime] = useState('09:00');
  const [schedDate, setSchedDate] = useState('');

  const addSched = async () => {
    await addSchedule({
      id: Date.now().toString(),
      type: schedType,
      frequency: schedFreq,
      time: schedTime,
      customDate: schedFreq === 'Custom' ? schedDate : undefined,
      enabled: true,
    });
  };

  const toggleSetting = async <
    TSection extends keyof SettingsState,
    TKey extends keyof SettingsState[TSection]
  >(section: TSection, key: TKey) => {
    if (!settings) return;
    await patchSettings({
      [section]: {
        ...settings[section],
        [key]: !settings[section][key],
      },
    } as Partial<SettingsState>);
  };

  const exportBackup = async () => {
    const backup = await apiGet<unknown>('/settings/backup');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cybershield_backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = async () => {
    await apiPost<{ message: string }>('/settings/reset-data');
    await Promise.all([refreshSchedules(), refreshSettings()]);
    alert('All backend data cleared!');
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="transition-all hover:scale-105 active:scale-95 flex-shrink-0">
      {value ? <ToggleRight size={26} className="text-accent" /> : <ToggleLeft size={26} className="text-t4" />}
    </button>
  );

  const Row = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-border hover:border-border-h transition-all">
      <div><span className="text-sm text-t1 font-medium">{label}</span><p className="text-xs text-t3 mt-0.5">{desc}</p></div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );

  if (!settings) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-t1">Settings</h1>
          <p className="text-sm text-t3 mt-0.5">Loading preferences...</p>
        </motion.div>
      </div>
    );
  }

  const content = () => {
    switch (tab) {
      case 'general': return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-t1">General</h3>
          <p className="text-xs text-t3 mb-1">Configure how CyberShield works</p>
          <Row label="Auto Scan on Startup" desc="Run quick scan when app opens" value={settings.general.autoScan} onChange={() => toggleSetting('general', 'autoScan')} />
          <Row label="Real-Time Protection" desc="Continuously monitor for threats" value={settings.general.realTime} onChange={() => toggleSetting('general', 'realTime')} />
          <Row label="Dark Mode" desc="Use dark theme interface" value={settings.general.darkMode} onChange={() => toggleSetting('general', 'darkMode')} />
          <Row label="Auto Updates" desc="Update threat definitions automatically" value={settings.general.autoUpdate} onChange={() => toggleSetting('general', 'autoUpdate')} />
          <div className="p-4 bg-white/[0.02] rounded-xl border border-border">
            <span className="text-xs text-t3">App Version</span>
            <p className="text-sm text-t1 font-medium mt-0.5">CyberShield v2.1.0</p>
          </div>
        </div>
      );
      case 'notifications': return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-t1">Notifications</h3>
          <p className="text-xs text-t3 mb-1">Choose what alerts you receive</p>
          <Row label="Threat Alerts" desc="Instant notification on threats" value={settings.notifications.notifThreats} onChange={() => toggleSetting('notifications', 'notifThreats')} />
          <Row label="Update Alerts" desc="New security updates available" value={settings.notifications.notifUpdates} onChange={() => toggleSetting('notifications', 'notifUpdates')} />
          <Row label="Scan Complete" desc="When scans finish" value={settings.notifications.notifComplete} onChange={() => toggleSetting('notifications', 'notifComplete')} />
          <Row label="Weekly Summary" desc="Weekly security health report" value={settings.notifications.notifWeekly} onChange={() => toggleSetting('notifications', 'notifWeekly')} />
          <Row label="Breach Alerts" desc="New data breach notifications" value={settings.notifications.notifBreach} onChange={() => toggleSetting('notifications', 'notifBreach')} />
        </div>
      );
      case 'privacy': return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-t1">Privacy</h3>
          <p className="text-xs text-t3 mb-1">Control your data & privacy</p>
          <Row label="Clear Data on Close" desc="Delete history when closing app" value={settings.privacy.privClear} onChange={() => toggleSetting('privacy', 'privClear')} />
          <Row label="Block Trackers" desc="Alert for tracking cookies" value={settings.privacy.privBlock} onChange={() => toggleSetting('privacy', 'privBlock')} />
          <Row label="Safe Search" desc="Warn before suspicious sites" value={settings.privacy.privSafe} onChange={() => toggleSetting('privacy', 'privSafe')} />
          <Row label="Anonymous Mode" desc="Don't store any scan data" value={settings.privacy.privAnon} onChange={() => toggleSetting('privacy', 'privAnon')} />
          <div className="p-4 bg-white/[0.02] rounded-xl border border-border">
            <span className="text-xs text-t3 mb-2 block">Data Management</span>
            <div className="flex gap-2 flex-wrap">
              <button onClick={resetAll} className="btn btn-d text-xs">Clear All Data</button>
              <button onClick={exportBackup} className="btn btn-s text-xs">Export Backup</button>
            </div>
          </div>
        </div>
      );
      case 'network': return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-t1">Network</h3>
          <p className="text-xs text-t3 mb-1">Network security preferences</p>
          <Row label="Auto Detect Network" desc="Detect network changes automatically" value={settings.network.netAuto} onChange={() => toggleSetting('network', 'netAuto')} />
          <Row label="VPN Reminder" desc="Remind to use VPN on public WiFi" value={settings.network.netVpn} onChange={() => toggleSetting('network', 'netVpn')} />
          <Row label="Public WiFi Warning" desc="Show warning on public networks" value={settings.network.netPublic} onChange={() => toggleSetting('network', 'netPublic')} />
          <Row label="Secure DNS" desc="Use DNS over HTTPS (DoH)" value={settings.network.netDns} onChange={() => toggleSetting('network', 'netDns')} />
        </div>
      );
      case 'scheduling': return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-t1">Scan Schedule</h3>
          <p className="text-xs text-t3 mb-1">Set up automatic recurring scans</p>
          <div className="bg-white/[0.02] rounded-xl p-5 border border-border space-y-4">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">New Schedule</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-t3 mb-1 block">Scan Type</label>
                <select value={schedType} onChange={(e) => setSchedType(e.target.value)} className="inp">
                  <option value="Quick">Quick Scan</option><option value="Normal">Normal Scan</option><option value="Deep">Deep Scan</option><option value="Targeted">Targeted Scan</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-t3 mb-1 block">Frequency</label>
                <select value={schedFreq} onChange={(e) => setSchedFreq(e.target.value as typeof schedFreq)} className="inp">
                  <option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Custom">Custom Date</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-t3 mb-1 block">Time</label>
                <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} className="inp" />
              </div>
              {schedFreq === 'Custom' && (
                <div>
                  <label className="text-xs text-t3 mb-1 block">Date</label>
                  <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} className="inp" />
                </div>
              )}
            </div>
            <button onClick={addSched} className="btn btn-p"><Plus size={13} /> Add Schedule</button>
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-t3 text-sm">No schedules configured yet</div>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleSchedule(s.id)}>{s.enabled ? <ToggleRight size={22} className="text-accent" /> : <ToggleLeft size={22} className="text-t4" />}</button>
                    <div><span className={`text-sm font-medium ${s.enabled ? 'text-t1' : 'text-t3'}`}>{s.type} Scan</span><p className="text-[10px] text-t3">{s.frequency} at {s.time}{s.customDate ? ` on ${s.customDate}` : ''}</p></div>
                  </div>
                  <button onClick={() => removeSchedule(s.id)} className="p-1.5 text-t4 hover:text-danger-l transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-t1">Settings</h1>
        <p className="text-sm text-t3 mt-0.5">Configure preferences & scheduling</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-5">
        <div className="md:w-44 flex-shrink-0">
          <div className="crd p-1.5 space-y-0.5 md:sticky md:top-4">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  tab === t.id ? 'bg-accent/10 text-accent-l' : 'text-t3 hover:text-t2 hover:bg-white/[0.03]'
                }`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <motion.div key={tab} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
            className="crd p-5" style={{ minHeight: '480px' }}>
            {content()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
