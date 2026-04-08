import os from "node:os";
import { BreachCheck } from "../models/breach-check.model.js";
import { FileAnalysis } from "../models/file-analysis.model.js";
import { Scan } from "../models/scan.model.js";

function makeTrend(values, size, fallback) {
  if (values.length === 0) {
    return fallback;
  }

  const trimmed = values.slice(-size);
  while (trimmed.length < size) {
    trimmed.unshift(trimmed[0]);
  }
  return trimmed;
}

export async function buildDashboard(userId) {
  const [scans, breaches, fileAnalyses] = await Promise.all([
    Scan.find({ userId }).sort({ createdAt: -1 }).lean(),
    BreachCheck.find({ userId }).sort({ createdAt: -1 }).lean(),
    FileAnalysis.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const totalScans = scans.length;
  const lastScan = scans[0] || null;
  const vulnerabilitiesCount = lastScan?.summary?.vulnerabilitiesCount || 0;
  const threatsFound = scans.reduce(
    (sum, scan) => sum + (scan.summary?.riskyPorts || 0),
    0
  );
  const openPorts = lastScan?.summary?.openPorts || 0;
  const breachCount = breaches.reduce((sum, item) => sum + (item.breachCount || 0), 0);
  const riskyFiles = fileAnalyses.filter((item) => item.riskLevel === "high" || item.riskLevel === "medium").length;

  const deviceHealth = Math.max(
    20,
    100 - vulnerabilitiesCount * 6 - breachCount * 8 - riskyFiles * 5
  );
  const cpuUsage = Math.min(
    100,
    Math.round(((os.loadavg()[0] || 0) / Math.max(os.cpus().length, 1)) * 100)
  );
  const ramUsage = Math.round(
    ((os.totalmem() - os.freemem()) / Math.max(os.totalmem(), 1)) * 100
  );
  const activeInterfaces = Object.values(os.networkInterfaces()).filter(Boolean).length;
  const networkMbps = Math.max(25, activeInterfaces * 40);
  const totalRisk = vulnerabilitiesCount + breachCount * 4 + riskyFiles * 2;
  const pulseState = totalRisk >= 20 ? "critical" : totalRisk >= 10 ? "warning" : "normal";
  const pulseColor =
    pulseState === "critical" ? "#e85545" : pulseState === "warning" ? "#e8a035" : "#3bc97a";

  return {
    totals: {
      totalScans,
      vulnerabilitiesCount,
      threatsFound,
      breachChecks: breaches.length,
      exposedEmails: breaches.filter((item) => item.found).length,
      fileAnalyses: fileAnalyses.length,
      riskyFiles,
      openPorts,
    },
    latestScan: lastScan,
    ui: {
      breaches: breachCount,
      openPorts,
      vulnerabilities: vulnerabilitiesCount,
      deviceHealth,
      threatsFound,
      cpuUsage,
      ramUsage,
      networkMbps,
      lastScan: lastScan ? new Date(lastScan.createdAt).toISOString() : "Never",
      totalRisk,
      pulseState,
      pulseColor,
      barValues: makeTrend(
        scans.map((scan) => Math.min(100, (scan.summary?.openPorts || 0) * 10)),
        6,
        [22, 30, 28, 35, 26, 24]
      ),
      lineValues: makeTrend(
        scans.map((scan) => Math.min(100, (scan.summary?.riskyPorts || 0) * 18)),
        7,
        [12, 18, 22, 15, 20, 24, 16]
      ),
      donutValues: [
        { label: "Secure", value: Math.max(0, 100 - totalRisk), color: "#3bc97a" },
        { label: "Warnings", value: Math.min(35, vulnerabilitiesCount * 4 + riskyFiles * 3), color: "#e8a035" },
        { label: "Critical", value: Math.min(45, breachCount * 10 + threatsFound * 4), color: "#e85545" },
      ],
    },
  };
}
