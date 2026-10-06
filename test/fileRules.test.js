import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {listLocalCoreFiles} from '../src/fileRules.js';
test('application file scan never follows directory junctions outside the extracted app',async t=>{const root=await mkdtemp(join(tmpdir(),'cn-files-'));t.after(()=>rm(root,{recursive:true,force:true}));const app=join(root,'app'),outside=join(root,'outside');await mkdir(app);await mkdir(outside);await writeFile(join(outside,'private.js'),'private data');await symlink(outside,join(app,'js'),'junction');assert.deepEqual(await listLocalCoreFiles(app),[]);});
