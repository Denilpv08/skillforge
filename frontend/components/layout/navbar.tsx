"use client";
import { Bell, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <p className="text-sm text-gray-500">
          Bienvenido de vuelta,{" "}
          <span className="font-semibold text-gray-800">{user?.full_name}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 cursor-pointer rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="gap-2 text-gray-600 cursor-pointer hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </Button>
      </div>
    </header>
  );
}
