import type {Sample} from '../types';
export const HISTORY_DAYS = 90;
export const MAX_INTERVAL_MS = 5 * 60_000;
export const PERIODS = {day: {label:'آخر 24 ساعة',days:1},week:{label:'آخر أسبوع',days:7},month:{label:'آخر 30 يومًا',days:30}} as const;
export type Period = keyof typeof PERIODS;
export function reportFor(samples:Sample[],start:number,end:number) {
  const rows=[...samples].filter(s=>s.ts>=start&&s.ts<=end).sort((a,b)=>a.ts-b.ts);
  let coveredMs=0,pvMs=0,loadMs=0,battMs=0,pvWh=0,loadWh=0,chargeWh=0,dischargeWh=0;
  for(let i=1;i<rows.length;i++) {
    const a=rows[i-1],b=rows[i],dt=b.ts-a.ts;
    if(dt<=0||dt>MAX_INTERVAL_MS)continue;
    coveredMs+=dt;
    if(a.pv!=null&&b.pv!=null){pvWh+=(a.pv+b.pv)/2*dt/3600000;pvMs+=dt;}
    if(a.load!=null&&b.load!=null){loadWh+=(a.load+b.load)/2*dt/3600000;loadMs+=dt;}
    if(a.battP!=null&&b.battP!=null){battMs+=dt;chargeWh+=(Math.max(0,a.battP)+Math.max(0,b.battP))/2*dt/3600000;dischargeWh+=(Math.max(0,-a.battP)+Math.max(0,-b.battP))/2*dt/3600000;}
  }
  const values=(key:'pv'|'load'|'battV')=>rows.map(s=>s[key]).filter((v):v is number=>v!=null&&Number.isFinite(v));
  const peak=(key:'pv'|'load')=>values(key).reduce<number|null>((best,v)=>best==null?v:Math.max(best,v),null);
  const volts=values('battV');
  const events: {ts:number;message:string;kind:'fault'|'grid'|'control'}[]=[];
  rows.forEach((row,i)=>{
    const prev=rows[i-1];const old=new Set(prev?.faults??[]),next=new Set(row.faults??[]);
    for(const fault of next)if(!old.has(fault))events.push({ts:row.ts,message:`${prev?'ظهور':'رُصد'} خطأ: ${fault}`,kind:'fault'});
    // Unknown/legacy readings cannot prove a fault cleared or the grid changed.
    if(row.faults&&prev?.faults)for(const fault of old)if(!next.has(fault))events.push({ts:row.ts,message:`اختفاء الخطأ من القراءة: ${fault}`,kind:'fault'});
    if(prev?.gridConnected!=null&&row.gridConnected!=null&&prev.gridConnected!==row.gridConnected)events.push({ts:row.ts,message:row.gridConnected?'عودة الشبكة':'انقطاع الشبكة',kind:'grid'});
  });
  return {rows,start,end,coveredMs,pvMs,loadMs,coverage:end>start?Math.min(100,coveredMs/(end-start)*100):0,pvKwh:pvMs?pvWh/1000:null,loadKwh:loadMs?loadWh/1000:null,chargeKwh:battMs?chargeWh/1000:null,dischargeKwh:battMs?dischargeWh/1000:null,peakPv:peak('pv'),peakLoad:peak('load'),minVoltage:volts.reduce<number|null>((best,v)=>best==null?v:Math.min(best,v),null),maxVoltage:volts.reduce<number|null>((best,v)=>best==null?v:Math.max(best,v),null),events};
}
export type HistoryReport = ReturnType<typeof reportFor>;
export const csvCell=(value:unknown)=>`"${(typeof value==='string'?value.replace(/^[=+@-]/,'\'$&'):String(value??'')).replace(/"/g,'""')}"`;
export function reportCsv(report:HistoryReport) {
  const header=['الوقت (بغداد)','الشمسي W','الحمل W','البطارية V','قدرة البطارية W (+شحن/-تفريغ)','SOC %','الشبكة','الأخطاء'];
  return '\uFEFF'+[header,...report.rows.map(s=>[new Date(s.ts).toLocaleString('en-GB',{timeZone:'Asia/Baghdad'}),s.pv,s.load,s.battV,s.battP,s.soc,s.gridConnected==null?'غير معروف':s.gridConnected?'متصلة':'مقطوعة',(s.faults??[]).join(' | ')])].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
export function downloadCsv(report:HistoryReport) {
  const url=URL.createObjectURL(new Blob([reportCsv(report)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`ufuk-inverter-${new Date(report.end).toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
