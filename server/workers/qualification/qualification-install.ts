import { mkdirSync, renameSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { controlCoverage, currentPin, HOST_ENVIRONMENT, MANAGED_CONFIGURATION, managedConfigurationMismatch, qualificationFile, QualificationRecord, templateMismatch, unregisteredExecutable, type QualificationEnvironment } from '../launch-qualification';
import { REQUIRED_CONTROLS } from './required-controls';
import type { LaunchTemplate } from '../maintenance-template';

/** The skeleton an operator fills from the host controls: the exact template, the current pin and host, and every control to run. */
export function recordSkeleton(template: LaunchTemplate, stages: string[], environment: QualificationEnvironment = HOST_ENVIRONMENT) {
    const pin = currentPin(template.provider);
    let realpath = '';
    try { realpath = environment.realpath(pin.path); } catch { /* Not installed: the install will refuse. */ }
    return {
        version: 1 as const, policy: template.policy, provider: template.provider, stages, host: environment.host(),
        executable: { path: pin.path, realpath, version: pin.version, sha256: realpath ? environment.sha256(realpath) : null },
        arguments: template.arguments, settings: template.settings,
        managedConfiguration: MANAGED_CONFIGURATION[template.provider].map(path => ({ path, sha256: environment.sha256(path) })),
        tools: template.tools, filesystem: template.filesystem, network: template.network,
        controls: (REQUIRED_CONTROLS[template.policy] || []).map(control => ({ ...control, result: 'unavailable', evidence: 'TODO: record the observed result and where its evidence is kept' })),
        qualifiedAt: '', qualifiedBy: '',
    };
}

/**
 * Why a filled record may not be installed, or undefined: it must parse, bind exactly this template, the current pin
 * and a registered canonical binary on this host, the managed configuration as it is now, and every required control
 * passed with its paired working control.
 */
export function installRefusal(input: unknown, template: LaunchTemplate, environment: QualificationEnvironment = HOST_ENVIRONMENT): string | undefined {
    const parsed = QualificationRecord.safeParse(input);
    if (!parsed.success) return `the record is malformed: ${parsed.error.issues[0]?.message ?? 'invalid'}`;
    const record = parsed.data, pin = currentPin(template.provider);
    const stale = templateMismatch(record, template);
    if (stale) return stale;
    if (record.executable.path !== pin.path || record.executable.version !== pin.version) return 'the record does not bind the current pin';
    let real: string;
    try { real = environment.realpath(pin.path); } catch { return 'the pinned executable is not installed'; }
    try {
        if (record.executable.realpath !== real || environment.sha256(real) !== record.executable.sha256) return 'the record does not bind the installed binary';
    } catch { return 'the pinned executable binary could not be read'; }
    const unregistered = unregisteredExecutable(pin, real);
    if (unregistered) return unregistered;
    if (!isDeepStrictEqual(record.host, environment.host())) return 'the record was not made on this host';
    return managedConfigurationMismatch(record, environment) ?? controlCoverage(template.policy, record.controls);
}

/** Installs a validated record for a project, keeping the record it replaces beside it for audit. */
export function installRecord(dataRoot: string, record: QualificationRecord, at = new Date().toISOString()): string {
    const file = qualificationFile(dataRoot, record.policy);
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    if (existsSync(file)) writeFileSync(`${file}.${at.replace(/[:.]/g, '-')}.replaced`, readFileSync(file), { mode: 0o600, flag: 'wx' });
    writeFileSync(`${file}.tmp`, JSON.stringify(record, null, 2), { mode: 0o600 });
    renameSync(`${file}.tmp`, file);
    return file;
}
