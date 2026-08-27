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
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";

export const Settings: React.FC = () => {
  const { 
    currentUser, 
    cloudInfo, 
    testConnection, 
    forceCloudSync, 
    showToast,
    clearItemTables,
    clearAllActivities,
    resetDatabase
  } = useApp();

  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(cloudInfo.lastTestResult || null);
  const [showClearConfirm, setShowClearConfirm] = useState<"items" | "activities" | "all" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAdminUser = currentUser?.isAdmin || currentUser?.id === "user-admin";

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    try {
      const res = await testConnection();
      setTestResult(res);
      showToast(
        res.success ? "Conexão Verificada" : "Falha na Conexão", 
        res.message, 
        res.success ? "success" : "warning"
      );
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceCloudSync();
      showToast("Sincronização Concluída", "Os dados foram recarregados diretamente do Firebase Firestore.", "success");
    } catch {
      showToast("Erro", "Não foi possível sincronizar com o Firestore.", "warning");
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
      await handleTestDatabase();
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configurações do Sistema</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerenciamento de credenciais, conexão em nuvem Firebase Firestore e ferramentas de manutenção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Sincronizando..." : "Sincronizar Firestore"}</span>
          </button>
          
          <button
            onClick={handleTestDatabase}
            disabled={isTestingDb}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <Database className={`w-4 h-4 ${isTestingDb ? "animate-pulse" : ""}`} />
            <span>{isTestingDb ? "Testando..." : "Testar Conexão"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Main Cloud Database & Credentials Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Credenciais de Acesso */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Credenciais de Acesso</h3>
                  <p className="text-xs text-slate-400">Status de autorização e nível de privilégios</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Autenticado
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-emerald-900">Chave API Sincronizada</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Seu agente central local está conectado com a nuvem Gestor de Ativos com segurança e criptografia TLS.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-slate-800">Nível de Permissão</h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isAdminUser ? (
                      <span className="font-semibold text-blue-700">
                        Administrador Master (Acesso total de Leitura, Escrita e Manutenção de Dados)
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-700">
                        Acesso Restrito ao Usuário / Responsabilidade Pessoal
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Banco de Dados Firestore */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Banco de Dados Firestore</h3>
                  <p className="text-xs text-slate-400">Instância gerenciada Google Cloud Platform</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                cloudInfo.status === "connected"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {cloudInfo.status === "connected" ? "Online na Nuvem" : "Sincronizando"}
              </span>
            </div>

            {/* Connection Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  Instância Firestore
                </div>
                <div className="font-mono font-bold text-slate-800 truncate" title={cloudInfo.databaseId}>
                  {cloudInfo.databaseId}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-500" />
                  Projeto Google Cloud
                </div>
                <div className="font-mono font-bold text-slate-800 truncate" title={cloudInfo.projectId}>
                  {cloudInfo.projectId}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <ActivityIcon className="w-3.5 h-3.5 text-slate-500" />
                  Latência de Rede
                </div>
                <div className="font-bold text-emerald-700 text-sm">
                  {cloudInfo.latencyMs !== null ? `${cloudInfo.latencyMs} ms` : "Calculando..."}
                </div>
              </div>
            </div>

            {/* Live Count Statistics */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Documentos Confirmados no Firebase
                </h4>
                <span className="text-[11px] text-slate-400">
                  {cloudInfo.lastSync ? `Última sincronização: ${cloudInfo.lastSync.toLocaleTimeString("pt-BR")}` : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                  <Laptop className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">
                    {testResult?.counts?.assets ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Ativos</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                  <UsersIcon className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">
                    {testResult?.counts?.users ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Usuários</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                  <KeyRound className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">
                    {testResult?.counts?.licenses ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Licenças</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                  <Package className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">
                    {testResult?.counts?.consumables ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Consumíveis</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs col-span-2 sm:col-span-1">
                  <History className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-base font-bold text-slate-800">
                    {testResult?.counts?.activities ?? "—"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Atividades</div>
                </div>
              </div>
            </div>

            {/* Test Action Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingDb ? "animate-spin" : ""}`} />
                {isTestingDb ? "Verificando Conexão Firestore..." : "Testar Conexão Firebase Agora"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): System Maintenance & Advanced Tools */}
        <div className="space-y-6">
          {/* Maintenance Actions (For Admins) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Manutenção de Dados</h3>
                <p className="text-[11px] text-slate-400">Ferramentas para limpeza controlada</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Aviso de Segurança
                </p>
                Os dados persistidos no Cloud Firestore são permanentes e só podem ser excluídos através de comandos explícitos de limpeza abaixo.
              </div>

              {isAdminUser ? (
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setShowClearConfirm("items")}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200 rounded-xl text-slate-700 hover:text-red-700 font-semibold transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                      Zerar Tabelas de Itens
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-red-500">Ativos/Licenças</span>
                  </button>

                  <button
                    onClick={() => setShowClearConfirm("activities")}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200 rounded-xl text-slate-700 hover:text-red-700 font-semibold transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                      Limpar Histórico de Atividades
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-red-500">Logs</span>
                  </button>

                  <button
                    onClick={() => setShowClearConfirm("all")}
                    className="w-full flex items-center justify-between p-3 bg-red-50/40 hover:bg-red-100/70 border border-red-200 rounded-xl text-red-700 font-semibold transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Reset Geral do Banco
                    </span>
                    <span className="text-[10px] text-red-600 font-bold">Admin Only</span>
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 italic text-center py-4">
                  Apenas usuários com perfil de Administrador podem acessar as ações de manutenção do banco de dados.
                </p>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Informações do Sistema
            </h4>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Aplicação:</span>
                <span className="font-semibold text-slate-800">Gestor de Ativos TI</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Versão do Cliente:</span>
                <span className="font-semibold text-slate-800">v2.4.0 (Cloud Sync)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Plataforma:</span>
                <span className="font-semibold text-slate-800">React 18 + Vite</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Segurança:</span>
                <span className="font-semibold text-emerald-700">Firestore Rules Ativas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {showClearConfirm === "items" && "Tem certeza que deseja apagar todos os Ativos, Licenças e Consumíveis cadastrados no Firestore? Esta ação não pode ser desfeita."}
              {showClearConfirm === "activities" && "Tem certeza que deseja limpar todo o histórico de atividades e logs do sistema no Firestore?"}
              {showClearConfirm === "all" && "ATENÇÃO: Isso apagará todas as coleções no Firebase e restaurará apenas a conta do Administrador padrão. Confirma o reset total?"}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(null)}
                disabled={isActionLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteMaintenance}
                disabled={isActionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
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
