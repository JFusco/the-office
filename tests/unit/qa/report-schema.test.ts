import { expect, test } from 'vitest';
import { z } from 'zod';
import { OfficeQAReportSchema } from '../../../server/qa/report-schema';
import { OfficeQAResultSchema, ResultSchema } from '../../../server/workers/agents';
test('every provider object uses required fields; null is explicit and old results remain parseable', () => {
    const schema = z.toJSONSchema(OfficeQAResultSchema);
    function objects(s:any) { if (!s || typeof s !== 'object') return; if (s.properties) expect(s.required?.slice().sort()).toEqual(Object.keys(s.properties).sort()); for(const v of Object.values(s)) if(Array.isArray(v))v.forEach(objects);else objects(v); }
    objects(schema);
    expect(OfficeQAReportSchema.safeParse({version:1}).success).toBe(false);
    const old={outcome:'blocked',prerequisites:null,approach:null,summary:'Old setup retained',commit:'a'.repeat(40),evidence:[],findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:0,qaRunDir:'',paidRuns:0,blocker:'Missing access'};
    expect(ResultSchema.parse(old)).toEqual(old);
    expect(OfficeQAResultSchema.safeParse(old).success).toBe(false);
});
