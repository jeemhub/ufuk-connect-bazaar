// Capture the rendered Arabic/English summary to preserve shaping and text direction.
export async function downloadQuoteSummary(element: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const doc = new jsPDF({ unit:"mm", format:"a4" });
  const width = 182; const height = canvas.height * width / canvas.width;
  const pageHeight = 267; let offset=0;
  while (offset < height) {
    if (offset) doc.addPage();
    const pixelsPerMm=canvas.width/width;
    const slice=document.createElement("canvas"); slice.width=canvas.width;
    slice.height=Math.min(canvas.height-Math.round(offset*pixelsPerMm),Math.round(pageHeight*pixelsPerMm));
    const ctx=slice.getContext("2d"); if(!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(canvas,0,Math.round(offset*pixelsPerMm),canvas.width,slice.height,0,0,canvas.width,slice.height);
    doc.addImage(slice.toDataURL("image/png"),"PNG",14,14,width,slice.height/pixelsPerMm);
    offset+=pageHeight;
  }
  doc.save("Ufuk-quote-request.pdf");
}
