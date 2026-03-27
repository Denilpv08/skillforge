"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { usePermissions } from "@/hooks/use-permissions";
import { getNavItems } from "./navItem";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const permissions = usePermissions();
  const navItems = getNavItems(permissions.canManageUsers);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-gray-900 text-white transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        {sidebarOpen && (
          <span className="font-bold text-lg tracking-tight">SkillForge</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {sidebarOpen && user && (
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-sm font-medium text-white truncate">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          <span className="mt-1 inline-block text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
            {user.role}
          </span>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center hover:bg-gray-600 transition-colors"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
