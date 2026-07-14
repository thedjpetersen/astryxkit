/** @deprecated Import App Foundry contracts from `app-foundry/core`. */
export * from "app-foundry/core";

import {
  configureShell as configureAppFoundryShell,
  resetShellForTests as resetAppFoundryShellForTests,
  shell as appFoundryShell,
  type ShellSDK,
  type ShellSDKOptions,
} from "app-foundry/core";

type CompatibilityGlobal = typeof globalThis & {
  __appFoundryShellSdk?: ShellSDK;
  __astryxkitShellSdk?: ShellSDK;
};

function preserveLegacyAlias(sdk: ShellSDK) {
  (globalThis as CompatibilityGlobal).__astryxkitShellSdk = sdk;
  return sdk;
}

/** @deprecated Import `shell` from `app-foundry/core`. */
export function shell(options: ShellSDKOptions = {}) {
  const globalScope = globalThis as CompatibilityGlobal;

  if (!globalScope.__appFoundryShellSdk && globalScope.__astryxkitShellSdk) {
    globalScope.__appFoundryShellSdk = globalScope.__astryxkitShellSdk;
  }

  return preserveLegacyAlias(appFoundryShell(options));
}

/** @deprecated Import `configureShell` from `app-foundry/core`. */
export function configureShell(options: ShellSDKOptions = {}) {
  return preserveLegacyAlias(configureAppFoundryShell(options));
}

/** @deprecated Import `resetShellForTests` from `app-foundry/core`. */
export function resetShellForTests(options: ShellSDKOptions = {}) {
  return preserveLegacyAlias(resetAppFoundryShellForTests(options));
}
