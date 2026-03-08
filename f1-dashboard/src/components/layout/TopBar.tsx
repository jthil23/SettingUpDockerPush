"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import { useLayout } from "./LayoutContext";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/schedule": "Schedule",
  "/standings": "Standings",
  "/results": "Results",
  "/drivers": "Drivers",
  "/head-to-head": "Head-to-Head",
  "/predictions": "Predictions",
  "/admin": "Admin",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Try matching partial paths
  const match = Object.entries(pageTitles).find(
    ([path]) => path !== "/" && pathname.startsWith(path)
  );
  return match ? match[1] : "F1 Dashboard";
}

export default function TopBar() {
  const pathname = usePathname();
  const { toggleSidebar } = useLayout();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30">
      {/* Accent gradient line */}
      <div className="accent-line" />

      <div className="flex items-center justify-between h-14 px-4 md:px-6 bg-f1-dark/80 backdrop-blur-md border-b border-f1-carbon">
        <div className="flex items-center gap-3">
          {/* Hamburger menu — mobile only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-f1-white/60 hover:text-f1-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>

          <h1 className="text-lg font-heading font-semibold text-f1-white tracking-wide">
            {title}
          </h1>
        </div>
        <CountdownTimer />
      </div>
    </header>
  );
}
