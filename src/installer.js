import {cp,lstat,readFile,rename,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {join} from 'node:path';

export const MANIFEST_FILE='postman-cn-manifest.json';
export const GENERATED_BY='postman-cn-enhanced';
const ASAR='app.asar',BACKUP='app.asar.postman-cn.bak';
async function info(path){try{const s=await lstat(path);if(s.isSymbolicLink())throw new Error('Symbolic links are not supported: '+path);return s;}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function manifest(path){return await info(path)?JSON.parse(await readFile(path,'utf8')):null;}
async function hash(path){return createHash('sha256').update(await readFile(path)).digest('hex');}
async function validBackup(path,owner){if(!await info(path))throw new Error('Original backup is missing');const digest=await hash(path);if(owner?.originalSha256&&owner.originalSha256!==digest)throw new Error('Original backup integrity hash mismatch');return digest;}

// Stage everything before touching live files. Previous overrides are retained,
// never recursively deleted. All mutation paths are fixed children of resources.
export async function installPatchedApp({resourcesDir,patchedAppDir,version,patchSummary={}}){
  if(version!=='12.31.2')throw new Error('Only Postman 12.31.2 has been verified');
  if(!(await info(resourcesDir))?.isDirectory()||!(await info(patchedAppDir))?.isDirectory())throw new Error('Resources or staged application directory is missing');
  const app=join(resourcesDir,'app'),original=join(resourcesDir,ASAR),backup=join(resourcesDir,BACKUP),metadata=join(resourcesDir,MANIFEST_FILE);
  const owner=await manifest(metadata),hasApp=!!await info(app),hasOriginal=!!await info(original),hasBackup=!!await info(backup);
  if(hasApp&&(!['postman-cn',GENERATED_BY].includes(owner?.generatedBy)||owner?.version!==version))throw new Error('Existing app was not created by a compatible postman-cn installer (foreign app)');
  if(hasOriginal&&hasBackup)throw new Error('Original and backup both exist; resolve this conflict before installing');
  if(hasApp&&!hasBackup)throw new Error('Existing override has no original backup');
  if(!hasOriginal&&!hasBackup)throw new Error('Original app.asar is missing');
  const digest=hasBackup?await validBackup(backup,owner):await hash(original);
  const suffix=randomUUID(),stage=join(resourcesDir,'.postman-cn-stage-'+suffix),stageManifest=join(resourcesDir,'.postman-cn-manifest-'+suffix);
  const previousApp=join(resourcesDir,'app.postman-cn.previous-'+suffix),previousManifest=join(resourcesDir,'postman-cn-manifest.previous-'+suffix+'.json');
  await cp(patchedAppDir,stage,{recursive:true,errorOnExist:true,force:false});
  await writeFile(stageManifest,JSON.stringify({generatedBy:GENERATED_BY,version,installedAt:new Date().toISOString(),originalSha256:digest,patchSummary},null,2)+'\n',{flag:'wx'});
  let movedOriginal=false,movedApp=false,movedManifest=false,activated=false;
  try{
    if(hasOriginal){await rename(original,backup);movedOriginal=true;}
    if(hasApp){await rename(app,previousApp);movedApp=true;}
    if(owner){await rename(metadata,previousManifest);movedManifest=true;}
    await rename(stage,app);activated=true;
    await rename(stageManifest,metadata);
    return metadata;
  }catch(error){
    // Preserve failed staged files too, so an interrupted upgrade is recoverable.
    try{if(activated)await rename(app,stage);if(movedApp)await rename(previousApp,app);if(movedManifest)await rename(previousManifest,metadata);if(movedOriginal)await rename(backup,original);}catch(rollbackError){throw new AggregateError([error,rollbackError],'Install failed; rollback incomplete. Retained files need manual recovery.');}
    throw error;
  }
}

export async function restoreInstall({resourcesDir}){
  if(!(await info(resourcesDir))?.isDirectory())throw new Error('Resources directory is missing');
  const metadata=join(resourcesDir,MANIFEST_FILE),owner=await manifest(metadata);
  if(owner?.generatedBy!==GENERATED_BY||!owner.originalSha256)throw new Error('No verified enhanced installer manifest; use the original installer to restore');
  const app=join(resourcesDir,'app'),original=join(resourcesDir,ASAR),backup=join(resourcesDir,BACKUP);
  if(await info(original))throw new Error('Original app.asar already exists; refusing to overwrite');
  if(!(await info(app))?.isDirectory())throw new Error('Localized app directory is missing');
  await validBackup(backup,owner);
  const suffix=randomUUID(),retainedAppDir=join(resourcesDir,'app.postman-cn.disabled-'+suffix),retainedManifest=join(resourcesDir,'postman-cn-manifest.disabled-'+suffix+'.json');
  await rename(app,retainedAppDir);
  let restored=false;
  try{await rename(backup,original);restored=true;await rename(metadata,retainedManifest);}
  catch(error){try{if(restored)await rename(original,backup);await rename(retainedAppDir,app);}catch(rollbackError){throw new AggregateError([error,rollbackError],'Restore failed; rollback incomplete. Retained files need manual recovery.');}throw error;}
  return {restored:true,retainedAppDir};
}
