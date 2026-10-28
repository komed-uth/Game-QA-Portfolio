import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const requiredCapabilities = ['pull-requests:read', 'checks:read', 'actions:read', 'artifacts:read'];

// This is an observation transport, not authentication: the calling connected-tool
// session must collect these responses from the intended account. Never synthesize
// a successful CLI probe from this file or persist it as repository configuration.
export async function readConnectorObservations(file, repository, expectedLogin, { readiness = false } = {}) {
  let data;
  try { data = JSON.parse(await readFile(file, 'utf8')); }
  catch { throw new Error('Connector observations are missing or malformed JSON.'); }
  return validateConnectorObservations(data, repository, expectedLogin, { readiness });
}

function validateConnectorObservations(data, repository, expectedLogin, { readiness = false } = {}) {
  if (data?.version !== 1 || typeof data.repository !== 'string' ||
      data.repository.toLowerCase() !== repository.toLowerCase()) {
    throw new Error('Connector observations do not identify the requested repository and version.');
  }
  if (!expectedLogin || typeof data.account?.login !== 'string' || data.account.login !== expectedLogin) {
    throw new Error('Connector account does not match the independently supplied --expected-login.');
  }
  for (const capability of requiredCapabilities) {
    if (!Array.isArray(data.capabilities) || !data.capabilities.includes(capability)) {
      throw new Error(`Connector capability is unverified: ${capability}.`);
    }
  }
  const now = Date.now();
  const observations = readiness ? { account: data.account, initial: data.initial,
    workflowRuns: data.workflowRuns, artifact: data.artifact } : { account: data.account };
  for (const [label, observation] of Object.entries(observations)) {
    const time = Date.parse(observation?.observedAt);
    if (!Number.isFinite(time) || time > now || now - time > 5 * 60_000) {
      throw new Error(`Connector ${label} observation is missing, stale or future-dated; collect fresh connected-tool responses.`);
    }
  }
  return data;
}

// Foreground orchestration only: the caller collects actual connected-tool
// responses after this request and writes one JSON line. No polling or watcher.
export async function requestFinalConnectorObservation({ repository, pullRequest, headSha, validationRun, expectedLogin }) {
  const request = { nonce: randomUUID(), notBefore: new Date().toISOString(), repository, pullRequest, headSha, validationRun };
  const response = await new Promise((resolve, reject) => {
    let buffer = '';
    const finish = (error, value) => {
      clearTimeout(timer);
      process.stdin.off('data', onData);
      process.stdin.off('end', onEnd);
      process.stdin.off('error', onError);
      process.stdin.pause();
      if (error) reject(error); else resolve(value);
    };
    const onEnd = () => finish(new Error('Final connector observation was not supplied; collect fresh responses after the request.'));
    const onError = () => finish(new Error('Final connector observation input failed.'));
    const onData = chunk => {
      buffer += chunk;
      if (Buffer.byteLength(buffer, 'utf8') > 256 * 1024) return finish(new Error('Final connector observation exceeds 256 KiB; supply only the requested metadata.'));
      const newline = buffer.indexOf('\n');
      if (newline < 0) return;
      try {
        if (buffer.slice(newline + 1).trim()) throw new Error();
        finish(null, JSON.parse(buffer.slice(0, newline)));
      } catch { finish(new Error('Final connector observation must be one JSON line.')); }
    };
    const timer = setTimeout(() => finish(new Error('Final connector observation timed out after 60 seconds; rerun with a foreground collector.')), 60_000);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);
    console.log(`CONNECTOR OBSERVATION REQUIRED: ${JSON.stringify(request)}`);
  });
  validateConnectorObservations(response, repository, expectedLogin);
  if (response.nonce !== request.nonce || response.validationRun !== validationRun) {
    throw new Error('Final connector observation does not match the requested nonce and validation run.');
  }
  const observedAt = Date.parse(response.observedAt);
  const accountAt = Date.parse(response.account.observedAt);
  const requestedAt = Date.parse(request.notBefore);
  if (!Number.isFinite(observedAt) || observedAt < requestedAt || observedAt > Date.now() || accountAt < requestedAt) {
    throw new Error('Final connector metadata and account must be observed after the pinned request.');
  }
  return response;
}
