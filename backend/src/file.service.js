import crypto from "node:crypto";

const RISKY_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".scr",
  ".dll",
  ".js",
  ".jar",
  ".apk",
  ".ps1",
  ".vbs",
]);

const SUSPICIOUS_KEYWORDS = [
  "password",
  "keylogger",
  "token",
  "wallet",
  "exploit",
  "payload",
  "eval(",
  "powershell",
  "base64",
];

export function analyzeFile(file) {
  const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");
  const fileName = file.originalname;
  const lowerName = fileName.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.slice(lowerName.lastIndexOf(".")) : "";
  const text = file.buffer.toString("utf8", 0, Math.min(file.size, 16000)).toLowerCase();
  const indicators = [];
  let score = 0;

  if (RISKY_EXTENSIONS.has(extension)) {
    indicators.push(`Risky executable extension detected: ${extension}`);
    score += 35;
  }

  if (!file.mimetype || file.mimetype === "application/octet-stream") {
    indicators.push("Unknown or generic MIME type");
    score += 15;
  }

  if (file.size > 25 * 1024 * 1024) {
    indicators.push("Large file size may require manual review");
    score += 10;
  }

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (text.includes(keyword)) {
      indicators.push(`Suspicious content keyword found: ${keyword}`);
      score += 12;
    }
  }

  if (lowerName.includes("patch") || lowerName.includes("crack") || lowerName.includes("keygen")) {
    indicators.push("Filename suggests unauthorized patching or cracking");
    score += 20;
  }

  let riskLevel = "safe";
  if (score >= 60) riskLevel = "high";
  else if (score >= 35) riskLevel = "medium";
  else if (score >= 15) riskLevel = "low";

  if (indicators.length === 0) {
    indicators.push("No obvious malicious indicators were found.");
  }

  return {
    fileName,
    mimeType: file.mimetype || "application/octet-stream",
    size: file.size,
    sha256,
    score,
    riskLevel,
    indicators,
    recommendation:
      riskLevel === "high"
        ? "Quarantine immediately and perform manual investigation."
        : riskLevel === "medium"
          ? "Review before opening on a trusted endpoint."
          : riskLevel === "low"
            ? "Open with caution and keep monitoring."
            : "File appears safe based on basic checks.",
  };
}
