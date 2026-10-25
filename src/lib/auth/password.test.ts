import { describe, expect, it } from "vitest";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the correct password and rejects others", async () => {
    const hash = await hashPassword("ein-sicheres-Passwort");
    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(await verifyPassword("ein-sicheres-Passwort", hash)).toBe(true);
    expect(await verifyPassword("ein-sicheres-passwort", hash)).toBe(false);
  });

  it("uses a random salt", async () => {
    expect(await hashPassword("gleich")).not.toBe(await hashPassword("gleich"));
  });

  it("rejects malformed hashes instead of throwing", async () => {
    expect(await verifyPassword("x", "plaintext")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
  });

  it("has a dummy hash that never matches", async () => {
    expect(await verifyPassword("", DUMMY_HASH)).toBe(false);
  });
});
