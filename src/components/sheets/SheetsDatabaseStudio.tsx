import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  createStructuredDatabaseSpreadsheet,
  fetchCompleteDatabaseFromSheets,
  pushCompleteDatabaseToSheets,
  getSpreadsheetDetails,
  getSheetValues,
  appendRowsToSpreadsheet,
  GoogleSpreadsheetMetadata
} from "../../services/googleSheets";
import { Asset, License, Consumable, AssetStatus, LicenseStatus, ConsumableStatus } from "../../types";
import { 
  Database, 
  Sparkles, 
  RefreshCw, 
  ExternalLink, 
  UploadCloud, 
  DownloadCloud, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Table, 
  Laptop, 
  KeyRound, 
  Package, 
  Users as UsersIcon, 
  ClipboardList, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight,
  HardDrive,
  Check,
  Zap,
  Clock,
  Link2,
  Search,
  Eye,
  Download,
  Filter,
  FileSpreadsheet,
  Maximize2,
  X,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SheetsDatabaseStudioProps {
  accessToken: string | null;
  onOpenInViewer: (spreadsheetId: string, tabName?: string) => void;
  onConnectGoogle: () => void;
}

export const SheetsDatabaseStudio: React.FC<SheetsDatabaseStudioProps> = ({
  accessToken,
  onOpenInViewer,
  onConnectGoogle
}) => {
  const { 
    assets, 
    licenses, 
    consumables, 
    users, 
    activities, 
    importAllFromSheets, 
    showToast,
    addAsset,
    addLicense,
    addConsumable,
    sheetsAutoSyncEnabled,
    sheetsAutoSyncInterval,
    sheetsSyncState,
    setSheetsAutoSyncEnabled,
    setSheetsAutoSyncInterval,
    syncWithSheets,
    pushToSheets,
    deleteSheetsDatabase
  } = useApp();

  // Active DB state
  const [activeDbId, setActiveDbId] = useState<string>(() => {
    return localStorage.getItem("ac_sheets_db_id") || "";
  });
  const [activeDbName, setActiveDbName] = useState<string>(() => {
    return localStorage.getItem("ac_sheets_db_name") || "Base de Dados Ativa no Google Sheets";
  });
  const [activeDbUrl, setActiveDbUrl] = useState<string>(() => {
    return localStorage.getItem("ac_sheets_db_url") || "";
  });
  const [activeDbMeta, setActiveDbMeta] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => {
    return localStorage.getItem("ac_sheets_db_last_sync") || null;
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteFromDriveChoice, setDeleteFromDriveChoice] = useState<boolean>(true);
  const [isDeletingDb, setIsDeletingDb] = useState<boolean>(false);

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [dbTitleInput, setDbTitleInput] = useState<string>(
    `Base de Dados TI - Enterprise DB (${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")})`
  );
  const [isCreatingDb, setIsCreatingDb] = useState<boolean>(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncDirection, setSyncDirection] = useState<"pull" | "push" | null>(null);

  // Manual connect state
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectInputId, setConnectInputId] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Quick Insert Modal State
  const [showQuickInsertModal, setShowQuickInsertModal] = useState<boolean>(false);
  const [insertTargetTable, setInsertTargetTable] = useState<"TB_ATIVOS" | "TB_LICENCAS" | "TB_CONSUMIVEIS">("TB_ATIVOS");
  const [isInsertingRow, setIsInsertingRow] = useState<boolean>(false);
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "Notebooks",
    manufacturer: "Dell",
    model: "Latitude 5430",
    seriesNumber: "",
    status: "Disponível" as AssetStatus,
    cost: "R$ 4.500,00",
    description: ""
  });
  const [licenseForm, setLicenseForm] = useState({
    name: "",
    supplier: "Microsoft",
    key: "",
    seatsTotal: 10,
    expirationDate: "2026-12-31",
    status: "Ativo" as LicenseStatus
  });
  const [consumableForm, setConsumableForm] = useState({
    name: "",
    category: "Periféricos",
    quantityRemaining: 15,
    quantityTotal: 25,
    description: ""
  });

  // Live Google Sheets API Table Reader State
  const [selectedLiveTable, setSelectedLiveTable] = useState<string>("TB_ATIVOS");
  const [liveTableRows, setLiveTableRows] = useState<string[][]>([]);
  const [isLoadingLiveTable, setIsLoadingLiveTable] = useState<boolean>(false);
  const [liveTableSearch, setLiveTableSearch] = useState<string>("");
  const [liveTableFetchTime, setLiveTableFetchTime] = useState<string | null>(null);
  const [liveTableSelectedRow, setLiveTableSelectedRow] = useState<{ headers: string[]; values: string[]; index: number } | null>(null);
  const [liveTableViewMode, setLiveTableViewMode] = useState<"table" | "cards">("table");

  // Fetch active DB metadata if ID exists
  const loadActiveDbMeta = async (id: string, token: string) => {
    if (!id || !token) return;
    try {
      const meta = await getSpreadsheetDetails(token, id);
      setActiveDbMeta(meta);
      setActiveDbName(meta.properties.title);
      setActiveDbUrl(meta.spreadsheetUrl);
      localStorage.setItem("ac_sheets_db_name", meta.properties.title);
      localStorage.setItem("ac_sheets_db_url", meta.spreadsheetUrl);
    } catch (e: any) {
      console.warn("Could not fetch active DB details:", e);
    }
  };

  // Fetch Live Table Data directly from Google Sheets API
  const fetchLiveTableData = async (tableName?: string, tokenOverride?: string, idOverride?: string) => {
    const token = tokenOverride || accessToken;
    const dbId = idOverride || activeDbId;
    const targetTable = tableName || selectedLiveTable || "TB_ATIVOS";

    if (!token || !dbId) return;

    setIsLoadingLiveTable(true);
    try {
      const valRes = await getSheetValues(token, dbId, `${targetTable}!A1:Z300`);
      setLiveTableRows(valRes.values || []);
      setLiveTableFetchTime(new Date().toLocaleTimeString("pt-BR"));
    } catch (err: any) {
      console.error(`Error fetching live data for ${targetTable}:`, err);
      showToast("Erro ao Ler Tabela", err?.message || `Não foi possível carregar dados da aba ${targetTable}.`, "warning");
    } finally {
      setIsLoadingLiveTable(false);
    }
  };

  useEffect(() => {
    if (activeDbId && accessToken) {
      loadActiveDbMeta(activeDbId, accessToken);
      fetchLiveTableData(selectedLiveTable, accessToken, activeDbId);
    }
  }, [activeDbId, accessToken]);

  // Synchronize state when database is deleted or updated elsewhere
  useEffect(() => {
    const handleUpdate = () => {
      const id = localStorage.getItem("ac_sheets_db_id") || "";
      const name = localStorage.getItem("ac_sheets_db_name") || "Base de Dados Ativa no Google Sheets";
      const url = localStorage.getItem("ac_sheets_db_url") || "";
      const lastSync = localStorage.getItem("ac_sheets_db_last_sync") || null;
      setActiveDbId(id);
      setActiveDbName(name);
      setActiveDbUrl(url);
      setLastSyncTimestamp(lastSync);
      if (!id) {
        setActiveDbMeta(null);
        setLiveTableRows([]);
      }
    };
    window.addEventListener("ac-sheets-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("ac-sheets-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Handler: Delete and unlink active database
  const handleDeleteDatabase = async () => {
    setIsDeletingDb(true);
    try {
      await deleteSheetsDatabase(deleteFromDriveChoice);
      setActiveDbId("");
      setActiveDbName("Base de Dados Ativa no Google Sheets");
      setActiveDbUrl("");
      setActiveDbMeta(null);
      setLiveTableRows([]);
      setLastSyncTimestamp(null);
      setShowDeleteModal(false);
    } catch (err: any) {
      console.error("Error deleting sheets database:", err);
      showToast("Erro ao Excluir Base", err?.message || "Ocorreu um erro ao excluir a base de dados.", "warning");
    } finally {
      setIsDeletingDb(false);
    }
  };

  // When user switches live table tab
  const handleSelectLiveTable = (tableName: string) => {
    setSelectedLiveTable(tableName);
    if (activeDbId && accessToken) {
      fetchLiveTableData(tableName, accessToken, activeDbId);
    }
  };

  // Export current live table to CSV
  const handleDownloadCSV = () => {
    if (liveTableRows.length === 0) {
      showToast("Tabela Vazia", "Não há dados para exportar.", "warning");
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," + liveTableRows.map(e => e.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedLiveTable}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Exportado", `Download do arquivo ${selectedLiveTable}.csv iniciado com sucesso.`, "success");
  };

  // Handler: Create new structured database
  const handleCreateDatabase = async () => {
    if (!accessToken) {
      showToast("Conexão Necessária", "Conecte sua conta Google para criar a base de dados.", "warning");
      return;
    }

    setIsCreatingDb(true);
    try {
      const res = await createStructuredDatabaseSpreadsheet(
        accessToken,
        { assets, licenses, consumables, users, activities },
        { databaseName: dbTitleInput }
      );

      const dbId = res.spreadsheetId;
      const dbUrl = res.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${dbId}/edit`;
      const title = res.properties.title;
      const now = new Date().toLocaleString("pt-BR");

      setActiveDbId(dbId);
      setActiveDbName(title);
      setActiveDbUrl(dbUrl);
      setActiveDbMeta(res);
      setLastSyncTimestamp(now);

      localStorage.setItem("ac_sheets_db_id", dbId);
      localStorage.setItem("ac_sheets_db_name", title);
      localStorage.setItem("ac_sheets_db_url", dbUrl);
      localStorage.setItem("ac_sheets_db_last_sync", now);
      window.dispatchEvent(new Event("ac-sheets-updated"));

      setShowCreateModal(false);
      showToast(
        "Base de Dados Criada no Google Sheets!", 
        `A base "${title}" foi provisionada com sucesso contendo todas as 6 tabelas relacionais formatadas.`, 
        "success"
      );
    } catch (err: any) {
      console.error("Error creating sheets database:", err);
      showToast("Erro ao Criar Base", err?.message || "Não foi possível criar a base no Google Sheets.", "warning");
    } finally {
      setIsCreatingDb(false);
    }
  };

  // Handler: Connect existing sheet as DB
  const handleConnectExisting = async () => {
    if (!accessToken || !connectInputId.trim()) return;
    setIsConnecting(true);
    try {
      const cleanId = connectInputId.includes("/d/") 
        ? connectInputId.split("/d/")[1].split("/")[0]
        : connectInputId.trim();

      const meta = await getSpreadsheetDetails(accessToken, cleanId);
      const title = meta.properties.title;
      const url = meta.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

      setActiveDbId(cleanId);
      setActiveDbName(title);
      setActiveDbUrl(url);
      setActiveDbMeta(meta);

      localStorage.setItem("ac_sheets_db_id", cleanId);
      localStorage.setItem("ac_sheets_db_name", title);
      localStorage.setItem("ac_sheets_db_url", url);
      window.dispatchEvent(new Event("ac-sheets-updated"));

      setShowConnectModal(false);
      setConnectInputId("");
      showToast("Base Conectada", `Planilha "${title}" vinculada como banco de dados principal.`, "success");
    } catch (err: any) {
      console.error("Failed to connect sheet as DB:", err);
      showToast("Erro ao Conectar", err?.message || "Planilha não encontrada ou sem permissão de acesso.", "warning");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handler: Pull complete database from Sheets to App
  const handlePullDatabase = async () => {
    if (!accessToken || !activeDbId) return;
    setIsSyncing(true);
    setSyncDirection("pull");
    try {
      const parsedData = await fetchCompleteDatabaseFromSheets(accessToken, activeDbId);
      await importAllFromSheets(parsedData);
      const now = new Date().toLocaleString("pt-BR");
      setLastSyncTimestamp(now);
      localStorage.setItem("ac_sheets_db_last_sync", now);
      window.dispatchEvent(new Event("ac-sheets-updated"));
    } catch (err: any) {
      console.error("Pull sync failed:", err);
      showToast("Erro na Sincronização", err?.message || "Falha ao ler dados da planilha do Google.", "warning");
    } finally {
      setIsSyncing(false);
      setSyncDirection(null);
    }
  };

  // Handler: Push local state into Sheets database
  const handlePushDatabase = async () => {
    if (!accessToken || !activeDbId) return;
    setIsSyncing(true);
    setSyncDirection("push");
    try {
      const res = await pushCompleteDatabaseToSheets(accessToken, activeDbId, {
        assets,
        licenses,
        consumables,
        users,
        activities
      });

      const now = new Date().toLocaleString("pt-BR");
      setLastSyncTimestamp(now);
      localStorage.setItem("ac_sheets_db_last_sync", now);
      window.dispatchEvent(new Event("ac-sheets-updated"));

      showToast(
        "Base Atualizada no Google Sheets",
        `Tabelas (${res.updatedTables.join(", ")}) sincronizadas com sucesso na planilha.`,
        "success"
      );
    } catch (err: any) {
      console.error("Push sync failed:", err);
      showToast("Erro na Gravação", err?.message || "Falha ao gravar registros na planilha.", "warning");
    } finally {
      setIsSyncing(false);
      setSyncDirection(null);
    }
  };

  // Handler: Quick Insert Row into Active Sheet DB
  const handleQuickInsert = async () => {
    if (!accessToken || !activeDbId) return;
    setIsInsertingRow(true);

    try {
      if (insertTargetTable === "TB_ATIVOS") {
        const newId = `TAG-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
        const newAssetData: Omit<Asset, "id" | "health"> = {
          name: assetForm.name || "Novo Ativo de TI",
          category: assetForm.category,
          manufacturer: assetForm.manufacturer,
          model: assetForm.model,
          seriesNumber: assetForm.seriesNumber || `SN-${Date.now().toString().slice(-6)}`,
          status: assetForm.status,
          cost: assetForm.cost,
          description: assetForm.description || "Criado via Google Sheets DB Studio",
          purchaseDate: new Date().toISOString().split("T")[0]
        };

        // Add to local app state
        addAsset(newAssetData);

        // Append to Google Sheet table
        const row = [
          newId,
          newAssetData.name,
          newAssetData.category,
          newAssetData.manufacturer,
          newAssetData.model,
          newAssetData.seriesNumber,
          newAssetData.status,
          "", // usuario
          "", // depto
          newAssetData.cost,
          newAssetData.purchaseDate,
          "", // garantia
          100, // saude
          "Boa", // bateria
          "Windows 11 Pro", // SO
          "Intel Core i7", // CPU
          "16 GB", // RAM
          "512 GB SSD", // Armazenamento
          "", // MAC
          newAssetData.description,
          new Date().toISOString()
        ];

        await appendRowsToSpreadsheet(accessToken, activeDbId, "TB_ATIVOS", [row]);
        showToast("Ativo Registrado na Planilha", `Equipamento "${newAssetData.name}" gravado em TB_ATIVOS.`, "success");
      } else if (insertTargetTable === "TB_LICENCAS") {
        const newLic: Omit<License, "id"> = {
          name: licenseForm.name || "Novo Software",
          software: licenseForm.name || "Novo Software",
          supplier: licenseForm.supplier,
          key: licenseForm.key || "XXXX-XXXX-XXXX-XXXX",
          seatsTotal: Number(licenseForm.seatsTotal) || 10,
          seatsUsed: 0,
          expirationDate: licenseForm.expirationDate,
          status: licenseForm.status,
          iconType: "cloud"
        };

        addLicense(newLic);

        const row = [
          `LIC-${Date.now().toString().slice(-5)}`,
          newLic.name,
          newLic.supplier,
          newLic.key,
          newLic.seatsTotal,
          0,
          newLic.seatsTotal,
          newLic.expirationDate,
          newLic.status,
          "cloud",
          new Date().toISOString()
        ];

        await appendRowsToSpreadsheet(accessToken, activeDbId, "TB_LICENCAS", [row]);
        showToast("Licença Registrada", `Software "${newLic.name}" gravado em TB_LICENCAS.`, "success");
      } else if (insertTargetTable === "TB_CONSUMIVEIS") {
        const newCon: Omit<Consumable, "id" | "status"> = {
          name: consumableForm.name || "Novo Consumível",
          category: consumableForm.category,
          quantityRemaining: Number(consumableForm.quantityRemaining) || 10,
          quantityTotal: Number(consumableForm.quantityTotal) || 20,
          description: consumableForm.description || "Insumo registrado via Sheets DB",
          iconName: "print"
        };

        addConsumable(newCon);

        const pct = newCon.quantityTotal > 0 ? Math.round((newCon.quantityRemaining / newCon.quantityTotal) * 100) : 0;
        const row = [
          `CON-${Date.now().toString().slice(-5)}`,
          newCon.name,
          newCon.category,
          newCon.quantityRemaining,
          newCon.quantityTotal,
          `${pct}%`,
          "Normal",
          newCon.description,
          "package",
          new Date().toISOString()
        ];

        await appendRowsToSpreadsheet(accessToken, activeDbId, "TB_CONSUMIVEIS", [row]);
        showToast("Consumível Registrado", `Item "${newCon.name}" gravado em TB_CONSUMIVEIS.`, "success");
      }

      setShowQuickInsertModal(false);
      // Reload live data to reflect immediately
      fetchLiveTableData(insertTargetTable);
    } catch (err: any) {
      console.error("Failed to append row:", err);
      showToast("Erro ao Inserir na Planilha", err?.message || "Não foi possível gravar a linha.", "warning");
    } finally {
      setIsInsertingRow(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO ENGINE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300">
              <Database className="w-3.5 h-3.5" />
              <span>Google Sheets Relational Database Engine v2.4</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Base de Dados Integrada no Google Sheets
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Utilize o Google Sheets como um banco de dados relacional em nuvem. Cada entidade (Ativos, Licenças, Consumíveis, Usuários e Auditoria) é mapeada em tabelas estruturadas com validações, formatação corporativa e sincronização bidirecional em tempo real.
            </p>
          </div>

          {/* Quick Engine Actions */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (!accessToken) {
                  onConnectGoogle();
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-emerald-100" />
              <span>Criar Nova Base de Dados</span>
            </button>

            <button
              onClick={() => {
                if (!accessToken) {
                  onConnectGoogle();
                } else {
                  setShowConnectModal(true);
                }
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-xl text-xs backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Link2 className="w-4 h-4" />
              <span>Vincular Planilha Existente</span>
            </button>
          </div>
        </div>

        {/* Database Status Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${activeDbId ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              Status: <strong className="text-white">{activeDbId ? "Base Conectada & Operacional" : "Nenhuma Base Vinculada"}</strong>
            </span>

            {activeDbId && (
              <span className="hidden sm:inline-block text-slate-500">•</span>
            )}

            {activeDbId && (
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                ID: {activeDbId.slice(0, 8)}...{activeDbId.slice(-6)}
              </span>
            )}
          </div>

          {lastSyncTimestamp && (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Última Sincronização: <strong className="text-slate-200">{lastSyncTimestamp}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ACTIVE DATABASE DASHBOARD (If connected) */}
      {activeDbId ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Header with Title and Operations */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 truncate">{activeDbName}</h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider">
                  Base Ativa
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Esta planilha é o repositório central de dados do sistema de ativos.
              </p>
            </div>

            {/* Actions on active DB */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={activeDbUrl || `https://docs.google.com/spreadsheets/d/${activeDbId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir no Google Sheets</span>
              </a>

              <button
                onClick={() => onOpenInViewer(activeDbId, "TB_ATIVOS")}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Editor Tabular</span>
              </button>

              <button
                onClick={handlePullDatabase}
                disabled={isSyncing}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Puxar dados atualizados da Planilha para o App"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing && syncDirection === "pull" ? "animate-bounce" : ""}`} />
                <span>Puxar da Planilha</span>
              </button>

              <button
                onClick={handlePushDatabase}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                title="Gravar estado atual da aplicação nas tabelas do Google Sheets"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isSyncing && syncDirection === "push" ? "animate-bounce" : ""}`} />
                <span>Gravar Dados no Sheets</span>
              </button>

              <button
                onClick={() => setShowQuickInsertModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inserir Registro</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Excluir base de dados do Google Sheets"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Excluir Base de Dados</span>
              </button>
            </div>
          </div>

          {/* Auto-Sync Banner & Frequency Controls */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Sincronização Periódica Automática (Background Auto-Sync)</h4>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase ${
                    sheetsAutoSyncEnabled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-200 text-slate-600"
                  }`}>
                    {sheetsAutoSyncEnabled ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {sheetsAutoSyncEnabled
                    ? `O sistema sincroniza o estado local e a planilha Google a cada ${sheetsAutoSyncInterval} segundos automaticamente.`
                    : "A sincronização periódica automática está pausada. Você pode reativá-la quando desejar."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end md:self-center shrink-0">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-600 font-medium">Intervalo:</span>
                <select
                  value={sheetsAutoSyncInterval}
                  onChange={(e) => setSheetsAutoSyncInterval(Number(e.target.value))}
                  disabled={!sheetsAutoSyncEnabled}
                  className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer disabled:opacity-50"
                >
                  <option value={15}>15 segundos</option>
                  <option value={30}>30 segundos</option>
                  <option value={60}>1 minuto</option>
                  <option value={120}>2 minutos</option>
                  <option value={300}>5 minutos</option>
                </select>
              </div>

              <button
                onClick={() => setSheetsAutoSyncEnabled(!sheetsAutoSyncEnabled)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  sheetsAutoSyncEnabled
                    ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
              >
                {sheetsAutoSyncEnabled ? "Pausar Auto-Sync" : "Ativar Auto-Sync"}
              </button>

              <button
                onClick={() => syncWithSheets(false)}
                disabled={sheetsSyncState.isSyncing}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Executar sincronização imediata agora"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${sheetsSyncState.isSyncing ? "animate-spin" : ""}`} />
                <span>{sheetsSyncState.isSyncing ? "Sincronizando..." : "Sincronizar Agora"}</span>
              </button>
            </div>
          </div>

          {/* 3. RELATIONAL SCHEMA CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Tabelas Relacionais Sincronizadas ({activeDbMeta?.sheets.length || 6})</span>
              </h4>
              <span className="text-[11px] text-slate-400">Google Sheets v4 API • Schema Normalizado</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* TB_ATIVOS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xs">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs font-bold text-slate-900">TB_ATIVOS</h5>
                      <p className="text-[11px] text-slate-500">Hardware & Equipamentos</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[11px] border border-blue-100">
                    {assets.length} registros
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono">
                  <p><span className="text-blue-600 font-bold">PK:</span> id (Tag Ativo)</p>
                  <p><span className="text-slate-400">Campos:</span> nome, categoria, fabricante, modelo, série, status, custo, saude_pct, so, cpu, ram, disco</p>
                </div>

                <button
                  onClick={() => onOpenInViewer(activeDbId, "TB_ATIVOS")}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspecionar Tabela</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TB_LICENCAS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs font-bold text-slate-900">TB_LICENCAS</h5>
                      <p className="text-[11px] text-slate-500">Softwares & SaaS</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-bold text-[11px] border border-purple-100">
                    {licenses.length} registros
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono">
                  <p><span className="text-purple-600 font-bold">PK:</span> id (ID Licença)</p>
                  <p><span className="text-slate-400">Campos:</span> nome_software, fornecedor, chave_serial, assentos_totais, assentos_usados, data_expiracao, status</p>
                </div>

                <button
                  onClick={() => onOpenInViewer(activeDbId, "TB_LICENCAS")}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspecionar Tabela</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TB_CONSUMIVEIS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center font-bold text-xs">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs font-bold text-slate-900">TB_CONSUMIVEIS</h5>
                      <p className="text-[11px] text-slate-500">Insumos & Suprimentos</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[11px] border border-amber-100">
                    {consumables.length} registros
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono">
                  <p><span className="text-amber-600 font-bold">PK:</span> id (ID Item)</p>
                  <p><span className="text-slate-400">Campos:</span> nome_item, categoria, quantidade_restante, quantidade_total, nivel_estoque_pct, status, descricao</p>
                </div>

                <button
                  onClick={() => onOpenInViewer(activeDbId, "TB_CONSUMIVEIS")}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspecionar Tabela</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TB_COLABORADORES */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs">
                      <UsersIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs font-bold text-slate-900">TB_COLABORADORES</h5>
                      <p className="text-[11px] text-slate-500">Usuários & Departamentos</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[11px] border border-emerald-100">
                    {users.length} usuários
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono">
                  <p><span className="text-emerald-600 font-bold">PK:</span> id (ID Usuário)</p>
                  <p><span className="text-slate-400">Campos:</span> nome, email, cargo, departamento, status, perfil_acesso, atualizado_em</p>
                </div>

                <button
                  onClick={() => onOpenInViewer(activeDbId, "TB_COLABORADORES")}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspecionar Tabela</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TB_AUDITORIA */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs font-bold text-slate-900">TB_AUDITORIA</h5>
                      <p className="text-[11px] text-slate-500">Trilha de Eventos & Logs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold text-[11px]">
                    {activities.length} eventos
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono">
                  <p><span className="text-slate-700 font-bold">PK:</span> id (ID Atividade)</p>
                  <p><span className="text-slate-400">Campos:</span> data_hora, usuario_responsavel, acao, alvo_item, categoria, tipo_registro, detalhes</p>
                </div>

                <button
                  onClick={() => onOpenInViewer(activeDbId, "TB_AUDITORIA")}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspecionar Tabela</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* _CONFIG_BASE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs font-bold text-slate-900">_CONFIG_BASE</h5>
                      <p className="text-[11px] text-slate-500">Metadados & Parâmetros</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-bold text-[11px] border border-teal-100">
                    Sistema
                  </span>
                </div>

                <div className="text-[10px] text-slate-600 space-y-1 bg-white p-2.5 rounded border border-slate-100 font-mono">
                  <p><span className="text-teal-600 font-bold">Tipo:</span> Key-Value Metadata</p>
                  <p><span className="text-slate-400">Campos:</span> DB_VERSION, SCHEMA_TYPE, LAST_SYNC, TOTAL_TABELAS, STATUS</p>
                </div>

                <button
                  onClick={() => onOpenInViewer(activeDbId, "_CONFIG_BASE")}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspecionar Tabela</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. LIVE GOOGLE SHEETS API DATA EXPLORER & VIEWER */}
          <div className="pt-6 border-t border-slate-200/80 space-y-4">
            {/* Live Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Listagem Direta da Planilha Integrada (Google Sheets API v4)</span>
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Dados lidos e renderizados diretamente da planilha em tempo real. Qualquer alteração remota é refletida aqui.
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar dados da planilha..."
                    value={liveTableSearch}
                    onChange={(e) => setLiveTableSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-500 transition-colors"
                  />
                  {liveTableSearch && (
                    <button
                      onClick={() => setLiveTableSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => fetchLiveTableData(selectedLiveTable)}
                  disabled={isLoadingLiveTable}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                  title="Recarregar dados diretamente da API do Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLiveTable ? "animate-spin" : ""}`} />
                  <span>Recarregar API</span>
                </button>

                <button
                  onClick={handleDownloadCSV}
                  disabled={liveTableRows.length === 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                  title="Baixar dados desta aba como arquivo CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>

                <a
                  href={activeDbUrl || `https://docs.google.com/spreadsheets/d/${activeDbId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abrir no Sheets</span>
                </a>
              </div>
            </div>

            {/* Table Selection Tabs */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 flex-nowrap">
                {([
                  { id: "TB_ATIVOS", label: "Ativos de TI", icon: Laptop, count: assets.length },
                  { id: "TB_LICENCAS", label: "Licenças", icon: KeyRound, count: licenses.length },
                  { id: "TB_CONSUMIVEIS", label: "Consumíveis", icon: Package, count: consumables.length },
                  { id: "TB_COLABORADORES", label: "Colaboradores", icon: UsersIcon, count: users.length },
                  { id: "TB_AUDITORIA", label: "Auditoria", icon: ClipboardList, count: activities.length },
                  { id: "_CONFIG_BASE", label: "Parâmetros", icon: ShieldCheck, count: undefined }
                ] as const).map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = selectedLiveTable === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSelectLiveTable(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20 scale-[1.02]"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? "bg-emerald-700 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                        {tab.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Status indicator badge */}
              <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 whitespace-nowrap">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Faixa: <strong className="text-slate-700 font-mono">{selectedLiveTable}!A1:Z300</strong>
                </span>
                {liveTableFetchTime && (
                  <span>• Atualizado: <strong className="text-slate-700">{liveTableFetchTime}</strong></span>
                )}
              </div>
            </div>

            {/* Live Data Grid / Table Content */}
            <div className="bg-slate-900/5 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              {isLoadingLiveTable ? (
                <div className="p-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Consultando Google Sheets API v4...</p>
                  <p className="text-[11px] text-slate-400">Lendo dados estruturados da tabela <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700">{selectedLiveTable}</code></p>
                </div>
              ) : liveTableRows.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Nenhum dado encontrado na aba "{selectedLiveTable}"</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    A tabela ainda não possui linhas preenchidas no Google Sheets ou precisa ser sincronizada.
                  </p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={handlePushDatabase}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Preencher Dados Iniciais no Sheets</span>
                    </button>
                    <button
                      onClick={() => fetchLiveTableData(selectedLiveTable)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tentar Novamente</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Table Stats bar */}
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        {liveTableRows.length - 1} {liveTableRows.length - 1 === 1 ? "registro retornado" : "registros retornados"}
                      </span>
                      {liveTableSearch && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-medium rounded-full text-[10px]">
                          Filtro ativo: "{liveTableSearch}"
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Clique em uma linha para ver a ficha detalhada</span>
                      <span className="text-slate-300">|</span>
                      <span>Total de colunas: <strong className="text-slate-700">{liveTableRows[0]?.length || 0}</strong></span>
                    </div>
                  </div>

                  {/* Scrollable Table */}
                  <div className="overflow-x-auto max-h-[520px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-white sticky top-0 z-10 select-none shadow-sm">
                          <th className="p-3 border-r border-slate-700 font-mono text-[10px] w-12 text-center text-slate-400 bg-slate-800">
                            #
                          </th>
                          {liveTableRows[0]?.map((headerName, colIdx) => (
                            <th
                              key={colIdx}
                              className="p-3 border-r border-slate-700 font-bold whitespace-nowrap text-slate-100 text-xs tracking-wider"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{headerName || `Col ${colIdx + 1}`}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {liveTableRows.slice(1).map((row, rIdx) => {
                          // Search Filter match
                          if (
                            liveTableSearch &&
                            !row.some((cell) =>
                              String(cell || "").toLowerCase().includes(liveTableSearch.toLowerCase())
                            )
                          ) {
                            return null;
                          }

                          return (
                            <tr
                              key={rIdx}
                              onClick={() => {
                                setLiveTableSelectedRow({
                                  headers: liveTableRows[0] || [],
                                  values: row,
                                  index: rIdx + 1
                                });
                              }}
                              className="hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                            >
                              <td className="p-2.5 border-r border-slate-100 text-center text-slate-400 font-mono text-[10px] bg-slate-50/50 group-hover:bg-emerald-50">
                                {rIdx + 1}
                              </td>
                              {liveTableRows[0]?.map((_, colIdx) => {
                                const val = row[colIdx] !== undefined ? String(row[colIdx]) : "";
                                const valLower = val.toLowerCase();
                                const isStatus = valLower === "disponível" || valLower === "em uso" || valLower === "ativo" || valLower === "manutenção" || valLower === "crítico" || valLower === "expirado";
                                
                                return (
                                  <td
                                    key={colIdx}
                                    className="p-2.5 border-r border-slate-100 text-slate-700 whitespace-nowrap"
                                  >
                                    {isStatus ? (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        valLower === "disponível" || valLower === "ativo"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : valLower === "em uso"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : valLower === "manutenção"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-red-50 text-red-700 border border-red-200"
                                      }`}>
                                        {val}
                                      </span>
                                    ) : colIdx === 0 ? (
                                      <span className="font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                                        {val}
                                      </span>
                                    ) : (
                                      <span>{val || <span className="text-slate-300 italic">-</span>}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: No active database connected */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Database className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Nenhuma Base Google Sheets Vinculada</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Você pode criar instantaneamente uma nova base de dados relacional com 6 tabelas no seu Google Drive ou conectar uma planilha existente para gerenciar o inventário corporativo.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (!accessToken) onConnectGoogle();
                else setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Criar Base de Dados no Google Sheets</span>
            </button>

            <button
              onClick={() => {
                if (!accessToken) onConnectGoogle();
                else setShowConnectModal(true);
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Link2 className="w-4 h-4" />
              <span>Conectar Planilha Existente</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. MODAL: CRIAR NOVA BASE DE DADOS ESTRUTURADA */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Criar Base de Dados no Google Sheets</h3>
                  <p className="text-xs text-slate-500">
                    O assistente criará um novo arquivo com 6 tabelas relacionais formatadas no seu Google Drive.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nome do Arquivo no Google Drive</label>
                  <input
                    type="text"
                    value={dbTitleInput}
                    onChange={(e) => setDbTitleInput(e.target.value)}
                    placeholder="Ex: Base de Dados TI - Enterprise DB"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-700">Estrutura que será criada automaticamente:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>_CONFIG_BASE:</strong> Metadados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>TB_ATIVOS:</strong> {assets.length} itens</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>TB_LICENCAS:</strong> {licenses.length} softwares</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>TB_CONSUMIVEIS:</strong> {consumables.length} itens</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>TB_COLABORADORES:</strong> {users.length} usuários</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>TB_AUDITORIA:</strong> {activities.length} logs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreatingDb}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateDatabase}
                  disabled={isCreatingDb || !dbTitleInput.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isCreatingDb ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisionando Base no Drive...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Criar e Sincronizar Base</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: VINCULAR PLANILHA EXISTENTE */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Conectar Planilha Existente como Banco</h3>
                  <p className="text-xs text-slate-500">
                    Cole o link do Google Sheets ou o ID da planilha do seu Google Drive.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Link ou ID da Planilha</label>
                <input
                  type="text"
                  value={connectInputId}
                  onChange={(e) => setConnectInputId(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1a2b3c... ou ID"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConnectExisting}
                  disabled={isConnecting || !connectInputId.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando Conexão...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Vincular Planilha</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: INSERIR REGISTRO RÁPIDO NA BASE GOOGLE SHEETS */}
      <AnimatePresence>
        {showQuickInsertModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Inserir Novo Registro na Planilha</h3>
                    <p className="text-[11px] text-slate-500">Grava diretamente no banco de dados ativo do Google Sheets</p>
                  </div>
                </div>
              </div>

              {/* Table Selector Tabs */}
              <div className="flex border-b border-slate-200 gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setInsertTargetTable("TB_ATIVOS")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                    insertTargetTable === "TB_ATIVOS" ? "bg-blue-100 text-blue-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  TB_ATIVOS
                </button>
                <button
                  type="button"
                  onClick={() => setInsertTargetTable("TB_LICENCAS")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                    insertTargetTable === "TB_LICENCAS" ? "bg-purple-100 text-purple-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  TB_LICENCAS
                </button>
                <button
                  type="button"
                  onClick={() => setInsertTargetTable("TB_CONSUMIVEIS")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                    insertTargetTable === "TB_CONSUMIVEIS" ? "bg-amber-100 text-amber-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  TB_CONSUMIVEIS
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {insertTargetTable === "TB_ATIVOS" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Nome do Equipamento *</label>
                      <input
                        type="text"
                        value={assetForm.name}
                        onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                        placeholder="Ex: Dell Latitude 5430"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Categoria</label>
                        <select
                          value={assetForm.category}
                          onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        >
                          <option value="Notebooks">Notebooks</option>
                          <option value="Desktops">Desktops</option>
                          <option value="Monitores">Monitores</option>
                          <option value="Servidores">Servidores</option>
                          <option value="Dispositivos Móveis">Dispositivos Móveis</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Status</label>
                        <select
                          value={assetForm.status}
                          onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Atribuído">Atribuído</option>
                          <option value="Manutenção">Manutenção</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Fabricante</label>
                        <input
                          type="text"
                          value={assetForm.manufacturer}
                          onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                          placeholder="Dell, Lenovo, Apple"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Custo (R$)</label>
                        <input
                          type="text"
                          value={assetForm.cost}
                          onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}
                          placeholder="R$ 4.500,00"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {insertTargetTable === "TB_LICENCAS" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Nome do Software / Assinatura *</label>
                      <input
                        type="text"
                        value={licenseForm.name}
                        onChange={(e) => setLicenseForm({ ...licenseForm, name: e.target.value })}
                        placeholder="Ex: Microsoft 365 Business"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Fornecedor</label>
                        <input
                          type="text"
                          value={licenseForm.supplier}
                          onChange={(e) => setLicenseForm({ ...licenseForm, supplier: e.target.value })}
                          placeholder="Microsoft, Adobe, Atlassian"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Total de Assentos</label>
                        <input
                          type="number"
                          value={licenseForm.seatsTotal}
                          onChange={(e) => setLicenseForm({ ...licenseForm, seatsTotal: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {insertTargetTable === "TB_CONSUMIVEIS" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Nome do Consumível / Insumo *</label>
                      <input
                        type="text"
                        value={consumableForm.name}
                        onChange={(e) => setConsumableForm({ ...consumableForm, name: e.target.value })}
                        placeholder="Ex: Cabo HDMI 2.0 2m"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Qtd Restante</label>
                        <input
                          type="number"
                          value={consumableForm.quantityRemaining}
                          onChange={(e) => setConsumableForm({ ...consumableForm, quantityRemaining: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700">Capacidade Total</label>
                        <input
                          type="number"
                          value={consumableForm.quantityTotal}
                          onChange={(e) => setConsumableForm({ ...consumableForm, quantityTotal: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickInsertModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleQuickInsert}
                  disabled={isInsertingRow}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isInsertingRow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Gravar na Planilha Ativa</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: DETALHES DO REGISTRO SELECIONADO NA PLANILHA */}
      <AnimatePresence>
        {liveTableSelectedRow && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold font-mono text-sm">
                    #{liveTableSelectedRow.index}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Ficha do Registro</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono font-bold">
                        {selectedLiveTable}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Linha consultada diretamente da API do Google Sheets v4
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setLiveTableSelectedRow(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Key-Value fields */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {liveTableSelectedRow.headers.map((hdr, hIdx) => {
                    const val = liveTableSelectedRow.values[hIdx] !== undefined ? String(liveTableSelectedRow.values[hIdx]) : "";
                    const isStatus = val.toLowerCase() === "disponível" || val.toLowerCase() === "em uso" || val.toLowerCase() === "ativo" || val.toLowerCase() === "manutenção" || val.toLowerCase() === "crítico" || val.toLowerCase() === "expirado";

                    return (
                      <div
                        key={hIdx}
                        className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 hover:border-slate-300 transition-colors"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                          {hdr || `Coluna ${hIdx + 1}`}
                        </p>
                        {isStatus ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            val.toLowerCase() === "disponível" || val.toLowerCase() === "ativo"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : val.toLowerCase() === "em uso"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : val.toLowerCase() === "manutenção"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {val}
                          </span>
                        ) : (
                          <p className="text-xs font-semibold text-slate-800 break-words font-mono">
                            {val || <span className="text-slate-300 font-sans italic">Não informado</span>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const rowObj: Record<string, string> = {};
                    liveTableSelectedRow.headers.forEach((h, i) => {
                      rowObj[h || `Col_${i}`] = liveTableSelectedRow.values[i] || "";
                    });
                    navigator.clipboard.writeText(JSON.stringify(rowObj, null, 2));
                    showToast("Copiado!", "Registro copiado em formato JSON para a área de transferência.", "success");
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Copiar JSON</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={activeDbUrl || `https://docs.google.com/spreadsheets/d/${activeDbId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver no Google Sheets</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setLiveTableSelectedRow(null)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Database Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Excluir Base de Dados Google Sheets
                    </h3>
                    <p className="text-xs text-slate-500">
                      Deseja realmente desvincular e remover esta base de dados do sistema?
                    </p>
                  </div>
                </div>

                <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Nome da Base:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{activeDbName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">ID da Planilha:</span>
                    <span className="font-mono text-slate-700 font-semibold">{activeDbId ? `${activeDbId.slice(0, 10)}...` : "—"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    A sincronização periódica e as configurações de conexão serão canceladas imediatamente. O cache local do sistema não será afetado.
                  </p>
                </div>

                {/* Option to also delete from Google Drive */}
                <div className="mt-4 flex items-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-200/60">
                  <input
                    type="checkbox"
                    id="deleteDriveCheckbox"
                    checked={deleteFromDriveChoice}
                    onChange={(e) => setDeleteFromDriveChoice(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="deleteDriveCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Mover a planilha também para a lixeira do Google Drive
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeletingDb}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDatabase}
                    disabled={isDeletingDb}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    {isDeletingDb ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Excluindo Base...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirmar Exclusão</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
