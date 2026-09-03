import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { X, Printer, Download, QrCode, Tag, Check, Laptop, Copy, Sparkles, LayoutGrid } from "lucide-react";
import { motion } from "motion/react";
import { Asset } from "../types";
import { PhysicalAssetPlaque } from "./PhysicalAssetPlaque";

interface AssetTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Partial<Asset> & { id: string; name: string };
}

export const AssetTagModal: React.FC<AssetTagModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const [tagStyle, setTagStyle] = useState<"plaque" | "detailed">("plaque");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (asset?.id) {
      // Encode key asset identification info into QR
      const qrData = asset.id;
      QRCode.toDataURL(qrData, {
        width: 320,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [asset?.id, asset?.name, asset?.seriesNumber]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `QR_${asset.id || "Ativo"}.png`;
    a.click();
  };

  const handleCopyTag = () => {
    if (!asset.id) return;
    navigator.clipboard.writeText(asset.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-asset-tag, #printable-asset-tag * {
            visibility: visible;
          }
          #printable-asset-tag {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0;
            padding: 12px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            width: 90mm;
            max-width: 90mm;
            background: white !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 print:shadow-none print:border-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Etiqueta Patrimonial & QR Code</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                Identificação Física do Ativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Style switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl print:hidden">
          <button
            type="button"
            onClick={() => setTagStyle("plaque")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tagStyle === "plaque"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Plaqueta Física (ISIS)</span>
          </button>
          <button
            type="button"
            onClick={() => setTagStyle("detailed")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tagStyle === "detailed"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
            <span>Etiqueta Detalhada</span>
          </button>
        </div>

        {/* Printable Asset Tag Card */}
        <div className="flex justify-center">
          {tagStyle === "plaque" ? (
            <div id="printable-asset-tag">
              <PhysicalAssetPlaque
                tagNumber={asset.id}
                assetName={asset.name}
                companyName="isis"
                subTitle="Transportes e Terminais"
                size="md"
                showActions={false}
              />
            </div>
          ) : (
            <div
              id="printable-asset-tag"
              className="w-full max-w-[340px] bg-white border-2 border-slate-800 rounded-xl p-4 shadow-md relative overflow-hidden"
            >
              {/* Top Brand Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-slate-900 rounded-sm flex items-center justify-center text-[9px] font-black text-white">
                    AC
                  </div>
                  <span className="font-black text-xs tracking-tight text-slate-900 uppercase">
                    AssetCentral
                  </span>
                </div>
                <span className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">
                  Patrimônio TI
                </span>
              </div>

              {/* Tag Body: QR Code + Asset Details */}
              <div className="flex items-center gap-3.5">
                {/* QR Code Container */}
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt={`QR Code ${asset.id}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                  )}
                </div>

                {/* Text specifications */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      Identificador (TAG)
                    </p>
                    <p className="text-sm font-mono font-black text-slate-900 truncate">
                      {asset.id || "SEM TAG"}
                    </p>
                  </div>

                  <div className="mt-1.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      Equipamento
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {asset.name || "Novo Ativo"}
                    </p>
                    {asset.model && (
                      <p className="text-[10px] text-slate-500 truncate">
                        {asset.manufacturer ? `${asset.manufacturer} ` : ""}{asset.model}
                      </p>
                    )}
                  </div>

                  {asset.seriesNumber && (
                    <div className="mt-1">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                        S/N: <span className="font-mono text-slate-700 font-bold">{asset.seriesNumber}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra footer on label if MAC or NF is present */}
              {(asset.macAddress || asset.invoiceNumber) && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-slate-300 grid grid-cols-2 gap-1 text-[8px] text-slate-600 font-mono">
                  {asset.macAddress && (
                    <div className="truncate">
                      <span className="font-bold text-slate-400">MAC:</span> {asset.macAddress}
                    </div>
                  )}
                  {asset.invoiceNumber && (
                    <div className="truncate text-right">
                      <span className="font-bold text-slate-400">NF:</span> {asset.invoiceNumber}
                    </div>
                  )}
                </div>
              )}

              {/* Warning strip at bottom */}
              <div className="mt-2 text-center text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
                Propriedade Corporativa • Não Remover
              </div>
            </div>
          )}
        </div>

        {/* Tag metadata and tips */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1.5 print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Código da TAG:</span>
            <button
              onClick={handleCopyTag}
              className="flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-700 text-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{asset.id}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Esta etiqueta pode ser impressa em impressora térmica ou papel adesivo padrão (dimensões ~90x50mm) para fixação no equipamento físico.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Baixar Imagem QR</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Etiqueta</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
