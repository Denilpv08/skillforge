import { Shield, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import UserRow from "./UserRow";
import { User } from "@/types/auth";

interface UserListProps {
  users: User[];
  isLoading: boolean;
  currentUserId: string;
  setModalOpen: (open: boolean) => void;
}

const UserList = ({
  users,
  isLoading,
  currentUserId,
  setModalOpen,
}: UserListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-800">Miembros del equipo</h2>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-gray-100 py-0">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Sin usuarios"
            description="Crea el primer usuario de tu organización"
            action={{
              label: "Crear usuario",
              onClick: () => setModalOpen(true),
            }}
          />
        ) : (
          users.map((user) => (
            <UserRow key={user.id} user={user} currentUserId={currentUserId} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UserList;
