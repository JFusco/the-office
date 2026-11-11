/** A single-issue read must establish identity before any mutation preflight uses it. */
export function jiraRecord(data: any, expectedKey: string) {
    const records = data.workItem || data.issue || data;
    const record = Array.isArray(records) && records.length === 1 ? records[0] : records;
    if (!record || Array.isArray(record) || record.key !== expectedKey)
        throw new Error('Jira issue identity mismatch or ambiguous single-issue response');
    return record;
}
