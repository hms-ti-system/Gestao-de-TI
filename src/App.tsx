import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Login } from "./views/Login";
import { Dashboard } from "./views/Dashboard";
import { Assets } from "./views/Assets";
import { AssetDetailsView } from "./views/AssetDetailsView";
import { Consumables } from "./views/Consumables";
import { Licenses } from "./views/Licenses";
import { Users } from "./views/Users";
import { UserProfileView } from "./views/UserProfileView";
import { Settings as SettingsView } from "./views/Settings";
import { GoogleSheetsView } from "./views/GoogleSheetsView";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

const MainLayout: React.FC = () => {
  const { currentUser, toast, hideToast } = useApp();
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedAssetId, setSelectedAssetId] = useState("TAG-2023-0842");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast?.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!currentUser) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard 
            setCurrentView={setCurrentView} 
            setSelectedAssetId={setSelectedAssetId} 
          />
        );
      case "assets":
        return (
          <Assets 
            setCurrentView={setCurrentView} 
            setSelectedAssetId={setSelectedAssetId} 
          />
        );
      case "asset-detail":
        return (
          <AssetDetailsView 
            assetId={selectedAssetId} 
            setCurrentView={setCurrentView}
            setSelectedAssetId={setSelectedAssetId}
          />
        );
      case "consumables":
        return <Consumables />;
      case "licenses":
        return <Licenses />;
      case "sheets":
        return <GoogleSheetsView />;
      case "users":
        return <Users />;
      case "profile":
        return <UserProfileView setCurrentView={setCurrentView} />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <Dashboard 
            setCurrentView={setCurrentView} 
            setSelectedAssetId={setSelectedAssetId} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Navigation Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Container Segment */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen overflow-x-hidden">
        {/* Search & Profile Header */}
        <Header 
          setMobileOpen={setMobileOpen} 
          setCurrentView={setCurrentView}
          setSelectedAssetId={setSelectedAssetId}
        />

        {/* Dynamic Inner Viewport Panel with animation wrap */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView + (currentView === "asset-detail" ? selectedAssetId : "")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Global Toast Notification Overlay */}
      <AnimatePresence>
        {toast && toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 p-4 flex gap-3.5 items-start"
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 overflow-hidden">
              <h5 className="text-xs font-bold leading-none">{toast.title}</h5>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed leading-normal">{toast.message}</p>
            </div>

            <button 
              onClick={hideToast}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
