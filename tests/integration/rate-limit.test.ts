import { describe, expect, it } from "vitest";
import {
  clearRateLimit,
  hashIdentifier,
  isRateLimited,
  recordRateLimitEvent,
} from "@/lib/security/rate-limit";

const rule = { limit: 3, windowMs: 60_000 };

describe("rate limiting", () => {
  it("blocks after the limit and can be cleared", async () => {
    const key = `test:${hashIdentifier("203.0.113.7")}`;
    for (let i = 0; i < 3; i++) {
      expect(await isRateLimited(key, rule)).toBe(false);
      await recordRateLimitEvent(key);
    }
    expect(await isRateLimited(key, rule)).toBe(true);
    expect(await isRateLimited("test:other", rule)).toBe(false);

    await clearRateLimit(key);
    expect(await isRateLimited(key, rule)).toBe(false);
  });

  it("pseudonymises identifiers", () => {
    const hashed = hashIdentifier("203.0.113.7");
    expect(hashed).toMatch(/^[0-9a-f]{32}$/);
    expect(hashed).not.toContain("203");
    expect(hashIdentifier("203.0.113.7")).toBe(hashed);
  });
});
