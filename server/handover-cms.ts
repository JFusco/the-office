import { parse } from 'smol-toml';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectById, projectData } from './projects';

// Snapshot the existing user-authored contracts before updating either
// automation. This never edits automation configuration or legacy memories.
const project=projectById('cms-field-vocabulary'),root=resolve(projectData(project),'handover');
mkdirSync(root,{recursive:true,mode:0o700});
const file=resolve(root,'policies.json');
if(existsSync(file)){console.log(`Existing CMS handover retained: ${file}`);}
else{
  const policies=['review-cms-vendor-drift','cms-drift-pr-and-issue-follow-up'].map(id=>{
    const source=resolve('/Users/joe.fusco/.codex/automations',id),raw=readFileSync(resolve(source,'automation.toml'),'utf8');
    const config=parse(raw) as {id:string;prompt:string};
    if(config.id!==id||!config.prompt.includes(project.repository))throw new Error(`Unexpected automation contract for ${id}`);
    writeFileSync(resolve(root,`${id}-before.toml`),raw,{mode:0o600});
    const memory=resolve(root,`${id}-legacy-memory.md`);
    if(existsSync(resolve(source,'memory.md')))writeFileSync(memory,readFileSync(resolve(source,'memory.md')),{mode:0o600});
    return {id,prompt:config.prompt,memory:existsSync(memory)?memory:'No previous memory file available.'};
  });
  writeFileSync(file,JSON.stringify(policies,null,2),{mode:0o600,flag:'wx'});
  console.log(`Original CMS policies and evidence preserved: ${file}`);
}
