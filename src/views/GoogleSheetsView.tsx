import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  initGoogleAuth, 
  googleSignIn, 
  googleSignOut, 
  getGoogleAccessToken,
  getCachedGoogleUser
} from "../services/googleAuth";
import { 
  listUserSpreadsheets, 
  getSpreadsheetDetails, 
  getSheetValues, 
  createGoogleSpreadsheet,
  appendRowsToSpreadsheet,
  formatAssetsForSheet,
  formatLicensesForSheet,
  formatConsumablesForSheet,
  formatActivitiesForSheet,
  formatSummarySheet,
  GoogleDriveFile,
  GoogleSpreadsheetMetadata
} from "../services/googleSheets";
import { Asset, License, Consumable, AssetStatus, LicenseStatus, ConsumableStatus } from "../types";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  DownloadCloud, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Table, 
  Eye, 
  Layers, 
  Check, 
  FilePlus2, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight,
  LogOut,
  FolderOpen,
  ArrowRight,
  Info,
  Laptop,
  KeyRound,
  Package,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as FirebaseUser } from "firebase/auth";
import { SheetsDatabaseStudio } from "../components/sheets/SheetsDatabaseStudio";
import { SheetsSyncLogPanel } from "../components/sheets/SheetsSyncLogPanel";

export const GoogleSheetsView: React.FC = () => {
  const { 
    assets, 
    licenses, 
    consumables, 
    activities, 
    users, 
    addAsset, 
    addLicense, 
    addConsumable, 
    showToast 
  } = useApp();

  // Authentication State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(getCachedGoogleUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"database" | "drive" | "export" | "import" | "viewer">("database");

  // Drive Explorer State
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Export State
  const [exportType, setExportType] = useState<"all" | "assets" | "licenses" | "consumables" | "activities">("all");
  const [exportTitle, setExportTitle] = useState<string>(`Inventário TI - ${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}`);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastCreatedSheet, setLastCreatedSheet] = useState<GoogleSpreadsheetMetadata | null>(null);

  // Viewer State
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [currentSheetMetadata, setCurrentSheetMetadata] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [selectedTabName, setSelectedTabName] = useState<string>("");
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [isLoadingSheetData, setIsLoadingSheetData] = useState<boolean>(false);
  const [viewerSearch, setViewerSearch] = useState<string>("");

  // Add Row in Viewer Modal State
  const [showAddRowModal, setShowAddRowModal] = useState<boolean>(false);
  const [newRowValues, setNewRowValues] = useState<string[]>([]);
  const [isAppendingRow, setIsAppendingRow] = useState<boolean>(false);

  // Import State
  const [importSourceType, setImportSourceType] = useState<"drive_select" | "manual_id">("drive_select");
  const [importSpreadsheetId, setImportSpreadsheetId] = useState<string>("");
  const [importTargetType, setImportTargetType] = useState<"assets" | "licenses" | "consumables">("assets");
  const [importMetadata, setImportMetadata] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [importTabName, setImportTabName] = useState<string>("");
  const [rawImportData, setRawImportData] = useState<string[][]>([]);
  const [isLoadingImportData, setIsLoadingImportData] = useState<boolean>(false);
  const [columnMapping, setColumnMapping] = useState<{ [targetField: string]: number }>({});
  const [isExecutingImport, setIsExecutingImport] = useState<boolean>(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState<boolean>(false);
  const [parsedPreviewItems, setParsedPreviewItems] = useState<any[]>([]);

  // Initialize Auth on component load
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );

    // Initial check for cached token
    getGoogleAccessToken().then((token) => {
      if (token) {
        setAccessToken(token);
        setGoogleUser(getCachedGoogleUser());
      }
      setIsAuthLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch spreadsheets from drive when user is authenticated
  const loadDriveFiles = async (tokenOverride?: string) => {
    const token = tokenOverride || accessToken;
    if (!token) return;

    setIsLoadingFiles(true);
    try {
      const files = await listUserSpreadsheets(token, searchQuery);
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Failed to list Google Drive spreadsheets:", err);
      showToast("Aviso Google Drive", err?.message || "Não foi possível carregar planilhas do Drive.", "warning");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadDriveFiles();
    }
  }, [accessToken]);

  // Handle Google Sign In
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        showToast("Conexão Estabelecida", `Conectado com sucesso à conta Google (${result.user.email}).`, "success");
        loadDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      showToast("Falha na Conexão Google", err?.message || "Ocorreu um erro ao conectar com o Google.", "warning");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Google Sign Out
  const handleGoogleLogout = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setCurrentSheetMetadata(null);
    setSheetRows([]);
    showToast("Desconectado", "Sua sessão do Google foi encerrada.", "info");
  };

  // Load spreadsheet in Viewer
  const handleLoadSheetInViewer = async (spreadsheetId: string, initialTabName?: string) => {
    if (!accessToken) {
      showToast("Atenção", "Conecte sua conta Google primeiro.", "warning");
      return;
    }

    setSelectedSheetId(spreadsheetId);
    setActiveTab("viewer");
    setIsLoadingSheetData(true);

    try {
      const meta = await getSpreadsheetDetails(accessToken, spreadsheetId);
      setCurrentSheetMetadata(meta);
      const targetTab = initialTabName && meta.sheets.some(s => s.properties.title === initialTabName)
        ? initialTabName
        : meta.sheets[0]?.properties.title || "Sheet1";
      setSelectedTabName(targetTab);

      const valRes = await getSheetValues(accessToken, spreadsheetId, `${targetTab}!A1:Z200`);
      setSheetRows(valRes.values || []);
    } catch (err: any) {
      console.error("Error loading spreadsheet data:", err);
      showToast("Erro ao Abrir Planilha", err?.message || "Não foi possível carregar dados da planilha.", "warning");
    } finally {
      setIsLoadingSheetData(false);
    }
  };

  // Switch tab in viewer
  const handleViewerTabChange = async (tabName: string) => {
    if (!accessToken || !selectedSheetId) return;
    setSelectedTabName(tabName);
    setIsLoadingSheetData(true);
    try {
      const valRes = await getSheetValues(accessToken, selectedSheetId, `${tabName}!A1:Z200`);
      setSheetRows(valRes.values || []);
    } catch (err: any) {
      showToast("Erro ao Carregar Aba", err?.message || "Falha ao ler dados da aba.", "warning");
    } finally {
      setIsLoadingSheetData(false);
    }
  };

  // Handle Export to Google Sheets
  const handleExecuteExport = async () => {
    if (!accessToken) {
      showToast("Atenção", "Faça login com a conta Google para exportar planilhas.", "warning");
      return;
    }

    setIsExporting(true);
    setLastCreatedSheet(null);

    try {
      let payloadSheets: { title: string; data: (string | number | boolean | null)[][] }[] = [];

      if (exportType === "all") {
        payloadSheets = [
          { title: "Resumo Executivo", data: formatSummarySheet(assets, licenses, consumables, users) },
          { title: "Ativos de TI", data: formatAssetsForSheet(assets, users) },
          { title: "Licenças de Software", data: formatLicensesForSheet(licenses) },
          { title: "Consumíveis & Estoque", data: formatConsumablesForSheet(consumables) },
          { title: "Auditoria & Atividades", data: formatActivitiesForSheet(activities) }
        ];
      } else if (exportType === "assets") {
        payloadSheets = [
          { title: "Ativos de TI", data: formatAssetsForSheet(assets, users) }
        ];
      } else if (exportType === "licenses") {
        payloadSheets = [
          { title: "Licenças de Software", data: formatLicensesForSheet(licenses) }
        ];
      } else if (exportType === "consumables") {
        payloadSheets = [
          { title: "Consumíveis & Estoque", data: formatConsumablesForSheet(consumables) }
        ];
      } else if (exportType === "activities") {
        payloadSheets = [
          { title: "Auditoria & Atividades", data: formatActivitiesForSheet(activities) }
        ];
      }

      const res = await createGoogleSpreadsheet(accessToken, exportTitle || "Inventário de TI", payloadSheets);
      setLastCreatedSheet(res);
      showToast("Planilha Criada com Sucesso!", `A planilha "${exportTitle}" foi gerada no seu Google Drive.`, "success");
      loadDriveFiles();
    } catch (err: any) {
      console.error("Export error:", err);
      showToast("Erro na Exportação", err?.message || "Falha ao criar planilha no Google Sheets.", "warning");
    } finally {
      setIsExporting(false);
    }
  };

  // Load Import Sheet Details
  const handleLoadImportDetails = async (sheetId: string) => {
    if (!accessToken || !sheetId.trim()) return;
    setIsLoadingImportData(true);
    setImportMetadata(null);
    setRawImportData([]);

    try {
      const cleanId = sheetId.includes("/d/") 
        ? sheetId.split("/d/")[1].split("/")[0]
        : sheetId.trim();

      const meta = await getSpreadsheetDetails(accessToken, cleanId);
      setImportMetadata(meta);
      setImportSpreadsheetId(cleanId);

      const firstTab = meta.sheets[0]?.properties.title || "Sheet1";
      setImportTabName(firstTab);

      const valRes = await getSheetValues(accessToken, cleanId, `${firstTab}!A1:Z100`);
      setRawImportData(valRes.values || []);

      // Auto-guess mapping based on headers
      if (valRes.values && valRes.values.length > 0) {
        autoMapColumns(valRes.values[0], importTargetType);
      }
    } catch (err: any) {
      console.error("Error loading import sheet:", err);
      showToast("Erro ao Carregar Planilha", err?.message || "Não foi possível ler os cabeçalhos da planilha informada.", "warning");
    } finally {
      setIsLoadingImportData(false);
    }
  };

  // Change Import Tab
  const handleImportTabChange = async (tabName: string) => {
    if (!accessToken || !importSpreadsheetId) return;
    setImportTabName(tabName);
    setIsLoadingImportData(true);
    try {
      const valRes = await getSheetValues(accessToken, importSpreadsheetId, `${tabName}!A1:Z100`);
      setRawImportData(valRes.values || []);
      if (valRes.values && valRes.values.length > 0) {
        autoMapColumns(valRes.values[0], importTargetType);
      }
    } catch (err: any) {
      showToast("Erro ao Ler Aba", err?.message, "warning");
    } finally {
      setIsLoadingImportData(false);
    }
  };

  // Helper to auto-map columns based on header strings
  const autoMapColumns = (headers: string[], target: "assets" | "licenses" | "consumables") => {
    const mapping: { [key: string]: number } = {};
    const normHeaders = headers.map(h => String(h || "").toLowerCase().trim());

    if (target === "assets") {
      normHeaders.forEach((h, idx) => {
        if (h.includes("tag") || h.includes("id") || h.includes("código")) mapping["id"] = idx;
        else if (h.includes("nome") || h.includes("equipamento") || h.includes("dispositivo")) mapping["name"] = idx;
        else if (h.includes("cat") || h.includes("tipo")) mapping["category"] = idx;
        else if (h.includes("fabri") || h.includes("marca")) mapping["manufacturer"] = idx;
        else if (h.includes("mod")) mapping["model"] = idx;
        else if (h.includes("série") || h.includes("serial")) mapping["seriesNumber"] = idx;
        else if (h.includes("status")) mapping["status"] = idx;
        else if (h.includes("valor") || h.includes("custo") || h.includes("preço")) mapping["cost"] = idx;
        else if (h.includes("garant")) mapping["warrantyDate"] = idx;
        else if (h.includes("desc") || h.includes("obs")) mapping["description"] = idx;
      });
    } else if (target === "licenses") {
      normHeaders.forEach((h, idx) => {
        if (h.includes("id") || h.includes("código")) mapping["id"] = idx;
        else if (h.includes("nome") || h.includes("software")) mapping["name"] = idx;
        else if (h.includes("fornec") || h.includes("vendor")) mapping["supplier"] = idx;
        else if (h.includes("chave") || h.includes("key") || h.includes("serial")) mapping["key"] = idx;
        else if (h.includes("total") || h.includes("licenças") || h.includes("assentos")) mapping["seatsTotal"] = idx;
        else if (h.includes("expir") || h.includes("validade")) mapping["expirationDate"] = idx;
      });
    } else if (target === "consumables") {
      normHeaders.forEach((h, idx) => {
        if (h.includes("id") || h.includes("código")) mapping["id"] = idx;
        else if (h.includes("nome") || h.includes("item")) mapping["name"] = idx;
        else if (h.includes("cat") || h.includes("tipo")) mapping["category"] = idx;
        else if (h.includes("rest") || h.includes("atual") || h.includes("saldo") || h.includes("disp")) mapping["quantityRemaining"] = idx;
        else if (h.includes("total") || h.includes("capac")) mapping["quantityTotal"] = idx;
        else if (h.includes("desc")) mapping["description"] = idx;
      });
    }

    setColumnMapping(mapping);
  };

  // Preview Import before confirmation
  const handlePrepareImport = () => {
    if (rawImportData.length <= 1) {
      showToast("Planilha Vazia", "A aba selecionada não possui linhas de dados para importar.", "warning");
      return;
    }

    const dataRows = rawImportData.slice(1);
    const parsed: any[] = [];

    dataRows.forEach((row, rowIndex) => {
      // Skip completely empty rows
      if (row.every(c => !c || String(c).trim() === "")) return;

      if (importTargetType === "assets") {
        const nameVal = columnMapping["name"] !== undefined ? row[columnMapping["name"]] : `Ativo #${rowIndex + 1}`;
        const tagVal = columnMapping["id"] !== undefined && row[columnMapping["id"]] 
          ? row[columnMapping["id"]] 
          : `TAG-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
        const categoryVal = columnMapping["category"] !== undefined ? row[columnMapping["category"]] || "Hardware" : "Hardware";
        const manuVal = columnMapping["manufacturer"] !== undefined ? row[columnMapping["manufacturer"]] || "Genérico" : "Genérico";
        const modelVal = columnMapping["model"] !== undefined ? row[columnMapping["model"]] || "Padrão" : "Padrão";
        const serialVal = columnMapping["seriesNumber"] !== undefined ? row[columnMapping["seriesNumber"]] || `SN-${Date.now()}-${rowIndex}` : `SN-${Date.now()}-${rowIndex}`;
        const rawStatus = columnMapping["status"] !== undefined ? String(row[columnMapping["status"]] || "").toLowerCase() : "";
        
        let statusVal: AssetStatus = "Disponível";
        if (rawStatus.includes("atrib") || rawStatus.includes("uso")) statusVal = "Atribuído";
        else if (rawStatus.includes("manu") || rawStatus.includes("repar")) statusVal = "Manutenção";

        parsed.push({
          id: tagVal,
          name: nameVal,
          category: categoryVal,
          manufacturer: manuVal,
          model: modelVal,
          seriesNumber: serialVal,
          status: statusVal,
          cost: columnMapping["cost"] !== undefined ? row[columnMapping["cost"]] : "R$ 0,00",
          warrantyDate: columnMapping["warrantyDate"] !== undefined ? row[columnMapping["warrantyDate"]] : "",
          description: columnMapping["description"] !== undefined ? row[columnMapping["description"]] : "Importado via Google Sheets",
          health: 100
        });
      } else if (importTargetType === "licenses") {
        const nameVal = columnMapping["name"] !== undefined ? row[columnMapping["name"]] : `Software #${rowIndex + 1}`;
        const keyVal = columnMapping["key"] !== undefined ? row[columnMapping["key"]] || "XXXX-XXXX-XXXX" : "XXXX-XXXX-XXXX";
        const supplierVal = columnMapping["supplier"] !== undefined ? row[columnMapping["supplier"]] || "Fornecedor TI" : "Fornecedor TI";
        const seatsVal = columnMapping["seatsTotal"] !== undefined ? parseInt(String(row[columnMapping["seatsTotal"]] || "1"), 10) || 1 : 1;
        const expVal = columnMapping["expirationDate"] !== undefined ? row[columnMapping["expirationDate"]] || "2026-12-31" : "2026-12-31";

        parsed.push({
          name: nameVal,
          software: nameVal,
          supplier: supplierVal,
          key: keyVal,
          seatsTotal: seatsVal,
          seatsUsed: 0,
          expirationDate: expVal,
          status: "Ativo" as LicenseStatus,
          iconType: "cloud" as const
        });
      } else if (importTargetType === "consumables") {
        const nameVal = columnMapping["name"] !== undefined ? row[columnMapping["name"]] : `Item #${rowIndex + 1}`;
        const catVal = columnMapping["category"] !== undefined ? row[columnMapping["category"]] || "Geral" : "Geral";
        const remVal = columnMapping["quantityRemaining"] !== undefined ? parseInt(String(row[columnMapping["quantityRemaining"]] || "10"), 10) || 10 : 10;
        const totVal = columnMapping["quantityTotal"] !== undefined ? parseInt(String(row[columnMapping["quantityTotal"]] || "10"), 10) || 10 : 10;
        const descVal = columnMapping["description"] !== undefined ? row[columnMapping["description"]] : "Importado via Google Sheets";

        parsed.push({
          name: nameVal,
          category: catVal,
          quantityRemaining: remVal,
          quantityTotal: Math.max(totVal, remVal),
          description: descVal,
          iconName: "print" as const
        });
      }
    });

    if (parsed.length === 0) {
      showToast("Nenhum Item Válido", "Não foi possível extrair registros válidos com o mapeamento atual.", "warning");
      return;
    }

    setParsedPreviewItems(parsed);
    setShowImportConfirmModal(true);
  };

  // Execute Import into application storage
  const handleConfirmImport = async () => {
    setIsExecutingImport(true);
    try {
      let count = 0;
      for (const item of parsedPreviewItems) {
        if (importTargetType === "assets") {
          addAsset(item);
        } else if (importTargetType === "licenses") {
          addLicense(item);
        } else if (importTargetType === "consumables") {
          addConsumable(item);
        }
        count++;
      }

      setShowImportConfirmModal(false);
      showToast(
        "Importação Concluída com Sucesso", 
        `${count} registros foram importados para o módulo de ${importTargetType === "assets" ? "Ativos de TI" : importTargetType === "licenses" ? "Licenças" : "Consumíveis"}.`, 
        "success"
      );
    } catch (err: any) {
      console.error("Import execution failed:", err);
      showToast("Erro na Importação", err?.message || "Falha ao gravar registros importados.", "warning");
    } finally {
      setIsExecutingImport(false);
    }
  };

  // Add row directly to current viewer sheet
  const handleAppendRow = async () => {
    if (!accessToken || !selectedSheetId || !selectedTabName) return;
    setIsAppendingRow(true);

    try {
      await appendRowsToSpreadsheet(accessToken, selectedSheetId, selectedTabName, [newRowValues]);
      showToast("Linha Adicionada", "A nova linha foi gravada na sua planilha do Google Sheets.", "success");
      setShowAddRowModal(false);
      setNewRowValues([]);
      // Reload sheet values
      const valRes = await getSheetValues(accessToken, selectedSheetId, `${selectedTabName}!A1:Z200`);
      setSheetRows(valRes.values || []);
    } catch (err: any) {
      console.error("Append error:", err);
      showToast("Erro ao Gravar Linha", err?.message || "Não foi possível adicionar linha na planilha.", "warning");
    } finally {
      setIsAppendingRow(false);
    }
  };

  // Filtered rows for viewer
  const viewerHeaders = sheetRows.length > 0 ? sheetRows[0] : [];
  const viewerDataRows = sheetRows.length > 1 ? sheetRows.slice(1) : [];
  const filteredViewerDataRows = viewerDataRows.filter(row => {
    if (!viewerSearch.trim()) return true;
    const query = viewerSearch.toLowerCase();
    return row.some(cell => String(cell || "").toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Workspace Integration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Google Planilhas & Drive
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl">
              Sincronize ativos de TI, licenças e consumíveis diretamente com o Google Sheets. Exporte relatórios automatizados, crie novas planilhas e importe inventários em lote.
            </p>
          </div>

          {/* Account Status Capsule */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[280px]">
            {isAuthLoading ? (
              <div className="flex items-center gap-3 text-emerald-100 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificando conexão Google...</span>
              </div>
            ) : googleUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={googleUser.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCUgS7fDbdjDDbHbn2iIu7i2JpVr8ZV57e7bMCZxI0oW4wvOe1EtGhDwQwGGtmzcXglqhyhWrbNp8MAEWZD4RGKx-DbHh-MUwv_Kh5iLshA6iGla5fFX50Ja_C_UXv7M8tVMmahFmBWAxaFGhE66FPaJSfCOH7R5QGcZDojaRxniHoQAESB2vnzVrW8FluC97ObSf7q3l53iq1ZGa2ZAjL-obKpeDYM1_Uy1lP6Xb2Ba1806vNp00naBpvXJtyhyeXo4Mo-IygrbiU"}
                    alt={googleUser.displayName || "Google User"}
                    className="w-10 h-10 rounded-full border-2 border-emerald-400/50 object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{googleUser.displayName || "Conta Google"}</p>
                    <p className="text-[11px] text-emerald-200 truncate">{googleUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sheets & Drive Conectados</span>
                  </span>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-[11px] text-red-200 hover:text-red-100 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Desconectar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-emerald-100">Conecte sua conta Google para ler e gravar planilhas.</p>
                {/* Official Sign in with Google Button Styled with SVG */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full py-2.5 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 active:scale-[0.98]"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span>Entrar com o Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 bg-white px-4 pt-3 rounded-xl border shadow-sm">
        <button
          onClick={() => setActiveTab("database")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "database"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Base de Dados (Database Studio)</span>
        </button>

        <button
          onClick={() => setActiveTab("drive")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "drive"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Planilhas do Google Drive ({driveFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("export")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "export"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Exportar para Google Planilhas</span>
        </button>

        <button
          onClick={() => setActiveTab("import")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "import"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Importar do Google Planilhas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("viewer");
            if (!selectedSheetId && accessToken) {
              const savedDbId = localStorage.getItem("ac_sheets_db_id");
              if (savedDbId) {
                handleLoadSheetInViewer(savedDbId, "TB_ATIVOS");
              }
            }
          }}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "viewer"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Visualizador & Editor Integrado</span>
        </button>
      </div>

      {/* TAB 0: DATABASE STUDIO */}
      {activeTab === "database" && (
        <div className="space-y-6">
          <SheetsDatabaseStudio
            accessToken={accessToken}
            onOpenInViewer={(sheetId, tabName) => handleLoadSheetInViewer(sheetId, tabName)}
            onConnectGoogle={handleGoogleLogin}
          />
          <SheetsSyncLogPanel onOpenViewerWithDb={() => setActiveTab("viewer")} />
        </div>
      )}

      {/* TAB 1: GOOGLE DRIVE EXPLORER */}
      {activeTab === "drive" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar planilhas no seu Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDriveFiles()}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => loadDriveFiles()}
                disabled={isLoadingFiles || !accessToken}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? "animate-spin" : ""}`} />
                <span>Atualizar</span>
              </button>

              <button
                onClick={() => {
                  setExportTitle(`Inventário TI - ${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}`);
                  setActiveTab("export");
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Criar Nova Planilha TI</span>
              </button>
            </div>
          </div>

          {!accessToken ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Conecte sua conta Google</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Para explorar suas planilhas de ativos e relatórios existentes no Google Drive, clique no botão abaixo para autenticar.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Conectar com Google Workspace</span>
              </button>
            </div>
          ) : isLoadingFiles ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Consultando planilhas no Google Drive...</p>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Nenhuma planilha encontrada no Drive</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Crie sua primeira planilha corporativa de inventário com um clique na aba Exportar.
              </p>
              <button
                onClick={() => setActiveTab("export")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer hover:bg-emerald-700 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gerar Planilha Agora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 font-mono">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString("pt-BR") : "Recente"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {file.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Proprietário: {file.owners?.[0]?.displayName || "Você"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLoadSheetInViewer(file.id)}
                      className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      onClick={() => {
                        setImportSpreadsheetId(file.id);
                        setImportSourceType("drive_select");
                        setActiveTab("import");
                        handleLoadImportDetails(file.id);
                      }}
                      title="Importar dados desta planilha"
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                    </button>

                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs transition-colors flex items-center justify-center"
                        title="Abrir no Google Sheets"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPORT TO GOOGLE SHEETS */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gerador de Planilhas Google</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione o modelo e os dados que deseja exportar. Uma nova planilha com formatação corporativa e cabeçalhos estilizados será criada no seu Google Drive.
                </p>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Título da Planilha no Google Drive
                </label>
                <div className="relative">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={exportTitle}
                    onChange={(e) => setExportTitle(e.target.value)}
                    placeholder="Ex: Relatório Patrimonial de TI 2026"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-lg text-xs font-medium text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Template Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Selecione o Modelo de Exportação
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setExportType("all")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      exportType === "all"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      {exportType === "all" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Livro Mestre Completo (Todas as Abas)</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Resumo Executivo + Ativos ({assets.length}) + Licenças ({licenses.length}) + Consumíveis ({consumables.length}) + Auditoria.
                    </p>
                  </div>

                  <div
                    onClick={() => setExportType("assets")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      exportType === "assets"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Laptop className="w-4 h-4" />
                      </div>
                      {exportType === "assets" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Inventário de Ativos de TI</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tabela detalhada com tags, números de série, custos, colaboradores atribuídos e saúde.
                    </p>
                  </div>

                  <div
                    onClick={() => setExportType("licenses")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      exportType === "licenses"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      {exportType === "licenses" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Licenças & Softwares</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Chaves de ativação, assentos utilizados/disponíveis e prazos de validade.
                    </p>
                  </div>

                  <div
                    onClick={() => setExportType("consumables")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      exportType === "consumables"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      {exportType === "consumables" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Controle de Estoque & Consumíveis</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Saldos restantes, capacidades e status de reposição de insumos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExecuteExport}
                disabled={isExporting || !accessToken}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Criando planilha no Google Drive...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Criar Planilha no Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export Status / Success Column */}
          <div className="space-y-4">
            {lastCreatedSheet ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Planilha Criada com Sucesso!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    "{lastCreatedSheet.properties.title}" está disponível no seu Google Drive.
                  </p>
                </div>

                <div className="pt-3 border-t border-emerald-200/60 space-y-2">
                  <a
                    href={lastCreatedSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Abrir no Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleLoadSheetInViewer(lastCreatedSheet.spreadsheetId)}
                    className="w-full py-2.5 px-4 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver no Visualizador Interno</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recursos da Exportação</h4>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Cabeçalhos com cores corporativas e congelamento de primeira linha automático.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Mapeamento dos nomes de colaboradores diretamente aos ativos de TI.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Planilhas compatíveis com fórmulas Google Sheets e integração com Google Looker Studio.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT FROM GOOGLE SHEETS */}
      {activeTab === "import" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assistente de Importação Google Sheets</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Carregue uma planilha existente no seu Google Drive para cadastrar ou sincronizar ativos, licenças ou consumíveis.
                </p>
              </div>

              {/* Target Data Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => {
                    setImportTargetType("assets");
                    if (rawImportData.length > 0) autoMapColumns(rawImportData[0], "assets");
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importTargetType === "assets" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Ativos de TI
                </button>
                <button
                  onClick={() => {
                    setImportTargetType("licenses");
                    if (rawImportData.length > 0) autoMapColumns(rawImportData[0], "licenses");
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importTargetType === "licenses" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Licenças
                </button>
                <button
                  onClick={() => {
                    setImportTargetType("consumables");
                    if (rawImportData.length > 0) autoMapColumns(rawImportData[0], "consumables");
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importTargetType === "consumables" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Consumíveis
                </button>
              </div>
            </div>

            {/* Source Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Selecionar Planilha do seu Drive
                </label>
                <select
                  value={importSpreadsheetId}
                  onChange={(e) => {
                    setImportSpreadsheetId(e.target.value);
                    if (e.target.value) handleLoadImportDetails(e.target.value);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                >
                  <option value="">-- Selecione uma planilha do Google Drive --</option>
                  {driveFiles.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Ou Cole o ID / Link da Planilha
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={importSpreadsheetId}
                    onChange={(e) => setImportSpreadsheetId(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleLoadImportDetails(importSpreadsheetId)}
                    disabled={isLoadingImportData || !importSpreadsheetId}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingImportData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Carregar"}
                  </button>
                </div>
              </div>
            </div>

            {/* If metadata loaded, show sheet tab selector and column mapping */}
            {importMetadata && (
              <div className="space-y-6 pt-4 border-t border-slate-100 animate-fadeIn">
                {/* Tab Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Aba da Planilha:</span>
                  {importMetadata.sheets.map((s) => (
                    <button
                      key={s.properties.sheetId}
                      onClick={() => handleImportTabChange(s.properties.title)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        importTabName === s.properties.title
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {s.properties.title}
                    </button>
                  ))}
                </div>

                {/* Column Mapping Grid */}
                {rawImportData.length > 0 && (
                  <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>Mapeamento Inteligente de Colunas</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {rawImportData.length - 1} linhas de dados detectadas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {importTargetType === "assets" && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Tag / Código do Ativo</label>
                            <select
                              value={columnMapping["id"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, id: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Gerar TAG automático)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Nome do Equipamento *</label>
                            <select
                              value={columnMapping["name"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, name: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 font-bold"
                            >
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Categoria</label>
                            <select
                              value={columnMapping["category"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, category: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: Hardware)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Fabricante</label>
                            <select
                              value={columnMapping["manufacturer"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, manufacturer: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: Genérico)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Modelo</label>
                            <select
                              value={columnMapping["model"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, model: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: Standard)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Número de Série</label>
                            <select
                              value={columnMapping["seriesNumber"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, seriesNumber: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Gerar Serial temporário)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {importTargetType === "licenses" && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Nome do Software *</label>
                            <select
                              value={columnMapping["name"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, name: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 font-bold"
                            >
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Chave / Serial</label>
                            <select
                              value={columnMapping["key"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, key: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: Auto-gerado)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Quantidade de Assentos</label>
                            <select
                              value={columnMapping["seatsTotal"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, seatsTotal: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: 1)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {importTargetType === "consumables" && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Nome do Item *</label>
                            <select
                              value={columnMapping["name"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, name: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 font-bold"
                            >
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Quantidade Restante</label>
                            <select
                              value={columnMapping["quantityRemaining"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, quantityRemaining: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: 10)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">Capacidade Total</label>
                            <select
                              value={columnMapping["quantityTotal"] ?? ""}
                              onChange={(e) => setColumnMapping({ ...columnMapping, quantityTotal: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                            >
                              <option value="">(Padrão: Igual ao saldo)</option>
                              {rawImportData[0]?.map((h, i) => (
                                <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handlePrepareImport}
                      className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Pré-visualizar e Confirmar Importação</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRATED VIEWER & LIVE EDITOR */}
      {activeTab === "viewer" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Viewer Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentSheetMetadata ? currentSheetMetadata.properties.title : "Visualizador de Planilhas"}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    Sheets API v4
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentSheetMetadata ? `Aba ativa: ${selectedTabName} • ${filteredViewerDataRows.length} linhas filtradas` : "Selecione uma planilha para visualizar os dados em tempo real"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {currentSheetMetadata && (
                <>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrar linhas..."
                      value={viewerSearch}
                      onChange={(e) => setViewerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => handleViewerTabChange(selectedTabName)}
                    disabled={isLoadingSheetData}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Recarregar dados da planilha"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheetData ? "animate-spin" : ""}`} />
                    <span>Recarregar</span>
                  </button>

                  <button
                    onClick={() => {
                      if (sheetRows.length === 0) return;
                      const csvContent = "data:text/csv;charset=utf-8," + sheetRows.map(e => e.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `${selectedTabName}_${new Date().toISOString().slice(0,10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast("CSV Exportado", `Download do arquivo ${selectedTabName}.csv iniciado.`, "success");
                    }}
                    disabled={sheetRows.length === 0}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Exportar aba atual em formato CSV"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewRowValues(new Array(viewerHeaders.length).fill(""));
                      setShowAddRowModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Linha</span>
                  </button>

                  <a
                    href={currentSheetMetadata.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Abrir no Sheets</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Tab buttons if multiple sheets */}
          {currentSheetMetadata && currentSheetMetadata.sheets.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {currentSheetMetadata.sheets.map((s) => (
                <button
                  key={s.properties.sheetId}
                  onClick={() => handleViewerTabChange(s.properties.title)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedTabName === s.properties.title
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.properties.title}
                </button>
              ))}
            </div>
          )}

          {/* Grid Content */}
          {isLoadingSheetData ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Lendo dados da planilha no Google Sheets...</p>
            </div>
          ) : !currentSheetMetadata ? (
            <div className="p-12 text-center text-slate-400">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-medium">Nenhuma planilha carregada no visualizador.</p>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => {
                    const savedDbId = localStorage.getItem("ac_sheets_db_id");
                    if (savedDbId && accessToken) {
                      handleLoadSheetInViewer(savedDbId, "TB_ATIVOS");
                    } else {
                      setActiveTab("database");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Carregar Base Integrada</span>
                </button>
                <button
                  onClick={() => setActiveTab("drive")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Escolher no Google Drive</span>
                </button>
              </div>
            </div>
          ) : sheetRows.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              A aba "{selectedTabName}" está vazia ou não contém dados legíveis.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white sticky top-0 z-10">
                    <th className="p-2.5 border-r border-slate-700 font-mono text-[10px] w-10 text-center text-slate-400">#</th>
                    {viewerHeaders.map((h, i) => (
                      <th key={i} className="p-2.5 border-r border-slate-700 font-bold whitespace-nowrap">
                        {h || `Coluna ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredViewerDataRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-2 border-r border-slate-100 text-center text-slate-400 font-mono text-[10px] bg-slate-50/50">
                        {rIdx + 1}
                      </td>
                      {viewerHeaders.map((_, cIdx) => {
                        const cellVal = row[cIdx] !== undefined ? String(row[cIdx]) : "";
                        const cellLower = cellVal.toLowerCase();
                        const isStatus = cellLower === "disponível" || cellLower === "em uso" || cellLower === "ativo" || cellLower === "manutenção" || cellLower === "crítico" || cellLower === "expirado";

                        return (
                          <td key={cIdx} className="p-2 border-r border-slate-100 text-slate-700 whitespace-nowrap">
                            {isStatus ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cellLower === "disponível" || cellLower === "ativo"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : cellLower === "em uso"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : cellLower === "manutenção"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {cellVal}
                              </span>
                            ) : cIdx === 0 ? (
                              <span className="font-mono font-bold text-slate-900">{cellVal}</span>
                            ) : (
                              <span>{cellVal || <span className="text-slate-300 italic">-</span>}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE / MUTATING IMPORT (Mandatory Workspace Skill Requirement) */}
      <AnimatePresence>
        {showImportConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirmar Importação de Dados</h3>
                  <p className="text-xs text-slate-500">
                    Você está prestes a importar {parsedPreviewItems.length} registros para o módulo de{" "}
                    <strong className="text-slate-800">
                      {importTargetType === "assets" ? "Ativos de TI" : importTargetType === "licenses" ? "Licenças" : "Consumíveis"}
                    </strong>.
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60">
                <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider">Amostra dos Dados:</p>
                <div className="space-y-1.5">
                  {parsedPreviewItems.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-xs flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{item.id || item.supplier || item.category}</span>
                    </div>
                  ))}
                  {parsedPreviewItems.length > 8 && (
                    <p className="text-[11px] text-slate-400 text-center pt-1 italic">
                      + mais {parsedPreviewItems.length - 8} itens serão adicionados...
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Esta operação adicionará os novos registros ao banco de dados corporativo. Certifique-se de que os dados estão corretos antes de confirmar.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportConfirmModal(false)}
                  disabled={isExecutingImport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isExecutingImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isExecutingImport ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Importar {parsedPreviewItems.length} Itens</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD ROW TO GOOGLE SHEET MODAL */}
      <AnimatePresence>
        {showAddRowModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Adicionar Linha na Planilha do Google</h3>
                <span className="text-xs text-emerald-600 font-bold">{selectedTabName}</span>
              </div>

              <p className="text-xs text-slate-500">
                Preencha os valores para cada coluna da planilha selecionada. A nova linha será gravada ao final da tabela.
              </p>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {viewerHeaders.map((header, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">{header || `Coluna ${idx + 1}`}</label>
                    <input
                      type="text"
                      value={newRowValues[idx] || ""}
                      onChange={(e) => {
                        const copy = [...newRowValues];
                        copy[idx] = e.target.value;
                        setNewRowValues(copy);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAppendRow}
                  disabled={isAppendingRow}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isAppendingRow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Gravar no Google Sheets</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
