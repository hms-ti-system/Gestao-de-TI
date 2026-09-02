import React, { useState } from "react";
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
  Zap,
  RefreshCw,
  RotateCcw,
  Flame,
  ShieldCheck,
  Server
} from "lucide-react";

export const Settings: React.FC = () => {
  const { 
    currentUser, 
    cloudInfo,
    firebaseConfig,
    testFirestoreConnection,
    migrateToFirebase,
    deleteSupabaseDatabase,
    recreateAllDatabases,
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

  const [activeTab, setActiveTab] = useState<"firebase_config" | "maintenance">("firebase_config");
  
  // Firebase testing and migration states
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<any>(cloudInfo.lastTestResult || null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Maintenance state
  const [showClearConfirm, setShowClearConfirm] = useState<"items" | "activities" | "all" | "recreate" | "delete_supabase" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAdminUser = currentUser?.isAdmin || currentUser?.id === "user-admin";

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res = await testFirestoreConnection();
      setFirebaseTestResult(res);
      showToast(
        res.success ? "Conexão Firebase Firestore Validada" : "Aviso de Conexão Firebase", 
        res.message, 
        res.success ? "success" : "warning"
      );
    } catch (err: any) {
      showToast("Erro de Teste", err?.message || "Falha ao testar conexão com o Firebase.", "warning");
    } finally {
      setIsTestingFirebase(false);
    }
  };

  const handleRunFirebaseMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await migrateToFirebase();
      setMigrationResult(res);
      showToast("Sincronização Concluída", res.message, "success");
      await handleTestFirebase();
    } catch (err: any) {
      showToast("Erro na Sincronização", err?.message || "Houve uma falha ao transferir dados para o Firebase.", "warning");
      setMigrationResult({ success: false, message: err?.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceCloudSync();
      showToast("Sincronização Concluída", "Os dados foram recarregados diretamente do Firebase Firestore.", "success");
    } catch {
      showToast("Erro", "Não foi possível sincronizar com o Firebase Firestore.", "warning");
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
        showToast("Coleções Limpas", "As coleções de ativos, licenças e consumíveis foram zeradas no Firebase.", "info");
      } else if (showClearConfirm === "activities") {
        await clearAllActivities();
        showToast("Histórico Limpo", "O histórico de atividades foi apagado com sucesso no Firebase.", "info");
      } else if (showClearConfirm === "all") {
        await resetDatabase();
        showToast("Sistema Reiniciado", "O banco de dados Firebase Firestore foi resetado e o usuário admin mestre foi recriado.", "warning");
      } else if (showClearConfirm === "recreate") {
        const res = await recreateAllDatabases();
        if (res.success) {
          showToast("Banco Totalmente Recriado", "Todos os dados anteriores foram excluídos e um novo banco limpo está pronto no Firebase Firestore.", "success");
        }
      } else if (showClearConfirm === "delete_supabase") {
        deleteSupabaseDatabase();
      }
      setShowClearConfirm(null);
      await handleTestFirebase();
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
            Configurações do Firebase & Banco de Dados
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie a conexão de banco de dados NoSQL em nuvem com o Firebase Firestore, sincronização em tempo real e integridade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Recarregar do Firebase"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("firebase_config")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "firebase_config"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          Conexão Firebase Firestore (Ativa)
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

      {/* TAB 1: Firebase Firestore Configuration & Status */}
      {activeTab === "firebase_config" && (
        <div className="space-y-6">
          {/* Firebase Status Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold flex items-center gap-1.5 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Firebase Firestore Ativo
                  </span>
                  <span className="text-xs text-amber-100 font-medium">Google Cloud Platform</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Banco de Dados em Nuvem Conectado
                </h3>
                <p className="text-xs text-amber-100 max-w-xl leading-relaxed">
                  O sistema está configurado para salvar, atualizar e consultar todos os inventários, licenças, consumíveis e usuários diretamente no Firebase Firestore com persistência em tempo real.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={isTestingFirebase}
                  className="px-5 py-2.5 bg-white hover:bg-amber-50 text-slate-900 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-amber-600 ${isTestingFirebase ? "animate-spin" : ""}`} />
                  {isTestingFirebase ? "Testando Firestore..." : "Testar Conexão Firebase"}
                </button>
                <button
                  type="button"
                  onClick={handleRunFirebaseMigration}
                  disabled={isMigrating}
                  className="px-5 py-2.5 bg-amber-500/30 hover:bg-amber-500/40 text-white font-bold rounded-xl text-xs border border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className={`w-4 h-4 text-amber-300 ${isMigrating ? "animate-spin" : ""}`} />
                  {isMigrating ? "Gravando no Firebase..." : "Sincronizar Todos os Dados"}
                </button>
              </div>
            </div>
          </div>

          {/* Connection Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Firebase Project Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-600 fill-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Projeto Firebase</h4>
                  <p className="text-[11px] text-slate-400">Identificadores do Cloud</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Project ID:</span>
                  <span className="font-mono font-bold text-slate-800 text-[12px] break-all">
                    {firebaseConfig.projectId || "gen-lang-client-0378416982"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Firestore Database:</span>
                  <span className="font-mono font-bold text-amber-700 text-[12px] break-all">
                    {firebaseConfig.firestoreDatabaseId || "ai-studio-assetcentral-5aa2dd0f-b3e1-4c7a-a9d6-49f8b61302b3"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Modo de Segurança:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Regras Ativas (firestore.rules)
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Connection Status & Latency */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  <Server className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Status da Conexão</h4>
                  <p className="text-[11px] text-slate-400">Tempo de resposta e integridade</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Firebase Firestore Operacional
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Comunicação direta estabelecida com as coleções no Google Cloud.
                  </p>
                  {cloudInfo.latencyMs !== null && (
                    <span className="block mt-2 font-mono text-[11px] text-emerald-900">
                      Latência estimada: <strong>{cloudInfo.latencyMs} ms</strong>
                    </span>
                  )}
                </div>

                {firebaseTestResult && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    firebaseTestResult.success 
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-0.5">
                      {firebaseTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      {firebaseTestResult.success ? "Conexão Validada com Sucesso" : "Aviso de Conexão"}
                    </div>
                    <p className="text-[11px]">{firebaseTestResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Migration and Persistence */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                  <Database className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Sincronizar Coleções</h4>
                  <p className="text-[11px] text-slate-400">Gravar registros no Firestore</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Coleções Disponíveis:</span>
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
                onClick={handleRunFirebaseMigration}
                disabled={isMigrating}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className={`w-4 h-4 ${isMigrating ? "animate-spin" : ""}`} />
                {isMigrating ? "Gravando no Firestore..." : "Sincronizar com Firestore"}
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

          {/* Delete Supabase Database Card */}
          <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-600 text-white font-black rounded-md text-[10px] uppercase tracking-wider">
                  Exclusão Solicitada
                </span>
                <h4 className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Deletar Conexão e Credenciais do Supabase
                </h4>
              </div>
              <p className="text-xs text-red-900/80 leading-relaxed max-w-2xl">
                O banco de dados principal agora é exclusivamente o <strong>Firebase Firestore</strong>. Clique no botão ao lado para confirmar a exclusão e descarte de todas as credenciais do Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowClearConfirm("delete_supabase")}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Deletar Supabase</span>
            </button>
          </div>

          {/* Live Count Statistics & User Session */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                Registros Sincronizados no Firebase Firestore
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
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
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
                  <span className="text-slate-400 block mb-0.5">Provedor Ativo:</span>
                  <span className="font-semibold text-amber-600 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    Firebase Firestore
                  </span>
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
                  <p className="text-xs text-slate-400">Controles administrativos de integridade de dados no Firebase Firestore</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Aviso de Segurança
                </p>
                As ações de limpeza afetam diretamente as coleções do Firebase Firestore e a memória local.
              </div>

              {isAdminUser ? (
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        Zerar Coleções de Ativos, Licenças e Consumíveis
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Apaga todos os registros de equipamentos, licenças e consumíveis no Firestore, mantendo os usuários.
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
                        Apaga todos os logs e eventos de auditoria passados no Firebase Firestore.
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
                        Zera todas as coleções do Firebase e restaura a conta padrão Master 'admin' com senha 'admin'.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowClearConfirm("all")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Reset Geral
                    </button>
                  </div>

                  {/* Excluir Todos os Bancos e Recriar Novo Banco no Firebase */}
                  <div className="p-4.5 bg-gradient-to-r from-red-50/90 via-orange-50/70 to-amber-50/80 border-2 border-red-300 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-red-700 text-white font-black rounded-md text-[10px] uppercase tracking-wider">
                            Ação Completa
                          </span>
                          <h5 className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-red-600" />
                            Excluir Todos os Bancos & Recriar Novo no Firebase
                          </h5>
                        </div>
                        <p className="text-xs text-red-900/85 leading-relaxed max-w-xl">
                          Exclui completamente todos os dados de equipamentos, licenças, consumíveis, atividades e usuários tanto do <strong>Firebase Firestore</strong> quanto do <strong>armazenamento local</strong>. 
                          Recria uma base de dados limpa com a estrutura necessária e o usuário mestre padrão (<code>admin</code> / <code>admin</code>).
                        </p>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowClearConfirm("recreate")}
                          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir & Recriar Banco</span>
                        </button>
                      </div>
                    </div>
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
                <Layers className="w-4 h-4 text-amber-600" />
                Informações da Aplicação
              </h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Aplicação:</span>
                  <span className="font-semibold text-slate-800">Gestor de Ativos TI</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Versão:</span>
                  <span className="font-semibold text-slate-800">v3.5.0 (Firebase Firestore)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Banco de Dados:</span>
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    Firebase Firestore
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Supabase:</span>
                  <span className="font-semibold text-red-600">Deletado / Desconectado</span>
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
                <p className="text-xs text-slate-500">Esta ação impactará os dados em nuvem</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {showClearConfirm === "items" && "Tem certeza que deseja apagar todos os Ativos, Licenças e Consumíveis cadastrados no Firebase Firestore? Esta ação não pode ser desfeita."}
              {showClearConfirm === "activities" && "Tem certeza que deseja limpar todo o histórico de atividades e logs do sistema no Firebase Firestore?"}
              {showClearConfirm === "all" && "ATENÇÃO: Isso apagará todas as coleções no Firebase Firestore e restaurará apenas a conta do Administrador padrão. Confirma o reset total?"}
              {showClearConfirm === "recreate" && "ATENÇÃO MÁXIMA: Esta ação EXCLUIRÁ TODOS OS DADOS do Firebase Firestore e do armazenamento local. Em seguida, recriará uma nova base limpa com o Administrador Master ('admin' / 'admin'). Tem certeza absoluta que deseja prosseguir?"}
              {showClearConfirm === "delete_supabase" && "Tem certeza que deseja excluir e desconectar completamente qualquer resquício ou credencial do banco de dados Supabase? O sistema continuará conectado exclusivamente ao Firebase Firestore."}
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
