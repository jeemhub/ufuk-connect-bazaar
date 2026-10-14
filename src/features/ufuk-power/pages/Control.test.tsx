import {beforeEach,expect,it,vi} from 'vitest';import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';import {Control} from './Control';
const state=vi.hoisted(()=>({groups:[{id:'b',controlItemId:'b',mode:'batch',name:'Battery',fields:[{id:'41',name:'Lithium battery protocol (41)',min:0,max:31,readOnly:false,initial:'Protocol B',options:[{key:'0',val:'Protocol A'},{key:'17',val:'Protocol B'},{key:'18',val:'Protocol C'}]}]}],setValue:vi.fn()}));
vi.mock('../store',()=>{const client={controlGroups:async()=>({groups:state.groups,tried:[]}),readValues:async()=>({'41':'17'}),setValue:state.setValue};return {useApp:()=>({selected:{id:'d'},nameOf:()=> 'Test',pushToast:vi.fn(),client})};});vi.mock('../lib/db',()=>({store:{recordControl:vi.fn()}}));beforeEach(()=>{cleanup();vi.clearAllMocks();HTMLDialogElement.prototype.showModal=function(){this.open=true;};HTMLDialogElement.prototype.close=function(){this.open=false;};});
it('normalizes BMS initial display labels and keeps unsupported restart disabled',async()=>{
 render(<Control/>);await waitFor(()=>expect(screen.getByRole('combobox')).toHaveValue('17'));
 expect(screen.getByRole('button',{name:'إعادة تشغيل العاكس'})).toBeDisabled();
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'18'}});fireEvent.click(screen.getByRole('button',{name:'إرسال'}));
 expect(screen.getByRole('button',{name:'تأكيد وإرسال للعاكس'})).toBeDisabled();expect(state.setValue).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'إلغاء'}));expect(state.setValue).not.toHaveBeenCalled();
});
