import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import {applyPatches} from '../src/patcher.js';

test('preload translates input hints without modifying input values or editor code', async t => {
  const dir=await mkdtemp(join(tmpdir(),'cn-preload-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await writeFile(join(dir,'preload_desktop.js'),'');
  await applyPatches({appDir:dir,version:'12.31.2',dictionary:{entries:[
    {source:'Enter URL',target:'输入 URL',match:'literal',runtimeOnly:true},
    {source:'Send',target:'发送',match:'literal',runtimeOnly:true},
    {source:'Postman v{currentVersion} is the latest version.',target:'Postman v{currentVersion} 是最新版本。',match:'literal',runtimeOnly:true}
  ]}});
  const element=(tag,attrs={})=>({nodeType:1,tagName:tag,childNodes:[],parentElement:null,getAttribute:n=>attrs[n]??null,setAttribute:(n,v)=>attrs[n]=v,matches:()=>false});
  const body=element('DIV');
  const input=element('INPUT',{placeholder:'Enter URL'});input.value='Send';
  const code=element('CODE');const codeText={nodeType:3,nodeValue:'Send',parentElement:code};code.childNodes=[codeText];
  const version={nodeType:3,nodeValue:'Postman v12.31.2 is the latest version.',parentElement:body};
  body.childNodes=[input,code,version];input.parentElement=body;code.parentElement=body;
  const callbacks=[];
  const document={body,readyState:'complete',title:'Postman v12.31.2 is the latest version.'};
  vm.runInNewContext(await readFile(join(dir,'preload_desktop.js'),'utf8'),{
    Node:{TEXT_NODE:3,ELEMENT_NODE:1},document,
    window:{requestIdleCallback:cb=>callbacks.push(cb)},MutationObserver:class{observe(){}}
  });
  while(callbacks.length)callbacks.shift()({timeRemaining:()=>20});
  assert.equal(input.getAttribute('placeholder'),'输入 URL');
  assert.equal(input.value,'Send');
  assert.equal(codeText.nodeValue,'Send');
  assert.equal(version.nodeValue,'Postman v12.31.2 是最新版本。');
  assert.equal(document.title,'Postman v12.31.2 是最新版本。');
});
