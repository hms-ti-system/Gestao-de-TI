import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  ArrowLeft, 
  Settings, 
  Cpu, 
  HardDrive, 
  Layers, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  User, 
  Activity, 
  Link2,
  Play,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Laptop,
  ZoomIn,
  Pencil,
  Tag,
  Barcode,
  Building2,
  Copy,
  Check,
  Calendar,
  Image as ImageIcon,
  Plus
} from "lucide-react";
import { motion } from "motion/react";
import { Asset, User as UserType } from "../types";
import { ImageViewerModal } from "../components/ImageViewerModal";
import { EditAssetModal } from "../components/EditAssetModal";

interface AssetDetailsViewProps {
  assetId: string;
  setCurrentView: (view: string) => void;
  setSelectedAssetId: (id: string) => void;
}

export const AssetDetailsView: React.FC<AssetDetailsViewProps> = ({
  assetId,
  setCurrentView,
  setSelectedAssetId
}) => {
  const { assets, users, runDiagnostics, checkoutAsset, checkinAsset, showToast } = useApp();
  const [runningDiag, setRunningDiag] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Find asset
  const asset = assets.find(a => a.id === assetId);

  // Modals inside details
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Forms states
  const [checkoutUser, setCheckoutUser] = useState(users[0]?.id || "");
  const [checkoutLocation, setCheckoutLocation] = useState("Sede Principal");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkinStatus, setCheckinStatus] = useState<Asset["status"]>("Disponível");
  const [checkinCondition, setCheckinCondition] = useState("good");
  const [checkinLocation, setCheckinLocation] = useState("hq");
  const [checkinNotes, setCheckinNotes] = useState("");

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast("Copiado", `${label} (${text}) copiado para a área de transferência.`, "info");
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr || dateStr.trim() === "" || dateStr === "—") return "—";
    try {
      if (dateStr.includes("T")) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
        }
      }
      const clean = dateStr.trim().split(" ")[0];
      const parts = clean.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
        }
      }
      const d2 = new Date(dateStr);
      if (!isNaN(d2.getTime())) {
        return d2.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  if (!asset) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-4">
        <p className="text-slate-500 font-medium">Ativo {assetId} não encontrado.</p>
        <button 
          onClick={() => setCurrentView("assets")}
          className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  const isComputer = asset.category 
    ? (asset.category.toLowerCase().includes("notebook") || 
       asset.category.toLowerCase().includes("desktop") ||
       asset.category.toLowerCase().includes("servidor")) 
    : false;

  const hasBattery = asset.category
    ? (asset.category.toLowerCase().includes("notebook") || 
       asset.category.toLowerCase().includes("nobreak") ||
       asset.category.toLowerCase().includes("laptop") ||
       asset.category.toLowerCase().includes("ups"))
    : false;

  const handleRunDiagnostic = () => {
    setRunningDiag(true);
    runDiagnostics(asset.id);
    setTimeout(() => {
      setRunningDiag(false);
      showToast("Diagnóstico Concluído", "Relatório de integridade sincronizado com a nuvem.", "success");
    }, 1500);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkoutAsset(
      asset.id,
      checkoutUser,
      checkoutLocation,
      new Date().toISOString().split('T')[0],
      "",
      checkoutNotes
    );
    setShowCheckoutModal(false);
    setCheckoutNotes("");
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkinAsset(
      asset.id,
      checkinStatus,
      checkinCondition,
      checkinLocation,
      checkinNotes
    );
    setShowCheckinModal(false);
    setCheckinNotes("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3.5">
          <button 
            onClick={() => setCurrentView("assets")}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer shrink-0 mt-1"
            title="Voltar para todos os ativos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            {/* Top badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                {asset.id}
              </span>
              {asset.cmId && (
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                  CM/ID: {asset.cmId}
                </span>
              )}
              {asset.category && (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {asset.category}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                asset.status === "Disponível" 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : asset.status === "Atribuído"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {asset.status}
              </span>
            </div>

            {/* Asset Name & Subtitle */}
            <h2 className="font-sans text-2xl font-extrabold text-slate-900 mt-1 leading-tight">{asset.name}</h2>
            {(asset.manufacturer || asset.model || asset.seriesNumber) && (
              <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                {asset.manufacturer && <span className="font-semibold text-slate-700">{asset.manufacturer}</span>}
                {asset.manufacturer && asset.model && <span>•</span>}
                {asset.model && <span>Modelo: {asset.model}</span>}
                {asset.seriesNumber && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-600 bg-slate-100/80 px-1.5 py-0.5 rounded text-[11px]">
                      S/N: {asset.seriesNumber}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wide flex items-center gap-2 shadow-xs"
            title="Editar informações do ativo"
          >
            <Pencil className="w-4 h-4 text-blue-600" />
            <span>Editar Ativo</span>
          </button>

          {asset.status === "Disponível" ? (
            <button 
              onClick={() => setShowCheckoutModal(true)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wide flex items-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Entregar Ativo</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowCheckinModal(true)}
              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wide flex items-center gap-2 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Devolver ao Estoque</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: specs & history (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Identificação & Dados Gerais do Equipamento */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-blue-600" />
              Identificação & Dados do Equipamento
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fabricante</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{asset.manufacturer || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Modelo Técnico</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{asset.model || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Categoria</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{asset.category || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Número de Série (N/S)</p>
                  {asset.seriesNumber && (
                    <button 
                      onClick={() => handleCopy(asset.seriesNumber, "Número de Série")}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                      title="Copiar N/S"
                    >
                      {copiedField === "Número de Série" ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1 select-all">{asset.seriesNumber || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CM / ID Interno</p>
                  {asset.cmId && (
                    <button 
                      onClick={() => handleCopy(asset.cmId || "", "CM/ID")}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                      title="Copiar CM/ID"
                    >
                      {copiedField === "CM/ID" ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1">{asset.cmId || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status do Equipamento</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    asset.status === "Disponível" 
                      ? "bg-green-100 text-green-800" 
                      : asset.status === "Atribuído"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {asset.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descrição do Ativo */}
          {asset.description && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                Descrição do Ativo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {asset.description}
              </p>
            </div>
          )}

          {/* Hardware Configuration card */}
          {(isComputer || asset.cpu || asset.ram || asset.storage || asset.os || asset.macAddress) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Configuração de Hardware
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CPU</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{asset.cpu || "—"}</p>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">RAM / Memória</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{asset.ram || "—"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Armazenamento</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{asset.storage || "—"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sistema Operacional</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{asset.os || "—"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Endereço MAC</p>
                  <p className="text-xs font-mono font-medium text-slate-600 mt-1 truncate">{asset.macAddress || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial and registration details card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Informações de Cadastro e Financeiras
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data de Cadastro</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {formatDateDisplay(asset.registrationDate || asset.createdAt || asset.purchaseDate)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data de Compra</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {formatDateDisplay(asset.purchaseDate || asset.registrationDate)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fornecedor</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">{asset.supplier || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Custo Adquirido</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">{asset.cost || "—"}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vencimento de Garantia</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {formatDateDisplay(asset.warrantyDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Lifecycle timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Histórico de Ciclo de Vida
            </h3>
            <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
              {(asset.history && asset.history.length > 0) ? (
                asset.history.map((ev) => (
                  <div key={ev.id} className="relative">
                    {/* Timeline point */}
                    <span className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      ev.type === "success" 
                        ? "bg-green-500" 
                        : ev.type === "warning"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}></span>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">{ev.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ev.description}</p>
                      {ev.user && (
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">Responsável: {ev.user}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Nenhum registro histórico de movimentação ainda.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: active user, diagnostics, photo (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Foto do Ativo */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Foto do Ativo
              </h3>
              {asset.image && (
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Ampliar
                </button>
              )}
            </div>

            {asset.image ? (
              /* Auto-framed photo container */
              <div 
                onClick={() => setShowImageModal(true)}
                className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 flex items-center justify-center relative group cursor-pointer hover:border-blue-500 transition-all shadow-xs"
                title="Clique para ampliar a foto"
              >
                <img
                  src={asset.image}
                  alt={asset.name}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain p-1.5 select-none"
                />
                
                {/* Hover overlay with zoom hint */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[1px]">
                  <div className="p-2.5 bg-white/20 rounded-full mb-1.5 shadow-sm">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide">Clique para ver ampliado</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setShowEditModal(true)}
                className="w-full aspect-video rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100/70 hover:border-blue-400 cursor-pointer transition-all p-4 text-center"
                title="Adicionar foto ao ativo"
              >
                <div className="p-2.5 bg-white rounded-full border border-slate-200 text-slate-400 shadow-xs">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">Nenhuma foto cadastrada</p>
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5">+ Adicionar foto</p>
                </div>
              </div>
            )}
          </div>

          {/* Current Assignee profile */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Portador Responsável
            </h3>
            {asset.assignedToUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={asset.assignedToUser.avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-none">{asset.assignedToUser.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wide">{asset.assignedToUser.role}</p>
                  </div>
                </div>

                <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-600">
                  <p><strong>Departamento:</strong> {asset.assignedToUser.department}</p>
                  <p><strong>Filial/Local:</strong> {asset.assignedToUser.location}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs">
                <p className="font-semibold text-slate-700">Disponível no Estoque</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Equipamento pronto para alocação.</p>
              </div>
            )}
          </div>

          {/* Asset Health Diagnostics card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Saúde do Ativo
              </h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                asset.health > 80 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : asset.health > 50
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {asset.health > 80 ? "Ótimo" : asset.health > 50 ? "Alerta" : "Crítico"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-600">Integridade Geral</span>
                  <span className="font-mono font-bold text-slate-800">{asset.health}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      asset.health > 80 
                        ? "bg-green-500" 
                        : asset.health > 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${asset.health}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 uppercase tracking-wide font-bold">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span>Bateria</span>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">{asset.battery || (hasBattery ? "Excelente" : "N/A")}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span>Diagnósticos</span>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">Nuvem Ok</p>
                </div>
              </div>

              {(hasBattery || asset.batteryLastReplaced || asset.batteryNextReplacement) && (
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 uppercase tracking-wide font-bold pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Última Troca Bateria</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      {formatDateDisplay(asset.batteryLastReplaced)}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Próxima Troca</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      {formatDateDisplay(asset.batteryNextReplacement)}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleRunDiagnostic}
                disabled={runningDiag}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold rounded-lg text-[11px] uppercase tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {runningDiag ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                    <span>Iniciar Diagnóstico</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Linked assets */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              Ativos Vinculados
            </h3>
            {asset.linkedAssets && asset.linkedAssets.length > 0 ? (
              <div className="space-y-2">
                {asset.linkedAssets.map((la) => (
                  <div 
                    key={la.id}
                    onClick={() => setSelectedAssetId(la.id)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{la.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{la.id} • {la.category}</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600">Ver</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                Nenhum periférico vinculado diretamente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Saída de Ativo</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Atribuição de Responsabilidade</p>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Selecionar Usuário Beneficiário</label>
                <select
                  value={checkoutUser}
                  onChange={(e) => setCheckoutUser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  {users.filter(u => u.id !== "user-admin").map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Local de Implantação</label>
                <select
                  value={checkoutLocation}
                  onChange={(e) => setCheckoutLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="Sede Principal (HQ)">Sede Principal (HQ)</option>
                  <option value="Remoto - Home Office">Remoto - Home Office</option>
                  <option value="Escritório Regional SP">Escritório Regional SP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Notas de Configuração</label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Acessórios inclusos, pendências, observações gerais de entrega..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Confirmar Saída
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Checkin Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Entrada / Devolução de Ativo</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Retorno ao Estoque ou Manutenção</p>
              </div>
            </div>

            <form onSubmit={handleCheckinSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Status Pós-Retorno</label>
                <select
                  value={checkinStatus}
                  onChange={(e) => setCheckinStatus(e.target.value as Asset["status"])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="Disponível">Disponível (Pronto para Reatribuição)</option>
                  <option value="Manutenção">Manutenção (Necessita Reparo / Limpeza)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Condição Física do Retorno</label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="good">Em Perfeito Estado (Sem Danos)</option>
                  <option value="minor_damage">Pequenas Avarias / Arranhões</option>
                  <option value="damaged">Danificado / Defeito Funcional</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Local de Armazenamento</label>
                <select
                  value={checkinLocation}
                  onChange={(e) => setCheckinLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="hq">Estoque Central (Sede)</option>
                  <option value="it_lab">Laboratório de Suporte Técnico</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Observações do Recebimento</label>
                <textarea
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="Relatório de integridade, formatação executada, itens faltantes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Confirmar Retorno
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && (
        <EditAssetModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          asset={asset}
        />
      )}

      {/* Image Viewer Modal */}
      {asset.image && showImageModal && (
        <ImageViewerModal
          isOpen={showImageModal}
          imageUrl={asset.image}
          title={asset.name}
          subtitle={`${asset.manufacturer || ""} ${asset.model || ""} (${asset.id})`}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};
