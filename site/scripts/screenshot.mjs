import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const screenshotPath = path.join(
  repoRoot,
  "docs",
  "assets",
  "astryxkit-docs-home.png"
);
const previewUrl = "http://127.0.0.1:4174/astryxkit/";

await run("npm", ["run", "docs:build"]);
await mkdir(path.dirname(screenshotPath), { recursive: true });

const preview = spawn(
  "npx",
  [
    "vite",
    "preview",
    "--config",
    "site/vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "4174",
  ],
  {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  }
);

let previewOutput = "";

preview.stdout.on("data", (chunk) => {
  previewOutput += chunk.toString();
});

preview.stderr.on("data", (chunk) => {
  previewOutput += chunk.toString();
});

let browser;

try {
  await waitForServer(previewUrl);

  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });

  await page.goto(previewUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved ${path.relative(repoRoot, screenshotPath)}`);
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function waitForServer(url) {
  const startedAt = Date.now();
  const timeoutMs = 20_000;

  while (Date.now() - startedAt < timeoutMs) {
    if (preview.exitCode != null) {
      throw new Error(`Vite preview exited early:\n${previewOutput}`);
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`Timed out waiting for ${url}:\n${previewOutput}`);
}
