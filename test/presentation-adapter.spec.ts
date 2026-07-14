import { describe, expect, it } from "vitest";
import { defineShellPresentationAdapter } from "app-foundry/react";

describe("App Foundry presentation adapter contract", () => {
  it("preserves a complete feature-level adapter", () => {
    const Component = () => null;
    const adapter = defineShellPresentationAdapter({
      id: "contract-test",
      AppErrorBoundary: Component,
      AppOutlet: Component,
      CommandPalette: Component,
      Frame: Component,
      Preferences: Component,
    });

    expect(adapter.id).toBe("contract-test");
    expect(Object.keys(adapter).sort()).toEqual([
      "AppErrorBoundary",
      "AppOutlet",
      "CommandPalette",
      "Frame",
      "Preferences",
      "id",
    ]);
  });
});
