import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Map,
  Tag,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

export function getNavItems(canManageUsers: boolean): NavItem[] {
  return [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    { href: "/dashboard/courses", label: "Cursos", icon: BookOpen, show: true },
    {
      href: "/dashboard/my-learning",
      label: "Mi aprendizaje",
      icon: GraduationCap,
      show: true,
    },
    { href: "/dashboard/paths", label: "Rutas", icon: Map, show: true },
    {
      href: "/dashboard/categories",
      label: "Categorías",
      icon: Tag,
      show: canManageUsers,
    },
    {
      href: "/dashboard/users",
      label: "Usuarios",
      icon: Users,
      show: canManageUsers,
    },
    { href: "/dashboard/profile", label: "Perfil", icon: User, show: true },
  ].filter((item) => item.show);
}
