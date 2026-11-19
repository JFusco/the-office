import { test, expect } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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

test('a file a worker left at the report path is kept under another name and the report is saved', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-report-unit-')), directory = resolve(root, 'office-qa', 'one'), path = resolve(directory, 'report.json');
    try {
        const result = { qa: { version: 2, setup: { status: 'blocked' }, cases: [] }, qaRunDir: directory } as any, saved = JSON.stringify(result.qa, null, 2);
        mkdirSync(directory, { recursive: true });
        // The worker's whole stage result, with the report nested inside it.
        const stray = JSON.stringify({ outcome: 'blocked', qaRunDir: directory, qa: result.qa });
        writeFileSync(path, stray);
        saveQAReport(result, directory, root);
        expect([readFileSync(path, 'utf8'), readFileSync(resolve(directory, 'worker-report.json'), 'utf8')]).toEqual([saved, stray]);
        // Saving again changes nothing, and a second stray file never replaces the first one kept.
        saveQAReport(result, directory, root);
        expect(readdirSync(directory).sort()).toEqual(['report.json', 'worker-report.json']);
        rmSync(path); writeFileSync(path, 'not json');
        saveQAReport(result, directory, root);
        expect([readFileSync(path, 'utf8'), readFileSync(resolve(directory, 'worker-report.json'), 'utf8'), readFileSync(resolve(directory, 'worker-report-2.json'), 'utf8')]).toEqual([saved, stray, 'not json']);
    } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a report with the same content in another layout or key order is that report; one with other content is never replaced', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-report-unit-')), directory = resolve(root, 'office-qa', 'one'), path = resolve(directory, 'report.json');
    try {
        const result = { qa: { version: 2, setup: { status: 'blocked' }, cases: [] }, qaRunDir: directory } as any;
        mkdirSync(directory, { recursive: true });
        writeFileSync(path, JSON.stringify(result.qa));
        saveQAReport(result, directory, root);
        expect(readdirSync(directory)).toEqual(['report.json']);
        expect(readFileSync(path, 'utf8')).toBe(JSON.stringify(result.qa));
        // The same report with its keys in another order and untrimmed text is kept aside and saved in the Office's layout.
        rmSync(path); writeFileSync(path, JSON.stringify({ cases: [], setup: { status: 'blocked ' }, version: 2 }));
        saveQAReport(result, directory, root);
        expect(readdirSync(directory).sort()).toEqual(['report.json', 'worker-report.json']);
        expect(readFileSync(path, 'utf8')).toBe(JSON.stringify(result.qa, null, 2));
        rmSync(resolve(directory, 'worker-report.json'));
        result.qa = { ...result.qa, setup: { status: 'ready' } };
        expect(() => saveQAReport(result, directory, root)).toThrow('Prior Office QA report retained');
        expect(readdirSync(directory)).toEqual(['report.json']);
    } finally { rmSync(root, { recursive: true, force: true }); }
});
