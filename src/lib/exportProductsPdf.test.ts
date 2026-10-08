import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {createProductsPdf, exportProductsToPdf} from "./exportProductsPdf";
const state=vi.hoisted(()=>({addPage:vi.fn(),addImage:vi.fn(),save:vi.fn(),text:vi.fn(),rect:vi.fn()}));
vi.mock("jspdf",()=>({jsPDF:class {addPage=state.addPage;addImage=state.addImage;save=state.save;}}));
beforeEach(()=>{
 vi.clearAllMocks();
 vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue({measureText:(s:string)=>({width:s.length*8}),fillText:state.text,fillRect:vi.fn(),strokeRect:state.rect} as unknown as CanvasRenderingContext2D);
 vi.spyOn(HTMLCanvasElement.prototype,"toDataURL").mockReturnValue("data:image/jpeg;base64,test");
});
afterEach(()=>vi.restoreAllMocks());
const product=(id:number)=>({id:String(id),nameAr:`منتج رقم ${id}`,priceIqd:150000,priceWholesale:120000,priceDealer:90000,stock:10});
it("paginates a large report with all products, repeated headings and bounded page buffers",async()=>{
 const progress=vi.fn();
 await exportProductsToPdf({products:Array.from({length:1110},(_,i)=>product(i)),onProgress:progress});
 expect(state.addImage.mock.calls.length).toBeGreaterThan(30);
 expect(state.addPage).toHaveBeenCalledTimes(state.addImage.mock.calls.length-1);
 for(let i=0;i<1110;i++)expect(state.text).toHaveBeenCalledWith(`منتج رقم ${i}`,expect.any(Number),expect.any(Number));
 for(const [,y,,height] of state.rect.mock.calls)expect(y+height).toBeLessThanOrEqual(1670);
 expect(state.text.mock.calls.filter(([text])=>text==="اسم المنتج")).toHaveLength(state.addImage.mock.calls.length);
 expect(progress.mock.calls.at(-1)).toEqual([100]);
 expect(state.save).toHaveBeenCalledWith(expect.stringMatching(/\.pdf$/),{returnPromise:true});
});
it("rejects empty reports and download failures without reporting completion",async()=>{
 await expect(createProductsPdf({products:[]})).rejects.toThrow("لا توجد منتجات");
 const progress=vi.fn();state.save.mockRejectedValueOnce(new Error("Download failed"));
 await expect(exportProductsToPdf({products:[product(1)],onProgress:progress})).rejects.toThrow("Download failed");
 expect(progress.mock.calls.at(-1)).not.toEqual([100]);
});
it("wraps oversized names over pages without dropping text or overflowing",async()=>{
 await createProductsPdf({products:[{...product(1),nameAr:"س".repeat(20000)}]});
 const drawn=state.text.mock.calls.map(([text])=>text).filter(text=>/^س+$/.test(text)).join("");
 expect(drawn).toHaveLength(20000);
 for(const [,y,,height] of state.rect.mock.calls)expect(y+height).toBeLessThanOrEqual(1670);
});
