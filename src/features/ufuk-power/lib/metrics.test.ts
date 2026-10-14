import {describe, expect, it} from 'vitest';
import {solarPowerWatts, summarize} from './metrics';
import type {Point} from '../types';
const p=(title:string,val:string,unit='W',section?:string):Point=>({title,val,unit,section});
describe('total solar input power',()=>{
  it('adds both MPPT inputs, independent of their order',()=>{
    const points=[p('PV1 input power','1580'),p('PV2 input power','1820')];
    expect(summarize(points).pvPower).toBe(3400);
    expect(summarize([...points].reverse()).pvPower).toBe(3400);
  });
  it('prefers an explicit total without double counting inputs',()=>{
    expect(solarPowerWatts([p('PV1 input power','1580'),p('PV2 input power','1820'),p('PV total power','3400')])).toBe(3400);
    expect(solarPowerWatts([p('PV1 input power','1580'),p('Total power','3.4','kW','pv_')])).toBe(3400);
  });
  it('normalizes units and handles numbered camel-case or sectioned titles',()=>{
    expect(solarPowerWatts([p('PV1InputPower','1.58','kW'),p('PV2InputPower','1820')])).toBe(3400);
    expect(solarPowerWatts([p('Input power','1580','W','pv_')])).toBe(1580);
    expect(solarPowerWatts([p('MPPT 1 power','1.58','kW'),p('MPPT 2 power','1.82','kW')])).toBe(3400);
  });
  it('keeps zero valid and refuses an incomplete channel total',()=>{
    expect(solarPowerWatts([p('PV1 input power','0'),p('PV2 input power','0')])).toBe(0);
    expect(solarPowerWatts([p('PV1 input power','1580'),p('PV2 input power','--')])).toBeNull();
  });
  it('does not count a channel twice or use ratings, energy or battery charging power',()=>{
    expect(solarPowerWatts([p('PV1 input power','1580'),p('PV1 power','1580'),p('PV2 input power','1820')])).toBe(3400);
    expect(solarPowerWatts([p('PV rated power','6000'),p('PV daily power','10','kWh'),p('Charger power','1580')])).toBeNull();
  });
  it('preserves single-channel and legacy protocols',()=>{
    expect(solarPowerWatts([p('PV input power','3400')])).toBe(3400);
    expect(solarPowerWatts([p('PVPower','3400')])).toBe(3400);
    expect(solarPowerWatts([p('P PV','3400')])).toBe(3400);
  });
});
