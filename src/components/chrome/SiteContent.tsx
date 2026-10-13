"use client";

import { useSiteStore } from "@/lib/siteStore";

/** Page content wrapper. Made inert while the menu is open so focus stays in the menu. */
export function SiteContent({ children }: { children: React.ReactNode }) {
  const menuOpen = useSiteStore((s) => s.menuOpen);
  return (
    <div id="site-content" className="relative z-[1]" inert={menuOpen}>
      {children}
    </div>
  );
}
