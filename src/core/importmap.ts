// Micro-apps ship as independent ES modules, and import maps are how the
// browser is told two things at once: where each app's entry lives
// (`@app/<id>`), and — more importantly — that every module must share one
// copy of React and one copy of the shell SDK. Without the shared pins, an
// app would bundle its own SDK, register commands into it, and the host
// would never see them.

import type { ShellAppManifest, ShellHost } from "./host";

export type ShellImportMap = {
  imports: Record<string, string>;
};

export const shellImportMapId = "astryxkit-importmap";

// Dev-server paths, deliberately: production hosts substitute their own
// pins (CDN URLs, hashed bundles) via `buildShellImportMap`'s second
// argument. These defaults make the local-dev story work out of the box.
export const sharedImportPins: Record<string, string> = {
  "@astryxdesign/core/": "/node_modules/@astryxdesign/core/",
  "@astryxkit/sdk": "/node_modules/astryxkit/dist/core/shell-sdk.js",
  "astryxkit": "/node_modules/astryxkit/dist/index.js",
  "astryxkit/core": "/node_modules/astryxkit/dist/core/index.js",
  "astryxkit/react": "/node_modules/astryxkit/dist/react/index.js",
  "react": "/node_modules/.vite/deps/react.js",
  "react-dom": "/node_modules/.vite/deps/react-dom.js",
  "react-dom/": "/node_modules/.vite/deps/react-dom/",
  "react-dom/client": "/node_modules/.vite/deps/react-dom_client.js",
};

export function buildShellImportMap(
  manifests: ShellAppManifest[],
  sharedPins: Record<string, string> = sharedImportPins
): ShellImportMap {
  const appImports = Object.fromEntries(
    manifests.map((manifest) => [`@app/${manifest.id}`, manifest.entryUrl])
  );

  return {
    imports: {
      ...sharedPins,
      ...appImports,
    },
  };
}

export function buildImportMapFromHost(host: ShellHost): ShellImportMap {
  return buildShellImportMap(host.getManifests());
}

// Import maps must exist before any module resolution uses them, and a
// document only honors one — so installation is idempotent: if the script
// tag is already present, it wins and this call is a no-op.
export function installShellImportMap(
  importMap: ShellImportMap
): HTMLScriptElement | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const existing = document.getElementById(shellImportMapId);

  if (existing instanceof HTMLScriptElement) {
    return existing;
  }

  const script = document.createElement("script");
  script.id = shellImportMapId;
  script.type = "importmap";
  script.textContent = JSON.stringify(importMap, null, 2);
  document.head.appendChild(script);

  return script;
}
