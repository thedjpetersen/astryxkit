import { defineShellPresentationAdapter } from "app-foundry/react";
import { ShellAppErrorBoundary, ShellAppOutlet } from "./app-outlet.js";
import { ShellCommandPalette } from "./command-palette.js";
import { ShellFrame } from "./frame.js";
import { ShellPreferencesPanel } from "./preferences.js";

export const astryxPresentationAdapter = defineShellPresentationAdapter({
  id: "astryxkit",
  AppErrorBoundary: ShellAppErrorBoundary,
  AppOutlet: ShellAppOutlet,
  CommandPalette: ShellCommandPalette,
  Frame: ShellFrame,
  Preferences: ShellPreferencesPanel,
});
