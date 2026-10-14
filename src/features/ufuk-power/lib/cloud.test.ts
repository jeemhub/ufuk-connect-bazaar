import {it,expect,vi,afterEach} from 'vitest';
import {CloudClient,extractGroups} from './cloud';
import type {CloudDevice,Session} from '../types';
const device={id:'dev',pn:'p',sn:'s',devcode:1,devaddr:1,alias:'Test',plant:'',role:0,online:true} satisfies CloudDevice;
const session={account:'test',pwdSha1:'',token:'',secret:'',auth:'',userId:''} satisfies Session;
afterEach(()=>vi.restoreAllMocks());
it('preserves additional protocol fields in duplicate group wrappers',()=>{
 const groups=extractGroups([{id:'battery',name:'Battery',fields:[{id:14,name:'Battery type'}]},{id:'battery',name:'Battery',fields:[{id:41,name:'Lithium battery protocol',enumMap:'{"0":"Protocol A","17":"Protocol B"}'}]}],'batch');
 expect(groups).toHaveLength(1);expect(groups[0].fields.map(f=>f.id)).toEqual(['14','41']);expect(groups[0].fields[1].options).toEqual([{key:'0',val:'Protocol A'},{key:'17',val:'Protocol B'}]);
});
it('fetches missing legacy settings even when batch groups are nonempty',async()=>{
 const client=new CloudClient(session,()=>{});const call=vi.spyOn(client as unknown as {call:()=>Promise<unknown>},'call').mockResolvedValueOnce({id:'battery',fields:[{id:14,name:'Battery type'}]}).mockResolvedValueOnce([{id:41,name:'Lithium battery protocol',min:0,max:31}]).mockResolvedValueOnce([]);
 const result=await client.controlGroups(device);expect(result.groups.flatMap(g=>g.fields.map(f=>f.id))).toEqual(['14','41']);expect(call).toHaveBeenCalledTimes(3);
});
it('rejects read-only, out-of-range and unsupported protocol values before any write',async()=>{
 const client=new CloudClient(session,()=>{});const field=extractGroups([{id:'41',name:'BMS',min:0,max:31}],'legacy')[0].fields[0];const group={id:'g',name:'Battery',mode:'legacy' as const,controlItemId:null,fields:[field]};
 await expect(client.setValue(device,group,{...field,readOnly:true},'1')).rejects.toThrow('للقراءة فقط');
 await expect(client.setValue(device,group,field,'32')).rejects.toThrow('خارج المدى');
 await expect(client.setValue(device,group,{...field,options:[{key:'17',val:'Vendor protocol'}]},'0')).rejects.toThrow('غير متاحة');
});
