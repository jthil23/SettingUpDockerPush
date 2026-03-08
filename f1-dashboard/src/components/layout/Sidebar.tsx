"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Flag,
  Users,
  GitCompare,
  Swords,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useLayout } from "./LayoutContext";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/standings", label: "Standings", icon: Trophy },
  { href: "/results", label: "Results", icon: Flag },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/head-to-head", label: "Head-to-Head", icon: GitCompare },
  { href: "/battles", label: "Battles", icon: Swords },
  { href: "/predictions", label: "Predictions", icon: Target },
  { href: "/admin", label: "Admin", icon: Settings },
];

const STORAGE_KEY = "f1-sidebar-collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useLayout();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  // Avoid hydration mismatch — render expanded by default on server
  const isCollapsed = mounted ? collapsed : false;

  const sidebarContent = (
    <aside
      className={`flex flex-col h-screen bg-f1-dark border-r border-f1-carbon transition-all duration-300 ease-in-out
        ${sidebarOpen ? "w-60" : ""}
        ${!sidebarOpen ? "hidden md:flex" : ""}
      `}
      style={{
        width: sidebarOpen ? 240 : isCollapsed ? 72 : 240,
        minWidth: sidebarOpen ? 240 : isCollapsed ? 72 : 240,
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(45,45,45,0.3) 10px, rgba(45,45,45,0.3) 11px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-f1-carbon">
        <Link href="/" className="flex items-center gap-1 font-heading">
          <span className="text-2xl font-bold text-f1-red">F1</span>
          <AnimatePresence>
            {(!isCollapsed || sidebarOpen) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-f1-white overflow-hidden whitespace-nowrap"
              >
                DASH
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Close button on mobile */}
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-f1-white/40 hover:text-f1-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 py-4 px-2 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showLabel = sidebarOpen || !isCollapsed;

          return (
            <Link
              key={href}
              href={href}
              className={`
                relative flex items-center gap-3 rounded-lg px-3 py-2.5
                transition-all duration-200 group
                ${
                  isActive
                    ? "bg-f1-carbon/60 text-f1-white"
                    : "text-f1-white/60 hover:bg-f1-carbon/30 hover:text-f1-white"
                }
              `}
              title={isCollapsed && !sidebarOpen ? label : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-f1-red"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                size={20}
                className={`shrink-0 transition-all duration-200 ${
                  isActive
                    ? "text-f1-red"
                    : "group-hover:drop-shadow-[0_0_6px_rgba(225,6,0,0.4)]"
                }`}
              />

              <AnimatePresence>
                {showLabel && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — hidden on mobile overlay */}
      <button
        onClick={toggleCollapsed}
        className="hidden md:flex items-center justify-center h-12 border-t border-f1-carbon text-f1-white/40 hover:text-f1-white hover:bg-f1-carbon/30 transition-colors duration-200"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — sticky */}
      <div className="hidden md:flex sticky top-0 h-screen">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-screen md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
