import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { startPreview } from "./preview-server.mjs";

test("an occupied preview port rejects without probing the existing server", async () => {
  let requests = 0;
  const existingServer = createServer((request, response) => {
    requests++;
    response.end("Existing stale preview");
  });
  existingServer.listen(0, "127.0.0.1");
  await once(existingServer, "listening");
  const port = existingServer.address().port;
  let child;
  try {
    await assert.rejects(async () => { child = await startPreview(port); }, /Preview stopped:.*already in use/s);
    assert.equal(requests, 0, "The existing server must never be used as a readiness probe");
  } finally {
    if (child) {
      child.kill();
      await once(child, "exit");
    }
    existingServer.closeAllConnections();
    await new Promise(resolve => existingServer.close(resolve));
  }
});

test("concurrent owned previews allocate distinct available ports", async () => {
  const children = [];
  try {
    children.push(await startPreview(0));
    children.push(await startPreview(0));
    assert.notEqual(children[0].url, children[1].url);
    for (const child of children) {
      assert.match(child.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
      const response = await fetch(child.url);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /<html/);
    }
  } finally {
    await Promise.all(children.map(async child => {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }));
  }
});
