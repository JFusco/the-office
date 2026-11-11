/** Joe's direct approval call_a3b8b1000fcb470aab04627f35c0f91e/0; not a general uncertainty waiver. */
export const PACKED165 = Object.freeze({ project: 'cms-field-vocabulary', repository: 'JFusco/cms-field-vocabulary', key: 'GH-165',
    job: '29f36e5e-caf9-4237-8f00-a51cf9058f7c', head: 'b2281fc40cbcf55d9fb8edee21f2ff53b773230c',
    branch: 'codex/165-team-learning-review-engines-node-change', manager: 'pnpm@11.28.10',
    effectSha256: '5e1329e1229c1455977b20b08f863b86c6cf62fc37db6445cda35dd805c7d3bd',
    beforeSha256: 'b9502dc59d26bad841b0eb4b3edb08a76a93eedc1dbf85c651ce253f23711cd6',
    afterSha256: '0950526010f74c784a43f117b73d3e429fe7f6cd5551864ccdeea36d5769229f', action: 'authorize-packed-repair-165' });
export type Packed165Policy = { readonly [K in keyof typeof PACKED165]: string };
export const packed165EffectId = (p: Packed165Policy = PACKED165) => `harness:${p.job}:push:${p.head}`;
