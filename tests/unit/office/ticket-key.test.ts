import { expect, test } from 'vitest';
import { ownTicket, ticketNumber, ticketPrefix, validTicket } from '../../../server/office/ticket-key';
import { validTicket as fromProjects } from '../../../server/office/projects';
import { legacyCecBindings } from '../../../server/office/project-bindings-config';

const base = { site: 'https://one.example.net', cloudId: 'c', board: 1, account: 'a', repo: '/tmp/r', organization: 'https://dev.azure.com/o', project: 'p', repository: 'r', repositoryId: 'i', target: 'staging' };
const cec = { id: 'cec', provider: 'azure' as const }, acme = { id: 'acme', provider: 'azure' as const }, web = { id: 'web', provider: 'github' as const };
// A second Jira project whose key needs escaping-safe, prefix-exact matching.
const registry = new Map([['cec', legacyCecBindings(base)], ['acme', { ...legacyCecBindings(base), jira: { ...legacyCecBindings(base).jira, projectKey: 'AC_ME' } }]]);

test('each project owns only keys with its own prefix', () => {
    expect(ticketPrefix(web)).toBe('GH');
    expect(ticketPrefix(cec, registry)).toBe('CEC');
    expect(ticketPrefix(acme, registry)).toBe('AC_ME');
    expect(ownTicket(cec, 'CEC-12', registry)).toBe(true);
    expect(ownTicket(acme, 'AC_ME-12', registry)).toBe(true);
    expect(ownTicket(acme, 'CEC-12', registry)).toBe(false);
    expect(ownTicket(cec, 'AC_ME-12', registry)).toBe(false);
    expect(ownTicket(cec, 'GH-12', registry)).toBe(false);
    expect(ownTicket(web, 'GH-12')).toBe(true);
    expect(ownTicket(web, 'CEC-12')).toBe(false);
    expect(ticketNumber(acme, 'AC_ME-307', registry)).toBe(307);
});

test.each(['CEC-0', 'CEC-012', 'CEC-', 'CEC-1a', 'CEC-1 ', ' CEC-1', 'cec-1', 'XCEC-1', 'CEC-1\n', 'CEC--1', 'CEC-1.5', '', undefined, null, 12, {}])('%o is not an owned ticket', key => {
    expect(ownTicket(cec, key, registry)).toBe(false);
    expect(ticketNumber(cec, key, registry)).toBeUndefined();
});

test('the command-boundary check keeps its looser digits rule and is still exported from projects', () => {
    expect(validTicket(cec, 'CEC-012', registry)).toBe(true);
    expect(validTicket(cec, 'CEC-0', registry)).toBe(true);
    expect(validTicket(web, 'GH-7')).toBe(true);
    for (const key of ['CEC-', 'CEC-1a', 'GH-1', 'cec-1', 'CEC-1\n', 'XCEC-1']) expect(validTicket(cec, key, registry)).toBe(false);
    expect(validTicket(web, 'CEC-1')).toBe(false);
    expect(fromProjects).toBe(validTicket);
});

test('a missing or null provider key is rejected without throwing', () => {
    expect(validTicket(cec, undefined as any, registry)).toBe(false);
    expect(validTicket(cec, null as any, registry)).toBe(false);
});

test('a Jira project without a binding is an error, never a match against another project', () => {
    expect(() => ownTicket({ id: 'unbound', provider: 'azure' }, 'CEC-1', registry)).toThrow('Project "unbound" has no Jira/Azure binding');
});
