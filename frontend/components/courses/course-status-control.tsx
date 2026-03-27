"use client";
import { useState } from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { CourseStatus } from "@/types/course";
import { useChangeCourseStatus } from "@/hooks/use-courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface StatusTransition {
  to: CourseStatus;
  label: string;
  description: string;
  buttonVariant: "primary" | "danger" | "secondary";
}

const transitions: Record<CourseStatus, StatusTransition | null> = {
  DRAFT: {
    to: "PUBLISHED",
    label: "Publicar curso",
    description:
      "El curso será visible para todos los estudiantes de tu organización. Asegúrate de que el contenido esté completo.",
    buttonVariant: "primary",
  },
  PUBLISHED: {
    to: "ARCHIVED",
    label: "Archivar curso",
    description:
      "El curso dejará de estar disponible para nuevas inscripciones. Los estudiantes ya inscritos mantendrán su acceso.",
    buttonVariant: "danger",
  },
  ARCHIVED: {
    to: "DRAFT",
    label: "Reactivar como borrador",
    description:
      "El curso volverá a estado borrador para que puedas editarlo y publicarlo de nuevo.",
    buttonVariant: "secondary",
  },
};

const statusBadge: Record<CourseStatus, { label: string; variant: any }> = {
  DRAFT: { label: "Borrador", variant: "warning" },
  PUBLISHED: { label: "Publicado", variant: "success" },
  ARCHIVED: { label: "Archivado", variant: "default" },
};

interface CourseStatusControlProps {
  courseId: string;
  currentStatus: CourseStatus;
}

export function CourseStatusControl({
  courseId,
  currentStatus,
}: CourseStatusControlProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const changeStatus = useChangeCourseStatus();
  const transition = transitions[currentStatus];
  const badge = statusBadge[currentStatus];

  const handleConfirm = () => {
    if (!transition) return;
    changeStatus.mutate(
      { courseId, status: transition.to },
      { onSuccess: () => setConfirmOpen(false) },
    );
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Estado:</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        {transition && (
          <Button
            variant={transition.buttonVariant}
            size="sm"
            onClick={() => setConfirmOpen(true)}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            {transition.label}
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar cambio de estado"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{transition?.description}</p>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <Badge variant={statusBadge[transition?.to ?? "DRAFT"].variant}>
              {statusBadge[transition?.to ?? "DRAFT"].label}
            </Badge>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={transition?.buttonVariant ?? "primary"}
              loading={changeStatus.isPending}
              onClick={handleConfirm}
            >
              Confirmar
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
