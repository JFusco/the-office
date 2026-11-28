import { readFileSync } from 'node:fs';
import { projectById, projectData } from '../../office/projects';
import { QualificationRecord } from '../launch-qualification';
import { installRecord, installRefusal, recordSkeleton } from './qualification-install';
import { chainQualified } from './chain-qualification';
import { POLICIES, policyTemplate } from './policy-templates';

export { POLICIES } from './policy-templates';

const option = (args: string[], name: string) => { const index = args.indexOf(name); return index < 0 ? '' : args[index + 1] || ''; };
const templateOf = (policy: string) => ({ entry: POLICIES[policy], template: policyTemplate(policy) });

/**
 * `pnpm office launch-qualification template|install|status --project ID [--policy ID] [--record FILE]`. Writes only
 * the project's own qualification records; runs no provider and sends nothing (docs/maintenance-launch-qualification.md).
 */
export async function qualificationCommand(args: string[]): Promise<number> {
    const [verb] = args, projectId = option(args, '--project');
    if (!projectId) { console.error('--project ID is required'); return 1; }
    const dataRoot = projectData(projectById(projectId));
    if (verb === 'template') {
        const { entry, template } = templateOf(option(args, '--policy'));
        console.log(JSON.stringify(recordSkeleton(template, entry.stages), null, 2));
        return 0;
    }
    if (verb === 'install') {
        const record = JSON.parse(readFileSync(option(args, '--record'), 'utf8'));
        const { template } = templateOf(String(record?.policy));
        const refusal = installRefusal(record, template);
        if (refusal) { console.error(`Not installed: ${refusal}`); return 1; }
        console.log(`Installed ${installRecord(dataRoot, QualificationRecord.parse(record))}`);
        return 0;
    }
    if (verb === 'status') {
        let failed = 0;
        for (const [policy, entry] of Object.entries(POLICIES)) {
            const refusal = chainQualified(dataRoot, entry.stages.map(stage => ({ policy, stage })));
            if (refusal) failed++;
            console.log(`${policy}: ${refusal ? `not qualified (${refusal.mismatch})` : 'qualified'}`);
        }
        return failed ? 1 : 0;
    }
    console.error('pnpm office launch-qualification template --project ID --policy ID | install --project ID --record FILE | status --project ID');
    return 1;
}
