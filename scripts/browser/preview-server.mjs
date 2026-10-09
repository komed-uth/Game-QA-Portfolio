import { spawn } from "node:child_process";

export async function startPreview(port = 4175) {
  let output = "";
  const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview",
    "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Preview did not become ready: ${output}`)), 5000);
      const fail = (error) => { clearTimeout(timeout); reject(error); };
      server.once("error", fail);
      server.once("exit", () => fail(new Error(`Preview stopped: ${output}`)));
      server.stderr.on("data", (chunk) => { output = (output + chunk).slice(-4000); });
      server.stdout.on("data", (chunk) => {
        output = (output + chunk).slice(-4000);
        // Vite prints this URL only after this child has successfully bound its port.
        const confirmation = output.replace(/\u001b\[[0-9;]*m/g, "")
          .match(/Local:\s+http:\/\/127\.0\.0\.1:(\d+)\//);
        if (Number(confirmation?.[1]) === port && server.exitCode === null && !server.killed) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
    return server;
  } catch (error) {
    server.kill();
    throw error;
  }
}
