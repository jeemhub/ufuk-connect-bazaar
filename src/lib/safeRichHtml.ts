import DOMPurify from "dompurify";
const OPTIONS = {
  ADD_ATTR: ["target", "rel", "style"], ALLOW_DATA_ATTR: false,
  ALLOWED_TAGS: ["p","br","b","strong","i","em","u","s","strike","span","div","h1","h2","h3","h4","h5","h6","blockquote","ul","ol","li","a","img","figure","figcaption","hr","pre","code","table","thead","tbody","tr","th","td"],
};
export const sanitizeRichHtml = (html: string): string => DOMPurify.sanitize(html, OPTIONS) as string;
