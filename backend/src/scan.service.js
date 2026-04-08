import { spawn } from "node:child_process";
import { parseStringPromise } from "xml2js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { detectNmap } from "./tooling.service.js";

const DANGEROUS_PORTS = new Set([21, 23, 25, 110, 135, 139, 445, 3389, 5900]);
const WARNING_PORTS = new Set([22, 53, 80, 143, 587, 993, 995, 8080]);

function mapRisk(portNumber, state) {
  if (state !== "open") return "safe";
  if (DANGEROUS_PORTS.has(portNumber)) return "high";
  if (WARNING_PORTS.has(portNumber)) return "medium";
  return "low";
}

function normalizePorts(xmlPorts = []) {
  return xmlPorts.map((item) => {
    const port = Number(item.$?.portid || 0);
    const state = item.state?.[0]?.$?.state || "unknown";
    const serviceInfo = item.service?.[0]?.$ || {};

    return {
      port,
      protocol: item.$?.protocol || "tcp",
      state,
      service: serviceInfo.name || "unknown",
      product: serviceInfo.product || "",
      risk: mapRisk(port, state),
    };
  });
}

export async function executeNmapScan({ target, ports }) {
  const toolInfo = detectNmap();

  if (!toolInfo.available) {
    throw new AppError(
      "Nmap is not installed. Install nmap on macOS/Linux or use the Docker setup.",
      503,
      { tool: toolInfo }
    );
  }

  const requestedPorts = ports || env.nmapDefaultPorts;
  const args = ["-Pn", "-p", requestedPorts, "-oX", "-", target];

  const rawOutput = await new Promise((resolve, reject) => {
    const child = spawn("nmap", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new AppError("Failed to start nmap process", 500, { cause: error.message }));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new AppError("Nmap scan failed", 500, { stderr, exitCode: code }));
        return;
      }
      resolve(stdout);
    });
  });

  const parsed = await parseStringPromise(rawOutput);
  const host = parsed?.nmaprun?.host?.[0] || {};
  const portsNode = host?.ports?.[0]?.port || [];
  const normalizedPorts = normalizePorts(portsNode);
  const openPorts = normalizedPorts.filter((item) => item.state === "open").length;
  const riskyPorts = normalizedPorts.filter((item) => item.risk !== "safe").length;

  return {
    toolInfo,
    rawOutput,
    target,
    ports: normalizedPorts,
    summary: {
      totalPorts: normalizedPorts.length,
      openPorts,
      riskyPorts,
      vulnerabilitiesCount: riskyPorts,
    },
  };
}
