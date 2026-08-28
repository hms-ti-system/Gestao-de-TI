import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Menu, 
  ChevronDown, 
  Laptop, 
  AlertTriangle,
  UserCheck,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity as ActivityIcon,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Asset } from "../types";

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  setSelectedAssetId: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  setMobileOpen, 
  setCurrentView,
  setSelectedAssetId 
}) => {
  const { 
    currentUser, 
    assets, 
    consumables, 
    forceCloudSync, 
    supabaseInfo,
    supabaseConfig,
    testSupabaseConnection,
    showToast,
    isReadOnly
  } = useApp();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [isSyncingSupa, setIsSyncingSupa] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supaModalRef = useRef<HTMLDivElement>(null);

  // Close suggestions, notifications, and db modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (supaModalRef.current && !supaModalRef.current.contains(e.target as Node)) {
        setShowSupabaseModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRunSupabaseTest = async () => {
    setIsTestingSupa(true);
    try {
      const res = await testSupabaseConnection();
      showToast(
        res.success ? "Conexão Supabase OK" : "Aviso Supabase",
        res.message,
        res.success ? "success" : "warning"
      );
    } finally {
      setIsTestingSupa(false);
    }
  };

  const handleForceSupabaseSync = async () => {
    setIsSyncingSupa(true);
    try {
      await forceCloudSync();
      showToast("Sincronizado", "Dados atualizados com sucesso do Supabase.", "success");
    } finally {
      setIsSyncingSupa(false);
    }
  };

  // Filter assets based on query
  const filteredSuggestions = searchQuery.trim() === "" 
    ? [] 
    : assets.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.assignedToUser?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const handleSuggestionClick = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    setCurrentView("asset-detail");
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Generate dynamic alerts based on database status
  const alerts: Array<{ id: string; text: string; type: "warning" | "success" | "info" }> = [];
  
  // Checking low stock consumables
  consumables.forEach(c => {
    if (c.status === "Crítico") {
      alerts.push({ id: `c-crit-${c.id}`, text: `Estoque crítico: ${c.name} (apenas ${c.quantityRemaining} restantes)`, type: "warning" });
    } else if (c.status === "Estoque Baixo") {
      alerts.push({ id: `c-low-${c.id}`, text: `Estoque baixo: ${c.name} (${c.quantityRemaining} em estoque)`, type: "warning" });
    }
  });

  // Assets in maintenance
  assets.forEach(a => {
    if (a.status === "Manutenção") {
      alerts.push({ id: `a-maint-${a.id}`, text: `Ativo ${a.id} em manutenção técnica`, type: "info" });
    }
  });

  if (alerts.length === 0) {
    alerts.push({ id: "all-good", text: "Sem novas notificações. Tudo em conformidade!", type: "success" });
  }

  return (
    <header className="flex justify-between items-center h-16 px-6 sticky top-0 z-30 bg-white border-b border-slate-200 transition-all duration-150 shadow-sm">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Search Bar with Autocomplete Suggestions */}
        <div ref={searchRef} className="relative w-full max-w-md hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Pressione / para pesquisar ativos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 transition-all outline-none"
          />

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in duration-100">
              <div className="px-4 py-2 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Ativos Encontrados
              </div>
              {filteredSuggestions.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSuggestionClick(asset)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
                      <p className="text-xs text-slate-400 font-mono">TAG: {asset.id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    asset.status === "Disponível" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : asset.status === "Atribuído"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {asset.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Header actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Connection Status Badge */}
        <div ref={supaModalRef} className="relative">
          <button
            onClick={() => {
              setShowSupabaseModal(!showSupabaseModal);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              supabaseInfo.status === "connected"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : supabaseInfo.status === "syncing"
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : supabaseConfig.url
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Clique para ver o status da conexão Supabase (PostgreSQL)"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                supabaseInfo.status === "connected" ? "bg-emerald-400" : supabaseInfo.status === "syncing" ? "bg-blue-400" : "bg-slate-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                supabaseInfo.status === "connected" ? "bg-emerald-600" : supabaseInfo.status === "syncing" ? "bg-blue-600" : "bg-slate-400"
              }`}></span>
            </span>
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">
              {supabaseInfo.status === "connected"
                ? "Supabase Conectado"
                : supabaseInfo.status === "syncing"
                ? "Supabase Sincronizando..."
                : supabaseConfig.url
                ? "Supabase Offline"
                : "Supabase Pendente"}
            </span>
            <span className="md:hidden inline text-[11px]">Supabase</span>
          </button>

          {/* Supabase Info Popover */}
          {showSupabaseModal && (
            <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 p-5 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="pb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Status Supabase PostgreSQL</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    supabaseInfo.status === "connected" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : supabaseInfo.status === "syncing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {supabaseInfo.status === "connected" ? "Online" : supabaseInfo.status === "syncing" ? "Sincronizando" : "Pendente"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Persistência relacional PostgreSQL no Supabase com sincronização em tempo real.
                </p>
              </div>

              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">URL do Projeto:</span>
                  <span className="font-mono text-slate-700 font-semibold truncate max-w-[200px] text-right" title={supabaseConfig.url || "Não configurado"}>
                    {supabaseConfig.url || "Não configurado"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Motor de Dados:</span>
                  <span className="text-slate-700 font-semibold">PostgreSQL (Relacional)</span>
                </div>
                {supabaseInfo.latencyMs !== null && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Latência de Comunicação:</span>
                    <span className="text-emerald-700 font-bold">
                      {supabaseInfo.latencyMs} ms
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Status do Firebase:</span>
                  <span className="text-slate-400 font-medium">
                    Desconectado
                  </span>
                </div>

                {supabaseInfo.lastTestResult?.counts && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ActivityIcon className="w-3.5 h-3.5 text-emerald-600" />
                      Linhas Gravadas no Supabase
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                        <div className="font-bold text-slate-800 text-xs">{supabaseInfo.lastTestResult.counts.assets ?? 0}</div>
                        <div className="text-[9px] text-slate-400 font-medium">Ativos</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                        <div className="font-bold text-slate-800 text-xs">{supabaseInfo.lastTestResult.counts.users ?? 0}</div>
                        <div className="text-[9px] text-slate-400 font-medium">Usuários</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                        <div className="font-bold text-slate-800 text-xs">{supabaseInfo.lastTestResult.counts.licenses ?? 0}</div>
                        <div className="text-[9px] text-slate-400 font-medium">Licenças</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-xs">
                        <div className="font-bold text-slate-800 text-xs">{supabaseInfo.lastTestResult.counts.consumables ?? 0}</div>
                        <div className="text-[9px] text-slate-400 font-medium">Consumíveis</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleRunSupabaseTest}
                    disabled={isTestingSupa}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupa ? "animate-spin" : ""}`} />
                    {isTestingSupa ? "Testando..." : "Testar Conexão"}
                  </button>
                  <button
                    onClick={handleForceSupabaseSync}
                    disabled={isSyncingSupa}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    title="Recarregar dados diretamente do Supabase"
                  >
                    <Database className={`w-3.5 h-3.5 ${isSyncingSupa ? "animate-pulse text-emerald-600" : ""}`} />
                    {isSyncingSupa ? "Sincronizando..." : "Sincronizar"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCurrentView("settings");
                    setShowSupabaseModal(false);
                  }}
                  className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Abrir Configurações do Supabase</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Circle */}
        <button 
          onClick={() => {
            showToast("Ajuda do Sistema", "O Gestor de Ativos opera integrado ao Supabase PostgreSQL com controle de acesso RBAC. O perfil de visualização permite consulta completa de inventário.", "info");
          }}
          className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors hidden sm:flex cursor-pointer"
          title="Ajuda e Documentação"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Dynamic Notifications Button */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full transition-all relative cursor-pointer ${
              showNotifications ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && alerts[0].id !== "all-good" && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-300"></span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-xs uppercase text-slate-500 tracking-wider">Notificações Recentes</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {alerts[0].id === "all-good" ? 0 : alerts.length} Alertas
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {alerts.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3">
                    {notif.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : notif.type === "success" ? (
                      <UserCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

        {/* Profile Dropdown Trigger */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView("profile")}
              className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-all cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-9 w-9 rounded-full object-cover border border-slate-300"
              />
              <div className="text-left hidden sm:block leading-none">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
                  {isReadOnly && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded border border-amber-200 uppercase">
                      Leitura
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
