import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, Check, Download, Info, Pencil } from "lucide-react";
import { IsisLogo } from "./IsisLogo";
import { Asset } from "../types";

export type QrPayloadMode = "complete" | "url" | "tag";

export function buildAssetQrPayload(
  tagNumber: string,
  asset?: Partial<Asset>,
  assetName?: string,
  mode: QrPayloadMode = "complete"
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const publicUrl = `${origin}${pathname}?tag=${encodeURIComponent(tagNumber)}`;

  if (mode === "tag") {
    return tagNumber;
  }

  if (mode === "url") {
    return publicUrl;
  }

  // Modo Completo: Legível em qualquer leitor/celular com todas as informações do Ativo
  const lines: string[] = [
    `PATRIMÔNIO / TAG: ${tagNumber}`,
    `ATIVO: ${assetName || asset?.name || "Não informado"}`,
  ];

  if (asset?.model) {
    lines.push(`MODELO: ${asset.manufacturer ? `${asset.manufacturer} ` : ""}${asset.model}`);
  }
  if (asset?.category) lines.push(`CATEGORIA: ${asset.category}`);
  if (asset?.seriesNumber) lines.push(`S/N: ${asset.seriesNumber}`);
  if (asset?.status) lines.push(`STATUS: ${asset.status}`);
  if (asset?.assignedToUser?.name) {
    lines.push(`RESPONSÁVEL: ${asset.assignedToUser.name}`);
  }
  if (asset?.assignedToUser?.department) {
    lines.push(`SETOR: ${asset.assignedToUser.department}`);
  }
  if (asset?.assignedToUser?.location) {
    lines.push(`LOCAL: ${asset.assignedToUser.location}`);
  }

  const specs = [asset?.cpu, asset?.ram, asset?.storage].filter(Boolean).join(" | ");
  if (specs) lines.push(`SPECS: ${specs}`);

  lines.push(`FICHA ONLINE: ${publicUrl}`);

  return lines.join("\n");
}

interface PhysicalAssetPlaqueProps {
  tagNumber: string;
  asset?: Partial<Asset>;
  assetName?: string;
  companyName?: string;
  subTitle?: string;
  showActions?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  qrMode?: QrPayloadMode;
  onEdit?: () => void;
}

export const PhysicalAssetPlaque: React.FC<PhysicalAssetPlaqueProps> = ({
  tagNumber,
  asset,
  assetName,
  companyName = "isis",
  subTitle = "Transportes e Terminais",
  showActions = true,
  className = "",
  size = "md",
  qrMode = "complete",
  onEdit,
}) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showPayloadInfo, setShowPayloadInfo] = useState(false);

  const safeMode: QrPayloadMode = qrMode === "url" || qrMode === "tag" ? qrMode : "complete";
  const qrDataText = buildAssetQrPayload(tagNumber, asset, assetName, safeMode);

  useEffect(() => {
    if (tagNumber) {
      QRCode.toDataURL(qrDataText, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0a0f1d",
          light: "#ffffff",
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error("Error generating plaque QR:", err));
    }
  }, [tagNumber, qrDataText]);

  const handleCopy = () => {
    if (!tagNumber) return;
    navigator.clipboard.writeText(tagNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `Plaqueta_QR_${tagNumber}.png`;
    a.click();
  };

  const scaleClasses = {
    sm: "max-w-[280px] p-2.5",
    md: "max-w-[360px] p-3.5",
    lg: "max-w-[440px] p-4",
  }[size];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Plaqueta Física Realista */}
      <div
        id="physical-plaque-print"
        className={`w-full ${scaleClasses} bg-linear-to-b from-white via-slate-50 to-slate-100 rounded-xl border border-slate-300 shadow-md hover:shadow-lg transition-all relative overflow-hidden flex items-center justify-between gap-3 select-none`}
        style={{
          boxShadow: "0 3px 8px -2px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {/* Subtle metallic shine bar */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none opacity-60" />

        {/* Lado Esquerdo: Logo Isis + Número da TAG em destaque */}
        <div className="flex-1 min-w-0 flex flex-col justify-between pl-1">
          {/* Logo Empresa Isis Transportes e Terminais conforme imagem oficial */}
          <div className="pb-1">
            <IsisLogo
              size={size === "sm" ? "xs" : size === "lg" ? "md" : "sm"}
              showTagline={true}
              className="max-w-[190px]"
            />
          </div>

          {/* Numeração da TAG com tipografia idêntica à plaqueta física */}
          <div className="mt-3">
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
              Número da TAG / Patrimônio
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider leading-none drop-shadow-2xs">
                {tagNumber || "000000"}
              </p>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-1 hover:bg-slate-200/80 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Editar Plaqueta / TAG"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {assetName && (
              <p className="text-[8.5px] font-semibold text-slate-600 truncate mt-1">
                {assetName}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: QR Code 2D nítido e escaneável com dados completos */}
        <div 
          className="w-20 h-20 sm:w-22 sm:h-22 bg-white rounded-lg p-1 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center cursor-pointer group relative"
          onClick={() => setShowPayloadInfo(!showPayloadInfo)}
          title="Clique para ver todos os dados gravados no QR Code"
        >
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR Code da Plaqueta ${tagNumber}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <QrCode className="w-10 h-10 text-slate-300 animate-pulse" />
          )}
        </div>
      </div>

      {/* Modal / Popover dos dados gravados no QR Code */}
      {showPayloadInfo && (
        <div className="w-full max-w-[360px] bg-slate-900 text-white rounded-xl p-3 shadow-xl text-[11px] space-y-2 border border-slate-800 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-blue-400">
              <Info className="w-3.5 h-3.5" />
              Conteúdo Gravado no QR Code
            </span>
            <button
              onClick={() => setShowPayloadInfo(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          <pre className="font-mono text-[10px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto bg-slate-950/60 p-2 rounded border border-slate-800">
            {qrDataText}
          </pre>
          <p className="text-[9px] text-slate-400">
            Ao escanear por qualquer celular ou leitor, todos estes dados são exibidos na tela.
          </p>
        </div>
      )}

      {/* Ações de Apoio (Copiar, Download, Editar) */}
      {showActions && (
        <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Editar número da TAG ou plaqueta"
            >
              <Pencil className="w-3 h-3 text-blue-600" />
              <span>Editar TAG</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Copiar número da TAG"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? "Copiado!" : "Copiar TAG"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Baixar QR Code da plaqueta com dados completos"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Baixar QR</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPayloadInfo(!showPayloadInfo)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Ver dados gravados no QR Code"
          >
            <Info className="w-3 h-3 text-slate-400" />
            <span>Ver Dados QR</span>
          </button>
        </div>
      )}
    </div>
  );
};
