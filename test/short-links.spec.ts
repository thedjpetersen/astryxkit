import { describe, expect, it } from "vitest";
import {
  OPAQUE_CODE_ALPHABET,
  READABLE_CODE_ALPHABET,
  createShortLinkRoute,
  createWorkerRouter,
  generateReadableCode,
  generateShortCode,
} from "../src/worker";

describe("short codes", () => {
  it("generates prefixed codes from the opaque alphabet", () => {
    const code = generateShortCode({ prefix: "D" });

    expect(code).toHaveLength(8);
    expect(code[0]).toBe("D");
    for (const character of code.slice(1)) {
      expect(OPAQUE_CODE_ALPHABET).toContain(character);
    }
  });

  it("generates readable grouped codes", () => {
    const code = generateReadableCode();

    expect(code).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}$/);
    for (const character of code.replace("-", "")) {
      expect(READABLE_CODE_ALPHABET).toContain(character);
    }
  });

  it("rejects unusable alphabets", () => {
    expect(() => generateShortCode({ alphabet: "x" })).toThrow(/alphabet/);
  });
});

describe("createShortLinkRoute", () => {
  const router = createWorkerRouter<{ links: Record<string, string> }>({
    routes: [
      createShortLinkRoute({
        pathPrefix: "/d",
        resolve: (code, { env }) => env.links[code],
      }),
    ],
  });
  const env = { links: { DLNCHBRF: "/app/docs/d/DLNCHBRF" } };
  const ctx = {} as ExecutionContext;

  it("redirects a known code to its app route", async () => {
    const response = await router(
      new Request("https://example.com/d/DLNCHBRF"),
      env,
      ctx,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://example.com/app/docs/d/DLNCHBRF",
    );
  });

  it("404s an unknown code", async () => {
    const response = await router(
      new Request("https://example.com/d/NOPE"),
      env,
      ctx,
    );

    expect(response.status).toBe(404);
  });

  it("only matches the configured prefix and GET method", async () => {
    const wrongPrefix = await router(
      new Request("https://example.com/m/DLNCHBRF"),
      env,
      ctx,
    );
    const wrongMethod = await router(
      new Request("https://example.com/d/DLNCHBRF", { method: "POST" }),
      env,
      ctx,
    );

    expect(wrongPrefix.status).toBe(404);
    expect(wrongMethod.status).toBe(404);
  });
});
