import type {HistoryReport} from './history';
const fmt=(n:number|null,unit='')=>n==null?'غير متوفر':`${n.toLocaleString('en-US',{maximumFractionDigits:3})} ${unit}`;
const date=(ts:number)=>new Date(ts).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'});
export async function createInverterPdf(report:HistoryReport,name:string,onProgress:(percent:number)=>void) {
  const {jsPDF}=await import('jspdf');
  const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('تعذر إنشاء التقرير');
  const lines=[`العاكس: ${name}`,`الفترة: ${date(report.start)} إلى ${date(report.end)}`,`عدد القراءات: ${report.rows.length} | تغطية الرصد: ${fmt(report.coverage,'%')}`,`الإنتاج الشمسي التقديري: ${fmt(report.pvKwh,'kWh')}`,`استهلاك الحمل التقديري: ${fmt(report.loadKwh,'kWh')}`,`شحن البطارية التقديري: ${fmt(report.chargeKwh,'kWh')} | التفريغ: ${fmt(report.dischargeKwh,'kWh')}`,`أعلى قدرة شمسية: ${fmt(report.peakPv,'W')} | أعلى حمل: ${fmt(report.peakLoad,'W')}`,`فولتية البطارية: ${fmt(report.minVoltage,'V')} إلى ${fmt(report.maxVoltage,'V')}`,
    'المصدر: قراءات سحابة SmartValue التي حفظها هذا المتصفح أثناء فتح الأداة.',
    'الطاقة تقديرية من القدرة المسجلة؛ الفجوات الأكبر من 5 دقائق غير محسوبة.',
    'الملف CSV يتضمن القراءات التفصيلية. الوقت حسب بغداد.',
    'سجل الأخطاء والشبكة وأوامر التحكم:',...report.events.map(e=>`${date(e.ts)} | ${e.message}`)];
  if(!report.events.length)lines.push('لا توجد أحداث مسجلة ضمن هذه الفترة.');
  ctx.font='24px system-ui,sans-serif';
  const wrapped=lines.flatMap(line=>{
    const parts:string[]=[];let current='';for(const char of line){if(current&&ctx.measureText(current+char).width>1120){parts.push(current);current='';}current+=char;}parts.push(current);return parts;
  });
  const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});const count=Math.ceil(wrapped.length/36);
  try {for(let page=0;page<count;page++){
    ctx.fillStyle='#fff';ctx.fillRect(0,0,1240,1754);ctx.direction='rtl';ctx.textAlign='right';ctx.textBaseline='top';
    ctx.font='bold 34px system-ui';ctx.fillStyle='#0f766e';ctx.fillText('أفق البصرة | تقرير مراقبة العاكس',1180,60);
    ctx.font='24px system-ui';ctx.fillStyle='#334155';wrapped.slice(page*36,(page+1)*36).forEach((line,i)=>ctx.fillText(line,1180,150+i*41));
    ctx.font='20px system-ui';ctx.fillText(`صفحة ${page+1} / ${count}`,1180,1680);
    if(page)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',0.9),'JPEG',0,0,210,297,`inverter-${page}`,'FAST');onProgress(Math.round((page+1)/count*95));await new Promise(r=>setTimeout(r,0));
  }return pdf;
  }finally{canvas.width=0;canvas.height=0;}
}

export async function exportInverterPdf(report:HistoryReport,name:string,onProgress:(percent:number)=>void){
  const pdf=await createInverterPdf(report,name,onProgress);
  await pdf.save(`ufuk-inverter-${new Date(report.end).toISOString().slice(0,10)}.pdf`,{returnPromise:true});onProgress(100);
}
