import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { likePrefix } from '../../../server/store/like-prefix';

test('a prefix with LIKE wildcards and backslashes matches only literally', () => {
    const db = new DatabaseSync(':memory:');
    db.exec("CREATE TABLE e(id TEXT); INSERT INTO e VALUES('harness:j:remove-remote:a_b'),('harness:j:remove-remote:a_b:retry-1'),('harness:j:remove-remote:axb'),('harness:j:remove-remote:a%b'),('harness:j:remove-remote:a\\b')");
    const ids = (prefix: string) => (db.prepare("SELECT id FROM e WHERE id LIKE ? ESCAPE '\\' ORDER BY id").all(likePrefix(prefix)) as { id: string }[]).map(row => row.id);
    expect(ids('harness:j:remove-remote:a_b')).toEqual(['harness:j:remove-remote:a_b', 'harness:j:remove-remote:a_b:retry-1']);
    expect(ids('harness:j:remove-remote:a%b')).toEqual(['harness:j:remove-remote:a%b']);
    expect(ids('harness:j:remove-remote:a\\b')).toEqual(['harness:j:remove-remote:a\\b']);
    expect(ids('harness:j:remove-remote:')).toHaveLength(5);
    db.close();
});
