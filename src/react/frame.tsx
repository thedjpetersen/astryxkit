import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon, type IconName } from "@astryxdesign/core/Icon";
import {
  SideNav,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { ShellHost, WorkspaceContext } from "../core/host";
import { ShellCommandPalette } from "./command-palette";
import { useHostVersion, useShellTopNavMounts } from "./react-bindings";

export type ShellNavItem = {
  href: string;
  icon?: IconName;
  isSelected?: boolean;
  label: string;
};

export type ShellFrameProps = {
  brandHref?: string;
  brandName: string;
  children: ReactNode;
  contentPadding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  currentPathname: string;
  endContent?: ReactNode;
  height?: "fill" | "auto";
  host: ShellHost;
  logo?: ReactNode;
  sideNavLabel?: string;
  topNavItems?: ShellNavItem[];
  workspace: WorkspaceContext;
};

export function ShellFrame({
  brandHref = "/",
  brandName,
  children,
  contentPadding = 4,
  currentPathname,
  endContent,
  height = "fill",
  host,
  logo,
  sideNavLabel = "Applications",
  topNavItems = [],
  workspace,
}: ShellFrameProps) {
  const version = useHostVersion(host);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const apps = useMemo(() => host.getManifests(), [host, version]);
  const activeApp = useMemo(
    () => host.getManifestForPathname(currentPathname),
    [currentPathname, host, version]
  );
  const topNavHeaderMounts = useShellTopNavMounts(host, "header");
  const topNavStartMounts = useShellTopNavMounts(host, "start");
  const topNavCenterMounts = useShellTopNavMounts(host, "center");
  const topNavEndMounts = useShellTopNavMounts(host, "end");
  const contributedHeading = topNavHeaderMounts[0]?.content;
  const topNav = (
    <TopNav
      label="Application navigation"
      heading={
        contributedHeading ?? (
          <TopNavHeading
            logo={logo ?? <Icon icon="viewColumns" color="accent" />}
            heading={brandName}
            headingHref={brandHref}
            subheading={workspace.name}
          />
        )
      }
      startContent={
        <HStack gap={1} align="center" wrap="wrap">
          {topNavItems.map((item) => (
            <TopNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon ? <Icon icon={item.icon} /> : undefined}
              isSelected={item.isSelected ?? item.href === currentPathname}
            />
          ))}
          {topNavStartMounts.map((mount) => (
            <Fragment key={mount.id}>{mount.content}</Fragment>
          ))}
        </HStack>
      }
      centerContent={
        topNavCenterMounts.length > 0 ? (
          <HStack gap={2} align="center" wrap="wrap">
            {topNavCenterMounts.map((mount) => (
              <Fragment key={mount.id}>{mount.content}</Fragment>
            ))}
          </HStack>
        ) : undefined
      }
      endContent={
        <HStack gap={2} align="center" wrap="wrap">
          <Button
            label="Commands"
            variant="ghost"
            size="sm"
            icon={<Icon icon="search" />}
            onClick={() => setCommandPaletteOpen(true)}
          />
          {topNavEndMounts.map((mount) => (
            <Fragment key={mount.id}>{mount.content}</Fragment>
          ))}
          {endContent}
        </HStack>
      }
    />
  );
  const sideNav = (
    <SideNav collapsible>
      <SideNavSection title={sideNavLabel}>
        {apps.map((app) => (
          <SideNavItem
            key={app.id}
            href={app.route}
            label={app.name}
            icon={toIconName(app.icon)}
            selectedIcon={toIconName(app.icon)}
            isSelected={activeApp?.id === app.id}
          />
        ))}
      </SideNavSection>
    </SideNav>
  );

  return (
    <AppShell
      height={height}
      variant="elevated"
      contentPadding={contentPadding}
      topNav={topNav}
      sideNav={sideNav}
    >
      {children}
      <ShellCommandPalette
        host={host}
        isOpen={isCommandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </AppShell>
  );
}

function toIconName(icon?: string): IconName {
  const allowedIcons: IconName[] = [
    "arrowDown",
    "arrowUp",
    "arrowsUpDown",
    "calendar",
    "check",
    "checkDouble",
    "chevronDown",
    "chevronLeft",
    "chevronRight",
    "clock",
    "close",
    "copy",
    "error",
    "externalLink",
    "eyeSlash",
    "funnel",
    "info",
    "menu",
    "microphone",
    "moreHorizontal",
    "search",
    "stop",
    "success",
    "viewColumns",
    "warning",
    "wrench",
  ];

  return allowedIcons.includes(icon as IconName) ? (icon as IconName) : "wrench";
}
