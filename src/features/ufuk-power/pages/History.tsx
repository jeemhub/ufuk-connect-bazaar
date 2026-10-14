import {useEffect,useMemo,useState} from 'react';
import {Loader2,Download,FileText,RefreshCw} from 'lucide-react';
import {Card,btn,input,SectionTitle,Num} from '../components/ui';
import {HistoryChart} from '../components/HistoryChart';
import {useApp} from '../store';
import {store} from '../lib/db';
import {PERIODS,reportFor,downloadCsv,type Period} from '../lib/history';
import type {ControlLog} from '../types';
const format=(n:number|null,unit='')=>n==null?'—':`${n.toLocaleString('en-US',{maximumFractionDigits:2})} ${unit}`;
export function History() {
  const {selected,history,nameOf,pushToast}=useApp();const [period,setPeriod]=useState<Period|'all'|'custom'>('day');const [end,setEnd]=useState(Date.now());const [busy,setBusy]=useState(false);const [progress,setProgress]=useState(0);const [events,setEvents]=useState<ControlLog[]>([]);const [limit,setLimit]=useState(100);
  const [from,setFrom]=useState(new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Baghdad'}));
  const [to,setTo]=useState(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Baghdad'}));
  const invalid=period==='custom'&&(!from||!to||from>to);
  const id=selected?.id;
  useEffect(()=>{let cancelled=false;setEvents([]);if(id)store.getControlLogs(id).then(logs=>{if(!cancelled)setEvents(logs);});return()=>{cancelled=true;};},[id,end]);
  const samples=useMemo(()=>id?history[id]??[]:[],[history,id]);
  const report=useMemo(()=>{
    const finish=period==='custom'?Math.min(end,new Date(`${to}T23:59:59.999+03:00`).getTime()):end;
    const start=period==='custom'?new Date(`${from}T00:00:00+03:00`).getTime():period==='all'?samples.reduce((first,s)=>Math.min(first,s.ts),end):end-PERIODS[period].days*86400000;
    const r=reportFor(samples,start,finish);r.events.push(...events.filter(e=>e.ts>=start&&e.ts<=finish).map(e=>({ts:e.ts,message:`${e.field}: ${e.result} (${e.requested})`,kind:'control' as const})));r.events.sort((a,b)=>a.ts-b.ts);return r;
  },[samples,period,end,events,from,to]);
  if(!selected)return <Card>اختر عاكسًا لعرض سجلاته.</Card>;
  return <div className="space-y-3">
    <Card><SectionTitle>السجلات والتقارير — {nameOf(selected)}</SectionTitle>
      <div className="flex flex-wrap gap-2"><select aria-label="فترة التقرير" className={`${input} flex-1`} value={period} onChange={e=>{setPeriod(e.target.value as Period|'all'|'custom');setEnd(Date.now());setLimit(100);}}>{Object.entries(PERIODS).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}<option value="all">كل السجلات المحفوظة</option><option value="custom">فترة بتاريخ محدد</option></select><button className={btn.ghost} aria-label="تحديث التقرير" onClick={()=>setEnd(Date.now())}><RefreshCw className="size-4"/></button></div>
      {period==='custom'&&<div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs">من<input aria-label="من تاريخ" type="date" className={input} value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="text-xs">إلى<input aria-label="إلى تاريخ" type="date" className={input} value={to} onChange={e=>setTo(e.target.value)}/></label></div>}
      {invalid&&<p role="alert" className="mt-2 text-sm text-red-600">حدد تاريخ بداية يسبق تاريخ النهاية.</p>}
      <p className="mt-3 text-xs leading-6 text-slate-500">تُحفظ القراءات على هذا المتصفح لمدة 90 يومًا أثناء فتح الأداة. لا تُجلب بيانات الماضي غير المسجلة ولا يستمر الرصد عند إغلاق الموقع. تسجيل الخروج يحذف السجلات المحلية؛ صدّرها قبل الخروج.</p>
      <p className="mt-2 text-xs text-amber-700">الطاقة في التقرير تقديرية. تُستثنى الفجوات الأكبر من 5 دقائق؛ تغطية الفترة: <Num>{format(report.coverage,'%')}</Num>.</p>
      <div className="mt-3 flex flex-wrap gap-2"><button className={btn.ghost} disabled={!report.rows.length||busy||invalid} onClick={()=>downloadCsv(report)}><Download className="size-4"/>تصدير CSV</button><button className={btn.primary} disabled={!report.rows.length||busy||invalid} aria-busy={busy} onClick={async()=>{setBusy(true);setProgress(0);try{const {exportInverterPdf}=await import('../lib/reportPdf');await exportInverterPdf(report,nameOf(selected),setProgress);}catch(e){pushToast({key:'report',level:'error',title:'تعذر تصدير التقرير',body:(e as Error).message});}finally{setBusy(false);}}}>{busy?<Loader2 className="size-4 animate-spin"/>:<FileText className="size-4"/>}{busy?`جارٍ التصدير ${progress}%`:'تصدير PDF'}</button></div>
    </Card>
    <div className="grid grid-cols-2 gap-3">{[['الإنتاج الشمسي التقديري',format(report.pvKwh,'kWh')],['استهلاك الحمل التقديري',format(report.loadKwh,'kWh')],['أعلى قدرة شمسية',format(report.peakPv,'W')],['أعلى حمل',format(report.peakLoad,'W')],['أقل فولتية بطارية',format(report.minVoltage,'V')],['عدد القراءات',report.rows.length]].map(([label,value])=><Card key={label}><div className="text-xs text-slate-500">{label}</div><Num className="mt-2 block text-lg font-bold">{value}</Num></Card>)}</div>
    <Card><SectionTitle>الرسم خلال الفترة المحددة</SectionTitle><HistoryChart samples={report.rows}/></Card>
    <Card><SectionTitle>الأخطاء والشبكة وأوامر التحكم ({report.events.length})</SectionTitle>{!report.events.length?<p className="text-sm text-slate-500">لا توجد أحداث مسجلة خلال الفترة.</p>:<ul className="max-h-96 space-y-3 overflow-auto">{[...report.events].reverse().slice(0,limit).map((e,i)=><li key={`${e.ts}:${i}`} className="border-b border-slate-100 pb-2 text-sm"><span className="block text-xs text-slate-400">{new Date(e.ts).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'})}</span>{e.message}</li>)}</ul>}{report.events.length>limit&&<button className={`${btn.ghost} mt-3`} onClick={()=>setLimit(n=>n+100)}>عرض المزيد</button>}</Card>
    <Card><SectionTitle>آخر القراءات ضمن الفترة</SectionTitle><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{['وقت بغداد','الشمسي W','الحمل W','البطارية V','الشحن %'].map(h=><th className="p-2 text-start" key={h}>{h}</th>)}</tr></thead><tbody>{report.rows.slice(-100).reverse().map(s=><tr key={s.ts} className="border-t border-slate-100"><td className="p-2 whitespace-nowrap">{new Date(s.ts).toLocaleString('en-GB',{timeZone:'Asia/Baghdad'})}</td>{[s.pv,s.load,s.battV,s.soc??null].map((v,i)=><td key={i} className="p-2"><Num>{format(v)}</Num></td>)}</tr>)}</tbody></table></div><p className="mt-2 text-xs text-slate-400">تظهر أحدث 100 قراءة هنا، والتصدير CSV يشمل جميع القراءات ضمن الفترة.</p></Card>
  </div>;
}
