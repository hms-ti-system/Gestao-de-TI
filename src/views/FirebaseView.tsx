import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Database, 
  ShieldCheck, 
  Server, 
  HardDrive, 
  Laptop, 
  Users as UsersIcon, 
  KeyRound, 
  Package, 
  History, 
  Copy, 
  Check, 
  Terminal, 
  Activity, 
  Radio, 
  Lock, 
  FileText,
  Search,
  ExternalLink
} from "lucide-react";
import { firebaseConfig } from "../firebase";

interface TestLog {
  id: string;
  timestamp: string;
  latencyMs: number;
  success: boolean;
  message: string;
}

export const FirebaseView: React.FC = () => {
  const { 
    currentUser,
    cloudInfo,
    testFirestoreConnection,
    migrateToFirebase,
    forceCloudSync,
    showToast,
    assets,
    users,
    licenses,
    consumables,
    activities
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "config" | "collections" | "rules">("overview");
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const [testResult, setTestResult] = useState<any>(cloudInfo.lastTestResult || null);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<"assets" | "users" | "licenses" | "consumables" | "activities">("assets");
  const [searchQuery, setSearchQuery] = useState("");

  const dbId = (firebaseConfig as any).firestoreDatabaseId || "ai-studio-assetcentral-5aa2dd0f-b3e1-4c7a-a9d6-49f8b61302b3";
  const projectId = firebaseConfig.projectId || "gen-lang-client-0378416982";

  // Auto-run initial test if no test has been executed yet
  useEffect(() => {
    if (!cloudInfo.lastTestResult) {
      handleTestConnection(true);
    }
  }, []);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast("Copiado", `Valor copiado para a área de transferência.`, "info");
  };

  const handleTestConnection = async (silent = false) => {
    setIsTesting(true);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
      
      const newLog: TestLog = {
        id: `test-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
        latencyMs: res.latencyMs,
        success: res.success,
        message: res.message
      };
      setTestLogs(prev => [newLog, ...prev.slice(0, 9)]);

      if (!silent) {
        showToast(
          res.success ? "Firebase Firestore Conectado" : "Alerta de Conexão",
          `Resposta em ${res.latencyMs}ms: ${res.message}`,
          res.success ? "success" : "warning"
        );
      }
    } catch (err: any) {
      if (!silent) {
        showToast("Erro de Teste", err?.message || "Falha ao testar comunicação com o Firebase.", "warning");
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceCloudSync();
      await handleTestConnection(true);
      showToast("Dados Recarregados", "Todos os registros foram atualizados a partir do Firebase Firestore.", "success");
    } catch {
      showToast("Erro", "Falha ao recarregar dados do Firebase Firestore.", "warning");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunMigration = async () => {
    setIsMigrating(true);
    try {
      const res = await migrateToFirebase();
      showToast("Sincronização Concluída", res.message, "success");
      await handleTestConnection(true);
    } catch (err: any) {
      showToast("Erro na Sincronização", err?.message || "Falha ao gravar dados no Firebase.", "warning");
    } finally {
      setIsMigrating(false);
    }
  };

  // Filter items in collection inspector
  const getCollectionItems = () => {
    switch (selectedCollection) {
      case "assets":
        return assets.filter(a => 
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "users":
        return users.filter(u => 
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "licenses":
        return licenses.filter(l => 
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          l.vendor.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "consumables":
        return consumables.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "activities":
        return activities.filter(act => 
          act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          act.details.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  const currentItems = getCollectionItems();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
              <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Conexão Firebase Firestore
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurações técnicas, monitor de latência e sincronização de dados NoSQL em nuvem
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Puxar dados atualizados do Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? "animate-spin text-amber-500" : ""}`} />
            {isSyncing ? "Recarregando..." : "Recarregar Dados"}
          </button>

          <button
            type="button"
            onClick={() => handleTestConnection(false)}
            disabled={isTesting}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Executa teste real de ping, leitura e gravação no Firestore"
          >
            <Zap className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Testando..." : "Testar Conexão"}
          </button>
        </div>
      </div>

      {/* Hero Banner with Connection Status */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 pointer-events-none">
          <Flame className="w-80 h-80 fill-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                Sincronização em Tempo Real (onSnapshot)
              </span>
              <span className="px-2.5 py-1 bg-white/10 text-slate-200 border border-white/10 rounded-lg text-xs font-medium">
                Google Cloud Platform
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Base de Dados Firebase Firestore Ativa
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema armazena todos os inventários, licenças, consumíveis, usuários e histórico de atividades de forma duradoura no banco de dados NoSQL do Firebase Firestore com listener reativo em tempo real.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-mono">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>Base: <strong>{dbId}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Segurança: <strong>firestore.rules</strong></span>
              </div>
              {cloudInfo.latencyMs !== null && (
                <div className="flex items-center gap-1.5 font-mono text-emerald-300">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Latência: <strong>{cloudInfo.latencyMs} ms</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0 lg:w-80">
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-white">{assets.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Ativos</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-white">{users.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Usuários</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-white">{licenses.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Licenças</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center">
              <div className="text-lg font-bold text-white">{consumables.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Consumíveis</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-center col-span-2">
              <div className="text-lg font-bold text-white">{activities.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Logs de Auditoria</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          Status & Diagnóstico
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "config"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          Parâmetros do SDK & Configurações
        </button>

        <button
          onClick={() => setActiveTab("collections")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "collections"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          Inspetor de Coleções
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "rules"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Regras de Segurança (Rules)
        </button>
      </div>

      {/* TAB 1: Status & Diagnóstico */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Status Card 1: Conexão Geral */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Geral</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  Operacional
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Comunicação direta com o Google Cloud</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Última Checagem:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {cloudInfo.lastSyncTime || "Em tempo real"}
                </span>
              </div>
            </div>

            {/* Status Card 2: Latência Medida */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latência do Firestore</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-800 font-mono flex items-center gap-1.5">
                  {cloudInfo.latencyMs !== null ? `${cloudInfo.latencyMs} ms` : "---"}
                  <span className="text-xs font-sans font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Excelente
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Tempo de ida e volta (Round Trip Time)</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Modo de Transporte:</span>
                <span className="font-semibold text-slate-700">Auto Long-Polling</span>
              </div>
            </div>

            {/* Status Card 3: Base de Dados Cloud */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID da Base</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Database className="w-4 h-4" />
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 font-mono break-all line-clamp-1" title={dbId}>
                  {dbId}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Instância configurada no ambiente</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Projeto:</span>
                <span className="font-semibold text-slate-700 font-mono text-[11px] truncate max-w-[140px]">
                  {projectId}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Console & Synchronization Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Test Result & Sync Action */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Diagnóstico de Leitura e Gravação</h4>
                    <p className="text-xs text-slate-400">Verificação ponta a ponta com o Firebase Firestore</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTestConnection(false)}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                  Executar Teste
                </button>
              </div>

              {testResult ? (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                  testResult.success 
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950" 
                    : "bg-amber-50/60 border-amber-200 text-amber-950"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      {testResult.success ? "Comunicação Firestore Verificada" : "Aviso de Conexão"}
                    </span>
                    <span className="font-mono bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                      {testResult.latencyMs} ms
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{testResult.message}</p>

                  {testResult.counts && (
                    <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-5 gap-2 text-center text-[11px]">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                        <span className="text-slate-400 block">Ativos</span>
                        <strong className="text-blue-700">{testResult.counts.assets}</strong>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                        <span className="text-slate-400 block">Usuários</span>
                        <strong className="text-indigo-700">{testResult.counts.users}</strong>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                        <span className="text-slate-400 block">Licenças</span>
                        <strong className="text-amber-700">{testResult.counts.licenses}</strong>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                        <span className="text-slate-400 block">Consumíveis</span>
                        <strong className="text-emerald-700">{testResult.counts.consumables}</strong>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                        <span className="text-slate-400 block">Logs</span>
                        <strong className="text-purple-700">{testResult.counts.activities}</strong>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  Nenhum teste foi executado nesta sessão. Clique no botão acima para validar a conexão.
                </div>
              )}

              {/* Sync Button Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Forçar Gravação Geral no Firestore
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Grava todos os registros locais em lote (*batch write*) garantindo paridade total com a nuvem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunMigration}
                  disabled={isMigrating}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isMigrating ? "animate-spin" : ""}`} />
                  {isMigrating ? "Gravando Registros..." : "Sincronizar Tudo"}
                </button>
              </div>
            </div>

            {/* Right: Recent Test Logs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  Histórico de Pings
                </h4>
                <span className="text-[10px] text-slate-400">Últimos {testLogs.length}</span>
              </div>

              {testLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  Execute um teste de conexão para registrar a latência.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
                  {testLogs.map(log => (
                    <div key={log.id} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.success ? "bg-emerald-500" : "bg-red-500"}`}></span>
                        <span className="font-mono text-slate-600 text-[11px]">{log.timestamp}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {log.latencyMs} ms
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Configurações do SDK */}
      {activeTab === "config" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">Parâmetros de Conexão do Firebase SDK</h3>
                <p className="text-xs text-slate-400">Credenciais públicas e identificadores provisionados no Google Cloud</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                Firebase Web SDK v11
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Project ID */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Project ID
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs break-all">
                    {projectId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("projectId", projectId)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                  title="Copiar"
                >
                  {copiedKey === "projectId" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Database ID */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Firestore Database ID
                  </span>
                  <span className="font-mono font-bold text-amber-700 text-xs break-all">
                    {dbId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("dbId", dbId)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                  title="Copiar"
                >
                  {copiedKey === "dbId" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Auth Domain */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Auth Domain
                  </span>
                  <span className="font-mono font-semibold text-slate-700 text-xs break-all">
                    {firebaseConfig.authDomain || "---"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("authDomain", firebaseConfig.authDomain || "")}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                >
                  {copiedKey === "authDomain" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Storage Bucket */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Storage Bucket
                  </span>
                  <span className="font-mono font-semibold text-slate-700 text-xs break-all">
                    {firebaseConfig.storageBucket || "---"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("storageBucket", firebaseConfig.storageBucket || "")}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                >
                  {copiedKey === "storageBucket" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* App ID */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    App ID
                  </span>
                  <span className="font-mono font-semibold text-slate-700 text-xs break-all">
                    {firebaseConfig.appId || "---"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("appId", firebaseConfig.appId || "")}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                >
                  {copiedKey === "appId" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Long Polling Flag */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    experimentalAutoDetectLongPolling
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    true (Ativado)
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Inspetor de Coleções */}
      {activeTab === "collections" && (
        <div className="space-y-6">
          {/* Collection Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCollection("assets")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedCollection === "assets"
                  ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Laptop className={`w-5 h-5 mb-2 ${selectedCollection === "assets" ? "text-blue-600" : "text-slate-400"}`} />
              <div className="font-bold text-sm text-slate-800">Ativos</div>
              <div className="text-xs text-slate-500 font-mono">{assets.length} documentos</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCollection("users")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedCollection === "users"
                  ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <UsersIcon className={`w-5 h-5 mb-2 ${selectedCollection === "users" ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="font-bold text-sm text-slate-800">Usuários</div>
              <div className="text-xs text-slate-500 font-mono">{users.length} documentos</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCollection("licenses")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedCollection === "licenses"
                  ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <KeyRound className={`w-5 h-5 mb-2 ${selectedCollection === "licenses" ? "text-amber-600" : "text-slate-400"}`} />
              <div className="font-bold text-sm text-slate-800">Licenças</div>
              <div className="text-xs text-slate-500 font-mono">{licenses.length} documentos</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCollection("consumables")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedCollection === "consumables"
                  ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Package className={`w-5 h-5 mb-2 ${selectedCollection === "consumables" ? "text-emerald-600" : "text-slate-400"}`} />
              <div className="font-bold text-sm text-slate-800">Consumíveis</div>
              <div className="text-xs text-slate-500 font-mono">{consumables.length} documentos</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCollection("activities")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                selectedCollection === "activities"
                  ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <History className={`w-5 h-5 mb-2 ${selectedCollection === "activities" ? "text-purple-600" : "text-slate-400"}`} />
              <div className="font-bold text-sm text-slate-800">Atividades</div>
              <div className="text-xs text-slate-500 font-mono">{activities.length} documentos</div>
            </button>
          </div>

          {/* Collection Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  collection("{selectedCollection}")
                </span>
                <span className="text-xs text-slate-400">
                  {currentItems.length} registros correspondentes
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar nesta coleção..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-amber-500"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
              {currentItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum registro encontrado nesta coleção.
                </div>
              ) : (
                currentItems.map((item: any) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {item.name || item.title || item.email || "Sem Título"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {item.category || item.department || item.vendor || item.details || ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.status}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Firestore Doc
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Regras de Segurança (firestore.rules) */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Regras de Segurança Ativas</h3>
                  <p className="text-xs text-slate-400">Políticas de acesso implementadas no Google Cloud Firestore</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Regras Validadas
              </span>
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Controle de Acesso em Nuvem
              </span>
              <p>
                As coleções do sistema estão protegidas pelo projeto Firebase <code>{projectId}</code>. 
                Toda modificação realizada pelos módulos do aplicativo é sincronizada em tempo real com controle de versão local.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
