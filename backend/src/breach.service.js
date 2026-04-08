import crypto from "node:crypto";
import { env } from "../config/env.js";

function fallbackBreachData(email) {
  const normalized = email.toLowerCase();
  const domain = normalized.split("@")[1] || "";
  const riskyDomains = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]);
  const digest = crypto.createHash("sha1").update(normalized).digest("hex");
  const score = parseInt(digest.slice(0, 2), 16);

  if (!riskyDomains.has(domain) && score < 170) {
    return {
      provider: "fallback",
      found: false,
      breachCount: 0,
      breaches: [],
    };
  }

  return {
    provider: "fallback",
    found: true,
    breachCount: 2,
    breaches: [
      {
        name: "Credential Exposure Archive",
        domain,
        breachDate: "2024-01-12",
        compromisedData: ["Emails", "Passwords"],
        description: "Credentials were exposed in a third-party archive.",
      },
      {
        name: "Marketing SaaS Breach",
        domain,
        breachDate: "2024-08-20",
        compromisedData: ["Emails", "Names", "IP addresses"],
        description: "A vendor breach exposed subscriber profile data.",
      },
    ],
  };
}

function normalizeExternalBreaches(payload) {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      name: item.Name || item.name || "Unknown breach",
      domain: item.Domain || item.domain || "",
      breachDate: item.BreachDate || item.breachDate || "",
      compromisedData: item.DataClasses || item.compromisedData || [],
      description: item.Description || item.description || "",
    }));
  }

  if (Array.isArray(payload?.breaches)) {
    return normalizeExternalBreaches(payload.breaches);
  }

  return [];
}

export async function checkEmailBreach(email) {
  if (!env.breachApiUrl) {
    return fallbackBreachData(email);
  }

  try {
    const url = new URL(env.breachApiUrl);
    url.searchParams.set("email", email);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(env.breachApiKey ? { Authorization: `Bearer ${env.breachApiKey}` } : {}),
      },
      signal: AbortSignal.timeout(env.breachApiTimeoutMs),
    });

    if (!response.ok) {
      return fallbackBreachData(email);
    }

    const payload = await response.json();
    const breaches = normalizeExternalBreaches(payload);

    return {
      provider: "external",
      found: breaches.length > 0,
      breachCount: breaches.length,
      breaches,
    };
  } catch {
    return fallbackBreachData(email);
  }
}
