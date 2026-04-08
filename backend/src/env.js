import dotenv from "dotenv";

dotenv.config();

const splitList = (value, fallback) =>
  (value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cybershield",
  clientOrigins: splitList(
    process.env.CLIENT_ORIGINS,
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://tauri.localhost,https://tauri.localhost,tauri://localhost"
  ),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nmapDefaultTarget: process.env.NMAP_DEFAULT_TARGET || "127.0.0.1",
  nmapDefaultPorts: process.env.NMAP_DEFAULT_PORTS || "1-1024",
  breachApiUrl: process.env.BREACH_API_URL || "",
  breachApiKey: process.env.BREACH_API_KEY || "",
  breachApiTimeoutMs: Number(process.env.BREACH_API_TIMEOUT_MS || 5000),
};
