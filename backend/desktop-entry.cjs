const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.PORT = process.env.PORT || "4000";
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.CLIENT_ORIGINS =
  process.env.CLIENT_ORIGINS ||
  "http://tauri.localhost,https://tauri.localhost,tauri://localhost,http://127.0.0.1:5173,http://localhost:5173";

function resolveNodeCommand() {
  const candidates =
    process.platform === "darwin"
      ? ["/opt/homebrew/bin/node", "/usr/local/bin/node", "/usr/bin/node", "node"]
      : process.platform === "win32"
        ? ["node.exe", "node"]
        : ["/usr/bin/node", "/usr/local/bin/node", "node"];

  return candidates.find((candidate) => candidate === "node" || candidate === "node.exe" || fs.existsSync(candidate)) || null;
}

function resolveBackendRoot() {
  const execDir = path.dirname(process.execPath);
  const candidates = [
    path.resolve(execDir, "../Resources/_up_/backend"),
    path.resolve(execDir, "../Resources/backend"),
    path.resolve(process.cwd(), "backend"),
  ];

  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "src", "server.js"))) || null;
}

const nodeCommand = resolveNodeCommand();
const backendRoot = resolveBackendRoot();

if (!nodeCommand) {
  console.error("Failed to boot CyberShield backend sidecar");
  console.error("Unable to find a Node.js runtime for the packaged backend.");
  process.exit(1);
}

if (!backendRoot) {
  console.error("Failed to boot CyberShield backend sidecar");
  console.error("Unable to locate bundled backend resources.");
  process.exit(1);
}

const backendEntry = path.join(backendRoot, "src", "server.js");
const child = spawn(nodeCommand, [backendEntry], {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
});

function forwardSignal(signal) {
  if (!child.killed && child.exitCode === null) {
    child.kill(signal);
  }
}

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("exit", () => forwardSignal("SIGTERM"));

child.on("error", (error) => {
  console.error("Failed to boot CyberShield backend sidecar");
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
