#!/usr/bin/env node
// Safe local preflight. No network, no database connection, no secrets printed.
import fs from 'node:fs';
import path from 'node:path';
const expected = Object.freeze({
  project:'quiet-base-94226249',
  org:'org-winter-mouse-49053632',
  branch:'production',
  branchId:'br-broad-wildflower-b44aw696',
  source:'ltcchvjxgdcdsvgrmtjb',
});
const root=process.cwd();
const read=(p)=>fs.existsSync(path.join(root,p))?fs.readFileSync(path.join(root,p),'utf8'):null;
const log=(status,message)=>console.log(`[${status}] ${message}`);
const pkg=JSON.parse(read('package.json')??'{}');
if(pkg.name!=='miraj-ostadh'){log('FAIL','wrong package.json name');process.exitCode=1;}
else log('PASS','correct repository package name');
const project=read('PROJECT.md')??'';
if(!project.includes(expected.source)){log('FAIL','Supabase reference mismatch in PROJECT.md');process.exitCode=1;}
else log('PASS','expected Supabase reference in PROJECT.md (not proof of live source)');
const config=read('neon.ts');
if(!config){log('BLOCK','neon.ts missing; do not run deploy');process.exitCode=1;}
else {
 log('INFO','neon.ts exists; manual review required before deploy');
 if(config.includes('auth: true')||config.includes('storage:'))log('BLOCK','auth/storage change requires explicit migration approval');
}
if(!fs.existsSync(path.join(root,'.neon'))){log('BLOCK','.neon linkage absent: verify production branch name and ID via authenticated Neon');process.exitCode=1;}
else log('INFO','.neon exists but is not independently verified');
if(process.env.NEXT_PUBLIC_DATABASE_URL) {log('FAIL','database URL must not be exposed via NEXT_PUBLIC_');process.exitCode=1;}
if(process.env.DATABASE_URL) log('INFO','DATABASE_URL env is set (value redacted); do not assume target');
else log('BLOCK','DATABASE_URL env is not set for isolated Neon tests');
log('REQUIRED',`verify Neon project ${expected.project} / org ${expected.org}`);
log('REQUIRED',`verify name ${expected.branch} -> ID ${expected.branchId} using Neon Console/API before mutation`);
log('REQUIRED','verify dedicated non-production branch, secure backup, auth/RLS mapping and source inventory');
