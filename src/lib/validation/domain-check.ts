import { withRetry } from "@/lib/utils/retry";
import type { DomainResult } from "@/lib/types";

const RDAP_BASE_URL = "https://rdap.org/domain";

function sanitizeDomainName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function checkViaRDAP(domain: string): Promise<DomainResult | null> {
  try {
    const response = await fetch(`${RDAP_BASE_URL}/${domain}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) {
      return { available: true, domain, source: "rdap" };
    }

    if (response.status === 200) {
      return { available: false, domain, source: "rdap" };
    }

    return null;
  } catch {
    return null;
  }
}

async function checkViaGoDaddy(domain: string): Promise<DomainResult> {
  if (!process.env.GODADDY_API_KEY || !process.env.GODADDY_API_SECRET) {
    return { available: false, domain, source: "unknown" };
  }

  try {
    const response = await withRetry(async () => {
      const res = await fetch(
        `https://api.godaddy.com/v1/domains/available?domain=${domain}`,
        {
          headers: {
            Authorization: `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_API_SECRET}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!res.ok) {
        const error = new Error(
          `GoDaddy API error: ${res.status}`
        ) as Error & { status: number };
        error.status = res.status;
        throw error;
      }

      return res.json();
    });

    return {
      available: response.available === true,
      domain,
      price: response.price
        ? `$${(response.price / 1_000_000).toFixed(2)}`
        : undefined,
      currency: response.currency,
      source: "godaddy",
    };
  } catch {
    return { available: false, domain, source: "unknown" };
  }
}

async function getDomainPricing(
  domain: string
): Promise<{ price?: string; currency?: string }> {
  if (!process.env.GODADDY_API_KEY || !process.env.GODADDY_API_SECRET) {
    return {};
  }

  try {
    const response = await fetch(
      `https://api.godaddy.com/v1/domains/available?domain=${domain}`,
      {
        headers: {
          Authorization: `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_API_SECRET}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) return {};

    const data = await response.json();
    return {
      price: data.price
        ? `$${(data.price / 1_000_000).toFixed(2)}`
        : undefined,
      currency: data.currency,
    };
  } catch {
    return {};
  }
}

export async function checkDomainAvailability(
  name: string
): Promise<DomainResult> {
  const sanitized = sanitizeDomainName(name);
  const domain = `${sanitized}.com`;

  // Tier 1: RDAP (free, authoritative)
  const rdapResult = await checkViaRDAP(domain);

  if (rdapResult) {
    if (rdapResult.available) {
      // Domain available — try to get pricing from GoDaddy
      const pricing = await getDomainPricing(domain);
      return { ...rdapResult, ...pricing };
    }
    return rdapResult;
  }

  // Tier 2: GoDaddy fallback (includes pricing)
  return await checkViaGoDaddy(domain);
}
