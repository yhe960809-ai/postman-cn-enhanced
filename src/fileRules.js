import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import picomatch from 'picomatch';

export const LOCAL_CORE_INCLUDE = [
  'html/**/*.html',
  'js/**/*.js',
  '*.min.js',
  'main.js'
];

export const LOCAL_CORE_EXCLUDE = [
  '**/node_modules/**',
  '**/*.LICENSE.txt',
  '**/*.map',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.crt',
  '**/*.pem',
  '**/*.key'
];

export async function listLocalCoreFiles(appDir) {
  const include=picomatch(LOCAL_CORE_INCLUDE),exclude=picomatch(LOCAL_CORE_EXCLUDE),files=[];
  async function walk(relative=''){
    for(const item of await readdir(join(appDir,relative),{withFileTypes:true})){
      if(item.name.startsWith('.')||item.isSymbolicLink()||item.name==='node_modules')continue;
      const path=relative?relative+'/'+item.name:item.name;
      if(item.isDirectory())await walk(path);
      else if(item.isFile()&&include(path)&&!exclude(path))files.push(path);
    }
  }
  await walk();
  return files.sort();
}

export function entryMatchesFile(entry, filePath) {
  if (!entry.files || entry.files.length === 0) return true;
  return picomatch(entry.files, { dot: false })(filePath);
}
