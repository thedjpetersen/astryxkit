import { describe, expect, it } from "vitest";
import {
  createWorkerRouter,
  getText,
  jsonError,
  readJsonObject,
  redirectToApex,
} from "../src/worker";

describe("worker helpers", () => {
  it("creates JSON errors", async () => {
    const response = jsonError("Nope", 422, { code: "invalid" });

    expect(response.status).toBe(422);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      code: "invalid",
      error: "Nope",
    });
  });

  it("reads JSON objects defensively", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ name: "  Northstar  " }),
    });
    const body = await readJsonObject(request);

    expect(getText(body, "name")).toBe("Northstar");
  });

  it("matches exact and regex routes", async () => {
    const router = createWorkerRouter({
      health: { name: "example" },
      routes: [
        {
          method: "GET",
          pathname: /^\/api\/items\/(?<id>[^/]+)$/,
          handle: ({ params }) =>
            Response.json({
              id: params.id,
            }),
        },
      ],
    });

    await expect(
      (await router(new Request("https://example.com/api/health"), {}, testCtx())).json()
    ).resolves.toMatchObject({
      name: "example",
      status: "ok",
    });
    await expect(
      (await router(new Request("https://example.com/api/items/42"), {}, testCtx())).json()
    ).resolves.toEqual({
      id: "42",
    });
  });

  it("redirects www hosts to the apex host", () => {
    const response = redirectToApex({
      apexHost: "example.com",
      request: new Request("https://www.example.com/app?x=1"),
    });

    expect(response?.status).toBe(301);
    expect(response?.headers.get("Location")).toBe("https://example.com/app?x=1");
  });
});

function testCtx(): ExecutionContext {
  return {
    passThroughOnException() {},
    waitUntil() {},
  } as unknown as ExecutionContext;
}
