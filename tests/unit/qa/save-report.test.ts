import { test, expect } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { saveQAReport } from '../../../server/qa/save-report';
test('saving a setup report is idempotent but a changed report cannot replace its history',()=>{
    const root=mkdtempSync(resolve(tmpdir(),'office-report-unit-')),directory=resolve(root,'office-qa','one');
    try {const result={qa:{version:1,setup:{status:'blocked'}},qaRunDir:directory} as any;
        saveQAReport(result,directory,root);const bytes=readFileSync(resolve(directory,'report.json'),'utf8');saveQAReport(result,directory,root);
        result.qa.setup.status='ready';expect(()=>saveQAReport(result,directory,root)).toThrow('Prior Office QA report');expect(readFileSync(resolve(directory,'report.json'),'utf8')).toBe(bytes);
    } finally {rmSync(root,{recursive:true,force:true});}
});
