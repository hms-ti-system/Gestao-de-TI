import React, { useState, useEffect } from "react";
import { 
  Laptop, 
  Plus, 
  Trash2, 
  ZoomIn, 
  X, 
  Check, 
  Cpu, 
  HardDrive, 
  Layers, 
  Battery, 
  Calendar, 
  DollarSign, 
  Building2, 
  FileText, 
  UserCheck, 
  AlertTriangle,
  Upload,
  Link,
  RefreshCw,
  HelpCircle,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Asset, User } from "../types";
import { useApp } from "../context/AppContext";
import { ImageViewerModal } from "./ImageViewerModal";
import { AssetTagModal } from "./AssetTagModal";

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const { users, assets, updateAsset, showToast } = useApp();

  // Form states initialized with existing asset data
  const [name, setName] = useState(asset.name || "");
  const [manufacturer, setManufacturer] = useState(asset.manufacturer || "");
  const [model, setModel] = useState(asset.model || "");
  const [category, setCategory] = useState(asset.category || "Notebook");
  const [seriesNumber, setSeriesNumber] = useState(asset.seriesNumber || "");
  const [cmId, setCmId] = useState(asset.cmId || "");
  const [status, setStatus] = useState<Asset["status"]>(asset.status || "Disponível");
  const [assignedToUserId, setAssignedToUserId] = useState<string>(asset.assignedToUserId || "");
  
  const [cpu, setCpu] = useState(asset.cpu || "");
  const [ram, setRam] = useState(asset.ram || "");
  const [storage, setStorage] = useState(asset.storage || "");
  const [os, setOs] = useState(asset.os || "");
  const [macAddress, setMacAddress] = useState(asset.macAddress || "");
  
  const [batteryReplacedDate, setBatteryReplacedDate] = useState(asset.batteryLastReplaced || "");
  const [batteryNextDate, setBatteryNextDate] = useState(asset.batteryNextReplacement || "");
  
  const [cost, setCost] = useState(asset.cost || "");
  const [supplier, setSupplier] = useState(asset.supplier || "");
  const [invoiceNumber, setInvoiceNumber] = useState(asset.invoiceNumber || "");
  const [purchaseDate, setPurchaseDate] = useState(asset.purchaseDate || "");
  const [warrantyDate, setWarrantyDate] = useState(asset.warrantyDate || "");
  const [image, setImage] = useState(asset.image || "");
  const [description, setDescription] = useState(asset.description || "");

  const [showTagModal, setShowTagModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Sync state whenever selected asset changes
  useEffect(() => {
    if (asset) {
      setName(asset.name || "");
      setManufacturer(asset.manufacturer || "");
      setModel(asset.model || "");
      setCategory(asset.category || "Notebook");
      setSeriesNumber(asset.seriesNumber || "");
      setCmId(asset.cmId || "");
      setStatus(asset.status || "Disponível");
      setAssignedToUserId(asset.assignedToUserId || "");
      setCpu(asset.cpu || "");
      setRam(asset.ram || "");
      setStorage(asset.storage || "");
      setOs(asset.os || "");
      setMacAddress(asset.macAddress || "");
      setBatteryReplacedDate(asset.batteryLastReplaced || "");
      setBatteryNextDate(asset.batteryNextReplacement || "");
      setCost(asset.cost || "");
      setSupplier(asset.supplier || "");
      setInvoiceNumber(asset.invoiceNumber || "");
      setPurchaseDate(asset.purchaseDate || "");
      setWarrantyDate(asset.warrantyDate || "");
      setImage(asset.image || "");
      setDescription(asset.description || "");
    }
  }, [asset]);

  if (!isOpen) return null;

  // Datalists
  const uniqueManufacturers = Array.from(new Set([
    "Apple Inc.",
    "Dell Inc.",
    "Lenovo",
    "HP",
    "Asus",
    "Samsung",
    "LG",
    "APC / Schneider",
    "SMS Nobreaks",
    "Logitech",
    ...assets.map(a => a.manufacturer)
  ].filter(Boolean)));

  const uniqueCategories = Array.from(new Set([
    "Notebook",
    "Desktop",
    "Nobreak",
    "Servidor",
    "Monitor",
    "Teclado",
    "Mouse",
    "Headset",
    "Impressora",
    "Switch / Rede",
    ...assets.map(a => a.category)
  ].filter(Boolean)));

  const uniqueOs = Array.from(new Set([
    "Windows 11 Pro",
    "Windows 10 Pro",
    "macOS Sonoma",
    "macOS Ventura",
    "Ubuntu 22.04 LTS",
    "Red Hat Enterprise Linux",
    ...assets.map(a => a.os || "")
  ].filter(Boolean)));

  const isComputerCategory = (cat: string) => {
    if (!cat) return false;
    const norm = cat.trim().toLowerCase();
    return norm === "notebook" || norm === "desktop" || norm.includes("notebook") || norm.includes("desktop") || norm.includes("servidor");
  };

  const hasBatteryCategory = (cat: string) => {
    if (!cat) return false;
    const norm = cat.trim().toLowerCase();
    return (
      norm === "notebook" ||
      norm === "nobreak" ||
      norm.includes("notebook") ||
      norm.includes("nobreak") ||
      norm.includes("laptop") ||
      norm.includes("ups")
    );
  };

  // Image Processing
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Arquivo Inválido", "Por favor, selecione uma imagem válida (PNG, JPG, WebP).", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
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
          const compressed = canvas.toDataURL("image/jpeg", 0.88);
          setImage(compressed);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let assignedUserObj: User | null = null;
    let finalStatus: Asset["status"] = status;

    if (status === "Atribuído") {
      if (assignedToUserId) {
        assignedUserObj = users.find(u => u.id === assignedToUserId) || null;
      } else {
        // Default to first user if none chosen
        assignedUserObj = users[0] || null;
      }
    } else {
      assignedUserObj = null;
    }

    const updatedData: Partial<Asset> = {
      name: name.trim(),
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      category: category.trim(),
      seriesNumber: seriesNumber.trim(),
      cmId: cmId.trim() || undefined,
      macAddress: macAddress.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      purchaseDate: purchaseDate || undefined,
      warrantyDate: warrantyDate || undefined,
      status: finalStatus,
      assignedToUserId: status === "Atribuído" ? (assignedUserObj?.id || null) : null,
      assignedToUser: status === "Atribuído" ? assignedUserObj : null,
      image: image || undefined,
      description: description.trim() || undefined,
      cpu: isComputerCategory(category) ? cpu.trim() || undefined : undefined,
      ram: isComputerCategory(category) ? ram.trim() || undefined : undefined,
      storage: isComputerCategory(category) ? storage.trim() || undefined : undefined,
      os: isComputerCategory(category) ? os.trim() || undefined : undefined,
      batteryLastReplaced: hasBatteryCategory(category) ? batteryReplacedDate || undefined : undefined,
      batteryNextReplacement: hasBatteryCategory(category) ? batteryNextDate || undefined : undefined,
      cost: cost.trim() || undefined,
      supplier: supplier.trim() || undefined,
    };

    updateAsset(asset.id, updatedData);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-lg font-bold text-slate-900 leading-tight">
                    Editar Ativo
                  </h3>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {asset.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Atualize os dados técnicos, foto, especificações e status do ativo
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSubmit} className="overflow-y-auto pr-1.5 space-y-5 text-xs">
            {/* Foto do Ativo */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                Foto do Ativo
              </label>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
                  isDragging ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {image ? (
                  <div className="flex flex-col items-center gap-2.5 w-full">
                    <div 
                      onClick={() => {
                        setPreviewImage({
                          url: image,
                          title: name || asset.name || "Foto do Ativo",
                          subtitle: `${manufacturer} ${model} (${asset.id})`
                        });
                      }}
                      className="relative w-full max-w-[260px] h-36 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-white group cursor-pointer hover:border-blue-500 transition-all"
                      title="Clique para ampliar a foto"
                    >
                      <img 
                        src={image} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain p-1.5 select-none" 
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[1px]">
                        <div className="p-2 bg-white/20 rounded-full mb-1">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold tracking-wide">Clique para ampliar</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage("");
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-md z-10"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 text-[11px] shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Substituir Foto</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors text-[11px]"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-3 w-full">
                    <div className="p-2.5 bg-white rounded-full border border-slate-200 shadow-xs text-blue-600 mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Arraste uma foto ou clique para escolher</span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP ou GIF otimizados automaticamente</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Status e Atribuição */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Status & Atribuição de Usuário
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Status do Ativo</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStat = e.target.value as Asset["status"];
                      setStatus(newStat);
                      if (newStat === "Disponível") {
                        setAssignedToUserId("");
                      } else if (newStat === "Atribuído" && !assignedToUserId && users.length > 0) {
                        setAssignedToUserId(users[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold outline-none focus:border-blue-600"
                  >
                    <option value="Disponível">Disponível (Em Estoque)</option>
                    <option value="Atribuído">Atribuído (Em Uso com Colaborador)</option>
                    <option value="Manutenção">Manutenção (Em Reparo / Suporte)</option>
                  </select>
                </div>

                {status === "Atribuído" ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Colaborador Responsável</label>
                    <select
                      value={assignedToUserId}
                      onChange={(e) => setAssignedToUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold outline-none focus:border-blue-600"
                    >
                      <option value="">Selecione um colaborador...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role} - {u.department})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center text-slate-500 text-xs italic bg-white p-2.5 rounded-lg border border-slate-200">
                    {status === "Disponível" 
                      ? "O ativo está livre no estoque para novas entregas." 
                      : "O ativo está isolado em bancada técnica / manutenção."}
                  </div>
                )}
              </div>
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome do Ativo</label>
                <input
                  type="text"
                  required
                  placeholder="ex: MacBook Pro 14 M2 Max"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Fabricante</label>
                <input
                  type="text"
                  required
                  list="edit-manufacturers-list"
                  placeholder="ex: Apple Inc."
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
                <datalist id="edit-manufacturers-list">
                  {uniqueManufacturers.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Modelo Técnico</label>
                <input
                  type="text"
                  required
                  placeholder="ex: A2779 (2023)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Número de Série (N/S)</label>
                <input
                  type="text"
                  required
                  placeholder="ex: C02FX5GZMD6R"
                  value={seriesNumber}
                  onChange={(e) => setSeriesNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">CM / ID Interno</label>
                <input
                  type="text"
                  placeholder="ex: CM-1049 ou ID Interno"
                  value={cmId}
                  onChange={(e) => setCmId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                <input
                  type="text"
                  required
                  list="edit-categories-list"
                  placeholder="ex: Notebook"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
                <datalist id="edit-categories-list">
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Especificações de Computador (CPU, RAM, Armazenamento, OS) */}
              {isComputerCategory(category) && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Processador (CPU)</label>
                    <input
                      type="text"
                      placeholder="ex: Intel Core i7 13700H / Apple M2"
                      value={cpu}
                      onChange={(e) => setCpu(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Memória RAM</label>
                    <input
                      type="text"
                      placeholder="ex: 16GB DDR5 4800MHz"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Armazenamento</label>
                    <input
                      type="text"
                      placeholder="ex: 512GB NVMe SSD"
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Sistema Operacional</label>
                    <input
                      type="text"
                      list="edit-os-list"
                      placeholder="ex: Windows 11 Pro / macOS"
                      value={os}
                      onChange={(e) => setOs(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                    />
                    <datalist id="edit-os-list">
                      {uniqueOs.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </div>
                </>
              )}

              {/* Bateria para Notebooks e Nobreaks */}
              {hasBatteryCategory(category) && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Data de Troca de Bateria</label>
                    <input
                      type="date"
                      value={batteryReplacedDate}
                      onChange={(e) => setBatteryReplacedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wide">Próxima Troca de Bateria</label>
                    <input
                      type="date"
                      value={batteryNextDate}
                      onChange={(e) => setBatteryNextDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                </>
              )}

              {/* Conectividade de Rede & MAC */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Endereço MAC (Físico)</label>
                <input
                  type="text"
                  placeholder="ex: 00:1A:2B:3C:4D:5E"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              {/* Número da Nota Fiscal */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Número da Nota Fiscal (NF)</label>
                <input
                  type="text"
                  placeholder="ex: NF-e 000.182.904"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              {/* Dados Financeiros, Compra e Garantia */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Data de Compra</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Validade da Garantia</label>
                <input
                  type="date"
                  value={warrantyDate}
                  onChange={(e) => setWarrantyDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Custo Adquirido</label>
                <input
                  type="text"
                  placeholder="ex: R$ 6.499,00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Fornecedor / Loja</label>
                <input
                  type="text"
                  placeholder="ex: Dell Direct, Apple Store, Kalunga Corporativo"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              {/* Registro automático info */}
              <div className="space-y-1 sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">
                  Data de Registro no Sistema:{" "}
                  <strong className="text-slate-800">
                    {asset.createdAt
                      ? new Date(asset.createdAt).toLocaleDateString("pt-BR")
                      : asset.registrationDate || "Registro Automático"}
                  </strong>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Gravado automaticamente</span>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Descrição / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais sobre o equipamento, patrimônio ou licença vinculada..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 resize-none text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setShowTagModal(true)}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Ver TAG / QR Code</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Asset Tag & QR Code Modal */}
      {showTagModal && (
        <AssetTagModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          asset={{
            ...asset,
            name,
            manufacturer,
            model,
            seriesNumber,
            macAddress,
            invoiceNumber,
          }}
        />
      )}

      {/* Full screen preview */}
      {previewImage && (
        <ImageViewerModal
          isOpen={true}
          imageUrl={previewImage.url}
          title={previewImage.title}
          subtitle={previewImage.subtitle}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
};
