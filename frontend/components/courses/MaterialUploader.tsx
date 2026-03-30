"use client";
import React, { useState } from "react";
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Video,
  Code2,
  Link2,
  Download,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface MaterialFormData {
  type: "VIDEO" | "DOCUMENT" | "PRESENTATION" | "CODE" | "LINK" | "FILE";
  title: string;
  url?: string;
  content?: string;
  order_index: number;
  file_size_kb?: number;
  duration_sec?: number;
}

interface MaterialUploaderProps {
  lessonId: string;
  courseId: string;
  onMaterialAdded?: (material: any) => void;
  onError?: (error: string) => void;
}

const typeConfig = {
  VIDEO: {
    icon: Video,
    label: "Video",
    description: "YouTube, Vimeo o video directo",
    color: "bg-red-100 text-red-700",
  },
  DOCUMENT: {
    icon: FileText,
    label: "Documento",
    description: "PDF o documento",
    color: "bg-blue-100 text-blue-700",
  },
  PRESENTATION: {
    icon: Presentation,
    label: "Presentación",
    description: "Google Slides o embed",
    color: "bg-purple-100 text-purple-700",
  },
  CODE: {
    icon: Code2,
    label: "Código",
    description: "Fragmento de código",
    color: "bg-slate-100 text-slate-700",
  },
  LINK: {
    icon: Link2,
    label: "Enlace",
    description: "URL externa",
    color: "bg-green-100 text-green-700",
  },
  FILE: {
    icon: Download,
    label: "Archivo",
    description: "Descarga directa",
    color: "bg-orange-100 text-orange-700",
  },
};

const MaterialUploader: React.FC<MaterialUploaderProps> = ({
  lessonId,
  courseId,
  onMaterialAdded,
  onError,
}) => {
  const [selectedType, setSelectedType] = useState<
    keyof typeof typeConfig | null
  >(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    type: "VIDEO",
    title: "",
    url: "",
    content: "",
    order_index: 0,
    file_size_kb: 0,
    duration_sec: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleTypeSelect = (type: keyof typeof typeConfig) => {
    setSelectedType(type);
    setFormData({
      ...formData,
      type: type as any,
    });
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "order_index" ||
        name === "file_size_kb" ||
        name === "duration_sec"
          ? parseInt(value) || 0
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorMessage("El título es requerido");
      return;
    }

    if (formData.type !== "CODE" && !formData.url?.trim()) {
      setErrorMessage("La URL es requerida para este tipo de material");
      return;
    }

    if (formData.type === "CODE" && !formData.content?.trim()) {
      setErrorMessage("El contenido del código es requerido");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        type: formData.type,
        title: formData.title.trim(),
        url: formData.url || null,
        content: formData.content || null,
        order_index: formData.order_index,
        file_size_kb: formData.file_size_kb || null,
        duration_sec: formData.duration_sec || null,
      };

      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/materials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al agregar material");
      }

      const newMaterial = await response.json();
      setSuccessMessage("Material agregado exitosamente");
      setFormData({
        type: "VIDEO",
        title: "",
        url: "",
        content: "",
        order_index: 0,
        file_size_kb: 0,
        duration_sec: 0,
      });
      setSelectedType(null);

      if (onMaterialAdded) {
        onMaterialAdded(newMaterial);
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setErrorMessage(message);
      if (onError) {
        onError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Agregar Material</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Selecciona un tipo de material para agregar a esta lección
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Type Selection Grid */}
        {!selectedType && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Tipo de Material
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(typeConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleTypeSelect(key as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-center hover:border-gray-400 ${config.color} border-gray-200`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {config.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form */}
        {selectedType && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              ← Cambiar tipo
            </button>

            {/* Type Badge */}
            <div className="flex items-center gap-2">
              <Badge className={typeConfig[selectedType].color}>
                {typeConfig[selectedType].label}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nombre del material"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Type-specific fields */}
            {selectedType !== "CODE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder={
                    selectedType === "VIDEO"
                      ? "https://youtube.com/watch?v=..."
                      : selectedType === "LINK"
                        ? "https://ejemplo.com"
                        : "https://..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            )}

            {selectedType === "CODE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Pega tu código aquí..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Optional fields row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedType === "VIDEO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (segundos)
                  </label>
                  <input
                    type="number"
                    name="duration_sec"
                    value={formData.duration_sec || ""}
                    onChange={handleChange}
                    placeholder="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              )}

              {selectedType === "FILE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño (KB)
                  </label>
                  <input
                    type="number"
                    name="file_size_kb"
                    value={formData.file_size_kb || ""}
                    onChange={handleChange}
                    placeholder="1024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              )}

              {selectedType === "DOCUMENT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño (KB)
                  </label>
                  <input
                    type="number"
                    name="file_size_kb"
                    value={formData.file_size_kb || ""}
                    onChange={handleChange}
                    placeholder="2048"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  name="order_index"
                  value={formData.order_index}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  min="0"
                />
              </div>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Agregar Material
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedType(null)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialUploader;
