import { spawnSync } from "node:child_process";

let cachedNmapInfo = null;

function runShell(command) {
  return spawnSync("sh", ["-lc", command], {
    encoding: "utf8",
  });
}

export function detectNmap() {
  if (cachedNmapInfo) {
    return cachedNmapInfo;
  }

  const pathResult = runShell("command -v nmap");
  const available = pathResult.status === 0 && pathResult.stdout.trim().length > 0;

  if (!available) {
    cachedNmapInfo = {
      available: false,
      name: "nmap",
      path: "",
      version: "not-installed",
    };
    return cachedNmapInfo;
  }

  const versionResult = spawnSync("nmap", ["--version"], { encoding: "utf8" });
  const firstLine = (versionResult.stdout || "").split("\n")[0]?.trim() || "nmap";

  cachedNmapInfo = {
    available: true,
    name: "nmap",
    path: pathResult.stdout.trim(),
    version: firstLine,
  };
  return cachedNmapInfo;
}
