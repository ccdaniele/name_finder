import { withRetry } from "@/lib/utils/retry";
import type { DomainResult, DomainTldResult } from "@/lib/types";

const RDAP_BASE_URL = "https://rdap.org/domain";

function sanitizeDomainName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function checkViaRDAP(domain: string): Promise<{ available: boolean } | null> {
  try {
    const response = await fetch(`${RDAP_BASE_URL}/${domain}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 404) {
      return { available: true };
    }

    if (response.status === 200) {
      return { available: false };
    }

    return null;
  } catch {
    return null;
  }
}

async function checkViaGoDaddy(
  domain: string
): Promise<{ available: boolean; price?: string; currency?: string }> {
  if (!process.env.GODADDY_API_KEY || !process.env.GODADDY_API_SECRET) {
    return { available: false };
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
      price: response.price
        ? `$${(response.price / 1_000_000).toFixed(2)}`
        : undefined,
      currency: response.currency,
    };
  } catch {
    return { available: false };
  }
}

async function checkSingleDomain(
  domain: string,
  tld: string
): Promise<DomainTldResult> {
  // Tier 1: RDAP (free, authoritative)
  const rdapResult = await checkViaRDAP(domain);

  if (rdapResult) {
    if (rdapResult.available) {
      // Domain available — try to get pricing from GoDaddy
      const goDaddyResult = await checkViaGoDaddy(domain);
      return {
        tld,
        domain,
        available: true,
        price: goDaddyResult.price,
        currency: goDaddyResult.currency,
        source: "rdap",
      };
    }
    return { tld, domain, available: false, source: "rdap" };
  }

  // Tier 2: GoDaddy fallback (includes pricing)
  const goDaddyResult = await checkViaGoDaddy(domain);
  return {
    tld,
    domain,
    available: goDaddyResult.available,
    price: goDaddyResult.price,
    currency: goDaddyResult.currency,
    source: goDaddyResult.available || goDaddyResult.price ? "godaddy" : "unknown",
  };
}

export async function checkDomainAvailability(
  name: string,
  tlds: string[] = [".com"]
): Promise<DomainResult> {
  const sanitized = sanitizeDomainName(name);
  const tldResults: DomainTldResult[] = [];

  for (const tld of tlds) {
    const domain = `${sanitized}${tld}`;
    const result = await checkSingleDomain(domain, tld);
    tldResults.push(result);
  }

  // Pass if ANY TLD is available
  const firstAvailable = tldResults.find((r) => r.available);
  const primary = firstAvailable || tldResults[0];

  return {
    available: !!firstAvailable,
    domain: primary.domain,
    price: primary.price,
    currency: primary.currency,
    source: primary.source,
    tldResults: tlds.length > 1 ? tldResults : undefined,
  };
}
