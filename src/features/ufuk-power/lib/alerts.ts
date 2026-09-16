import type { AlertPrefs } from '../types';
import type { Summary } from './metrics';

export interface AlertEvent {
  key: string;
  level: 'error' | 'warning' | 'info';
  title: string;
  body: string;
}

/** Edge-triggered: only fires on transitions between two cloud readings, so a long outage alerts once. */
export function detectAlerts(prev: Summary | undefined, next: Summary, prefs: AlertPrefs, deviceId: string, name: string): AlertEvent[] {
  const out: AlertEvent[] = [];
  if (!prev) return out;

  if (prefs.notifyGridLoss && prev.gridConnected != null && next.gridConnected != null) {
    if (prev.gridConnected && !next.gridConnected) {
      out.push({ key: `${deviceId}:grid-lost`, level: 'warning', title: `انقطعت الشبكة — ${name}`, body: 'العاكس يعمل الآن على البطارية/الشمسي' });
    } else if (!prev.gridConnected && next.gridConnected) {
      out.push({ key: `${deviceId}:grid-back`, level: 'info', title: `عادت الشبكة — ${name}`, body: `${next.gridVoltage ?? ''}V` });
    }
  }

  const low = prefs.lowBatteryVoltage;
  if (prev.battVoltage != null && next.battVoltage != null && prev.battVoltage >= low && next.battVoltage < low) {
    out.push({ key: `${deviceId}:batt-low`, level: 'error', title: `فولتية البطارية منخفضة — ${name}`, body: `${next.battVoltage}V (الحد ${low}V)` });
  }

  if (prefs.notifyErrors) {
    const before = new Set(prev.faults.map((f) => `${f.title}=${f.val}`));
    for (const f of next.faults) {
      if (!before.has(`${f.title}=${f.val}`)) {
        out.push({ key: `${deviceId}:fault:${f.title}`, level: 'error', title: `${f.title} — ${name}`, body: f.val });
      }
    }
  }
  return out;
}

export async function showSystemNotification(a: AlertEvent) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  const opts: NotificationOptions = { body: a.body, tag: a.key, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', lang: 'ar', dir: 'rtl' };
  if (reg) await reg.showNotification(a.title, opts);
  else new Notification(a.title, opts);
}
