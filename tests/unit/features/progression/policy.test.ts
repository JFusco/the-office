import { expect, test } from 'vitest';
import { featurePolicy, automaticFeature, automaticEnabled, assertFeaturePlanningConfig } from '../../../../server/features/progression/policy';
import { fixture } from '../test-store';
test('inert defaults, captured feature policy and stable exact label identity', () => {
 const f = fixture(); try {
 expect(featurePolicy('brain')).toMatchObject({progression:'manual',assessment:{enabled:false,planningLabels:[],ordinaryLabels:[]}});
 expect(f.feature.progression).toBe('manual'); delete f.feature.progression;
 expect(automaticFeature(f.feature)).toBe(false);
 const bindings = { brain: { progression:'automatic' as const, assessment:{enabled:true,planningLabels:['b','a']} } };
 expect(automaticEnabled(f.feature, bindings)).toBe(false);
 f.feature.progression='automatic'; expect(automaticEnabled(f.feature, bindings)).toBe(true);
 expect(featurePolicy('brain',bindings).digest).toBe(featurePolicy('brain',{brain:{...bindings.brain,assessment:{enabled:true,planningLabels:['a','b']}}}).digest);
 } finally { f.close(); }
});
test('reject malformed, duplicate and overlapping policy fields', () => {
 for(const input of [[], {brain:null}, {brain:{progression:'auto'}}, {brain:{assessment:{enabled:1}}}, {brain:{assessment:{planningLabels:['x','x']}}}, {brain:{assessment:{planningLabels:['x'],ordinaryLabels:['x']}}}]) expect(()=>assertFeaturePlanningConfig(input)).toThrow();
 expect(()=>assertFeaturePlanningConfig({brain:{progression:'automatic',assessment:{enabled:true,planningLabels:['feature'],ordinaryLabels:['task']}}})).not.toThrow();
});
