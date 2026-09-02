import React, { useState } from "react";
import { useApp, SheetsSyncLogEntry } from "../../context/AppContext";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Zap, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Trash2, 
  DownloadCloud, 
  UploadCloud, 
  ShieldCheck, 
  ExternalLink,
  Info,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SheetsSyncLogPanelProps {
  onOpenViewerWithDb?: () => void;
  className?: string;
}

export const SheetsSyncLogPanel: React.FC<SheetsSyncLogPanelProps> = ({
  onOpenViewerWithDb,
  className = ""
}) => {
  const { 
    sheetsSyncLogs, 
    sheetsSyncState, 
    clearSheetsSyncLogs, 
    testGoogleSheetsHandshake, 
    syncWithSheets, 
    showToast 
  } = useApp();

  const [isTestingHandshake, setIsTestingHandshake] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"last5" | "all" | "errors">("last5");

  // Filter logs based on selection
  const last5Logs = sheetsSyncLogs.slice(0, 5);
  const errorLogs = sheetsSyncLogs.filter((l) => l.status === "error");
  
  const displayedLogs = 
    filterMode === "last5" ? last5Logs : 
    filterMode === "errors" ? errorLogs : 
    sheetsSyncLogs;

  const totalErrors = errorLogs.length;
  const latestLog = sheetsSyncLogs[0];

  const handleTestHandshake = async () => {
    setIsTestingHandshake(true);
    try {
      const res = await testGoogleSheetsHandshake();
      if (res.success) {
        showToast(
          "Handshake OK", 
          `API Google Sheets v4 respondeu em ${res.latencyMs}ms com status 200 OK.`, 
          "success"
        );
      } else {
        showToast(
          "Falha no Handshake da API", 
          res.message || "Erro ao comunicar com Google Sheets.", 
          "warning"
        );
      }
    } catch (err: any) {
      showToast("Erro de Conectividade", err?.message || "Não foi possível testar o handshake.", "warning");
    } finally {
      setIsTestingHandshake(false);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncWithSheets(false);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleCopyLog = (log: SheetsSyncLogEntry) => {
    const textToCopy = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(log.id);
    showToast("Copiado!", "Detalhes técnicos do log copiados para a área de transferência.", "info");
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSeconds < 5) return "agora mesmo";
      if (diffSeconds < 60) return `há ${diffSeconds}s`;
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `há ${diffMinutes}m`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `há ${diffHours}h`;
      return `há ${Math.floor(diffHours / 24)}d`;
    } catch {
      return "";
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                Painel de Sincronização & Handshake da API
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Últimos 5 Logs
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Monitoramento em tempo real dos handshakes OAuth e registros de escrita/leitura no Google Sheets.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestHandshake}
            disabled={isTestingHandshake}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow cursor-pointer disabled:opacity-50"
            title="Testar resposta da API do Google Sheets v4 e verificar credenciais"
          >
            <Zap className={`w-3.5 h-3.5 ${isTestingHandshake ? "animate-spin" : ""}`} />
            <span>{isTestingHandshake ? "Testando Handshake..." : "Testar Handshake API"}</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isManualSyncing || sheetsSyncState.isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizar dados com o Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing || sheetsSyncState.isSyncing ? "animate-spin" : ""}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Status Bar & Quick Filters */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Exibição:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              onClick={() => setFilterMode("last5")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                filterMode === "last5"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Últimos 5 Timestamps
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                filterMode === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos ({sheetsSyncLogs.length})
            </button>
            <button
              onClick={() => setFilterMode("errors")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                filterMode === "errors"
                  ? "bg-red-600 text-white"
                  : totalErrors > 0
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-400"
              }`}
            >
              <span>Erros</span>
              {totalErrors > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  filterMode === "errors" ? "bg-white text-red-700" : "bg-red-100 text-red-700"
                }`}>
                  {totalErrors}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Handshake State Pill */}
        <div className="flex items-center gap-3">
          {latestLog ? (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Último evento:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                latestLog.status === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : latestLog.status === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {latestLog.status === "success" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : latestLog.status === "error" ? (
                  <XCircle className="w-3 h-3 text-red-600" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                )}
                <span>{latestLog.actionName} ({getRelativeTime(latestLog.timestamp)})</span>
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px]">Nenhum handshake registrado nesta sessão</span>
          )}

          {sheetsSyncLogs.length > 0 && (
            <button
              onClick={clearSheetsSyncLogs}
              className="text-slate-400 hover:text-red-600 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Limpar histórico de logs de sincronização"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Logs List Section */}
      <div className="divide-y divide-slate-100">
        {displayedLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                {filterMode === "errors" 
                  ? "Nenhum erro de handshake detectado!" 
                  : "Nenhum registro de sincronização recente"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                {filterMode === "errors"
                  ? "Todas as comunicações com a API do Google Sheets responderam sem erros nos últimos testes."
                  : "Execute uma sincronização ou clique em 'Testar Handshake API' para registrar o primeiro evento."}
              </p>
            </div>
            <button
              onClick={handleTestHandshake}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Testar Conexão Agora</span>
            </button>
          </div>
        ) : (
          displayedLogs.map((log, index) => {
            const isExpanded = expandedLogId === log.id;
            const isSuccess = log.status === "success";
            const isError = log.status === "error";
            const isWarning = log.status === "warning";

            return (
              <div 
                key={log.id} 
                className={`p-4 transition-colors ${
                  isError ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Metadata & Title */}
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSuccess 
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                        : isError 
                        ? "bg-red-100 text-red-700 border border-red-200" 
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}>
                      {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                      {isError && <XCircle className="w-4 h-4" />}
                      {isWarning && <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Sequence index */}
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>

                        {/* Operation Tag */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          log.type === "handshake"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : log.type === "push"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            : log.type === "pull"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {log.type === "handshake" ? "Handshake API" : log.type === "push" ? "Push / Gravação" : log.type === "pull" ? "Pull / Leitura" : "Auto-Sync"}
                        </span>

                        {/* Status Tag */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isSuccess
                            ? "bg-emerald-100/70 text-emerald-800"
                            : isError
                            ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}>
                          {isSuccess ? "SUCESSO (200 OK)" : isError ? `ERRO (${log.statusCode || "Falha"})` : "AVISO"}
                        </span>

                        {/* Duration if available */}
                        {log.durationMs !== undefined && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{log.durationMs}ms</span>
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <p className={`text-xs font-bold ${isError ? "text-red-900" : "text-slate-800"}`}>
                        {log.message}
                      </p>

                      {/* Sub-details (if not error) */}
                      {log.details && !isError && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          {log.details}
                        </p>
                      )}

                      {/* Items synchronized capsule */}
                      {log.itemCounts && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {log.itemCounts.assets !== undefined && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                              <strong>{log.itemCounts.assets}</strong> Ativos
                            </span>
                          )}
                          {log.itemCounts.licenses !== undefined && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                              <strong>{log.itemCounts.licenses}</strong> Licenças
                            </span>
                          )}
                          {log.itemCounts.consumables !== undefined && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                              <strong>{log.itemCounts.consumables}</strong> Consumíveis
                            </span>
                          )}
                          {log.itemCounts.users !== undefined && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                              <strong>{log.itemCounts.users}</strong> Colaboradores
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Exact Timestamp & Details Toggle */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-700">
                        {formatTimestamp(log.timestamp)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {getRelativeTime(log.timestamp)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyLog(log)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Copiar JSON do log"
                      >
                        {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isExpanded ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                        title={isExpanded ? "Ocultar detalhes técnicos" : "Ver diagnóstico técnico"}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed Technical Accordion */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-2 overflow-hidden"
                    >
                      {/* Error Diagnostic Box */}
                      {isError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-red-900">
                          <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>Diagnóstico de Erro no Handshake / API Google:</span>
                          </div>
                          <p className="text-xs text-red-700 font-mono bg-white/70 p-2 rounded border border-red-200 break-all">
                            {log.errorDetails || log.message}
                          </p>
                          <div className="text-[11px] text-red-600/90 leading-relaxed pt-1">
                            <strong>Dica de Resolução:</strong> Caso o erro seja 401 (Não autorizado), desconecte e reconecte sua conta Google no banner superior. Se for 403 (Permissão negada), certifique-se de que sua conta possui permissão de leitura/escrita na planilha.
                          </div>
                        </div>
                      )}

                      {/* Technical payload details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                        <div>
                          <span className="text-slate-400">ID do Log:</span>{" "}
                          <span className="text-slate-700 font-bold">{log.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Timestamp ISO:</span>{" "}
                          <span className="text-slate-700">{log.timestamp}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Tipo de Operação:</span>{" "}
                          <span className="text-slate-700 font-bold">{log.type}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Código HTTP:</span>{" "}
                          <span className={isError ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                            {log.statusCode || (isSuccess ? "200" : "500")}
                          </span>
                        </div>
                        {log.endpointTested && (
                          <div className="md:col-span-2 break-all">
                            <span className="text-slate-400">Endpoint API:</span>{" "}
                            <span className="text-slate-600">{log.endpointTested}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info & Quick Stats */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Handshakes autenticados com escopo Google Workspace: <code>spreadsheets</code> e <code>drive.file</code></span>
        </div>
        <div className="font-mono text-slate-400 text-[10px]">
          Sincronizador v4.2 • Auto-Push Ativo
        </div>
      </div>
    </div>
  );
};
