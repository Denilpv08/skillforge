import { LearningPath } from "@/types/course";
import { useState } from "react";
import PathInfo from "./PathInfo";
import PathEdit from "./PathEdit";
import PathDelete from "./PathDelete";

interface PathCardProps {
  path: LearningPath;
  canManage: boolean;
}

const PathCard = ({ path, canManage }: PathCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <PathInfo
        path={path}
        canManage={canManage}
        setEditOpen={setEditOpen}
        setConfirmDelete={setConfirmDelete}
      />

      {/* Modal editar */}
      <PathEdit path={path} editOpen={editOpen} setEditOpen={setEditOpen} />

      {/* Modal eliminar */}
      <PathDelete
        path={path}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
      />
    </>
  );
};

export default PathCard;
