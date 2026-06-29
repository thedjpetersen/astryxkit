import type { ShellAppManifest, ShellHost } from "./host";

export type ShellImportMap = {
  imports: Record<string, string>;
};

export const shellImportMapId = "astryxkit-importmap";

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
