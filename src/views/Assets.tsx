import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  Laptop, 
  Search, 
  Download, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Filter,
  Trash2,
  Eye,
  Pencil,
  Calendar,
  Building,
  MapPin,
  ClipboardList,
  ZoomIn,
  FileSpreadsheet,
  QrCode,
  Tag,
  ShieldAlert,
  Camera
} from "lucide-react";
import { motion } from "motion/react";
import { Asset, User } from "../types";
import { ImageViewerModal } from "../components/ImageViewerModal";
import { EditAssetModal } from "../components/EditAssetModal";
import { QrScannerModal } from "../components/QrScannerModal";
import { AssetTagModal } from "../components/AssetTagModal";
import { PhysicalAssetPlaque } from "../components/PhysicalAssetPlaque";

// Helper for warranty expiration alerts (30, 15, 10, 5 days and expired)
export const getWarrantyAlert = (warrantyDate?: string) => {
  if (!warrantyDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(warrantyDate + "T00:00:00");
  if (isNaN(expiry.getTime())) return null;
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { type: "expired", label: "Garantia Vencida", badgeClass: "bg-red-100 text-red-700 border-red-200", days: diffDays };
  }
  if (diffDays <= 5) {
    return { type: "critical", label: `Garantia vence em ${diffDays}d (Crítico)`, badgeClass: "bg-rose-100 text-rose-700 border-rose-200 animate-pulse", days: diffDays };
  }
  if (diffDays <= 10) {
    return { type: "urgent", label: `Garantia vence em ${diffDays}d (10 dias)`, badgeClass: "bg-orange-100 text-orange-700 border-orange-200", days: diffDays };
  }
  if (diffDays <= 15) {
    return { type: "warning", label: `Garantia vence em ${diffDays}d (15 dias)`, badgeClass: "bg-amber-100 text-amber-700 border-amber-200", days: diffDays };
  }
  if (diffDays <= 30) {
    return { type: "notice", label: `Garantia vence em ${diffDays}d (30 dias)`, badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200", days: diffDays };
  }
  return null;
};

interface AssetsProps {
  setCurrentView: (view: string) => void;
  setSelectedAssetId: (id: string) => void;
}

export const Assets: React.FC<AssetsProps> = ({ 
  setCurrentView, 
  setSelectedAssetId 
}) => {
  const { 
    assets, 
    users, 
    addAsset, 
    checkoutAsset, 
    checkinAsset, 
    showToast 
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeAssetId, setActiveAssetId] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCaptureTagScanner, setShowCaptureTagScanner] = useState(false);
  const [tagScannedSuccess, setTagScannedSuccess] = useState(false);
  const [tagModalAsset, setTagModalAsset] = useState<Asset | null>(null);

  // Add Asset Form State
  const [newTagId, setNewTagId] = useState("");
  const [newName, setNewName] = useState("");
  const [newManufacturer, setNewManufacturer] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newCmId, setNewCmId] = useState("");
  const [newMacAddress, setNewMacAddress] = useState("");
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");
  const [newPurchaseDate, setNewPurchaseDate] = useState("");
  const [newWarrantyDate, setNewWarrantyDate] = useState("");
  const [newBatteryReplacedDate, setNewBatteryReplacedDate] = useState("");
  const [newBatteryNextDate, setNewBatteryNextDate] = useState("");
  const [newCpu, setNewCpu] = useState("");
  const [newRam, setNewRam] = useState("");
  const [newStorage, setNewStorage] = useState("");
  const [newOs, setNewOs] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Unique manufacturers and categories for the dynamic suggestion lists
  const uniqueManufacturers = Array.from(new Set([
    "Apple Inc.",
    "Dell Inc.",
    "Lenovo",
    "HP",
    "Asus",
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
    ...assets.map(a => a.category)
  ].filter(Boolean)));

  const isComputerCategory = (cat: string) => {
    if (!cat) return false;
    const norm = cat.trim().toLowerCase();
    return norm === "notebook" || norm === "desktop" || norm.includes("notebook") || norm.includes("desktop");
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

  const resetAddForm = () => {
    setNewTagId("");
    setTagScannedSuccess(false);
    setNewName("");
    setNewManufacturer("");
    setNewModel("");
    setNewCategory("");
    setNewSerial("");
    setNewCmId("");
    setNewMacAddress("");
    setNewInvoiceNumber("");
    setNewPurchaseDate("");
    setNewWarrantyDate("");
    setNewBatteryReplacedDate("");
    setNewBatteryNextDate("");
    setNewCpu("");
    setNewRam("");
    setNewStorage("");
    setNewOs("");
    setNewCost("");
    setNewSupplier("");
    setNewImage("");
    setNewDescription("");
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    const autoTag = "TAG-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 9000 + 1000);
    setNewTagId(autoTag);
    setShowAddModal(true);
  };

  const uniqueOs = Array.from(new Set([
    "Windows 11 Pro",
    "Windows 10 Pro",
    "macOS Sonoma",
    "macOS Sequoia",
    "Ubuntu 22.04 LTS",
    "Linux",
    ...assets.map(a => a.os).filter(Boolean) as string[]
  ]));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [customLocations, setCustomLocations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ac_custom_locations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const uniqueLocations = Array.from(new Set([
    "Sede Principal (HQ)",
    "Remoto - Home Office",
    "Escritório Regional SP",
    "Laboratório TI",
    "Estoque Central",
    ...users.map(u => u.location),
    ...customLocations
  ].filter(Boolean)));

  // Checkout Form State
  const [checkoutUser, setCheckoutUser] = useState(users.filter(u => u.id !== "user-admin")[0]?.id || users[0]?.id || "");
  const [checkoutLocation, setCheckoutLocation] = useState("Sede Principal (HQ)");
  const [checkoutNotes, setCheckoutNotes] = useState("");

  // Checkin Form State
  const [checkinStatus, setCheckinStatus] = useState<Asset["status"]>("Disponível");
  const [checkinCondition, setCheckinCondition] = useState("good");
  const [checkinLocation, setCheckinLocation] = useState("hq");
  const [checkinNotes, setCheckinNotes] = useState("");

  // Calculations
  const totalAssets = assets.length;
  const inUseCount = assets.filter(a => a.status === "Atribuído").length;
  const availableCount = assets.filter(a => a.status === "Disponível").length;
  const maintenanceCount = assets.filter(a => a.status === "Manutenção").length;
  const activeAsset = assets.find(a => a.id === activeAssetId);

  // Filter Assets
  const filteredAssets = assets.filter(a => {
    const matchQuery = 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      (a.cmId || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.assignedToUser?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.seriesNumber || "").toLowerCase().includes(search.toLowerCase());

    const matchCat = selectedCategory === "all" || a.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchStatus = selectedStatus === "all" || a.status === selectedStatus;

    return matchQuery && matchCat && matchStatus;
  });

  const handleAssetClick = (id: string) => {
    setSelectedAssetId(id);
    setCurrentView("asset-detail");
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const isComp = isComputerCategory(newCategory);
    const hasBattery = hasBatteryCategory(newCategory);
    const nowIso = new Date().toISOString();
    const regDate = nowIso.split("T")[0];
    const generatedTag = newTagId.trim() || ("TAG-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 9000 + 1000));

    addAsset({
      id: generatedTag,
      name: newName.trim(),
      seriesNumber: newSerial.trim(),
      cmId: newCmId.trim() || undefined,
      macAddress: newMacAddress.trim() || undefined,
      invoiceNumber: newInvoiceNumber.trim() || undefined,
      purchaseDate: newPurchaseDate || undefined,
      warrantyDate: newWarrantyDate || undefined,
      manufacturer: newManufacturer.trim(),
      model: newModel.trim(),
      category: newCategory.trim(),
      status: "Disponível",
      createdAt: nowIso,
      registrationDate: regDate,
      cpu: isComp ? newCpu.trim() || undefined : undefined,
      ram: isComp ? newRam.trim() || undefined : undefined,
      storage: isComp ? newStorage.trim() || undefined : undefined,
      os: isComp ? newOs.trim() || undefined : undefined,
      batteryLastReplaced: hasBattery ? (newBatteryReplacedDate || undefined) : undefined,
      batteryNextReplacement: hasBattery ? (newBatteryNextDate || undefined) : undefined,
      cost: newCost.trim() || undefined,
      supplier: newSupplier.trim() || undefined,
      battery: hasBattery ? "Excelente" : undefined,
      linkedAssets: [],
      image: newImage || undefined,
      description: newDescription.trim() || undefined,
    });
    setShowAddModal(false);
    resetAddForm();
  };

  const triggerCheckout = (assetId: string) => {
    setActiveAssetId(assetId);
    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutLocation.trim() && !customLocations.includes(checkoutLocation.trim())) {
      const updated = [...customLocations, checkoutLocation.trim()];
      setCustomLocations(updated);
      try {
        localStorage.setItem("ac_custom_locations", JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
    }
    checkoutAsset(
      activeAssetId,
      checkoutUser,
      checkoutLocation,
      new Date().toISOString().split('T')[0],
      "",
      checkoutNotes
    );
    setShowCheckoutModal(false);
    setCheckoutNotes("");
  };

  const triggerCheckin = (assetId: string) => {
    setActiveAssetId(assetId);
    setShowCheckinModal(true);
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkinAsset(
      activeAssetId,
      checkinStatus,
      checkinCondition,
      checkinLocation,
      checkinNotes
    );
    setShowCheckinModal(false);
    setCheckinNotes("");
  };

  const handleExport = () => {
    try {
      // CSV headers in Portuguese corresponding to the table columns and details
      const headers = [
        "Tag do Ativo (ID)",
        "Nome do Ativo",
        "Data de Registro",
        "Data de Compra",
        "Nota Fiscal",
        "Validade da Garantia",
        "Endereço MAC",
        "CM/ID",
        "Fabricante",
        "Modelo",
        "Número de Série",
        "Categoria",
        "Status",
        "Atribuído a",
        "E-mail do Atribuído",
        "Data Troca Bateria",
        "Próxima Troca Bateria",
        "Custo",
        "Fornecedor"
      ];

      // Convert rows to CSV strings
      const csvRows = [
        headers.join(","), // Header row
        ...filteredAssets.map(asset => {
          const regDateFormatted = asset.createdAt
            ? new Date(asset.createdAt).toLocaleDateString("pt-BR")
            : asset.registrationDate
            ? new Date(asset.registrationDate + "T00:00:00").toLocaleDateString("pt-BR")
            : "";

          const purchaseDateFormatted = asset.purchaseDate
            ? new Date(asset.purchaseDate + "T00:00:00").toLocaleDateString("pt-BR")
            : "";

          const warrantyDateFormatted = asset.warrantyDate
            ? new Date(asset.warrantyDate + "T00:00:00").toLocaleDateString("pt-BR")
            : "";

          const row = [
            asset.id,
            asset.name,
            regDateFormatted,
            purchaseDateFormatted,
            asset.invoiceNumber || "",
            warrantyDateFormatted,
            asset.macAddress || "",
            asset.cmId || "",
            asset.manufacturer,
            asset.model,
            asset.seriesNumber || "",
            asset.category,
            asset.status,
            asset.assignedToUser ? asset.assignedToUser.name : "Estoque",
            asset.assignedToUser ? asset.assignedToUser.email : "",
            asset.batteryLastReplaced || "",
            asset.batteryNextReplacement || "",
            asset.cost || "",
            asset.supplier || ""
          ];

          // Escape commas and double quotes
          return row.map(val => {
            const cleanVal = typeof val === "string" ? val : String(val);
            // Replace inner double quotes with double-double quotes, and wrap in double quotes if there's a comma/newline/quote
            const escaped = cleanVal.replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(",");
        })
      ];

      const csvContent = csvRows.join("\n");
      
      // Use UTF-8 with BOM to support Portuguese characters properly in Excel
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ativos_inventario_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Exportação Concluída", `CSV gerado com sucesso contendo ${filteredAssets.length} ativos.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Erro na Exportação", "Houve uma falha ao gerar o arquivo CSV.", "warning");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Todos os Ativos</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Gerencie e rastreie o ciclo de vida do hardware corporativo.</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button 
            onClick={() => setShowScannerModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            title="Escanear QR Code da TAG do Ativo"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Escanear QR Code</span>
          </button>
          <button 
            onClick={() => setCurrentView("sheets")}
            className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Sincronizar ou Exportar para o Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Planilhas</span>
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ativo</span>
          </button>
        </div>
      </div>

      {/* Metrics Header Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Ativos</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{totalAssets}</h3>
            <span className="text-xs text-green-600 flex items-center font-bold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> {totalAssets > 0 ? `+${Math.round((inUseCount / totalAssets) * 100)}%` : "0%"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Uso</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{inUseCount}</h3>
            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${totalAssets > 0 ? (inUseCount / totalAssets) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Manutenção</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{maintenanceCount}</h3>
            {maintenanceCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                ALERTA
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disponíveis</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{availableCount}</h3>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      {/* Main Table Segment */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filtrar por modelo, tag ou usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 transition-all outline-none"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 outline-none w-full sm:w-auto"
            >
              <option value="all">Todas Categorias</option>
              <option value="Notebook">Notebooks</option>
              <option value="Servidor">Servidores</option>
              <option value="Monitor">Monitores</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 outline-none w-full sm:w-auto"
            >
              <option value="all">Todos Status</option>
              <option value="Disponível">Disponíveis</option>
              <option value="Atribuído">Atribuídos</option>
              <option value="Manutenção">Manutenção</option>
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Mostrando {filteredAssets.length} de {totalAssets} ativos
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tag do Ativo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modelo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Atribuído a</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    Nenhum ativo corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr 
                    key={asset.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <td 
                      onClick={() => handleAssetClick(asset.id)}
                      className="px-6 py-4 font-mono text-xs font-bold text-slate-700"
                    >
                      {asset.id}
                    </td>
                    <td 
                      onClick={() => handleAssetClick(asset.id)}
                      className="px-6 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={(e) => {
                            if (asset.image) {
                              e.stopPropagation();
                              setPreviewImage({
                                url: asset.image,
                                title: asset.name,
                                subtitle: `Série: ${asset.seriesNumber}${asset.cmId ? ` • CM/ID: ${asset.cmId}` : ""} (${asset.id})`
                              });
                            }
                          }}
                          className={`w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative group ${
                            asset.image ? "cursor-pointer hover:border-blue-400" : ""
                          }`}
                        >
                          {asset.image ? (
                            <>
                              <img 
                                src={asset.image} 
                                alt={asset.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain p-0.5" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="w-3.5 h-3.5 text-white" />
                              </div>
                            </>
                          ) : (
                            <Laptop className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800 font-bold text-xs">{asset.name}</span>
                            {(() => {
                              const alert = getWarrantyAlert(asset.warrantyDate);
                              if (alert) {
                                return (
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${alert.badgeClass}`} title={`Garantia: ${asset.warrantyDate}`}>
                                    <ShieldAlert className="w-2.5 h-2.5" />
                                    {alert.label}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Série: {asset.seriesNumber}{asset.cmId ? ` • CM/ID: ${asset.cmId}` : ""}</span>
                            {asset.macAddress && (
                              <span className="font-mono text-slate-500">MAC: {asset.macAddress}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td 
                      onClick={() => handleAssetClick(asset.id)}
                      className="px-6 py-4 text-xs text-slate-500 font-medium"
                    >
                      {asset.category}
                    </td>
                    <td 
                      onClick={() => handleAssetClick(asset.id)}
                      className="px-6 py-4"
                    >
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        asset.status === "Disponível" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : asset.status === "Atribuído"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td 
                      onClick={() => handleAssetClick(asset.id)}
                      className="px-6 py-4"
                    >
                      {asset.assignedToUser ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={asset.assignedToUser.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-slate-200"
                          />
                          <span className="text-xs text-slate-700 font-semibold">{asset.assignedToUser.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {asset.status === "Disponível" ? (
                          <button 
                            onClick={() => triggerCheckout(asset.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded cursor-pointer transition-all uppercase tracking-wide"
                          >
                            Entrega
                          </button>
                        ) : (
                          <button 
                            onClick={() => triggerCheckin(asset.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer transition-all uppercase tracking-wide border border-slate-200"
                          >
                            Devolução
                          </button>
                        )}
                        <button 
                          onClick={() => setTagModalAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Ver / Imprimir Etiqueta TAG e QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAssetClick(asset.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Ver Detalhes Completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Editar Ativo"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create New Asset */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Cadastrar Novo Ativo</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Entrada de Hardware</p>
              </div>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
              {/* Foto do Ativo */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide block">Foto do Ativo</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
                    isDragging ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {newImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        onClick={() => {
                          setPreviewImage({
                            url: newImage,
                            title: newName || "Foto do Novo Ativo",
                            subtitle: newModel ? `${newManufacturer} ${newModel}` : "Pré-visualização ampliada"
                          });
                        }}
                        className="relative w-full max-w-[240px] h-36 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-slate-900/5 group cursor-pointer hover:border-blue-500 transition-all"
                        title="Clique para ampliar a foto"
                      >
                        {/* Auto-framed image */}
                        <img 
                          src={newImage} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full object-contain p-1 select-none" 
                        />
                        {/* Hover Overlay with Zoom in cue */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[1px]">
                          <div className="p-2 bg-white/20 rounded-full mb-1">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-bold tracking-wide">Clique para ampliar</span>
                        </div>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewImage("");
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-md z-10"
                          title="Remover Foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-blue-500" /> Clique na foto para visualização em tela cheia
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2 w-full">
                      <div className="p-2 bg-white rounded-full border border-slate-100 shadow-sm text-slate-400 mb-2">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">Arraste uma foto ou clique para escolher</span>
                      <span className="text-[9px] text-slate-400 mt-1">Formatos suportados: JPG, PNG (Max 2MB)</span>
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

              {/* TAG Patrimonial e Leitor de Plaqueta QR Code */}
              <div className="p-4 bg-linear-to-br from-blue-50/90 via-sky-50/50 to-indigo-50/40 rounded-xl border-2 border-blue-200/90 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-800 text-xs">Plaqueta Patrimonial & TAG com QR Code</h5>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded-full uppercase tracking-wider">
                          Leitura Automática
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Leia a numeração da plaquetinha física (ex: ISIS 000937) via câmera ou digite manualmente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTagModalAsset({
                        id: newTagId || "000937",
                        name: newName || "Novo Ativo",
                        manufacturer: newManufacturer || "Fabricante",
                        model: newModel || "Modelo",
                        category: newCategory || "Categoria",
                        seriesNumber: newSerial || "S/N",
                        macAddress: newMacAddress || undefined,
                        invoiceNumber: newInvoiceNumber || undefined,
                        status: "Disponível",
                        createdAt: new Date().toISOString()
                      });
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    title="Visualizar a plaqueta estilizada com QR Code"
                  >
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ver Plaqueta</span>
                  </button>
                </div>

                {/* Botão Principal de Leitura da Plaqueta Física */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCaptureTagScanner(true)}
                    className="flex-1 py-2.5 px-4 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <Camera className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                    <span>📷 Ler Plaqueta / QR Code (Câmera)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const autoTag = "TAG-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 9000 + 1000);
                      setNewTagId(autoTag);
                      setTagScannedSuccess(false);
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Gerar código numérico provisório"
                  >
                    Gerar Provisório
                  </button>
                </div>

                {/* Campo do Código da TAG */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                      <span>Número da TAG (Plaqueta)</span>
                      {tagScannedSuccess && (
                        <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Preenchido via Leitura de Plaqueta
                        </span>
                      )}
                    </label>
                    <span className="text-[10px] text-slate-400">ex: 000937</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ex: 000937 (ou aponte a câmera no botão acima)"
                      value={newTagId}
                      onChange={(e) => {
                        setNewTagId(e.target.value);
                        setTagScannedSuccess(false);
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl text-slate-900 font-mono text-sm font-bold outline-none transition-all ${
                        tagScannedSuccess 
                          ? "bg-emerald-50/80 border-2 border-emerald-400 focus:border-emerald-600 text-emerald-950" 
                          : "bg-white border border-blue-200 focus:border-blue-600"
                      }`}
                    />
                    {newTagId && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 uppercase">
                        TAG Válida
                      </span>
                    )}
                  </div>
                </div>

                {/* Mini Preview da Plaqueta se tiver número */}
                {newTagId && (
                  <div className="pt-1">
                    <PhysicalAssetPlaque
                      tagNumber={newTagId}
                      assetName={newName || "Novo Equipamento"}
                      companyName="isis"
                      subTitle="Transportes e Terminais"
                      size="sm"
                      showActions={false}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Nome do Ativo</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: MacBook Pro 14 M2"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Fabricante</label>
                  <input
                    type="text"
                    required
                    list="manufacturers-list"
                    placeholder="ex: Apple Inc."
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                  <datalist id="manufacturers-list">
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
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Número de Série (N/S)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: C02FX5GZMD6R"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">CM/ID</label>
                  <input
                    type="text"
                    placeholder="ex: CM-1049 ou ID Interno"
                    value={newCmId}
                    onChange={(e) => setNewCmId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Endereço MAC (Físico)</label>
                  <input
                    type="text"
                    placeholder="ex: 00:1A:2B:3C:4D:5E"
                    value={newMacAddress}
                    onChange={(e) => setNewMacAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Número da Nota Fiscal (NF)</label>
                  <input
                    type="text"
                    placeholder="ex: NF-e 000.182.904"
                    value={newInvoiceNumber}
                    onChange={(e) => setNewInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                  <input
                    type="text"
                    required
                    list="categories-list"
                    placeholder="ex: Notebook"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                  <datalist id="categories-list">
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                {isComputerCategory(newCategory) && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">CPU</label>
                      <input
                        type="text"
                        placeholder="ex: 12th Gen Intel Core i5"
                        value={newCpu}
                        onChange={(e) => setNewCpu(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">RAM</label>
                      <input
                        type="text"
                        placeholder="ex: 16GB - DDR5"
                        value={newRam}
                        onChange={(e) => setNewRam(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">Armazenamento</label>
                      <input
                        type="text"
                        placeholder="ex: 512GB SSD"
                        value={newStorage}
                        onChange={(e) => setNewStorage(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">Sistema Operacional</label>
                      <input
                        type="text"
                        list="os-list"
                        placeholder="ex: Windows 11 Pro, macOS Sonoma"
                        value={newOs}
                        onChange={(e) => setNewOs(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                      />
                      <datalist id="os-list">
                        {uniqueOs.map((o) => (
                          <option key={o} value={o} />
                        ))}
                      </datalist>
                    </div>
                  </>
                )}
                {hasBatteryCategory(newCategory) && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">Data de Troca de Bateria</label>
                      <input
                        type="date"
                        value={newBatteryReplacedDate}
                        onChange={(e) => setNewBatteryReplacedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wide">Data para Próxima Troca</label>
                      <input
                        type="date"
                        value={newBatteryNextDate}
                        onChange={(e) => setNewBatteryNextDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Data de Compra</label>
                  <input
                    type="date"
                    value={newPurchaseDate}
                    onChange={(e) => setNewPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Validade da Garantia</label>
                  <input
                    type="date"
                    value={newWarrantyDate}
                    onChange={(e) => setNewWarrantyDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Custo Adquirido</label>
                  <input
                    type="text"
                    placeholder="ex: R$ 5.000,00"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Fornecedor</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: CDW-G, Dell, Kalunga"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                {/* Nota de Registro Automático */}
                <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">
                    Data de Registro do Ativo: <strong className="text-slate-800">Automático ({new Date().toLocaleDateString("pt-BR")})</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Registrado automaticamente pelo sistema</span>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Descrição do Ativo</label>
                  <textarea
                    rows={2}
                    placeholder="ex: Notebook de desenvolvimento de software da equipe de engenharia..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 resize-none text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Salvar Ativo
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Checkout (Saída de Ativo) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Saída de Ativo</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Atribuição de Responsabilidade</p>
              </div>
            </div>

            {activeAsset && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4 text-xs">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  {activeAsset.image ? (
                    <img 
                      src={activeAsset.image} 
                      alt={activeAsset.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Laptop className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{activeAsset.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Tag: {activeAsset.id} • S/N: {activeAsset.seriesNumber}</p>
                </div>
              </div>
            )}

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
                <input
                  type="text"
                  list="checkout-locations-list"
                  required
                  placeholder="ex: Sede Principal (HQ), Sala 204, Remoto..."
                  value={checkoutLocation}
                  onChange={(e) => setCheckoutLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
                <datalist id="checkout-locations-list">
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
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

      {/* MODAL 3: Checkin (Devolução de Ativo) */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Check-in de Ativo</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Devolução / Inventário Geral</p>
              </div>
            </div>

            {activeAsset && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4 text-xs">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  {activeAsset.image ? (
                    <img 
                      src={activeAsset.image} 
                      alt={activeAsset.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Laptop className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{activeAsset.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Tag: {activeAsset.id} • S/N: {activeAsset.seriesNumber}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCheckinSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Novo Status</label>
                  <select
                    value={checkinStatus}
                    onChange={(e) => setCheckinStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Manutenção">Manutenção Pendente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Avaliação Física</label>
                  <select
                    value={checkinCondition}
                    onChange={(e) => setCheckinCondition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="good">Bom Estado (90%+)</option>
                    <option value="repair">Necessita Reparo</option>
                    <option value="damaged">Danificado / Quebrado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Local de Destino</label>
                <select
                  value={checkinLocation}
                  onChange={(e) => setCheckinLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="hq">Armazém Sede (HQ)</option>
                  <option value="sp">Depósito São Paulo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Observações de Recebimento</label>
                <textarea
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="Relato de danos físicos, riscos na tela, itens faltantes ou liberação imediata..."
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
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal
          isOpen={Boolean(editingAsset)}
          onClose={() => setEditingAsset(null)}
          asset={editingAsset}
        />
      )}

      {/* Image Viewer Modal */}
      {previewImage && (
        <ImageViewerModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          title={previewImage.title}
          subtitle={previewImage.subtitle}
        />
      )}

      {/* QR Code Scanner Modal (Modo Consulta) */}
      <QrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        mode="lookup"
        onAssetFound={(assetId) => {
          setShowScannerModal(false);
          setSelectedAssetId(assetId);
          setCurrentView("asset-detail");
        }}
        onRegisterNewAssetWithTag={(tag) => {
          setShowScannerModal(false);
          resetAddForm();
          setNewTagId(tag);
          setTagScannedSuccess(true);
          setShowAddModal(true);
          showToast("Cadastro Iniciado com Plaqueta", `TAG "${tag}" inserida no formulário. Preencha os dados do ativo.`, "info");
        }}
      />

      {/* QR Code Scanner Modal (Modo Captura de Plaqueta no Cadastro) */}
      <QrScannerModal
        isOpen={showCaptureTagScanner}
        onClose={() => setShowCaptureTagScanner(false)}
        mode="capture"
        title="Leitor de Plaqueta de Patrimônio"
        subtitle="Aponte a câmera para o QR Code da plaquetinha física"
        onTagCaptured={(tag) => {
          setNewTagId(tag);
          setTagScannedSuccess(true);
          setShowCaptureTagScanner(false);
        }}
      />

      {/* Asset Tag & QR Code Modal */}
      {tagModalAsset && (
        <AssetTagModal
          isOpen={Boolean(tagModalAsset)}
          onClose={() => setTagModalAsset(null)}
          asset={tagModalAsset}
        />
      )}
    </div>
  );
};
