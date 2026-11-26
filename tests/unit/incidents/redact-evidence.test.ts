import { expect, test, vi } from 'vitest';
import { boundedEvidence } from '../../../server/incidents/bounded-evidence';
import { normalizeCause } from '../../../server/incidents/normalize-cause';
import { redactEvidence } from '../../../server/incidents/redact-evidence';

const SECRETS = [`github_pat_${'A1b2'.repeat(10)}_${'z9'.repeat(20)}`, `ghp_${'a'.repeat(36)}`, `ghs_${'b'.repeat(36)}`, `xoxb-1234567890-0987654321-${'c'.repeat(24)}`, `xoxp-1-2-${'d'.repeat(16)}`, 'AKIAIOSFODNN7EXAMPLE', `eyJhbGciOiJIUzI1NiJ9.${'e'.repeat(20)}.${'f'.repeat(20)}`];

test('provider tokens the office-wide redaction does not cover are removed, standing alone or inside a sentence', () => {
    for (const secret of SECRETS) {
        expect(redactEvidence(secret)).toBe('[redacted]');
        expect(redactEvidence(`push failed using ${secret}; retrying`)).toBe('push failed using [redacted]; retrying');
    }
});

test('credentials inside a URL are removed and the rest of the URL is kept', () => {
    expect(redactEvidence('clone https://joe:hunter2@github.com/a/b.git failed')).toBe('clone https://[redacted]@github.com/a/b.git failed');
});

test('what the office-wide redaction already covers still is, and ordinary text is untouched', () => {
    expect(redactEvidence('Authorization: Bearer abc.def.ghi')).not.toContain('abc.def');
    expect(redactEvidence('Worktree for GH-12 is missing head 4f2a9c1e')).toBe('Worktree for GH-12 is missing head 4f2a9c1e');
});

test('neither evidence nor normalized cause text keeps a token', () => {
    for (const secret of SECRETS) {
        expect(boundedEvidence(`Error: refused ${secret}`)).not.toContain(secret);
        expect(normalizeCause(`Error: refused ${secret}`)).not.toContain(secret.toLowerCase());
    }
});

test('the value of a credential property is removed whatever it looks like, in pasted JSON or key-value text', () => {
    expect(redactEvidence('response {"access_token":"opaque-value-123","scope":"repo","expires_in":3600}')).toBe('response {"access_token":"[redacted]","scope":"repo","expires_in":3600}');
    expect(redactEvidence(`{'refresh_token' : 'r-1', "client_secret": "s 2", "token":"t3", "apiKey":"k4", "password":"p5"}`)).toBe(`{'refresh_token' : '[redacted]', "client_secret": "[redacted]", "token":"[redacted]", "apiKey":"[redacted]", "password":"[redacted]"}`);
    expect(redactEvidence('retry with access_token=opaque-1 then refresh_token: opaque-2, done')).toBe('retry with access_token=[redacted] then refresh_token: [redacted], done');
    // Redacting twice changes nothing, and names that only resemble a credential are left alone.
    const once = redactEvidence('{"access_token":"opaque"} access_token=opaque');
    expect(redactEvidence(once)).toBe(once);
    expect(redactEvidence('{"tokens_used": "1200", "kind":"token-limit"} the token budget ran out')).toBe('{"tokens_used": "1200", "kind":"token-limit"} the token budget ran out');
});

test('only an unescaped matching quote ends a quoted credential', () => {
    expect(redactEvidence(String.raw`{"password":"pa'ss","token":"a\"b"}`)).toBe('{"password":"[redacted]","token":"[redacted]"}');
});

test('quoted and bare assignments and cookie properties preserve surrounding text', () => {
    const text = String.raw`before access_token="a\"b" token=fixture {"cookie":"session=fixture"} password='two words' after`;
    const redacted = redactEvidence(text);
    expect(redacted).toBe(`before access_token="[redacted]" token=[redacted] {"cookie":"[redacted]"} password='[redacted]' after`);
    expect(redactEvidence(redacted)).toBe(redacted);
    expect(redactEvidence('Cookie: name=fixture; token="fixture"; session=fixture')).toBe('Cookie: [redacted]');
});

/** The characters `JSON.stringify` writes as an escape: `\n`, `\t`, `\r`, `\b`, `\f` and `\u001b`. */
const ESCAPED = ['\n', '\t', '\r', '\b', '\f', '\u001b'];
const PREFIXED = [`sk-${'g'.repeat(40)}`, `github_pat_${'A1b2'.repeat(10)}_${'z9'.repeat(20)}`, ...['p', 'o', 'u', 's', 'r'].map(kind => `gh${kind}_${'h'.repeat(36)}`),
    ...['a', 'b', 'p', 'r', 's'].map(kind => `xox${kind}-1234567890-${'i'.repeat(24)}`), 'AKIAIOSFODNN7EXAMPLE', 'ASIAIOSFODNN7EXAMPLE',
    `eyJhbGciOiJIUzI1NiJ9.${'e'.repeat(20)}.${'f'.repeat(20)}`];
const jsonLine = (separator: string, tail: string) => JSON.stringify({ prior: `line${separator}${tail}` });

test.each(ESCAPED.map(separator => [JSON.stringify(separator), separator]))('a provider token right after a %s escape in JSON text is removed', (_, separator) => {
    for (const token of PREFIXED) expect(redactEvidence(jsonLine(separator, token))).toBe(jsonLine(separator, '[redacted]'));
    for (const word of ['ghost', 'gh-pages', 'task-runner', 'skip']) expect(redactEvidence(jsonLine(separator, word))).toBe(jsonLine(separator, word));
});

test('a credential name that ends a longer identifier is redacted, and one inside an identifier is not', () => {
    expect(redactEvidence('export GITHUB_TOKEN=fixture; GITHUB_TOKEN: fixture next')).toBe('export GITHUB_TOKEN=[redacted]; GITHUB_TOKEN: [redacted] next');
    expect(redactEvidence(`DB_PASSWD=fixture MY_PRIVATE_KEY=fixture SLACK_BOT_TOKEN="two words" done`)).toBe('DB_PASSWD=[redacted] MY_PRIVATE_KEY=[redacted] SLACK_BOT_TOKEN="[redacted]" done');
    expect(redactEvidence('{"github_token":"fixture","db_password":"fixture","n":1}')).toBe('{"github_token":"[redacted]","db_password":"[redacted]","n":1}');
    expect(redactEvidence('X-Auth-Token: fixture')).toBe('X-Auth-Token: [redacted]');
    expect(redactEvidence('gh auth login --token=fixture --hostname example.test')).toBe('gh auth login --token=[redacted] --hostname example.test');
    const kept = 'my_token_count=5 max_tokens=1200 tokens_used: 9 tokenizer=bpe password_hash=abc mytoken=abc v2token=abc {"token_budget": 5}';
    expect(redactEvidence(kept)).toBe(kept);
});

test('a secret key or credentials name is redacted, and a longer name that only contains one is not', () => {
    expect(redactEvidence('export AWS_SECRET_ACCESS_KEY=fixture; aws_secret_access_key = fixture SECRET_KEY: fixture secretKey="two words" done'))
        .toBe('export AWS_SECRET_ACCESS_KEY=[redacted]; aws_secret_access_key = [redacted] SECRET_KEY: [redacted] secretKey="[redacted]" done');
    expect(redactEvidence('credentials=fixture {"secretAccessKey":"fixture","credentials":"fixture","n":1}'))
        .toBe('credentials=[redacted] {"secretAccessKey":"[redacted]","credentials":"[redacted]","n":1}');
    expect(JSON.parse(redactEvidence(JSON.stringify({ log: 'line\nAWS_SECRET_ACCESS_KEY=fixture more' })))).toEqual({ log: 'line\nAWS_SECRET_ACCESS_KEY=[redacted] more' });
    const kept = 'secretKeyRef: abc secretName: abc SECRET_KEY_ID=abc credential.helper=osxkeychain credentials_file=abc issue_key=CEC-12 sort_key=abc';
    expect(redactEvidence(kept)).toBe(kept);
});

test('a camelCase name that ends in a credential name is redacted, and a lower-case or upper-case run is not', () => {
    const text = 'githubToken=fixture oauth2Token: fixture rsaPrivateKey="two words" {"githubToken":"fixture","userPassword":"fixture","webhookSecret":"fixture","n":1}';
    const redacted = redactEvidence(text);
    expect(redacted).toBe('githubToken=[redacted] oauth2Token: [redacted] rsaPrivateKey="[redacted]" {"githubToken":"[redacted]","userPassword":"[redacted]","webhookSecret":"[redacted]","n":1}');
    expect(redactEvidence(redacted)).toBe(redacted);
    const nested = JSON.stringify({ d: JSON.stringify({ githubToken: 'fixture', n: 1 }) });
    expect(redactEvidence(nested)).toBe(JSON.stringify({ d: JSON.stringify({ githubToken: '[redacted]', n: 1 }) }));
    expect(redactEvidence('JWTToken=fixture {"AWSSecretKey":"fixture"}')).toBe('JWTToken=[redacted] {"AWSSecretKey":"[redacted]"}');
    // A camelCase label is the next assignment, not the value of an empty one before it; a lower-case run is a value.
    expect(redactEvidence('token= githubToken=fixture token= oauth2Token=fixture token= JWTToken=fixture')).toBe('token= githubToken=[redacted] token= oauth2Token=[redacted] token= JWTToken=[redacted]');
    expect(redactEvidence('token= mytoken=fixture')).toBe('token= [redacted]');
    const kept = 'maxTokens=5 myTokenCount=3 passwordHash=abc tokensUsed: 9 mytoken=abc MYTOKEN=abc {"tokenBudget": 5, "inputTokens": 9}';
    expect(redactEvidence(kept)).toBe(kept);
});

test('the value of an escaped credential property is removed at any depth and ends at its own quote', () => {
    const nested = (value: object) => JSON.stringify({ d: JSON.stringify(value) });
    const cases: Array<[string, string]> = [
        [nested({ token: 'fixture', n: 1 }), nested({ token: '[redacted]', n: 1 })],
        [nested({ github_token: 'fixture', n: 1 }), nested({ github_token: '[redacted]', n: 1 })],
        [nested({ password: 'a"b', secret: 'c\\', n: 1 }), nested({ password: '[redacted]', secret: '[redacted]', n: 1 })],
        [JSON.stringify({ a: nested({ token: 'a"b\\', n: 1 }) }), JSON.stringify({ a: nested({ token: '[redacted]', n: 1 }) })],
        [JSON.stringify({ b: JSON.stringify({ a: nested({ token: 'fixture', n: 1 }) }) }), JSON.stringify({ b: JSON.stringify({ a: nested({ token: '[redacted]', n: 1 }) }) })],
        [JSON.stringify({ log: 'token="two words" more' }), JSON.stringify({ log: 'token="[redacted]" more' })],
    ];
    for (const [text, redacted] of cases) {
        expect(redactEvidence(text)).toBe(redacted);
        expect(redactEvidence(redacted)).toBe(redacted);
    }
    expect(redactEvidence(nested({ token: 'fixture-value' }).slice(0, -8))).not.toContain('fixture');
});

test('an escaped value never reaches past the string that holds it', () => {
    // A value cut short ends where its enclosing string does; the rest of the document is kept.
    const cut = String.raw`{"message":"curl failed: token=\"fixture (cut)","status":500,"path":"/repos/x"}`;
    expect(redactEvidence(cut)).toBe(String.raw`{"message":"curl failed: token=\"[redacted]\"","status":500,"path":"/repos/x"}`);
    expect(JSON.parse(redactEvidence(cut)).status).toBe(500);
    // An even run of backslashes is literal text before an ordinary quote, not an escaped opening.
    expect(redactEvidence(String.raw`{"cmd":"token=\\","x":"keep","y":"keep2"}`)).toBe('{"cmd":"token=[redacted]","x":"keep","y":"keep2"}');
    // An escaped name cut off at its colon does not take the quote that closes its string.
    const name = String.raw`{"log":"{\"token\":","level":"info","msg":"hello"}`;
    expect(redactEvidence(name)).toBe(name);
});

test('a bare value in JSON text ends at the escape after it, and an escaped backslash stays in the value', () => {
    expect(redactEvidence(String.raw`token=opaque-1\nskip`)).toBe(String.raw`token=[redacted]\nskip`);
    expect(redactEvidence(String.raw`{"log":"token=opaque-1\" more"}`)).toBe(String.raw`{"log":"token=[redacted]\" more"}`);
    expect(redactEvidence(String.raw`token=a\\b\tnext token=c\\\nnext`)).toBe(String.raw`token=[redacted]\tnext token=[redacted]\nnext`);
    expect(redactEvidence(`token=x1${'\\'}u001b[0m`)).toBe(`token=[redacted]${'\\'}u001b[0m`);
    // Escape letters are case-sensitive: \T, \B, \F, \R, \N and \U are not JSON escapes.
    expect(redactEvidence(String.raw`token=a\Tb\Bc\Fd\Re\Nf\U0041g`)).toBe('token=[redacted]');
    const json = JSON.stringify({ p: 'token=abc\\', n: 1 });
    expect(JSON.parse(redactEvidence(json))).toEqual({ p: 'token=[redacted]', n: 1 });
});

test.each(ESCAPED.map(separator => [JSON.stringify(separator), separator]))('a credential assignment right after a %s escape in JSON text is removed', (_, separator) => {
    expect(redactEvidence(jsonLine(separator, `token=opaque-1${separator}skip`))).toBe(jsonLine(separator, `token=[redacted]${separator}skip`));
    expect(redactEvidence(jsonLine(separator, 'ToKeN="opaque 2" end'))).toBe(jsonLine(separator, 'ToKeN="[redacted]" end'));
    expect(redactEvidence(jsonLine(separator, 'GITHUB_TOKEN=opaque-3'))).toBe(jsonLine(separator, 'GITHUB_TOKEN=[redacted]'));
});

test('escape letters are case-sensitive, so a name after \\T, \\B, \\F or \\U ends a longer word and is kept', () => {
    const text = String.raw`\Ttoken=x \Btoken=x \Ftoken=x \U0041token=x`;
    expect(redactEvidence(text)).toBe(text);
});

test('a bare value loses its whole secret: it may start with an escape, and only a control-character escape ends it', () => {
    const log = (text: string) => JSON.stringify({ l: text });
    expect(redactEvidence(log('token:\topaque-1 next'))).toBe(log('token:[redacted] next'));
    expect(redactEvidence(log('token=\u001b[32mopaque-1\u001b[0m'))).toBe(log('token=[redacted]\u001b[0m'));
    // Python and Go write non-ASCII and HTML characters as \uXXXX; those stay in the value.
    expect(redactEvidence('{"log":"token=p' + '\\u00e4ss' + '\\u003c' + 'tail"}')).toBe('{"log":"token=[redacted]"}');
    // Two levels down, a bare value stops before the backslashes of the escaped quote that ends it.
    const header = (secret: string) => JSON.stringify({ d: JSON.stringify({ msg: `curl -H "X-Auth-Token: ${secret}" https://x` }) });
    expect(redactEvidence(header('fixture'))).toBe(header('[redacted]'));
});

test('an escaped value ends at any quote of the string that holds it, even after an escaped backslash', () => {
    const even = '{"d":"{\\"token\\":\\"C:\\\\dir\\\\","n":1,"x":"keep"}';
    expect(JSON.parse(redactEvidence(even))).toEqual({ d: '{"token":"[redacted]"\\', n: 1, x: 'keep' });
});

test('in JSON text a label at the end of a string keeps the quote that closes it', () => {
    for (const text of ['{"msg":"Missing required env var GITHUB_TOKEN:","status":401}', '{"argv":"gh auth login --token=","n":1}', '{"hint":"send X-Auth-Token:","n":1}']) expect(redactEvidence(text)).toBe(text);
    expect(redactEvidence('{"msg":"GITHUB_TOKEN:","token":"fixture"}')).toBe('{"msg":"GITHUB_TOKEN:","token":"[redacted]"}');
    expect(redactEvidence('GITHUB_TOKEN:"fixture" next')).toBe('GITHUB_TOKEN:"[redacted]" next');
});

test('a name right after a terminal colour code is redacted, and a property name needs its opening quote', () => {
    const log = (text: string) => JSON.stringify({ l: text });
    expect(redactEvidence(log('\u001b[33mGITHUB_TOKEN=fixture\u001b[0m'))).toBe(log('\u001b[33mGITHUB_TOKEN=[redacted]\u001b[0m'));
    expect(redactEvidence('\u001b[1mtoken: fixture')).toBe('\u001b[1mtoken: [redacted]');
    expect(redactEvidence('note access_token": "x password = "fixture"')).toBe('note access_token": "x password = "[redacted]"');
});

test('in JSON text a label left alone keeps the sanitizer away too, so the JSON still parses and stays as it is', () => {
    const text = '{"argv":["mysql","--password="],"env":{"GITHUB_TOKEN":"x"}}';
    const redacted = redactEvidence(text);
    expect(redacted).toBe('{"argv":["mysql","--password="],"env":{"GITHUB_TOKEN":"[redacted]"}}');
    expect(redactEvidence(redacted)).toBe(redacted);
});

test('a label with nothing after it does not take the next label as its value', () => {
    expect(redactEvidence('with:\n  github_token:\n  token: abc123\n')).toBe('with:\n  github_token:\n  token: [redacted]\n');
    expect(redactEvidence('DB_PASSWD=\npasswd: hunter2')).toBe('DB_PASSWD=\npasswd: [redacted]');
    expect(redactEvidence('cli --token= token: abc123')).toBe('cli --token= token: [redacted]');
    expect(redactEvidence('token=mytoken=xyz')).toBe('token=[redacted]');
    // Nor does a bare value run over a quoted one into the label after it.
    expect(redactEvidence('token=abc-GITHUB_TOKEN="two words"id_token = secret-tail')).toBe('token=[redacted]TOKEN="[redacted]"id_token = [redacted]');
});

test('a quote right after another label opens that label\'s value, so it neither closes nor ends this one', () => {
    const nested = '{"msg":"payload {\\"field\\":\\"password:\\"} rejected; authorization=\\"Basic abc123\\""}';
    expect(redactEvidence(nested)).not.toContain('abc123');
    expect(() => JSON.parse(redactEvidence(nested))).not.toThrow();
    expect(redactEvidence('run token=\\"x password="secret value" end')).not.toContain('secret value');
    // In JSON text an unescaped quote is certain: a value that only ends in label-like text closes there.
    expect(redactEvidence('{"api_key":"X-Auth-Token=","private_key":"k"}')).toBe('{"api_key":"[redacted]","private_key":"[redacted]"}');
});

test('in JSON text a single-quoted value ends with the string that holds it', () => {
    expect(redactEvidence('{"cmd":"export GITHUB_TOKEN=\'ghx-abc (cut)","level":"info"}')).toBe('{"cmd":"export GITHUB_TOKEN=\'[redacted]\'","level":"info"}');
    expect(redactEvidence('password=\'he said "hi"\' done')).toBe('password=\'[redacted]\' done');
});

test('text too large for the regex stack is kept as nothing, and any other failure still throws', () => {
    const overflow = vi.spyOn(String.prototype, 'replaceAll').mockImplementationOnce(() => { throw new RangeError('Maximum call stack size exceeded'); });
    expect(redactEvidence('token=fixture')).toBe('[redacted]');
    overflow.mockImplementationOnce(() => { throw new TypeError('unexpected'); });
    expect(() => redactEvidence('token=fixture')).toThrow(TypeError);
    overflow.mockRestore();
    expect(redactEvidence('token=fixture')).toBe('token=[redacted]');
});

// #627: the gaps a review of #539 and #542 found. `message`, `wrap` and `cut` build the fixtures the plan names.
const B = '\\';
const u = (hex: string) => `${B}u${hex}`;
const tab = '\t', lf = '\n', NUL = '\0';
const message = (s: string) => JSON.stringify({ m: s });
const wrap = (s: string) => JSON.stringify({ d: s, n: 1 });
const cut = (s: string) => message(s).slice(0, -2);
/** The exact output, and the same output again on a second pass. */
function expectRedaction(input: string, output: string) {
    expect(redactEvidence(input)).toBe(output);
    expect(redactEvidence(output)).toBe(output);
}

test('#627: edits are chosen on the original text, so an earlier edit never moves a later layer decision', () => {
    const lead = (credentials: unknown, token: string) => NUL + JSON.stringify({ credentials, token }) + ' ';
    const S = '{"m":"token=\'a' + B + B + '\'b\' done token=fix' + u('0020') + 'tail next"}';
    const T = '{"m":"token=\'[redacted]\' done token=[redacted]' + u('0020') + 'tail next"}';
    const redacted = redactEvidence(lead(1, 'x'.repeat(256)) + wrap(S));
    const head = lead('[redacted]', '[redacted]');
    expect(redacted).toBe(head + wrap(T));
    expect(JSON.parse(head.slice(1, -1))).toEqual({ credentials: '[redacted]', token: '[redacted]' });
    expect(JSON.parse(JSON.parse(redacted.slice(head.length)).d)).toEqual({ m: "token='[redacted]' done token=[redacted] tail next" });
});

test('#627: the shared sanitizer keeps the JSON mode of the original text', () => {
    const output = '["password=[redacted]' + u('0020') + 'next","' + B + 'bearer [redacted]"]';
    expectRedaction('["password=fixture' + u('0020') + 'next","' + B + 'bearer fixture"]', output);
    expect(() => JSON.parse(output)).not.toThrow();
});

test('#627 items 1 and 2: a dotted or long property name ending in a credential name is recognized', () => {
    expectRedaction('{"spring.datasource.password":"hunter2"}', '{"spring.datasource.password":"[redacted]"}');
    expectRedaction(wrap('{"spring.datasource.password":"hunter2"}'), wrap('{"spring.datasource.password":"[redacted]"}'));
    expect(redactEvidence('{"credential.helper":"store"}')).toBe('{"credential.helper":"store"}');
    const key = 'a'.repeat(65) + 'Token';
    expectRedaction(JSON.stringify({ [key]: 'fixture' }), JSON.stringify({ [key]: '[redacted]' }));
});

test('#627 item 3: a credential property with a value that is not a string loses the whole value', () => {
    expectRedaction('{"githubToken":12345,"next":"kept"}', '{"githubToken":"[redacted]","next":"kept"}');
    for (const value of ['{"a":1}', '[1,2]', 'true', 'false', 'null', '-1.5e+10', '{"a":[1,{"b":"]}"}],"c":{}}']) {
        expectRedaction(`{"credentials":${value},"next":"kept"}`, '{"credentials":"[redacted]","next":"kept"}');
    }
    const serialized = JSON.stringify({ credentials: { a: 'x' + B, b: '}secret' }, next: 'kept' });
    expectRedaction(serialized, '{"credentials":"[redacted]","next":"kept"}');
    expectRedaction(wrap(serialized), wrap('{"credentials":"[redacted]","next":"kept"}'));
    const single = "{'credentials':{'a':'}x secret'},'n':1}";
    expectRedaction(single, `{'credentials':"[redacted]",'n':1}`);
    expectRedaction(wrap(single), wrap(`{'credentials':"[redacted]",'n':1}`));
    expectRedaction('{"credentials":{"a":"it\'s }"},"n":1}', '{"credentials":"[redacted]","n":1}');
    expectRedaction(JSON.stringify({ credentials: { a: 'q"}' }, next: 'kept' }), '{"credentials":"[redacted]","next":"kept"}');
    const unicodeQuoted = '{"d":"{' + B + '"credentials' + B + '":{' + B + '"a' + B + '":' + u('0022') + '}tail' + u('0022') + '},' + B + '"next' + B + '":1}","n":1}';
    const redacted = redactEvidence(unicodeQuoted);
    expect(redacted).toBe(wrap('{"credentials":"[redacted]","next":1}'));
    expect(JSON.parse(JSON.parse(redacted).d)).toEqual({ credentials: '[redacted]', next: 1 });
    expectRedaction(wrap('{"token":123'), wrap('{"token":"[redacted]"'));
    expectRedaction(wrap('{"credentials":{"a":"x (cut)'), wrap('{"credentials":"[redacted]"'));
});

test('#627 item 4: a serialized tab or newline between a label and its value is a gap at the label\'s layer', () => {
    expectRedaction(message('auth_token:' + tab + '"fixture" done'), message('auth_token:' + tab + '"[redacted]" done'));
    expectRedaction(wrap(message('auth_token:' + tab + '"fixture" done')), wrap(message('auth_token:' + tab + '"[redacted]" done')));
    expectRedaction(message('{"token":' + tab + '"fixture","n":1}'), message('{"token":' + tab + '"[redacted]","n":1}'));
    expectRedaction(message('token= auth.token' + tab + '=fixture next'), message('token= auth.token' + tab + '=[redacted] next'));
    expectRedaction(wrap('{"token"' + tab + ':"fixture","n":1}'), wrap('{"token"' + tab + ':"[redacted]","n":1}'));
    expectRedaction(message('token=' + lf + '  fixture done'), message('token=[redacted] done'));
    expectRedaction(message('token:' + B + 'tabc next'), message('token:[redacted] next'));
    expectRedaction(message('token:' + B + 't'), message('token:[redacted]'));
    expectRedaction(message('token="first password:' + tab + '"second value" done'), message('token="[redacted]" done'));
});

test('#627 item 5: a single-quoted value in a JSON string closes on an even run of decoded backslashes', () => {
    const cutWrap = redactEvidence(wrap(cut("token='a" + B + "'b' done")));
    expect(cutWrap).toBe(wrap(cut("token='[redacted]'")));
    expect(JSON.parse(cutWrap).n).toBe(1);
    expect(redactEvidence(cutWrap)).toBe(cutWrap);
    for (const value of ['left' + B + "'right", 'a' + B + B]) {
        expectRedaction(message("token='" + value + "' done"), message("token='[redacted]' done"));
        expectRedaction(wrap(message("token='" + value + "' done")), wrap(message("token='[redacted]' done")));
    }
    expectRedaction('{"m":"token=\'a' + u('005C') + '\'b\' done"}', '{"m":"token=\'[redacted]\' done"}');
    expectRedaction('{"m":"token=\'a' + u('005c') + u('005C') + '\' done"}', '{"m":"token=\'[redacted]\' done"}');
    expectRedaction(message('unbalanced " token=fix' + B + 'u0020tail next'), message('unbalanced " token=[redacted] next'));
    expectRedaction(wrap(cut('token=' + lf + '  fixture done')), wrap(cut('token=[redacted] done')));
});

test('#627 items 6 and 7: a label with nothing after it never takes the next label, dotted or after an escape', () => {
    expectRedaction('token= auth.token= fixture', 'token= auth.token= [redacted]');
    expectRedaction('token= team.auth.token= fixture', 'token= team.auth.token= [redacted]');
    expectRedaction(message('token=' + lf + '  team.auth.token= fixture'), message('token=' + lf + '  team.auth.token= [redacted]'));
    expectRedaction('password= GITHUB_TOKEN:' + lf + '  fixture', 'password= GITHUB_TOKEN:' + lf + '  [redacted]');
    expectRedaction('password= token="two words" done', 'password= token="[redacted]" done');
});

test('#627 item 8: only a lower-case \\u001b or \\u001B colour code with a lower-case m starts a name', () => {
    for (const prefix of [u('001b') + '[33m', u('001B') + '[33m']) expectRedaction(prefix + 'token=x', prefix + 'token=[redacted]');
    for (const text of [B + 'U001b[33mtoken=x', u('001b') + '[33Mtoken=x']) expect(redactEvidence(text)).toBe(text);
});

test('#627 item 9 (option a): an encoded whitespace escape ends a bare value; a printable escape stays in it', () => {
    for (const label of ['token=', 'password=', '?token=']) expectRedaction(label + 'fixture' + u('0020') + 'next', label + '[redacted]' + u('0020') + 'next');
    expectRedaction('?token=a' + B + '&b=2' + u('0020') + 'token=c&x=1', '?token=[redacted]' + u('0020') + 'token=[redacted]&x=1');
    expectRedaction('{"log":"token:' + u('00a0') + 'fixture next"}', '{"log":"token:[redacted] next"}');
    expectRedaction('token=fix' + u('00e4') + 'ture next', 'token=[redacted] next');
    expectRedaction('token=fixture' + u('FEFF') + 'next', 'token=[redacted]' + u('FEFF') + 'next');
    expectRedaction('token=fix' + u('0085') + 'ture next', 'token=[redacted] next');
    expectRedaction('token=fix' + B + 'U0020ture next', 'token=[redacted] next');
    expectRedaction(message('token=fix' + B + 'u0020tail next'), message('token=[redacted] next'));
    expectRedaction(wrap('{"m":"token=fix' + u('0020') + 'tail next"}'), wrap('{"m":"token=[redacted]' + u('0020') + 'tail next"}'));
    for (const text of ['Authorization: Bearer fixture', 'Authorization: Basic dXNlcjpwYXNz', 'Authorization: Bearer' + u('0020') + 'fixture', 'Authorization: Basic' + u('0020') + 'dXNlcjpwYXNz']) {
        expectRedaction(text, 'Authorization: [redacted]');
    }
    for (const text of ['Cookie: name=fixture' + u('0020') + 'other=fixture', 'Cookie: token=fixture; session=fixture']) expectRedaction(text, 'Cookie: [redacted]');
});
