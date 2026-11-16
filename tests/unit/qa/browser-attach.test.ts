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
