import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { currentPin, MANAGED_CONFIGURATION, qualificationFile, type QualificationEnvironment, type QualificationRecord } from '../../../../server/workers/launch-qualification';
import { REQUIRED_CONTROLS } from '../../../../server/workers/qualification/required-controls';
import type { LaunchTemplate } from '../../../../server/workers/maintenance-template';

export const HOST = { hostname: 'office-mac', platform: 'darwin', arch: 'arm64', release: '24.3.0' };
export const DIGEST = 'f'.repeat(64);

/** A host that reports the pinned executables installed with a fixed digest; nothing is read from the real machine. */
export function fakeEnvironment(overrides: Partial<{ realpath: string; sha256: string; managed: string | null; host: typeof HOST }> = {}): QualificationEnvironment {
    return {
        host: () => overrides.host ?? HOST,
        realpath: path => overrides.realpath ?? path,
        sha256: path => (MANAGED_CONFIGURATION.claude as readonly string[]).includes(path) || (MANAGED_CONFIGURATION.codex as readonly string[]).includes(path) ? (overrides.managed ?? null) : overrides.sha256 ?? DIGEST,
        read: path => { try { return readFileSync(path, 'utf8'); } catch { return null; } },
    };
}

/** A complete passing record for a template, as the install command would accept it. */
export function passingRecord(template: LaunchTemplate, stages: string[]): QualificationRecord {
    const pin = currentPin(template.provider);
    return { version: 1, policy: template.policy, provider: template.provider, stages, host: HOST,
        executable: { path: pin.path, realpath: pin.path, version: pin.version, sha256: DIGEST },
        arguments: template.arguments, settings: template.settings,
        managedConfiguration: MANAGED_CONFIGURATION[template.provider].map(path => ({ path, sha256: null })),
        tools: template.tools, filesystem: template.filesystem, network: template.network,
        controls: (REQUIRED_CONTROLS[template.policy] || []).map(control => ({ ...control, result: 'passed' as const, evidence: 'fixture' })),
        qualifiedAt: '2026-11-28T00:00:00.000Z', qualifiedBy: 'fixture' };
}

export function dataRoot(cleanup: (() => void)[]): string {
    const root = mkdtempSync(resolve(tmpdir(), 'office-qualification-'));
    cleanup.push(() => rmSync(root, { recursive: true, force: true }));
    return root;
}

export function install(root: string, record: unknown, policy: string) {
    const file = qualificationFile(root, policy);
    mkdirSync(resolve(file, '..'), { recursive: true });
    writeFileSync(file, JSON.stringify(record));
}
