#!/usr/bin/env node
import {Command} from 'commander';
import {lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readAsarFile} from '../src/asarAdapter.js';
import {loadDictionary} from '../src/dictionary.js';
import {defaultDictionaryPath,withExtractedApp} from '../src/runtime.js';
import {applyPatches} from '../src/patcher.js';
import {installPatchedApp,restoreInstall} from '../src/installer.js';
const exec=promisify(execFile),program=new Command();
program.name('postman-cn-enhanced').version('0.1.0').description('Local, reversible Chinese UI localization for Postman 12.31.2');
async function exists(path){try{const s=await lstat(path);if(s.isSymbolicLink())throw new Error('Symbolic links are not supported');return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
async function locate(installDir){
  const root=resolve(installDir),resourcesDir=join(root,'resources');
  if(!await exists(root)||!await exists(resourcesDir))throw new Error('Select the app-12.31.2 installation directory containing resources');
  const original=join(resourcesDir,'app.asar'),backup=join(resourcesDir,'app.asar.postman-cn.bak');
  const asarPath=await exists(original)?original:backup;
  if(!await exists(asarPath))throw new Error('Original archive or original backup is missing');
  const pkg=JSON.parse(await readAsarFile(asarPath,'package.json'));
  if(String(pkg.name).toLowerCase()!=='postman')throw new Error('The archive is not a Postman application');
  if(pkg.version!=='12.31.2')throw new Error('Only Postman 12.31.2 is supported; detected '+pkg.version);
  return {resourcesDir,asarPath,version:pkg.version};
}
async function requireClosed(){if(process.platform==='win32'){const {stdout}=await exec('tasklist.exe',['/FI','IMAGENAME eq Postman.exe','/NH']);if(/Postman\.exe/i.test(stdout))throw new Error('Close Postman completely before installation or restoration');}}
async function dictionary(options,version){
  const supplement=await loadDictionary(options.dictionary,version);
  const base=options.baseDictionary?await loadDictionary(options.baseDictionary,version):{entries:[]},entries=new Map();
  // Imported dictionaries are data only: never run regex or rewrite application
  // JavaScript from external entries. All translations use the DOM localizer.
  for(const e of [...base.entries,...supplement.entries]){if(e.match==='literal')entries.set(e.source,{...e,runtimeOnly:true,runtimeStrategy:'exact',files:[]});}
  return {versionRange:'12.31.2',entries:[...entries.values()]};
}
for(const command of ['check','install'])program.command(command)
  .description(command==='check'?'Preview compatibility without modifying Postman':'Install with original archive backup and rollback')
  .requiredOption('--install-dir <directory>','Postman app-12.31.2 directory')
  .option('--dictionary <file>','Translation dictionary',defaultDictionaryPath())
  .option('--base-dictionary <file>','Optional separately obtained, trusted base dictionary')
  .action(async options=>{
    const location=await locate(options.installDir);
    if(command==='install')await requireClosed();
    const dict=await dictionary(options,location.version);
    const report=await withExtractedApp(location.asarPath,async appDir=>{
      const result=await applyPatches({appDir,version:location.version,dictionary:dict,dryRun:command==='check'});
      if(!result.preloadLocalizer?.injected)throw new Error('Compatible preload could not be localized; refusing installation');
      const {missingEntries,...summary}=result;
      if(command==='install')await installPatchedApp({...location,patchedAppDir:appDir,patchSummary:summary});
      return {...summary,dryRun:command==='check',dictionaryEntries:dict.entries.length,missingEntriesCount:missingEntries.length};
    });
    console.log(JSON.stringify(report,null,2));
  });
program.command('restore').description('Verify original backup and restore English')
  .requiredOption('--install-dir <directory>','Postman app-12.31.2 directory')
  .action(async options=>{const location=await locate(options.installDir);await requireClosed();const {restored}=await restoreInstall(location);console.log(JSON.stringify({restored},null,2));});
program.parseAsync(process.argv).catch(error=>{console.error(error.message);process.exitCode=1;});
