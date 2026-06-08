import { describe, expect, test } from "vitest";

import { getAllowedSignupDomain, isEmailAllowedForSignup, SIGNUP_BLOCKED_MESSAGE } from "../lib/domain";
import { hashInviteToken } from "../lib/invite-token";
import { consumeAuthRate } from "../lib/rate-limit";
import { signupFormSchema } from "../lib/schemas";

describe("Signup domain enforcement", () => {
  test("rejects domains outside the Crimson allowlist", () => {
    expect(isEmailAllowedForSignup("alum@business.com")).toBe(false);
  });

  test("accepts lowercase @crimson.ua.edu identifiers", () => {
    expect(isEmailAllowedForSignup("you@crimson.ua.edu")).toBe(true);
  });

  test("normalizes ALLOWED_SIGNUP_DOMAIN casing via getAllowedSignupDomain()", () => {
    process.env.ALLOWED_SIGNUP_DOMAIN = " CRIMSON.UA.edu ";
    expect(getAllowedSignupDomain()).toBe("crimson.ua.edu");
  });

  test("surfaces the exact executive messaging text for schema violations", async () => {
    process.env.ALLOWED_SIGNUP_DOMAIN = "crimson.ua.edu";
    const parsed = await signupFormSchema.safeParseAsync({
      email: "you@gmail.com",
      password: "longenough!",
      name: "Test User",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const emailErr = parsed.error.flatten().fieldErrors.email?.join(" ") ?? "";
      expect(emailErr).toBe(SIGNUP_BLOCKED_MESSAGE);
    }
  });
});

describe("Invite hashing", () => {
  test("stores invite secrets as sha256 hex digests without embedding obvious raw prefixes", () => {
    const raw =
      "4d6f746f72206379636c696e6720697320696e206d7962204372696d736f6e20686561727420746f6f3a706c656173653a646f6e27742074656c6c2068657220746869732077617320696e76656e746564";
    const hashed = hashInviteToken(raw);
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[a-f0-9]+$/);
    expect(hashed).not.toContain(raw.slice(0, 8));
  });
});

describe("Rate limiting", () => {
  test("blocks more than ten signup attempts inside the fixed window when Upstash isn't configured", async () => {
    const ip = "203.0.113.52";
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      expect(await consumeAuthRate(ip, "signup")).toBe(true);
    }
    expect(await consumeAuthRate(ip, "signup")).toBe(false);
  });

  test("isolates brute-force buckets per flow for the same IP", async () => {
    const ip = "198.51.100.87";
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line no-await-in-loop
      await consumeAuthRate(ip, "signup");
    }
    expect(await consumeAuthRate(ip, "signup")).toBe(false);

    expect(await consumeAuthRate(ip, "signin")).toBe(true);
    expect(await consumeAuthRate(ip, "invite_accept")).toBe(true);
  });
});
