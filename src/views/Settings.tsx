import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  Database, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Activity as ActivityIcon,
  Server,
  Cloud,
  Layers,
  HardDrive,
  Users as UsersIcon,
  Laptop,
  KeyRound,
  Package,
  History,
  Trash2,
  AlertTriangle,
  Lock,
  ArrowRightLeft,
  Copy,
  Check,
  Zap,
  ExternalLink,
  Code2,
  Flame
} from "lucide-react";

export const Settings: React.FC = () => {
  const { 
    currentUser, 
    cloudInfo,
    dbProvider,
    setDbProvider,
    supabaseConfig,
    updateSupabaseConfig,
    supabaseInfo,
    testSupabaseConnection,
    migrateToSupabase,
    supabaseSqlSchema,
    testConnection, 
    forceCloudSync, 
    showToast,
    clearItemTables,
    clearAllActivities,
    resetDatabase,
    users,
    assets,
    licenses,
    consumables,
    activities
  } = useApp();

  const [activeTab, setActiveTab] = useState<"database" | "supabase_migration" | "maintenance">("database");
  
  // Firebase test state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(cloudInfo.lastTestResult || null);
  
  // Supabase state
  const [supaUrl, setSupaUrl] = useState(supabaseConfig.url || "");
  const [supaKey, setSupaKey] = useState(supabaseConfig.anonKey || "");
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [supaTestResult, setSupaTestResult] = useState<any>(supabaseInfo.lastTestResult || null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Maintenance state
  const [showClearConfirm, setShowClearConfirm] = useState<"items" | "activities" | "all" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAdminUser = currentUser?.isAdmin || currentUser?.id === "user-admin";

  const handleTestFirebase = async () => {
    setIsTestingDb(true);
    try {
      const res = await testConnection();
      setTestResult(res);
      showToast(
        res.success ? "Conexão Firebase Verificada" : "Falha na Conexão Firebase", 
        res.message, 
        res.success ? "success" : "warning"
      );
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    updateSupabaseConfig({
      url: supaUrl.trim(),
      anonKey: supaKey.trim(),
    });
    showToast("Configurações Salvas", "As credenciais do Supabase foram salvas com sucesso.", "success");
  };

  const handleTestSupabase = async () => {
    setIsTestingSupa(true);
    // Auto-save input first
    updateSupabaseConfig({
      url: supaUrl.trim(),
      anonKey: supaKey.trim(),
    });

    try {
      const res = await testSupabaseConnection();
      setSupaTestResult(res);
      showToast(
        res.success ? "Conexão Supabase Verificada" : "Aviso de Conexão Supabase", 
        res.message, 
        res.success ? "success" : "warning"
      );
    } finally {
      setIsTestingSupa(false);
    }
  };

  const handleRunMigration = async () => {
    if (!supaUrl || !supaKey) {
      showToast("Configuração Incompleta", "Por favor, preencha a URL e a Chave Anon do Supabase antes de migrar.", "warning");
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await migrateToSupabase();
      setMigrationResult(res);
      showToast("Migração Concluída com Sucesso", res.message, "success");
      await handleTestSupabase();
    } catch (err: any) {
      showToast("Erro na Migração", err?.message || "Houve uma falha ao transferir dados para o Supabase.", "warning");
      setMigrationResult({ success: false, message: err?.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    showToast("Script SQL Copiado", "O script PostgreSQL foi copiado para a sua área de transferência.", "info");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceCloudSync();
      showToast("Sincronização Concluída", `Os dados foram recarregados diretamente do ${dbProvider === "supabase" ? "Supabase (PostgreSQL)" : "Firebase (Firestore)"}.`, "success");
    } catch {
      showToast("Erro", "Não foi possível sincronizar o banco de dados.", "warning");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecuteMaintenance = async () => {
    if (!showClearConfirm) return;
    setIsActionLoading(true);
    try {
      if (showClearConfirm === "items") {
        await clearItemTables();
        showToast("Tabelas Limpas", "As tabelas de ativos, licenças e consumíveis foram zeradas.", "info");
      } else if (showClearConfirm === "activities") {
        await clearAllActivities();
        showToast("Histórico Limpo", "O histórico de atividades foi apagado com sucesso.", "info");
      } else if (showClearConfirm === "all") {
        await resetDatabase();
        showToast("Sistema Reiniciado", "O banco de dados foi resetado e o usuário admin mestre foi recriado.", "warning");
      }
      setShowClearConfirm(null);
      if (dbProvider === "supabase") {
        await handleTestSupabase();
      } else {
        await handleTestFirebase();
      }
    } catch {
      showToast("Erro", "Falha ao executar operação de manutenção.", "warning");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configurações & Banco de Dados</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento de conexões na nuvem, migração para Supabase PostgreSQL e manutenção de dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Sincronizando..." : `Sincronizar ${dbProvider === "supabase" ? "Supabase" : "Firestore"}`}</span>
          </button>
          
          <button
            onClick={dbProvider === "supabase" ? handleTestSupabase : handleTestFirebase}
            disabled={dbProvider === "supabase" ? isTestingSupa : isTestingDb}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Database className={`w-4 h-4 ${(dbProvider === "supabase" ? isTestingSupa : isTestingDb) ? "animate-pulse" : ""}`} />
            <span>{(dbProvider === "supabase" ? isTestingSupa : isTestingDb) ? "Testando..." : "Testar Conexão"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("database")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "database"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          Provedores & Status
        </button>

        <button
          onClick={() => setActiveTab("supabase_migration")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "supabase_migration"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-600" />
          Migração para Supabase (PostgreSQL)
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">Novo</span>
        </button>

        <button
          onClick={() => setActiveTab("maintenance")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "maintenance"
              ? "border-slate-800 text-slate-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Manutenção & Limpeza
        </button>
      </div>

      {/* TAB 1: Database Status & Provider Selector */}
      {activeTab === "database" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Provider Selector Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Banco de Dados Ativo</h3>
                    <p className="text-xs text-slate-300">Selecione o mecanismo de persistência principal</p>
                  </div>
                </div>

                <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setDbProvider("firebase");
                      showToast("Provedor Alterado", "Firebase Firestore ativado como banco principal.", "info");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      dbProvider === "firebase"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Firebase Firestore
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setDbProvider("supabase");
                      showToast("Provedor Alterado", "Supabase (PostgreSQL) ativado como banco principal.", "info");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      dbProvider === "supabase"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Supabase PostgreSQL
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                <span>
                  Motor atual: <strong className="text-white">{dbProvider === "supabase" ? "Supabase (PostgreSQL Relacional)" : "Google Cloud Firestore (NoSQL)"}</strong>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dual-Sync Ativo (Gravação Espelho)
                </span>
              </div>
            </div>

            {/* Provider 1: Supabase Card */}
            <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 transition-all ${
              dbProvider === "supabase" ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-800">Supabase (PostgreSQL)</h3>
                      {dbProvider === "supabase" && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Banco de dados relacional SQL na nuvem</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  supabaseInfo.status === "connected"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${supabaseInfo.status === "connected" ? "bg-emerald-400" : "bg-slate-400"} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${supabaseInfo.status === "connected" ? "bg-emerald-500" : "bg-slate-500"}`}></span>
                  </span>
                  {supabaseInfo.status === "connected" ? "Online no Supabase" : "Aguardando Conexão"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-medium block mb-1">URL do Projeto</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block" title={supabaseConfig.url || "Não configurado"}>
                    {supabaseConfig.url || "Não configurado (configure na aba Migração)"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-medium block mb-1">Latência Supabase</span>
                  <span className="text-emerald-700 font-bold text-sm">
                    {supabaseInfo.latencyMs !== null ? `${supabaseInfo.latencyMs} ms` : "Não testado"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingSupa}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingSupa ? "animate-spin" : ""}`} />
                  {isTestingSupa ? "Testando Supabase..." : "Testar Conexão Supabase"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("supabase_migration")}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Configurar & Migrar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Provider 2: Firebase Card */}
            <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 transition-all ${
              dbProvider === "firebase" ? "border-amber-400 ring-2 ring-amber-50" : "border-slate-200"
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-800">Firebase Firestore</h3>
                      {dbProvider === "firebase" && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Google Cloud Platform NoSQL Firestore</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  cloudInfo.status === "connected"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {cloudInfo.status === "connected" ? "Online no Firestore" : "Sincronizando"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    Banco Firestore
                  </div>
                  <div className="font-mono font-bold text-slate-800 truncate" title={cloudInfo.databaseId}>
                    {cloudInfo.databaseId}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5 text-slate-500" />
                    Projeto Google Cloud
                  </div>
                  <div className="font-mono font-bold text-slate-800 truncate" title={cloudInfo.projectId}>
                    {cloudInfo.projectId}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                    <ActivityIcon className="w-3.5 h-3.5 text-slate-500" />
                    Latência Firestore
                  </div>
                  <div className="font-bold text-emerald-700 text-sm">
                    {cloudInfo.latencyMs !== null ? `${cloudInfo.latencyMs} ms` : "Calculando..."}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={isTestingDb}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingDb ? "animate-spin" : ""}`} />
                  {isTestingDb ? "Testando Firestore..." : "Testar Conexão Firebase Agora"}
                </button>
              </div>
            </div>

            {/* Live Count Statistics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Registros Atuais na Memória Local / Nuvem
                </h4>
                <span className="text-[11px] text-slate-400">
                  {cloudInfo.lastSync ? `Último sync: ${cloudInfo.lastSync.toLocaleTimeString("pt-BR")}` : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <Laptop className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">{assets.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Ativos</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <UsersIcon className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">{users.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Usuários</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <KeyRound className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">{licenses.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Licenças</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <Package className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">{consumables.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Consumíveis</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                  <History className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">{activities.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Atividades</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: User Auth & System Summary */}
          <div className="space-y-6">
            {/* User credentials */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Sessão do Usuário</h3>
                    <p className="text-[11px] text-slate-400">{currentUser?.name || "Não identificado"}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                  Conectado
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 block mb-0.5">Perfil de Acesso:</span>
                  <span className="font-semibold text-slate-800">
                    {isAdminUser ? "Administrador Master" : "Usuário Comum"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 block mb-0.5">Email Cadastrado:</span>
                  <span className="font-mono text-slate-800 truncate block">{currentUser?.email || "—"}</span>
                </div>
              </div>
            </div>

            {/* Quick Migration Banner */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm">Migrar para Supabase</h4>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Transfira todas as tabelas de ativos, usuários e licenças para o banco de dados PostgreSQL do Supabase em 3 passos simples.
              </p>
              <button
                onClick={() => setActiveTab("supabase_migration")}
                className="w-full py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Abrir Assistente de Migração</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Supabase Migration Wizard */}
      {activeTab === "supabase_migration" && (
        <div className="space-y-6">
          {/* Migration Header Hero */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Assistente de Migração Completa
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Migração Firebase ➔ Supabase PostgreSQL</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Siga os 3 passos abaixo para conectar seu projeto Supabase, criar a estrutura de tabelas PostgreSQL e transferir todos os dados cadastrados.
                </p>
              </div>
              
              <div className="text-right shrink-0">
                <span className="text-xs text-emerald-200 block mb-1 font-semibold">Total a transferir:</span>
                <div className="text-2xl font-black text-white">
                  {assets.length + users.length + licenses.length + consumables.length + activities.length} registros
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: SQL Schema Generator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Criar Tabelas no Supabase</h4>
                    <p className="text-[11px] text-slate-400">Script SQL DDL com RLS</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? "Copiado!" : "Copiar SQL"}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Abra seu painel do Supabase, clique no menu <strong>SQL Editor</strong> à esquerda, cole o script abaixo e clique em <strong>RUN</strong>.
              </p>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                  {supabaseSqlSchema}
                </pre>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>O script cria as 5 tabelas (<code>users</code>, <code>assets</code>, <code>licenses</code>, <code>consumables</code>, <code>activities</code>) com suporte completo a JSONB e políticas de acesso.</span>
              </div>
            </div>

            {/* Step 2: Supabase Credentials Setup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Conectar Credenciais</h4>
                  <p className="text-[11px] text-slate-400">URL e Chave Anon do Projeto</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Project URL (Supabase URL):
                  </label>
                  <input
                    type="text"
                    value={supaUrl}
                    onChange={(e) => setSupaUrl(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Encontrado em Project Settings ➔ API</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Anon Key (Chave Pública):
                  </label>
                  <input
                    type="password"
                    value={supaKey}
                    onChange={(e) => setSupaKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Chave anon / public do Supabase</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSupabaseConfig}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
                  >
                    Salvar Dados
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupa}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupa ? "animate-spin" : ""}`} />
                    {isTestingSupa ? "Testando..." : "Testar Conexão"}
                  </button>
                </div>

                {supaTestResult && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    supaTestResult.success 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      {supaTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {supaTestResult.success ? "Conexão Supabase Validada!" : "Aviso de Validação"}
                    </div>
                    <p>{supaTestResult.message}</p>
                    {supaTestResult.latencyMs > 0 && (
                      <span className="block mt-1 font-mono text-[11px] text-slate-600">
                        Latência de resposta: <strong>{supaTestResult.latencyMs} ms</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: 1-Click Migration Trigger */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Executar Migração</h4>
                  <p className="text-[11px] text-slate-400">Transferência direta de documentos</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Dados Prontos para Gravação:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Ativos:</span>
                    <strong className="text-blue-700">{assets.length}</strong>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Usuários:</span>
                    <strong className="text-indigo-700">{users.length}</strong>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Licenças:</span>
                    <strong className="text-amber-700">{licenses.length}</strong>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500">Consumíveis:</span>
                    <strong className="text-emerald-700">{consumables.length}</strong>
                  </div>
                  <div className="flex justify-between bg-white p-2 rounded-lg border border-slate-100 col-span-2">
                    <span className="text-slate-500">Histórico de Atividades:</span>
                    <strong className="text-purple-700">{activities.length}</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunMigration}
                disabled={isMigrating || !supaUrl || !supaKey}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className={`w-4 h-4 ${isMigrating ? "animate-spin" : ""}`} />
                {isMigrating ? "Transferindo Registros para Supabase..." : "Iniciar Migração de Dados Agora"}
              </button>

              {migrationResult && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  migrationResult.success 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {migrationResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {migrationResult.success ? "Migração Finalizada com Sucesso!" : "Falha na Migração"}
                  </div>
                  <p>{migrationResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Maintenance & Data Purging */}
      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Operações de Manutenção & Limpeza</h3>
                  <p className="text-xs text-slate-400">Controles administrativos de integridade de dados</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Aviso de Segurança
                </p>
                As ações de limpeza afetam tanto o Firebase Firestore quanto o Supabase (PostgreSQL) para garantir que ambos os bancos permaneçam em sincronia absoluta.
              </div>

              {isAdminUser ? (
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        Zerar Tabelas de Ativos, Licenças e Consumíveis
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Apaga todos os registros de equipamentos, licenças e consumíveis mantendo os usuários cadastrados.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowClearConfirm("items")}
                      className="px-3 py-2 bg-white hover:bg-red-50 hover:border-red-200 border border-slate-200 rounded-xl text-red-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Limpar Itens
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-600" />
                        Limpar Histórico de Atividades e Logs
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Apaga todos os logs e eventos de auditoria passados.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowClearConfirm("activities")}
                      className="px-3 py-2 bg-white hover:bg-red-50 hover:border-red-200 border border-slate-200 rounded-xl text-red-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Limpar Logs
                    </button>
                  </div>

                  <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-red-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Reset Geral do Banco de Dados
                      </h5>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        Zera todas as tabelas e restaura a conta padrão Master 'admin' com senha 'admin'.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowClearConfirm("all")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Reset Geral
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic text-center py-6 text-xs">
                  Apenas usuários com privilégios de Administrador Master podem executar ações de manutenção de dados.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Informações da Aplicação
              </h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Aplicação:</span>
                  <span className="font-semibold text-slate-800">Gestor de Ativos TI</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Versão:</span>
                  <span className="font-semibold text-slate-800">v2.5.0 (Supabase Ready)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Provedor Ativo:</span>
                  <span className="font-semibold text-emerald-700">
                    {dbProvider === "supabase" ? "Supabase (PostgreSQL)" : "Firebase (Firestore)"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Sincronização:</span>
                  <span className="font-semibold text-blue-700">Dual-Engine Habilitado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Database Maintenance */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Confirmar Ação de Manutenção</h3>
                <p className="text-xs text-slate-500">Esta ação impactará os dados nos bancos conectados</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {showClearConfirm === "items" && "Tem certeza que deseja apagar todos os Ativos, Licenças e Consumíveis cadastrados no Firestore e Supabase? Esta ação não pode ser desfeita."}
              {showClearConfirm === "activities" && "Tem certeza que deseja limpar todo o histórico de atividades e logs do sistema no Firestore e Supabase?"}
              {showClearConfirm === "all" && "ATENÇÃO: Isso apagará todas as tabelas em nuvem e restaurará apenas a conta do Administrador padrão. Confirma o reset total?"}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(null)}
                disabled={isActionLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteMaintenance}
                disabled={isActionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                {isActionLoading ? "Executando..." : "Sim, Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
