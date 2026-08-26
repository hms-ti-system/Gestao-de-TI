import React, { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Image as ImageIcon, Check, X, Camera, RefreshCw } from "lucide-react";

interface AvatarUploaderProps {
  value: string;
  onChange: (newAvatar: string) => void;
  presets?: string[];
  label?: string;
  sublabel?: string;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  value,
  onChange,
  presets = [],
  label = "Foto de Perfil / Avatar",
  sublabel = "Escolha um arquivo do dispositivo, informe um link ou escolha um preset",
}) => {
  const [tab, setTab] = useState<"upload" | "url" | "presets">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(value && !value.startsWith("data:") ? value : "");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and optimize image to keep localStorage and database lightweight
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 320; // 320px is perfect for avatar
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          onChange(dataUrl);
        } else {
          onChange(e.target?.result as string);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(e.target?.result as string);
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  return (
    <div className="space-y-3 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-bold text-slate-700 text-xs uppercase tracking-wide block">
            {label}
          </label>
          {sublabel && (
            <p className="text-[11px] text-slate-400 font-medium">{sublabel}</p>
          )}
        </div>

        {/* Current Avatar Miniature */}
        {value && (
          <div className="relative group shrink-0">
            <img
              src={value}
              alt="Avatar preview"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-blue-500/20"
            />
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            tab === "upload"
              ? "bg-white text-blue-700 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Do Computador</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
            tab === "url"
              ? "bg-white text-blue-700 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Link / URL</span>
        </button>

        {presets.length > 0 && (
          <button
            type="button"
            onClick={() => setTab("presets")}
            className={`flex-1 py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              tab === "presets"
                ? "bg-white text-blue-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
        )}
      </div>

      {/* Mode 1: File Upload / Drag and Drop */}
      {tab === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-4 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50/70 scale-[0.99]"
                : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </div>

            <p className="text-xs font-bold text-slate-700">
              {isProcessing ? "Otimizando imagem..." : "Clique para escolher a foto ou arraste aqui"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              PNG, JPG, WebP ou GIF (Salvo diretamente no perfil)
            </p>
          </div>
        </div>
      )}

      {/* Mode 2: Link / URL input */}
      {tab === "url" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://exemplo.com/foto-do-usuario.jpg"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange(e.target.value);
              }}
              onBlur={handleApplyUrl}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono text-xs bg-white"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => {
                  setUrlInput("");
                  onChange("");
                }}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                title="Limpar campo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            Cole qualquer link direto de imagem pública na web para o avatar.
          </p>
        </div>
      )}

      {/* Mode 3: Presets */}
      {tab === "presets" && presets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {presets.map((preset, index) => {
              const isSelected = value === preset;
              return (
                <button
                  key={preset + index}
                  type="button"
                  onClick={() => onChange(preset)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-600 scale-105 ring-2 ring-blue-500/30"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Avatar preset ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-600/35 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white font-bold" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
