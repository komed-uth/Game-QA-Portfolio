import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockedIssueNumbers, eligibilityReasons, type Issue } from './policy.js';

const ready = (changes: Partial<Issue> = {}): Issue => ({
  number: 27, title: 'Video completion', body: 'Agreed criteria', state: 'open',
  labels: [{ name: 'ready-for-agent' }], assignees: [], comments: [], ...changes,
});
test('an unassigned ready issue with resolved prerequisites can proceed', () => {
  assert.deepEqual(eligibilityReasons(ready(), [ready({ number: 26, state: 'closed' })], []), []);
});
test('ready-for-agent does not release the actual implementation hold format', () => {
  assert.match(eligibilityReasons(ready({ body: '**Implementation hold:** Do not implement until separately authorized.' }), [], []).join(' '), /hold/);
});
test('showcase cleanup hold and holds in comments prevent dispatch', () => {
  assert.match(eligibilityReasons(ready({ body: 'Do not implement or deploy yet; both remain on hold until separately authorized.' }), [], []).join(' '), /hold/);
  assert.match(eligibilityReasons(ready({ comments: [{ body: 'Implementation on hold pending a decision.' }] }), [], []).join(' '), /hold/);
});
test('closed, conflicting, unspecified and assigned tickets require triage', () => {
  for (const changes of [
    { state: 'closed' }, { labels: [] },
    { labels: [{ name: 'ready-for-agent' }, { name: 'needs-info' }] },
    { assignees: [{ login: 'another-worker' }] },
  ]) assert.ok(eligibilityReasons(ready(changes), [], []).length);
});
test('open native or textual prerequisites block dispatch', () => {
  assert.match(eligibilityReasons(ready(), [ready({ number: 26 })], []).join(' '), /#26/);
});
test('existing closing PR or issue branch blocks duplicate work without matching issue 270', () => {
  for (const pr of [
    { number: 42, body: 'Closes #27', headRefName: 'feature' },
    { number: 42, body: null, headRefName: 'codex/issue-27' },
    { number: 42, body: 'Fixes https://github.com/komed-uth/Game-QA-Portfolio/issues/27', headRefName: 'feature' },
  ]) assert.match(eligibilityReasons(ready(), [], [pr]).join(' '), /#42/);
  assert.deepEqual(eligibilityReasons(ready(), [], [{ number: 42, body: 'Closes #270', headRefName: 'feature' }]), []);
});
test('textual blockers exclude parent links and deduplicate prerequisite links', () => {
  assert.deepEqual(blockedIssueNumbers('## Parent\n#23\n## Blocked by\n- [Photo timer #26](https://github.com/komed-uth/Game-QA-Portfolio/issues/26)\n## Acceptance\n#24'), [26]);
  assert.deepEqual(blockedIssueNumbers('Blocked by: #24, #25\nOther #23'), [24, 25]);
});


test('canonical closing references catch an issue after another closing reference', () => {
  assert.match(eligibilityReasons(ready(), [], [{
    number: 50, headRefName: 'combined-fix', body: 'Closes #24 and #27',
    closingIssuesReferences: [{ number: 24 }, { number: 27 }],
  }]).join(' '), /#50/);
});
