import {beforeEach,expect,it,vi} from 'vitest';import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';import {History} from './History';
const data=vi.hoisted(()=>({now:Date.now(),samples:[{ts:Date.now()-120000,pv:3400,load:3280,battV:53.5,battP:-223},{ts:Date.now()-60000,pv:3400,load:3280,battV:53.5,battP:-223}]}));
vi.mock('../store',()=>({useApp:()=>({selected:{id:'d'},history:{d:data.samples},nameOf:()=> 'Test inverter',pushToast:vi.fn()})}));vi.mock('../lib/db',()=>({store:{getControlLogs:async()=>[]}}));vi.mock('../components/HistoryChart',()=>({HistoryChart:()=>null}));beforeEach(cleanup);
it('shows period selectors, observed coverage and rejects reversed custom dates',async()=>{
 await act(async()=>{render(<History/>);});expect(screen.getByRole('combobox',{name:'فترة التقرير'})).toHaveValue('day');
 await act(async()=>{fireEvent.change(screen.getByRole('combobox',{name:'فترة التقرير'}),{target:{value:'week'}});});expect(screen.getByRole('option',{name:'آخر 30 يومًا'})).toBeInTheDocument();
 await act(async()=>{fireEvent.change(screen.getByRole('combobox',{name:'فترة التقرير'}),{target:{value:'custom'}});});
 fireEvent.change(screen.getByLabelText('من تاريخ'),{target:{value:'2026-10-20'}});fireEvent.change(screen.getByLabelText('إلى تاريخ'),{target:{value:'2026-10-14'}});
 expect(screen.getByRole('alert')).toHaveTextContent('حدد تاريخ');expect(screen.getByRole('button',{name:'تصدير PDF'})).toBeDisabled();
});
