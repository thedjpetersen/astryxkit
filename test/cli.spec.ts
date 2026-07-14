import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli";
import { generate, generatorDefinitions } from "../src/cli/generators";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "ak-cli-"));
});

afterEach(async () => {
  await rm(tempDir, { force: true, recursive: true });
});

describe("ak generators", () => {
  it("lists the Rails-like generators supported by AstryxKit", () => {
    expect(generatorDefinitions.map((generator) => generator.kind)).toEqual([
      "shell",
      "app",
      "command",
      "preference",
      "worker-route",
      "d1-repository",
    ]);
  });

  it("generates a micro-app manifest and activation module", async () => {
    const result = await generate("app", "Customer Ledger", { cwd: tempDir });

    expect(result).toEqual([
      {
        action: "create",
        path: path.join("src", "apps", "customer-ledger", "index.tsx"),
      },
    ]);

    const generated = await readFile(
      path.join(tempDir, "src/apps/customer-ledger/index.tsx"),
      "utf8"
    );

    expect(generated).toContain("customerLedgerManifest");
    expect(generated).toContain('id: "customer-ledger"');
    expect(generated).toContain('route: "/app/customer-ledger"');
    expect(generated).toContain('context.shell.commands.bind("customer-ledger.refresh"');
  });

  it("generates scoped command and preference modules", async () => {
    await generate("command", "catalog.refresh", { cwd: tempDir });
    await generate("preference", "catalog.density", { cwd: tempDir });

    const command = await readFile(
      path.join(tempDir, "src/commands/catalog/refresh.ts"),
      "utf8"
    );
    const preference = await readFile(
      path.join(tempDir, "src/preferences/catalog/density.ts"),
      "utf8"
    );

    expect(command).toContain('id: "catalog.refresh"');
    expect(command).toContain("bindRefreshCommand");
    expect(preference).toContain('key: "catalog.density"');
    expect(preference).toContain("densityPreference");
  });

  it("supports dry runs without writing files", async () => {
    const result = await generate("worker-route", "invoices", {
      cwd: tempDir,
      dryRun: true,
    });

    expect(result).toEqual([
      {
        action: "create",
        path: path.join("src", "worker", "routes", "invoices.ts"),
      },
    ]);

    await expect(
      readFile(path.join(tempDir, "src/worker/routes/invoices.ts"), "utf8")
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("protects existing files unless forced", async () => {
    await generate("d1-repository", "Customer", { cwd: tempDir });

    await expect(
      generate("d1-repository", "Customer", { cwd: tempDir })
    ).rejects.toThrow("already exists");

    const result = await generate("d1-repository", "Customer", {
      cwd: tempDir,
      force: true,
    });

    expect(result[0]?.action).toBe("overwrite");
  });

  it("refuses output paths outside the requested project", async () => {
    await expect(
      generate("command", "catalog.refresh", {
        cwd: tempDir,
        dir: "../outside",
      }),
    ).rejects.toThrow("Refusing to write outside");
  });

  it("runs through the CLI wrapper", async () => {
    let stdout = "";
    let stderr = "";

    const exitCode = await runCli(["g", "shell", "Northstar"], {
      cwd: tempDir,
      stdout: (message) => {
        stdout += message;
      },
      stderr: (message) => {
        stderr += message;
      },
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain(path.join("src", "shell", "northstar.tsx"));
  });
});
