import { expect, test } from 'vitest';
import { BROWSER_ATTACH_RULE } from '../../../server/qa/browser-attach';
import { officeQAGuidance } from '../../../server/qa/assignment';
import { browserQAGuidance } from '../../../server/workers/browser-qa-guidance';

test('both QA guidance texts tell a background worker which browser tool works and to attach to a handed-off browser', () => {
    for (const text of [officeQAGuidance('CEC-900', 'a'.repeat(40), 'retest', '/tmp/qa'), browserQAGuidance('/tmp/qa/run')]) expect(text).toContain(BROWSER_ATTACH_RULE);
    expect(BROWSER_ATTACH_RULE).toContain('agent-browser --cdp <port>');
    expect(BROWSER_ATTACH_RULE).toContain('never report an error from one as the browser being unavailable');
    // The Office QA route forbids the QA Team harness, so the rule must not send a worker to it.
    expect(BROWSER_ATTACH_RULE).not.toMatch(/qa-team|QA Team/);
});

test('a handed-off browser that is gone is replaced by the worker\'s own, and single sign-on is clicked without credentials', () => {
    const text = officeQAGuidance('CEC-900', 'a'.repeat(40), 'staging-qa', '/tmp/qa');
    expect(BROWSER_ATTACH_RULE).toContain('that handoff has ended and is not a blocker');
    expect(BROWSER_ATTACH_RULE).toContain('start your own run-owned browser');
    expect(BROWSER_ATTACH_RULE).toContain('Do not launch a second browser beside a live one');
    expect(text).toContain('exactly one single sign-on button, click it yourself');
    expect(text).toContain('never accept a consent, terms or permission prompt');
    expect(BROWSER_ATTACH_RULE).toContain('headed, so its window can be shown');
    expect(text).toContain('Never type a username, an email, a password, a verification code or any credential');
    expect(text).toContain('resolution kind provider-wait and release=null, not permission or human-hold');
});
