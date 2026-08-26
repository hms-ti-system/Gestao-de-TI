import React from "react";
import { useApp } from "../context/AppContext";
import { 
  LayoutDashboard, 
  Laptop, 
  Package, 
  KeyRound, 
  User, 
  BarChart3, 
  Settings, 
  LogOut,
  Boxes,
  Menu,
  X,
  Users as UsersIcon
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  mobileOpen, 
  setMobileOpen 
}) => {
  const { currentUser, logout } = useApp();

  const isAdminUser = currentUser?.isAdmin || currentUser?.id === "user-admin";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assets", label: "Ativos", icon: Laptop },
    { id: "consumables", label: "Consumíveis", icon: Package },
    { id: "licenses", label: "Licenças", icon: KeyRound },
    ...(isAdminUser ? [{ id: "users", label: "Usuários", icon: UsersIcon }] : []),
    { id: "profile", label: "Perfil", icon: User },
  ];

  const secondaryItems = [
    { id: "reports", label: "Relatórios", icon: BarChart3 },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#131b2e] text-white">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-sans text-lg font-bold leading-none tracking-tight">Gestor de Ativos</h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">Gestão de TI</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20 border-l-4 border-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Secondary Nav */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-1">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {currentUser && (
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-lg transition-all duration-150 mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        )}

        {/* User Capsule */}
        {currentUser && (
          <div className="pt-4 mt-2 border-t border-slate-800">
            <button 
              onClick={() => handleNavClick("profile")}
              className="flex items-center gap-3 p-2 bg-slate-800/40 hover:bg-slate-800 rounded-lg w-full text-left transition-all group"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] z-40 hidden lg:flex flex-col border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Back Drop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <aside 
        className={`fixed left-0 top-0 h-full w-[260px] z-50 lg:hidden flex flex-col transition-transform duration-300 transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
};
