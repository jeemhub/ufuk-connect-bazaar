export const fmtW = (w: number) => (Math.abs(w) >= 1000 ? `${(w / 1000).toFixed(2)} kW` : `${Math.round(w)} W`);

export function ago(ts: number | null | undefined, now = Date.now()) {
  if (!ts) return 'أبداً';
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `منذ ${s} ث`;
  const m = Math.round(s / 60);
  if (m < 60) return `منذ ${m} د`;
  const h = Math.round(m / 60);
  if (h < 48) return `منذ ${h} س`;
  return `منذ ${Math.round(h / 24)} يوم`;
}

export const STATE_AR: Record<string, string> = {
  Bulk: 'شحن سريع (Bulk)',
  Absorb: 'امتصاص (Absorb)',
  Float: 'تعويم (Float)',
  Idle: 'لا شحن',
  'Line Mode': 'على الشبكة',
  'Battery Mode': 'على البطارية',
  'Invert Mode': 'على العاكس (بطارية/شمسي)',
  'Grid-Tie': 'مرتبط بالشبكة',
  OffGrid: 'منفصل عن الشبكة',
  'Off-Grid': 'منفصل عن الشبكة',
  'Standby Mode': 'استعداد',
  'Fault Mode': 'عطل',
};
