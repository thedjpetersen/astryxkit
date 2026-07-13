import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const viteBin = fileURLToPath(
  new URL("../../node_modules/vite/bin/vite.js", import.meta.url),
);
const previewUrl = "http://127.0.0.1:4175/astryxkit/";
const routes = ["overview", "quickstart", "runtime", "build", "reference", "source"];
const colorSchemes = ["light", "dark"];

const preview = spawn(
  process.execPath,
  [
    viteBin,
    "preview",
    "--config",
    "site/vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "4175",
  ],
  {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  },
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

  const failures = [];

  for (const colorScheme of colorSchemes) {
    const page = await browser.newPage({
      colorScheme,
      viewport: { width: 1440, height: 1100 },
    });

    for (const route of routes) {
      const routeStartedAt = Date.now();

      await page.goto(`${previewUrl}#/${route}`, {
        waitUntil: "domcontentloaded",
      });
      await page.evaluate(
        () =>
          new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          }),
      );
      failures.push(
        ...(await page.evaluate(auditContrast)).map((failure) => ({
          ...failure,
          colorScheme,
          route,
        })),
      );
      console.log(
        `Checked ${colorScheme}/${route} in ${Date.now() - routeStartedAt}ms.`,
      );
    }

    await page.close();
  }

  if (failures.length > 0) {
    console.error("Docs contrast check failed:");

    for (const failure of failures.slice(0, 40)) {
      console.error(
        `- ${failure.colorScheme}/${failure.route}: ${failure.ratio}:1 ` +
          `(minimum ${failure.minimum}:1) for “${failure.text}” ` +
          `[${failure.foreground} on ${failure.background}]`,
      );
    }

    if (failures.length > 40) {
      console.error(`- …and ${failures.length - 40} more failures`);
    }

    process.exitCode = 1;
  } else {
    console.log("Docs contrast check passed in light and dark mode.");
  }
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}

function auditContrast() {
  const parseColor = (value) => {
    const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
    return [
      channels[0] ?? 0,
      channels[1] ?? 0,
      channels[2] ?? 0,
      channels[3] ?? 1,
    ];
  };

  const composite = (foreground, background) => {
    const alpha = foreground[3];

    return [
      foreground[0] * alpha + background[0] * (1 - alpha),
      foreground[1] * alpha + background[1] * (1 - alpha),
      foreground[2] * alpha + background[2] * (1 - alpha),
      1,
    ];
  };

  const styleCache = new WeakMap();
  const styleFor = (element) => {
    const cached = styleCache.get(element);

    if (cached) {
      return cached;
    }

    const style = getComputedStyle(element);
    styleCache.set(element, style);
    return style;
  };

  const backgroundCache = new WeakMap();

  const effectiveBackground = (element) => {
    const cached = backgroundCache.get(element);

    if (cached) {
      return cached;
    }

    const parentBackground = element.parentElement
      ? effectiveBackground(element.parentElement)
      : [255, 255, 255, 1];
    const background = composite(
      parseColor(styleFor(element).backgroundColor),
      parentBackground,
    );

    backgroundCache.set(element, background);
    return background;
  };

  const luminance = (color) => {
    const [red, green, blue] = color.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const contrast = (foreground, background) => {
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);

    return (
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    );
  };

  const formatColor = (color) =>
    `rgb(${color.slice(0, 3).map(Math.round).join(", ")})`;

  return Array.from(document.querySelectorAll("body *"))
    .filter((element) => {
      const style = styleFor(element);
      const hasDirectText = Array.from(element.childNodes).some(
        (node) =>
          node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
      );

      return (
        hasDirectText &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        !element.closest("[disabled], [aria-disabled='true']")
      );
    })
    .map((element) => {
      const style = styleFor(element);
      const background = effectiveBackground(element);
      const foreground = composite(parseColor(style.color), background);
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
      const isLargeText =
        fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const minimum = isLargeText ? 3 : 4.5;
      const ratio = contrast(foreground, background);

      return {
        background: formatColor(background),
        foreground: formatColor(foreground),
        minimum,
        ratio: Number(ratio.toFixed(2)),
        text: Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim())
          .filter(Boolean)
          .join(" ")
          .slice(0, 80),
      };
    })
    .filter(({ minimum, ratio }) => ratio < minimum);
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
