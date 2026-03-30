"use client";
import React, { useState } from "react";
import {
  Download,
  ExternalLink,
  Code2,
  FileText,
  Presentation,
  Link2,
  Video,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface Material {
  id: string;
  type: "VIDEO" | "DOCUMENT" | "PRESENTATION" | "CODE" | "LINK" | "FILE";
  title: string;
  url?: string;
  content?: string;
  order_index: number;
  file_size_kb?: number;
  duration_sec?: number;
}

interface MaterialViewerProps {
  material: Material;
  lessonTitle?: string;
}

const MaterialViewer: React.FC<MaterialViewerProps> = ({
  material,
  lessonTitle,
}) => {
  const [showCodeCopy, setShowCodeCopy] = useState(false);

  const typeConfig = {
    VIDEO: {
      icon: Video,
      label: "Video",
      color: "bg-red-100 text-red-700 border-red-200",
    },
    DOCUMENT: {
      icon: FileText,
      label: "Documento",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    PRESENTATION: {
      icon: Presentation,
      label: "Presentación",
      color: "bg-purple-100 text-purple-700 border-purple-200",
    },
    CODE: {
      icon: Code2,
      label: "Código",
      color: "bg-slate-100 text-slate-700 border-slate-200",
    },
    LINK: {
      icon: Link2,
      label: "Enlace",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    FILE: {
      icon: Download,
      label: "Archivo",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    },
  };

  const config = typeConfig[material.type];
  const IconComponent = config.icon;

  const renderContent = () => {
    switch (material.type) {
      case "VIDEO":
        return (
          <div className="space-y-3">
            {material.url && (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                {material.url.includes("youtube") ||
                material.url.includes("youtu.be") ? (
                  <iframe
                    src={material.url
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "www.youtube.com/embed/")}
                    className="w-full h-full"
                    allowFullScreen
                    title={material.title}
                  />
                ) : material.url.includes("vimeo") ? (
                  <iframe
                    src={material.url.replace(
                      "vimeo.com/",
                      "player.vimeo.com/video/",
                    )}
                    className="w-full h-full"
                    allowFullScreen
                    title={material.title}
                  />
                ) : (
                  <video
                    src={material.url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
            )}
            {material.duration_sec && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor(material.duration_sec / 60)}:
                  {String(material.duration_sec % 60).padStart(2, "0")} minutos
                </span>
              </div>
            )}
          </div>
        );

      case "DOCUMENT":
        return (
          <div className="space-y-3">
            {material.url ? (
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Documento PDF disponible
                </p>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Ver PDF
                </a>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">PDF no disponible</p>
              </div>
            )}
            {material.file_size_kb && (
              <p className="text-xs text-gray-500">
                Tamaño: {(material.file_size_kb / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        );

      case "PRESENTATION":
        return (
          <div className="space-y-3">
            {material.url ? (
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                {material.url.includes("docs.google.com") ? (
                  <iframe
                    src={material.url}
                    className="w-full min-h-96"
                    allowFullScreen
                    title={material.title}
                  />
                ) : (
                  <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
                    <Presentation className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-3">
                      Accede a la presentación en línea
                    </p>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir presentación
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  Presentación no disponible
                </p>
              </div>
            )}
          </div>
        );

      case "CODE":
        return (
          <div className="space-y-3">
            {material.content ? (
              <div className="bg-slate-900 rounded-lg overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Código</span>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(material.content || "");
                      setShowCodeCopy(true);
                      setTimeout(() => setShowCodeCopy(false), 2000);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {showCodeCopy ? "¡Copiado!" : "Copiar"}
                  </Button>
                </div>
                <pre className="p-4 overflow-x-auto text-slate-200 text-sm">
                  <code>{material.content}</code>
                </pre>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Código no disponible</p>
              </div>
            )}
          </div>
        );

      case "LINK":
        return (
          <div className="space-y-3">
            {material.url ? (
              <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {material.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 break-all">
                      {material.url}
                    </p>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visitar enlace
                    </a>
                  </div>
                  <Link2 className="w-8 h-8 text-green-400 shrink-0" />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Enlace no disponible</p>
              </div>
            )}
          </div>
        );

      case "FILE":
        return (
          <div className="space-y-3">
            {material.url ? (
              <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {material.title}
                    </h4>
                    {material.file_size_kb && (
                      <p className="text-sm text-gray-600 mb-4">
                        Tamaño:{" "}
                        {material.file_size_kb < 1024
                          ? `${material.file_size_kb} KB`
                          : `${(material.file_size_kb / 1024).toFixed(2)} MB`}
                      </p>
                    )}
                    <a
                      href={material.url}
                      download={material.title}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                  <Download className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Archivo no disponible</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border border-gray-200 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gray-50 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${config.color}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <Badge variant="default" className={`mb-1 ${config.color}`}>
                {config.label}
              </Badge>
              <h3 className="font-semibold text-gray-900">{material.title}</h3>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">{renderContent()}</CardContent>
    </Card>
  );
};

export default MaterialViewer;
