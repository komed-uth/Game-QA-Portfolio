import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runPagesPublicationFixture } from './fixtures/pages-publication.mjs';

for (const event of ['push', 'workflow_dispatch']) {
  test(`${event} publishes only the unchanged build validated at the selected commit`, async t => {
    const result = await runPagesPublicationFixture(t, { event });
    assert.equal(result.failure, undefined);
    assert.deepEqual(result.publication, ['upload:dist', 'deploy']);
    assert.equal(result.uploadedBuild, 'production build from selected commit');
    assert.equal(result.uploadedCommit, result.commit);
    assert.equal(result.commands.filter(command => command === 'npm run build').length, 1);
    assert.ok(result.commands.indexOf('npm run build') < result.commands.indexOf('npm run check:browser'));
    assert.deepEqual(result.commands.slice(result.commands.indexOf('npm run check:browser') + 1), []);
  });
  for (const browserStatus of ['failed', 'cancelled', 'incomplete', 'obsolete']) {
    test(`${event} ${browserStatus} validation prevents Pages upload and deployment`, async t => {
      const result = await runPagesPublicationFixture(t, { event, browserStatus });
      assert.ok(result.failure, 'Unsuccessful evidence must fail the publication job');
      assert.deepEqual(result.publication, []);
      assert.deepEqual(result.diagnostics, ['browser-validation-evidence']);
    });
  }
  test(`${event} changed build after validation blocks eligibility and publication`, async t => {
    const result = await runPagesPublicationFixture(t, { event, mutateBeforeEligibility: true });
    assert.match(result.failure, /must still match the validated build/);
    assert.deepEqual(result.publication, []);
  });
  test(`${event} content workflow failure stops expensive browser validation and publication`, async t => {
    const result = await runPagesPublicationFixture(t, { event, failCommand: 'npm run check:content-workflow' });
    assert.match(result.failure, /Command failed/);
    assert.ok(!result.commands.includes('npm run check:browser'));
    assert.deepEqual(result.publication, []);
    assert.deepEqual(result.diagnostics, ['browser-validation-evidence']);
  });
}
