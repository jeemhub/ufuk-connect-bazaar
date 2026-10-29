import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const changed=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(full.endsWith('.tsx')&&!full.endsWith('StorageMedia.tsx'))port(full);}}
function port(file){let text=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[];const names=new Set();
function visit(node){if((ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node)||ts.isJsxClosingElement(node))&&ts.isIdentifier(node.tagName)){const tag=node.tagName.text;const next=tag==='img'?'StorageImage':tag==='a'?'StorageLink':null;if(next){names.add(next);edits.push([node.tagName.getStart(sf),node.tagName.end,next]);}}ts.forEachChild(node,visit);}visit(sf);if(!edits.length)return;
for(const [start,end,value]of edits.sort((a,b)=>b[0]-a[0]))text=text.slice(0,start)+value+text.slice(end);
text='import { '+[...names].sort().join(', ')+' } from "@/components/site/StorageMedia";\n'+text;
fs.writeFileSync(file,text,{mode:0o600});changed.push({file,elements:edits.length});}
walk('src');fs.writeFileSync('../storage-element-port.json',JSON.stringify(changed,null,2),{mode:0o600});console.log(JSON.stringify({files:changed.length,tags:changed.reduce((n,x)=>n+x.elements,0)}));
