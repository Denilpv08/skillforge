import { useUpdateUser } from "@/hooks/use-users";
import { cn } from "@/lib/utils";
import { UserListItem, UserRole } from "@/types/auth";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Check, MoreVertical, X } from "lucide-react";

interface UserRowProps {
  user: UserListItem;
  currentUserId: string;
}

const roleConfig: Record<UserRole, { label: string; variant: any }> = {
  SUPER_ADMIN: { label: "Super Admin", variant: "danger" },
  ADMIN: { label: "Admin", variant: "info" },
  INSTRUCTOR: { label: "Instructor", variant: "warning" },
  STUDENT: { label: "Estudiante", variant: "default" },
};

const UserRow = ({ user, currentUserId }: UserRowProps) => {
  const updateUser = useUpdateUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const isSelf = user.id === currentUserId;
  const config = roleConfig[user.role];

  const toggleActive = () => {
    updateUser.mutate({
      userId: user.id,
      data: { is_active: !user.is_active },
    });
  };

  const changeRole = (role: string) => {
    updateUser.mutate({ userId: user.id, data: { role } });
    setMenuOpen(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 py-4 px-2 rounded-xl transition-colors",
        !user.is_active && "opacity-50",
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        <span className="text-indigo-700 font-semibold text-sm">
          {user.full_name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.full_name}
          </p>
          {isSelf && <span className="text-xs text-gray-400">(tú)</span>}
        </div>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>

      {/* Role badge */}
      <Badge variant={config.variant}>{config.label}</Badge>

      {/* Status */}
      <Badge variant={user.is_active ? "success" : "default"}>
        {user.is_active ? "Activo" : "Inactivo"}
      </Badge>

      {/* Acciones — solo si no es uno mismo */}
      {!isSelf && (
        <div className="relative">
          <Button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-48">
                <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Cambiar rol
                </p>
                {(["ADMIN", "INSTRUCTOR", "STUDENT"] as const).map((r) => (
                  <Button
                    key={r}
                    onClick={() => changeRole(r)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 text-black flex items-center gap-2",
                      user.role === r && "text-indigo-600 font-medium",
                    )}
                  >
                    {user.role === r && <Check className="w-3.5 h-3.5" />}
                    {roleConfig[r].label}
                  </Button>
                ))}

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <Button
                    onClick={toggleActive}
                    className={cn(
                      "w-full text-left bg-gray-50 px-3 py-2 text-sm flex items-center gap-2",
                      user.is_active
                        ? "text-red-500 hover:bg-red-50"
                        : "text-green-600 hover:bg-green-50",
                    )}
                  >
                    {user.is_active ? (
                      <>
                        <X className="w-3.5 h-3.5" /> Desactivar
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Activar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRow;
