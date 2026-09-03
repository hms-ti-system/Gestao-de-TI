import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, Check, Printer, Download } from "lucide-react";
import { IsisLogo } from "./IsisLogo";

interface PhysicalAssetPlaqueProps {
  tagNumber: string;
  assetName?: string;
  companyName?: string;
  subTitle?: string;
  showActions?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PhysicalAssetPlaque: React.FC<PhysicalAssetPlaqueProps> = ({
  tagNumber,
  assetName,
  companyName = "isis",
  subTitle = "Transportes e Terminais",
  showActions = true,
  className = "",
  size = "md",
}) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tagNumber) {
      QRCode.toDataURL(tagNumber, {
        width: 280,
        margin: 1,
        color: {
          dark: "#0a0f1d",
          light: "#ffffff",
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error("Error generating plaque QR:", err));
    }
  }, [tagNumber]);

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
            <p className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider leading-none mt-0.5 drop-shadow-2xs">
              {tagNumber || "000000"}
            </p>
            {assetName && (
              <p className="text-[8.5px] font-semibold text-slate-600 truncate mt-1">
                {assetName}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: QR Code 2D nítido e escaneável */}
        <div className="w-20 h-20 sm:w-22 sm:h-22 bg-white rounded-lg p-1 border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
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

      {/* Ações de Apoio (Copiar, Download, Impressão) */}
      {showActions && (
        <div className="flex items-center gap-2 pt-1">
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
            title="Baixar QR Code da plaqueta"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Baixar QR</span>
          </button>
        </div>
      )}
    </div>
  );
};
