import { describe, expect, it } from "vitest";
import {
  authorize,
  can,
  computeEffectivePermissions,
  defineAccessControl,
  isPermission,
  listPermissionGroups,
  listPermissions,
  partitionPermissionGrants,
  roleAtLeast,
} from "../src/core";
import {
  buildRateLimitTableSql,
  constantTimeEqual,
  createCapabilityGuard,
  createD1RateLimiter,
  generateCsrfToken,
  issueCsrfCookie,
  requireCapability,
  verifyCsrf,
} from "../src/worker";

const model = defineAccessControl({
  groups: [
    { id: "items", label: "Items", permissions: ["item:create", "item:edit"] },
  ],
  ownerRole: "owner",
  permissionMeta: {
    "item:create": { label: "Create items" },
  },
  permissions: ["item:create", "item:edit", "member:grant", "audit:read"],
  roles: {
    member: ["item:create", "item:edit"],
    admin: ["item:create", "item:edit", "member:grant"],
    owner: ["item:create", "item:edit", "member:grant", "audit:read"],
  },
});

describe("defineAccessControl", () => {
  it("rejects roles referencing unknown permissions", () => {
    expect(() =>
      defineAccessControl({
        permissions: ["item:create"],
        roles: { member: ["item:delete"] },
      })
    ).toThrowError(/unknown permission/);
  });

  it("rejects duplicate permissions and unknown owner roles", () => {
    expect(() =>
      defineAccessControl({
        permissions: ["item:create", "item:create"],
        roles: {},
      })
    ).toThrowError(/Duplicate/);
    expect(() =>
      defineAccessControl({
        ownerRole: "owner",
        permissions: ["item:create"],
        roles: { member: [] },
      })
    ).toThrowError(/ownerRole/);
  });

  it("lists permissions and appends an Other group for ungrouped ones", () => {
    expect(listPermissions(model)).toEqual([
      "item:create",
      "item:edit",
      "member:grant",
      "audit:read",
    ]);

    const groups = listPermissionGroups(model);

    expect(groups.map((group) => group.id)).toEqual(["items", "other"]);
    expect(groups[1].permissions).toEqual(["member:grant", "audit:read"]);
  });

  it("checks permission membership and role rank", () => {
    expect(isPermission(model, "item:create")).toBe(true);
    expect(isPermission(model, "item:destroy")).toBe(false);
    expect(roleAtLeast(model, "owner", "admin")).toBe(true);
    expect(roleAtLeast(model, "member", "admin")).toBe(false);
    expect(roleAtLeast(model, "intruder", "member")).toBe(false);
    expect(roleAtLeast(model, "member", "intruder")).toBe(false);
  });
});

describe("computeEffectivePermissions", () => {
  it("starts from the role set", () => {
    const effective = computeEffectivePermissions(model, { role: "member" });

    expect(effective).toEqual(new Set(["item:create", "item:edit"]));
  });

  it("adds grants and ignores unknown permissions", () => {
    const effective = computeEffectivePermissions(model, {
      grants: ["member:grant", "item:destroy"],
      role: "member",
    });

    expect(effective.has("member:grant")).toBe(true);
    expect(effective.has("item:destroy")).toBe(false);
  });

  it("lets denies override both role and grants", () => {
    const effective = computeEffectivePermissions(model, {
      denies: ["item:edit", "member:grant"],
      grants: ["member:grant"],
      role: "admin",
    });

    expect(effective.has("item:edit")).toBe(false);
    expect(effective.has("member:grant")).toBe(false);
    expect(effective.has("item:create")).toBe(true);
  });

  it("resolves unknown roles to the empty set", () => {
    expect(computeEffectivePermissions(model, { role: "intruder" }).size).toBe(
      0
    );
  });

  it("partitions stored grant rows with denies winning downstream", () => {
    const { denies, grants } = partitionPermissionGrants([
      { effect: "grant", permission: "member:grant" },
      { effect: "deny", permission: "item:edit" },
    ]);

    expect(grants).toEqual(["member:grant"]);
    expect(denies).toEqual(["item:edit"]);
  });
});

describe("authorize", () => {
  const effective = new Set(["item:edit", "member:grant"]);

  it("denies by default", () => {
    expect(authorize(effective, "audit:read").allowed).toBe(false);
    expect(authorize(effective, "").allowed).toBe(false);
    expect(authorize(new Set<string>(), "item:edit").allowed).toBe(false);
    expect(can(effective, "item:edit")).toBe(true);
    expect(can(effective, "audit:read")).toBe(false);
  });

  it("requires ownership for self-scoped permissions", () => {
    const opts = { selfPermissions: ["item:edit"] };

    expect(
      authorize(effective, "item:edit", {
        ...opts,
        actingUserId: "u1",
        resourceOwnerId: "u1",
      }).allowed
    ).toBe(true);
    expect(
      authorize(effective, "item:edit", {
        ...opts,
        actingUserId: "u1",
        resourceOwnerId: "u2",
      }).allowed
    ).toBe(false);
    expect(
      authorize(effective, "item:edit", { ...opts, actingUserId: "u1" })
        .allowed
    ).toBe(false);
    expect(authorize(effective, "item:edit", opts).allowed).toBe(false);
  });

  it("leaves non-self permissions unaffected by ownership options", () => {
    expect(
      authorize(effective, "member:grant", {
        actingUserId: "u1",
        resourceOwnerId: "u2",
        selfPermissions: ["item:edit"],
      }).allowed
    ).toBe(true);
  });
});

describe("capability guard", () => {
  it("returns 403 with a reason when the capability is missing", async () => {
    const denied = requireCapability({
      effective: new Set(["item:edit"]),
      permission: "member:grant",
    });

    expect(denied?.status).toBe(403);
    await expect(denied?.json()).resolves.toMatchObject({
      error: "Forbidden",
      permission: "member:grant",
    });
    expect(
      requireCapability({
        effective: new Set(["member:grant"]),
        permission: "member:grant",
      })
    ).toBeNull();
  });

  it("distinguishes 401 from 403", async () => {
    const guard = createCapabilityGuard((request) =>
      request.headers.get("Cookie") === "session=ok"
        ? new Set(["item:edit"])
        : null
    );

    const anonymous = await guard(
      new Request("https://example.com"),
      "item:edit"
    );
    const forbidden = await guard(
      new Request("https://example.com", {
        headers: { Cookie: "session=ok" },
      }),
      "member:grant"
    );
    const allowed = await guard(
      new Request("https://example.com", {
        headers: { Cookie: "session=ok" },
      }),
      "item:edit"
    );

    expect(anonymous?.status).toBe(401);
    expect(forbidden?.status).toBe(403);
    expect(allowed).toBeNull();
  });
});

describe("csrf", () => {
  it("issues a readable cookie for a generated token", () => {
    const token = generateCsrfToken();
    const cookie = issueCsrfCookie({ token });

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(cookie).toContain(`csrf_token=${token}`);
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
    expect(cookie).not.toContain("HttpOnly");
  });

  it("verifies only a matching cookie/header pair", () => {
    const token = generateCsrfToken();
    const request = (cookie: string | null, header: string | null) =>
      new Request("https://example.com", {
        headers: {
          ...(cookie === null ? {} : { Cookie: cookie }),
          ...(header === null ? {} : { "x-csrf-token": header }),
        },
        method: "POST",
      });

    expect(verifyCsrf(request(`csrf_token=${token}`, token))).toBe(true);
    expect(
      verifyCsrf(request(`other=1; csrf_token=${token}; more=2`, token))
    ).toBe(true);
    expect(
      verifyCsrf(request(`csrf_token=${token}`, generateCsrfToken()))
    ).toBe(false);
    expect(verifyCsrf(request(`csrf_token=${token}`, null))).toBe(false);
    expect(verifyCsrf(request(null, token))).toBe(false);
    expect(verifyCsrf(request("csrf_token=", ""))).toBe(false);
  });

  it("compares strings in constant time semantics", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
    expect(constantTimeEqual("", "")).toBe(true);
  });
});

describe("d1 rate limiter", () => {
  it("emits consumer-side DDL and rejects unsafe table names", () => {
    expect(buildRateLimitTableSql("auth_rate_limits")).toContain(
      "auth_rate_limits"
    );
    expect(() => buildRateLimitTableSql("rate; DROP TABLE users")).toThrow();
    expect(() =>
      createD1RateLimiter({ db: fakeRateLimitD1(), table: "bad-name" })
    ).toThrow();
  });

  it("limits within a fixed window and resets in the next one", async () => {
    const limiter = createD1RateLimiter({
      db: fakeRateLimitD1(),
      defaults: { limit: 2, windowSeconds: 60 },
    });
    const start = 1_000_000_000_000;

    expect(await limiter.check("ip:1", { now: start })).toEqual({
      allowed: true,
      retryAfter: 0,
    });
    expect((await limiter.check("ip:1", { now: start + 1000 })).allowed).toBe(
      true
    );

    const blocked = await limiter.check("ip:1", { now: start + 2000 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);

    // Separate keys do not share a bucket.
    expect((await limiter.check("ip:2", { now: start + 2000 })).allowed).toBe(
      true
    );

    // The next window starts clean.
    expect(
      (await limiter.check("ip:1", { now: start + 61_000 })).allowed
    ).toBe(true);
  });

  it("bypasses when the key is empty", async () => {
    const limiter = createD1RateLimiter({
      db: fakeRateLimitD1(),
      defaults: { limit: 1, windowSeconds: 60 },
    });

    expect(await limiter.check("")).toEqual({ allowed: true, retryAfter: 0 });
    expect(await limiter.check("")).toEqual({ allowed: true, retryAfter: 0 });
  });
});

// In-memory stand-in for the limiter's single upsert statement, mirroring
// SQLite semantics: same window increments, a new window resets to 1.
function fakeRateLimitD1(): D1Database {
  const rows = new Map<string, { count: number; windowStart: number }>();

  return {
    prepare(sql: string) {
      if (!sql.includes("ON CONFLICT(key)")) {
        throw new Error(`Unexpected statement: ${sql}`);
      }

      return {
        bind(key: string, windowStart: number) {
          return {
            async first() {
              const row = rows.get(key);
              const next =
                row && row.windowStart === windowStart
                  ? { count: row.count + 1, windowStart }
                  : { count: 1, windowStart };

              rows.set(key, next);

              return { count: next.count };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}
