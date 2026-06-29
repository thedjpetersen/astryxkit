import { Theme, defineTheme, type DefinedTheme } from "@astryxdesign/core/theme";
import { useEffect, useState, type ReactNode } from "react";

export type AppearanceMode = "light" | "dark" | "system";

export const defaultAppearanceStorageKey = "astryxkit.appearance";

export const astryxKitTheme = defineTheme({
  name: "astryxkit",
});

export function AstryxKitProvider({
  appearance,
  children,
  onAppearanceChange,
  storageKey = defaultAppearanceStorageKey,
  theme = astryxKitTheme,
}: {
  appearance?: AppearanceMode;
  children: ReactNode;
  onAppearanceChange?: (appearance: AppearanceMode) => void;
  storageKey?: string;
  theme?: DefinedTheme;
}) {
  const [storedAppearance, setStoredAppearance] = useState<AppearanceMode>(() =>
    appearance ?? readStoredAppearance(storageKey)
  );
  const resolvedAppearance = appearance ?? storedAppearance;

  useEffect(() => {
    if (appearance) {
      setStoredAppearance(appearance);
    }
  }, [appearance]);

  useEffect(() => {
    writeStoredAppearance(resolvedAppearance, storageKey);
    onAppearanceChange?.(resolvedAppearance);
  }, [onAppearanceChange, resolvedAppearance, storageKey]);

  return (
    <Theme theme={theme} mode={resolvedAppearance}>
      {children}
    </Theme>
  );
}

export function readStoredAppearance(
  storageKey = defaultAppearanceStorageKey,
  fallback: AppearanceMode = "system"
): AppearanceMode {
  if (typeof window === "undefined") {
    return fallback;
  }

  const storedAppearance = window.localStorage.getItem(storageKey);

  return isAppearanceMode(storedAppearance) ? storedAppearance : fallback;
}

export function writeStoredAppearance(
  appearance: AppearanceMode,
  storageKey = defaultAppearanceStorageKey
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, appearance);
}

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

export type { DefinedTheme };
