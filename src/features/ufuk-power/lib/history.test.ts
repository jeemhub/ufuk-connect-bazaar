import {describe,it,expect} from 'vitest';
import {reportFor,reportCsv} from './history';
import type {Sample} from '../types';
const sample=(ts:number,extra:Partial<Sample>={}):Sample=>({ts,pv:3400,load:3280,battV:53.5,battP:-223,...extra});
describe('recorded history reports',()=>{
 it('integrates only observed short intervals, using watts to kWh',()=>{
   const r=reportFor([sample(0),sample(60000),sample(120000)],0,3600000);
   expect(r.pvKwh).toBeCloseTo(3.4*2/60);expect(r.loadKwh).toBeCloseTo(3.28*2/60);expect(r.dischargeKwh).toBeCloseTo(.223*2/60);expect(r.coverage).toBeCloseTo(2/60*100);
 });
 it('does not invent production over gaps or missing channel readings',()=>{
   const r=reportFor([sample(0),sample(3600000)],0,3600000);expect(r.coverage).toBe(0);expect(r.pvKwh).toBeNull();
   expect(reportFor([sample(0,{pv:null,battP:null}),sample(60000,{pv:null,battP:null})],0,60000).chargeKwh).toBeNull();
 });
 it('filters dates and records fault appearance, disappearance and grid changes',()=>{
   const r=reportFor([sample(-1),sample(0,{faults:['Fault: 41'],gridConnected:true}),sample(60000,{faults:[],gridConnected:false})],0,60000);
   expect(r.rows).toHaveLength(2);expect(r.events.map(e=>e.message)).toEqual(['رُصد خطأ: Fault: 41','اختفاء الخطأ من القراءة: Fault: 41','انقطاع الشبكة']);
 });
 it('exports all readings with nulls blank and escapes text formulas',()=>{
   const csv=reportCsv(reportFor([sample(0,{pv:null,faults:['=HYPERLINK("x")']})],0,1));expect(csv).toContain('""');expect(csv).toContain('"-223"');expect(csv).toContain("'=HYPERLINK");
 });
 it('handles empty histories without fake extrema',()=>{const r=reportFor([],0,100);expect(r.peakPv).toBeNull();expect(r.minVoltage).toBeNull();expect(r.pvKwh).toBeNull();});
});
