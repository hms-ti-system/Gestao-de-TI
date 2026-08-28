import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Database, 
  CheckCircle2, 
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
  Copy,
  Check,
  Zap,
  RefreshCw,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

export const Settings: React.FC = () => {
  const { 
    currentUser, 
    supabaseConfig,
    updateSupabaseConfig,
    supabaseInfo,
    testSupabaseConnection,
    migrateToSupabase,
    supabaseSqlSchema,
    forceCloudSync, 
    showToast,
    clearItemTables,
    clearAllActivities,
    resetDatabase,
    users,
    assets,
    licenses,
    consumables,
    activities,
    isReadOnly,
    canDelete,
    canEdit
  } = useApp();

  const [activeTab, setActiveTab] = useState<"supabase_config" | "maintenance">("supabase_config");
  
  // Supabase state
  const [supaUrl, setSupaUrl] = useState(supabaseConfig.url || "");
  const [supaKey, setSupaKey] = useState(supabaseConfig.anonKey || "");
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [supaTestResult, setSupaTestResult] = useState<any>(supabaseInfo.lastTestResult || null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync inputs when cloud config is fetched or updated
  useEffect(() => {
    if (supabaseConfig.url) setSupaUrl(supabaseConfig.url);
    if (supabaseConfig.anonKey) setSupaKey(supabaseConfig.anonKey);
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

  // Maintenance state
  const [showClearConfirm, setShowClearConfirm] = useState<"items" | "activities" | "all" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAdminUser = currentUser?.isAdmin || currentUser?.id === "user-admin";

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
      showToast("Configuração Incompleta", "Por favor, preencha a URL e a Chave Anon do Supabase antes de sincronizar.", "warning");
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await migrateToSupabase();
      setMigrationResult(res);
      showToast("Sincronização Concluída", res.message, "success");
      await handleTestSupabase();
    } catch (err: any) {
      showToast("Erro na Sincronização", err?.message || "Houve uma falha ao transferir dados para o Supabase.", "warning");
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
      showToast("Sincronização Concluída", "Os dados foram recarregados diretamente do Supabase (PostgreSQL).", "success");
    } catch {
      showToast("Erro", "Não foi possível sincronizar com o Supabase.", "warning");
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
        showToast("Tabelas Limpas", "As tabelas de ativos, licenças e consumíveis foram zeradas no Supabase.", "info");
      } else if (showClearConfirm === "activities") {
        await clearAllActivities();
        showToast("Histórico Limpo", "O histórico de atividades foi apagado com sucesso no Supabase.", "info");
      } else if (showClearConfirm === "all") {
        await resetDatabase();
        showToast("Sistema Reiniciado", "O banco de dados Supabase foi resetado e o usuário admin mestre foi recriado.", "warning");
      }
      setShowClearConfirm(null);
      await handleTestSupabase();
    } catch {
      showToast("Erro", "Falha ao executar operação de manutenção.", "warning");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Notice Banner */}
      {isReadOnly && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900">Perfil de Visualização Ativo (Somente Leitura)</p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                Você está autenticado com permissões de consulta. Modificações de conexão, gravação de dados e rotinas de manutenção ou exclusão no Supabase estão desabilitadas.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 bg-amber-200/70 text-amber-900 font-bold uppercase text-[10px] rounded-md tracking-wider shrink-0">
            Modo Consulta
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configurações do Supabase & Banco de Dados</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie a conexão relacional PostgreSQL do Supabase, estrutura SQL e rotinas de manutenção.
          </p>
        </div>

        <button
          type="button"
          onClick={handleForceSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Recarregar do Supabase"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("supabase_config")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "supabase_config"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-600" />
          Conexão Supabase (PostgreSQL)
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

      {/* TAB 1: Supabase Configuration & Status */}
      {activeTab === "supabase_config" && (
        <div className="space-y-6">
          {/* Supabase Status Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Banco de Dados Principal: Supabase PostgreSQL
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Supabase Conectado</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  A aplicação opera exclusivamente com persistência relacional PostgreSQL no Supabase. O Firebase foi desconectado.
                </p>
              </div>
              
              <div className="text-right shrink-0 bg-white/10 p-4 rounded-xl border border-white/10">
                <span className="text-xs text-emerald-200 block mb-1 font-semibold">Total de Registros:</span>
                <div className="text-2xl font-black text-white">
                  {assets.length + users.length + licenses.length + consumables.length + activities.length}
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
                    <h4 className="font-bold text-sm text-slate-800">Estrutura SQL (DDL)</h4>
                    <p className="text-[11px] text-slate-400">Tabelas e Políticas RLS</p>
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
                Abra seu painel do Supabase, clique no menu <strong>SQL Editor</strong>, cole o script abaixo e clique em <strong>RUN</strong>.
              </p>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                  {supabaseSqlSchema}
                </pre>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>O script cria as 5 tabelas (<code>users</code>, <code>assets</code>, <code>licenses</code>, <code>consumables</code>, <code>activities</code>) com suporte a JSONB.</span>
              </div>
            </div>

            {/* Step 2: Supabase Credentials Setup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Credenciais do Supabase</h4>
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

            {/* Step 3: Enviar dados e Contagens */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Sincronizar Dados</h4>
                  <p className="text-[11px] text-slate-400">Gravar registros no Supabase</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Registros Prontos para Gravação:</span>
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
                {isMigrating ? "Gravando Registros no Supabase..." : "Salvar Registros no Supabase"}
              </button>

              {migrationResult && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  migrationResult.success 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {migrationResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {migrationResult.success ? "Dados Gravados com Sucesso!" : "Falha na Gravação"}
                  </div>
                  <p>{migrationResult.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Count Statistics & User Session */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Registros Atuais na Memória / Supabase
              </h4>

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

            {/* User Session Info */}
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
                  <span className="text-slate-400 block mb-0.5">Firebase Status:</span>
                  <span className="font-semibold text-slate-500">Desconectado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Maintenance & Data Purging */}
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
                  <p className="text-xs text-slate-400">Controles administrativos de integridade de dados no Supabase</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Aviso de Segurança
                </p>
                As ações de limpeza afetam diretamente as tabelas do Supabase (PostgreSQL).
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
                        Apaga todos os registros de equipamentos, licenças e consumíveis no Supabase, mantendo os usuários.
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
                        Apaga todos os logs e eventos de auditoria passados no Supabase.
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
                        Zera todas as tabelas do Supabase e restaura a conta padrão Master 'admin' com senha 'admin'.
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
                  <span className="font-semibold text-slate-800">v3.0.0 (Supabase Exclusive)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Banco de Dados:</span>
                  <span className="font-semibold text-emerald-700">Supabase (PostgreSQL)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Firebase:</span>
                  <span className="font-semibold text-slate-400">Desconectado</span>
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
                <p className="text-xs text-slate-500">Esta ação impactará as tabelas do Supabase</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {showClearConfirm === "items" && "Tem certeza que deseja apagar todos os Ativos, Licenças e Consumíveis cadastrados no Supabase? Esta ação não pode ser desfeita."}
              {showClearConfirm === "activities" && "Tem certeza que deseja limpar todo o histórico de atividades e logs do sistema no Supabase?"}
              {showClearConfirm === "all" && "ATENÇÃO: Isso apagará todas as tabelas no Supabase e restaurará apenas a conta do Administrador padrão. Confirma o reset total?"}
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
