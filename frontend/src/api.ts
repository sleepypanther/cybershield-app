import { fetchWithDesktopRetry, getApiBase } from "../lib/runtime";

const API_BASE = getApiBase();

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  success?: boolean;
};

export type PortStatus = "open" | "closed" | "filtered";
export type PortRiskLevel = "safe" | "warning" | "danger";
export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low";

export interface ScanPort {
  port: number;
  protocol: string;
  status: PortStatus;
  service: string;
  product: string;
  risk: string;
  riskLevel: PortRiskLevel;
  name: string;
  description: string;
  recommendation: string;
  fixSteps: string[];
}

export interface ScanResult {
  id: string;
  target: string;
  requestedPorts: string;
  createdAt: string;
  threats: number;
  filesScanned: number;
  details: string[];
  summary: {
    totalPorts: number;
    openPorts: number;
    riskyPorts: number;
    vulnerabilitiesCount: number;
  };
  ports: ScanPort[];
}

export interface VulnerabilityRecord {
  id: string;
  name: string;
  severity: VulnerabilitySeverity;
  category: string;
  cause: string;
  impact: string;
  howToFix: string[];
  source: string;
}

export interface DashboardSummary {
  totals: {
    totalScans: number;
    vulnerabilitiesCount: number;
    threatsFound: number;
    breachChecks: number;
    exposedEmails: number;
    fileAnalyses: number;
    riskyFiles: number;
    openPorts: number;
  };
  latestScan: {
    _id?: string;
    createdAt?: string;
  } | null;
  ui: {
    breaches: number;
    openPorts: number;
    vulnerabilities: number;
    deviceHealth: number;
    threatsFound: number;
    cpuUsage: number;
    ramUsage: number;
    networkMbps: number;
    lastScan: string;
    totalRisk: number;
    pulseState: "normal" | "warning" | "critical";
    pulseColor: string;
    barValues: number[];
    lineValues: number[];
    donutValues: Array<{ label: string; value: number; color: string }>;
  };
  tools?: {
    nmap?: {
      available?: boolean;
      name?: string;
      version?: string;
    };
  };
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithDesktopRetry(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  let payload: ApiEnvelope<T> | T | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as ApiEnvelope<T> | null)?.message || response.statusText || "Request failed";
    throw new ApiError(message, response.status);
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

function toArray<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

function toStringList(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function normalizePortStatus(value: unknown): PortStatus {
  const status = String(value || "").toLowerCase();
  if (status === "filtered") {
    return "filtered";
  }
  if (status === "closed") {
    return "closed";
  }
  return "open";
}

function normalizePortRisk(value: unknown): { raw: string; riskLevel: PortRiskLevel } {
  const raw = String(value || "safe").toLowerCase();

  if (raw === "critical" || raw === "high" || raw === "danger") {
    return { raw, riskLevel: "danger" };
  }

  if (raw === "medium" || raw === "warning") {
    return { raw, riskLevel: "warning" };
  }

  return { raw, riskLevel: "safe" };
}

function buildPortRecommendation(port: { status: PortStatus; riskLevel: PortRiskLevel; service: string; port: number }): string {
  if (port.status !== "open") {
    return `Port ${port.port} is not exposed right now. Keep monitoring it for unexpected changes.`;
  }

  if (port.riskLevel === "danger") {
    return `Restrict public access to the ${port.service} service or close port ${port.port} if it is not required.`;
  }

  if (port.riskLevel === "warning") {
    return `Verify that ${port.service} on port ${port.port} is expected and protected by firewall rules.`;
  }

  return `Keep ${port.service} on port ${port.port} patched and limit access to trusted hosts only.`;
}

function buildPortFixSteps(port: { status: PortStatus; riskLevel: PortRiskLevel; service: string; port: number }): string[] {
  if (port.status !== "open") {
    return [
      `Confirm that port ${port.port} should remain ${port.status}.`,
      "Review firewall rules to make sure the current state is intentional.",
      "Keep the service inventory updated so future changes are easy to spot.",
    ];
  }

  const common = [
    `Confirm that ${port.service} on port ${port.port} is an expected service.`,
    "Limit inbound access to trusted IPs with firewall rules.",
    "Patch or disable the backing service if it is no longer needed.",
  ];

  if (port.riskLevel === "danger") {
    return [
      common[0],
      `Close port ${port.port} or move ${port.service} behind a VPN or internal network.`,
      "Audit service credentials and logs for any unauthorized access attempts.",
    ];
  }

  return common;
}

function normalizePort(item: unknown): ScanPort {
  const source = (item || {}) as Record<string, unknown>;
  const port = Number(source.port || source.portNumber || 0);
  const protocol = String(source.protocol || "tcp");
  const status = normalizePortStatus(source.status || source.state);
  const service = String(source.service || source.name || "unknown");
  const product = String(source.product || source.version || "");
  const { raw, riskLevel } = normalizePortRisk(source.risk || source.severity);
  const descriptionParts = [protocol.toUpperCase(), service];

  if (product) {
    descriptionParts.push(product);
  }

  return {
    port,
    protocol,
    status,
    service,
    product,
    risk: raw,
    riskLevel,
    name: service.toUpperCase(),
    description: descriptionParts.join(" · "),
    recommendation: buildPortRecommendation({ status, riskLevel, service, port }),
    fixSteps: buildPortFixSteps({ status, riskLevel, service, port }),
  };
}

function severityFromPortRisk(risk: string): VulnerabilitySeverity {
  if (risk === "critical" || risk === "high" || risk === "danger") {
    return "critical";
  }
  if (risk === "medium" || risk === "warning") {
    return "high";
  }
  if (risk === "low") {
    return "medium";
  }
  return "low";
}

function normalizeSeverity(value: unknown): VulnerabilitySeverity {
  const severity = String(value || "low").toLowerCase();
  if (severity === "critical") {
    return "critical";
  }
  if (severity === "high") {
    return "high";
  }
  if (severity === "medium") {
    return "medium";
  }
  return "low";
}

function buildScanDetails(target: string, ports: ScanPort[], summary: ScanResult["summary"]): string[] {
  const details: string[] = [];
  const riskyPorts = ports.filter((port) => port.status === "open" && port.riskLevel !== "safe");

  details.push(`Target scanned: ${target}`);
  details.push(`${summary.openPorts} open ports detected across ${summary.totalPorts} checked ports.`);

  if (riskyPorts.length > 0) {
    riskyPorts.slice(0, 3).forEach((port) => {
      details.push(`Port ${port.port} (${port.service}) is exposed with ${port.risk} risk.`);
    });
  } else {
    details.push("No risky open ports were reported by the scan.");
  }

  return details;
}

function normalizeScanResult(payload: unknown): ScanResult {
  const source = (payload || {}) as Record<string, unknown>;
  const rawSummary = (source.summary || {}) as Record<string, unknown>;
  const ports = toArray<unknown>(source.ports, ["items"]).map(normalizePort);
  const summary = {
    totalPorts: Number(rawSummary.totalPorts || ports.length || 0),
    openPorts: Number(
      rawSummary.openPorts || ports.filter((port) => port.status === "open").length || 0
    ),
    riskyPorts: Number(
      rawSummary.riskyPorts ||
        ports.filter((port) => port.status === "open" && port.riskLevel !== "safe").length ||
        0
    ),
    vulnerabilitiesCount: Number(
      rawSummary.vulnerabilitiesCount ||
        ports.filter((port) => port.status === "open" && port.riskLevel !== "safe").length ||
        0
    ),
  };
  const target = String(source.target || "Unknown target");

  return {
    id: String(source.scanId || source.id || source._id || `${target}-${source.createdAt || Date.now()}`),
    target,
    requestedPorts: String(source.requestedPorts || ""),
    createdAt: String(source.createdAt || new Date().toISOString()),
    threats: summary.riskyPorts,
    filesScanned: summary.totalPorts,
    details: buildScanDetails(target, ports, summary),
    summary,
    ports,
  };
}

function normalizeVulnerability(item: unknown): VulnerabilityRecord {
  const source = (item || {}) as Record<string, unknown>;
  const name =
    String(source.name || source.title || source.vulnerability || "").trim() || "Unnamed vulnerability";
  const howToFix = toStringList(
    source.howToFix || source.fixSteps || source.remediation || source.recommendation,
    ["Review the affected service configuration.", "Patch or disable the exposed service."]
  );

  return {
    id: String(source.id || source._id || source.cve || source.port || name),
    name,
    severity: normalizeSeverity(source.severity || source.risk),
    category: String(source.category || source.type || source.service || "Security finding"),
    cause: String(
      source.cause || source.description || source.summary || `${name} was reported by the backend API.`
    ),
    impact: String(
      source.impact ||
        source.effect ||
        "This issue may increase the attack surface if it remains unresolved."
    ),
    howToFix,
    source: String(source.source || "api"),
  };
}

function deriveVulnerabilitiesFromPorts(ports: ScanPort[]): VulnerabilityRecord[] {
  return ports
    .filter((port) => port.status === "open" && port.riskLevel !== "safe")
    .map((port) => ({
      id: `port-${port.port}`,
      name: `Exposed ${port.service} service on port ${port.port}`,
      severity: severityFromPortRisk(port.risk),
      category: "Network Exposure",
      cause: `${port.service} is reachable on port ${port.port} over ${port.protocol.toUpperCase()}.`,
      impact: `Attackers can probe or abuse the exposed ${port.service} service if access is not restricted.`,
      howToFix: port.fixSteps,
      source: "scan",
    }));
}

async function getLatestScanResult(): Promise<ScanResult | null> {
  const scans = await request<unknown[]>("/scan?limit=1");
  const latest = Array.isArray(scans) ? scans[0] : null;

  return latest ? normalizeScanResult(latest) : null;
}

export async function runScan(target: string) {
  const result = await request<unknown>("/scan", {
    method: "POST",
    body: JSON.stringify(target ? { target } : {}),
  });
  const scan = normalizeScanResult(result);
  const vulnerabilities = deriveVulnerabilitiesFromPorts(scan.ports);

  return {
    scan,
    ports: scan.ports,
    vulnerabilities,
  };
}

export async function getPorts() {
  try {
    const payload = await request<unknown>("/ports");
    const items = toArray<unknown>(payload, ["ports", "items", "results"]);
    if (items.length > 0) {
      return items.map(normalizePort);
    }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
  }

  const latestScan = await getLatestScanResult();
  return latestScan?.ports || [];
}

export async function getVulnerabilities() {
  try {
    const payload = await request<unknown>("/vulnerabilities");
    const items = toArray<unknown>(payload, ["vulnerabilities", "items", "results"]);
    if (items.length > 0) {
      return items.map(normalizeVulnerability);
    }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
  }

  const ports = await getPorts();
  return deriveVulnerabilitiesFromPorts(ports);
}

export async function getDashboardSummary() {
  return request<DashboardSummary>("/dashboard");
}
