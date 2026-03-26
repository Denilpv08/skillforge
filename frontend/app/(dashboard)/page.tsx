import { redirect } from "next/navigation";

// Redirigir /dashboard → /dashboard
export default function DashboardRoot() {
  redirect("/dashboard");
}
