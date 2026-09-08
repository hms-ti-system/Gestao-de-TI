import React, { useState } from "react";
import { X, Tag, Check, AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Asset } from "../types";
import { useApp } from "../context/AppContext";
import { PhysicalAssetPlaque } from "./PhysicalAssetPlaque";

interface EditAssetTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onTagUpdated?: (newTag: string) => void;
}

export const EditAssetTagModal: React.FC<EditAssetTagModalProps> = ({
  isOpen,
  onClose,
  asset,
  onTagUpdated,
}) => {
  const { assets, updateAssetTag, showToast } = useApp();
  const [newTag, setNewTag] = useState(asset.id || "");
  const [name, setName] = useState(asset.name || "");
  const [seriesNumber, setSeriesNumber] = useState(asset.seriesNumber || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const cleanNewTag = newTag.trim();
  const isTagChanged = cleanNewTag.toUpperCase() !== asset.id.toUpperCase();
  const isDuplicate = isTagChanged && assets.some((a) => a.id.toUpperCase() === cleanNewTag.toUpperCase());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cleanNewTag) {
      showToast("Validação", "O número da TAG / Plaqueta não pode estar em branco.", "warning");
      return;
    }

    if (isDuplicate) {
      showToast("TAG Indisponível", `A TAG "${cleanNewTag}" já está em uso por outro ativo.`, "warning");
      return;
    }

    setIsSubmitting(true);
    const success = updateAssetTag(asset.id, cleanNewTag, {
      name: name.trim() || asset.name,
      seriesNumber: seriesNumber.trim() || asset.seriesNumber,
    });

    setIsSubmitting(false);

    if (success) {
      if (onTagUpdated) {
        onTagUpdated(cleanNewTag);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-hidden flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-slate-900 leading-tight">
                Editar Plaqueta Patrimonial / TAG
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Altere a numeração física ou dados da etiqueta do ativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prévia em tempo real da Plaqueta Física */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Prévia em Tempo Real da Plaqueta
          </span>
          <PhysicalAssetPlaque
            tagNumber={cleanNewTag || "000000"}
            asset={{
              ...asset,
              id: cleanNewTag || asset.id,
              name: name || asset.name,
              seriesNumber: seriesNumber || asset.seriesNumber,
            }}
            assetName={name || asset.name}
            size="sm"
            showActions={false}
          />
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Número da TAG / Patrimônio</span>
              <span className="text-[10px] font-normal text-slate-400">
                Plaqueta física (Ex: 000964)
              </span>
            </label>
            <input
              type="text"
              required
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="ex: 000964 ou TAG-2024-001"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {isDuplicate && (
              <p className="text-xs text-red-600 font-bold flex items-center gap-1 pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Esta TAG já pertence a outro ativo cadastrado.
              </p>
            )}
            {isTagChanged && !isDuplicate && cleanNewTag && (
              <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                A TAG será alterada de "{asset.id}" para "{cleanNewTag}".
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nome / Descrição na Plaqueta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: MacBook Pro 16"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Número de Série (S/N)
            </label>
            <input
              type="text"
              value={seriesNumber}
              onChange={(e) => setSeriesNumber(e.target.value)}
              placeholder="ex: C02G1234MD6R"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDuplicate || !cleanNewTag}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Plaqueta</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
