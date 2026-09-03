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
  ShieldCheck,
  Flame,
  QrCode
} from "lucide-react";
import { Asset } from "../types";
import { QrScannerModal } from "./QrScannerModal";

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
    licenses, 
    users, 
    consumables, 
    cloudInfo,
    showToast 
  } = useApp();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHeaderScanner, setShowHeaderScanner] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close suggestions and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Botão Escanear Plaqueta / QR Code */}
        <button
          type="button"
          onClick={() => setShowHeaderScanner(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs group"
          title="Escanear Plaqueta Patrimonial / QR Code do Ativo"
        >
          <QrCode className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Ler Plaqueta</span>
        </button>

        {/* Firebase Connection Status Indicator */}
        <button
          type="button"
          onClick={() => setCurrentView("firebase")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-900 transition-all cursor-pointer shadow-2xs"
          title="Status da Conexão Firebase Firestore (Clique para ver detalhes e configurações)"
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <span className="hidden sm:inline">Firebase</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {cloudInfo.latencyMs !== null && (
            <span className="font-mono text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded hidden md:inline">
              {cloudInfo.latencyMs}ms
            </span>
          )}
        </button>

        {/* Help Circle */}
        <button 
          onClick={() => {
            alert("Ajuda Gestor de Ativos:\n- Conexão em nuvem ativa com Firebase Firestore.\n- Use o menu lateral para navegar entre telas.\n- Você pode cadastrar, entregar ou devolver notebooks.\n- O estoque de consumíveis atualiza em tempo real.\n- Acesse a tela de Perfil para modificar suas informações.");
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
                <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>
          </div>
        )}
      </div>

      {/* Header QR Scanner Modal */}
      {showHeaderScanner && (
        <QrScannerModal
          isOpen={showHeaderScanner}
          onClose={() => setShowHeaderScanner(false)}
          mode="lookup"
          onAssetFound={(assetId) => {
            setShowHeaderScanner(false);
            setSelectedAssetId(assetId);
            setCurrentView("asset-detail");
          }}
          onRegisterNewAssetWithTag={(tag) => {
            setShowHeaderScanner(false);
            setCurrentView("assets");
          }}
        />
      )}
    </header>
  );
};
