import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  X, 
  Camera, 
  Upload, 
  Keyboard, 
  QrCode, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  PlusCircle,
  Tag,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Asset } from "../types";
import { useApp } from "../context/AppContext";
import { extractTagFromQrCode, matchAssetWithCode, playScanSound } from "../utils/tagParser";

export interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Modo de operação:
  // "lookup" = busca um ativo já cadastrado e abre na tela
  // "capture" = lê a plaqueta e preenche o campo TAG automaticamente no formulário
  mode?: "lookup" | "capture";
  // Callbacks de busca
  onAssetFound?: (assetId: string) => void;
  onScanSuccess?: (code: string) => void;
  // Callback de captura para o campo TAG
  onTagCaptured?: (tag: string, rawCode?: string) => void;
  // Ao escanear uma plaqueta não cadastrada no modo lookup, permite cadastrá-la diretamente
  onRegisterNewAssetWithTag?: (tag: string) => void;
  title?: string;
  subtitle?: string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  mode = "lookup",
  onAssetFound,
  onScanSuccess,
  onTagCaptured,
  onRegisterNewAssetWithTag,
  title,
  subtitle,
}) => {
  const { assets, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [unregisteredTag, setUnregisteredTag] = useState<string | null>(null);
  const [capturedTagFeedback, setCapturedTagFeedback] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "qr-reader-container-active";

  // Busca ativo com base no código lido
  const findMatchingAsset = (decodedText: string): Asset | null => {
    const clean = decodedText.trim();
    if (!clean) return null;

    // Usar algoritmo robusto de comparação
    const match = assets.find((a) => matchAssetWithCode(a, clean));
    return match || null;
  };

  // Trata sucesso na leitura do código QR
  const handleDecodedCode = (decodedText: string) => {
    const parsed = extractTagFromQrCode(decodedText);
    const tagCode = parsed.tag || decodedText.trim();

    // Tocar som de bip de sucesso
    playScanSound();

    if (mode === "capture") {
      // MODO CAPTURA: Usado no cadastro de novos ativos ou edição
      setCapturedTagFeedback(tagCode);
      stopCamera();

      showToast(
        "Plaqueta Lida com Sucesso!",
        `TAG "${tagCode}" identificada e preenchida automaticamente.`,
        "success"
      );

      if (onTagCaptured) {
        onTagCaptured(tagCode, decodedText);
      } else if (onScanSuccess) {
        onScanSuccess(tagCode);
      }

      setTimeout(() => {
        onClose();
      }, 750);
      return;
    }

    // MODO LOOKUP: Busca de ativo existente para visualização
    const match = findMatchingAsset(decodedText);

    if (match) {
      setFoundAsset(match);
      setUnregisteredTag(null);
      stopCamera();

      showToast(
        "Ativo Localizado via Plaqueta!",
        `${match.name} (TAG: ${match.id}) encontrado com sucesso. Abrindo ficha...`,
        "success"
      );

      setTimeout(() => {
        if (onAssetFound) {
          onAssetFound(match.id);
        } else if (onScanSuccess) {
          onScanSuccess(match.id);
        }
        onClose();
      }, 700);
    } else {
      // Plaqueta lida com sucesso, mas o ativo não está cadastrado
      setUnregisteredTag(tagCode);
      setFoundAsset(null);

      showToast(
        "Plaqueta Identificada (Sem Cadastro)",
        `A TAG "${tagCode}" foi lida, mas não pertence a nenhum ativo no banco de dados.`,
        "warning"
      );
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);
    setFoundAsset(null);
    setUnregisteredTag(null);
    setCapturedTagFeedback(null);

    try {
      // Aguardar renderização do elemento no DOM
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const scanner = new Html5Qrcode(readerElementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 230, height: 230 },
        },
        (decodedText) => {
          handleDecodedCode(decodedText);
        },
        () => {
          // Ignorar erros momentâneos de leitura de frame
        }
      );
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(
        "Não foi possível acessar a câmera do dispositivo. Verifique as permissões de vídeo ou utilize o upload de foto da plaqueta."
      );
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingImage(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-file-detector-instance");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedCode(decodedText);
    } catch (err) {
      showToast(
        "Leitura Não Concluída",
        "Não foi possível ler o QR Code da plaqueta na foto enviada. Tente com mais iluminação ou foco.",
        "warning"
      );
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedCode(manualCode);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              mode === "capture" 
                ? "bg-purple-50 text-purple-600 border-purple-100" 
                : "bg-blue-50 text-blue-600 border-blue-100"
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {title || (mode === "capture" ? "Ler Plaqueta de Patrimônio" : "Leitor de QR Code & Plaqueta")}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                {subtitle || (mode === "capture" ? "Preenchimento Automático de TAG" : "Consulta Rápida de Ativo")}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Informativo do Modo */}
        {mode === "capture" && (
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-purple-900 text-xs">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <p className="text-[11px] leading-snug">
              Aponte para o QR Code da plaquetinha. O número da <strong>TAG</strong> será extraído e adicionado automaticamente ao cadastro!
            </p>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "camera"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Câmera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Foto / Imagem</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "manual"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Digitar</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === "camera" && (
          <div className="space-y-3">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner flex flex-col items-center justify-center">
              {/* HTML5 QR Container */}
              <div id={readerElementId} className="w-full h-full" />

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center text-white z-20">
                  <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs font-semibold leading-relaxed mb-3">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tentar Novamente
                  </button>
                </div>
              )}

              {/* Scanning visual overlay */}
              {!cameraError && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-blue-500/80 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1 rounded-tl-sm"></div>
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1 rounded-tr-sm"></div>
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1 rounded-bl-sm"></div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1 rounded-br-sm"></div>
                    
                    {/* Linha de escaneamento animada */}
                    <div className="w-full h-0.5 bg-blue-400/80 shadow-[0_0_8px_#38bdf8] animate-bounce mt-24" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Posicione o QR Code da plaquetinha dentro do quadro.</span>
              <span className="font-bold text-blue-600">Autofoco ativo</span>
            </div>
          </div>
        )}

        {/* Tab 2: Upload QR Image */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <div id="qr-file-detector-instance" className="hidden" />
            <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-2.5 bg-slate-50 hover:bg-blue-50/30 transition-all cursor-pointer text-center">
              <div className="p-3 bg-white rounded-full border border-slate-200 text-blue-600 shadow-xs">
                {analyzingImage ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {analyzingImage ? "Processando plaqueta..." : "Selecione a foto da plaquetinha com QR Code"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Formatos aceitos: JPG, PNG, WebP
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={analyzingImage}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Tab 3: Manual Code Entry */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Número da Plaqueta (TAG) ou QR Code
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="ex: 000937 ou TAG-2023-0842"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 outline-none focus:border-blue-600"
              />
            </div>

            {mode === "lookup" && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Atalhos rápidos para teste:</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {assets.slice(0, 4).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setManualCode(a.id);
                        handleDecodedCode(a.id);
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {a.id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {mode === "capture" ? (
                  <>
                    <Tag className="w-3.5 h-3.5" />
                    <span>Usar esta TAG</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Localizar Ativo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Feedback de TAG Capturada (Modo Cadastro) */}
        {capturedTagFeedback && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 text-purple-900">
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold">TAG Identificada com Sucesso!</p>
              <p className="text-[11px] font-mono font-bold text-purple-700">
                {capturedTagFeedback} • Aplicando ao formulário...
              </p>
            </div>
          </div>
        )}

        {/* Feedback de Ativo Localizado (Modo Consulta) */}
        {foundAsset && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{foundAsset.name}</p>
              <p className="text-[10px] text-emerald-700 font-mono">
                TAG: {foundAsset.id} • Abrindo informações do ativo...
              </p>
            </div>
          </div>
        )}

        {/* Feedback de Plaqueta Não Cadastrada com Botão Direto para Cadastrar */}
        {unregisteredTag && mode === "lookup" && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Plaqueta Não Cadastrada</p>
                <p className="text-[11px] text-amber-700">
                  O código lido <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">{unregisteredTag}</strong> ainda não está associado a nenhum ativo.
                </p>
              </div>
            </div>

            {onRegisterNewAssetWithTag && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                  onRegisterNewAssetWithTag(unregisteredTag);
                }}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Cadastrar Novo Ativo com a TAG {unregisteredTag}</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
