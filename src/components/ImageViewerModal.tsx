import React, { useEffect } from "react";
import { X, ZoomIn, Download } from "lucide-react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = "Visualização da Foto",
  subtitle,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <ZoomIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none">{title}</h3>
              {subtitle && (
                <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="foto-ativo.jpg"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Baixar imagem"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container with Auto-Framing */}
        <div className="relative flex-1 min-h-[300px] max-h-[75vh] p-4 flex items-center justify-center bg-slate-950/60 overflow-auto">
          <img 
            src={imageUrl} 
            alt={title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-lg select-none"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 font-medium">
            Clique fora da imagem ou pressione <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> para fechar
          </span>
        </div>
      </div>
    </div>
  );
};
