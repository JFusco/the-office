import { expect, test } from 'vitest';
import { recordedCreates, recordedViews } from '../../../server/maintenance/recorded-gh-command';

const R = '/data/runs/df64b208-1627-4ef8-835b-703dce71952b', REPO = 'JFusco/cms-field-vocabulary';

test('the GH-193 draft worker\'s create and read-back lines are read with their variable', () => {
    expect(recordedCreates(`R=${R}; gh pr create -R ${REPO} --draft --base main --head codex/193-document-saas-string-and-nesting-limits --title "feat(optimizely): document SaaS field limits" --body-file $R/pr/body.md 2>&1`))
        .toEqual([{ repository: REPO, base: 'main', head: 'codex/193-document-saas-string-and-nesting-limits', title: 'feat(optimizely): document SaaS field limits', bodyFile: `${R}/pr/body.md`, draft: true }]);
    const view = `R=${R}; gh pr view 194 -R ${REPO} --json number,url,state,isDraft,headRefName,headRefOid,baseRefName,title,author,closingIssuesReferences,body > $R/pr/readback.json; python3 -c "\nimport json;d=json.load(open('$R/pr/readback.json'));b=open('$R/pr/body.md').read()\nprint({k:d[k] for k in ['number','state']},[i['number'] for i in d['closingIssuesReferences']]);print('body match',d['body'].strip()==b.strip())"; gh pr list -R ${REPO} --state all --head x --json number`;
    expect(recordedCreates(view)).toEqual([]);
    expect(recordedViews(view)).toEqual([{ number: 194, repository: REPO, fields: ['number', 'url', 'state', 'isDraft', 'headRefName', 'headRefOid', 'baseRefName', 'title', 'author', 'closingIssuesReferences', 'body'], stdout: `${R}/pr/readback.json` }]);
});

test('the GH-195 lines read through a guarded create, a command substitution and a piped subshell', () => {
    const create = `cd /w/195; [ "$(gh pr list -R ${REPO} --state all --head codex/195-x --json number -q length)" = 0 ] && gh pr create -R ${REPO} --draft --base main --head codex/195-x --title "feat(optimizely): qualify CMS 13 XHTML editor media" --body-file ${R}/pr/195/body.md`;
    expect(recordedCreates(create)).toEqual([{ repository: REPO, base: 'main', head: 'codex/195-x', title: 'feat(optimizely): qualify CMS 13 XHTML editor media', bodyFile: `${R}/pr/195/body.md`, draft: true }]);
    const view = `R=${R}/pr/195; gh pr view 196 -R ${REPO} --json number,state,body,url > $R/pr-readback.json; jq -r .body $R/pr-readback.json | (cd /w/195 && node scripts/validate_pr_body.cjs)`;
    expect(recordedViews(view)).toEqual([{ number: 196, repository: REPO, fields: ['number', 'state', 'body', 'url'], stdout: `${R}/pr/195/pr-readback.json` }]);
    // A filtered read is not a read-back of the pull request.
    expect(recordedViews(`gh pr view 196 -R ${REPO} --json isDraft,headRefOid -q '{d:.isDraft}' > ${R}/checks.json`)).toEqual([]);
});

test('anything the reader cannot follow is unreadable, never a guessed create', () => {
    for (const line of [
        `cat > ${R}/pr/body.md <<'EOF'\ngh pr create\nEOF`,
        `gh pr create -R ${REPO} --draft --base main --head b --title t --body-file $UNSET`,
        `gh pr create -R ${REPO} --draft --base main --head b --title t --body-file ${R}/b.md | tee ${R}/out`,
        `gh pr create -R ${REPO} --draft --base main --head b --title t --body "inline"`,
        `gh pr create -R ${REPO} --draft --base main --head b --title t --body-file ${R}/b.md &`,
        `gh pr create -R ${REPO} --draft --base main --head b --title "t --body-file ${R}/b.md`,
        `gh pr create -R ${REPO} --repo other/repo --draft --base main --head b --title t --body-file ${R}/b.md`,
    ]) expect(recordedCreates(line), line).toBeUndefined();
    // A create hidden in a substitution is opaque: no create segment is read from it.
    expect(recordedCreates(`URL=$(gh pr create -R ${REPO} --draft --base main --head b --title t --body-file ${R}/b.md); echo $URL`)).toEqual([]);
    expect(recordedCreates(`echo "gh pr create is next"`)).toEqual([]);
});
