import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { 
  Laptop, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Activity as ActivityIcon, 
  Calendar, 
  ChevronDown,
  ArrowRight,
  Sparkles,
  QrCode,
  FileSpreadsheet,
  PieChart as PieIcon,
  BarChart2,
  ShieldAlert,
  Clock,
  ChevronRight,
  Trash2
} from "lucide-react";
import { motion } from "motion/react";
import { Activity } from "../types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface DashboardProps {
  setCurrentView: (view: string) => void;
  setSelectedAssetId: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  setCurrentView, 
  setSelectedAssetId 
}) => {
  const { 
    assets, 
    users, 
    consumables, 
    licenses, 
    activities, 
    showToast, 
    clearAllActivities, 
    isReadOnly, 
    canDelete 
  } = useApp();
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const yearStartStr = `${currentYear}-01-01`;
  const yearEndStr = `${currentYear}-12-31`;

  const [dateFilterType, setDateFilterType] = useState<"30_days" | "current_year" | "custom">("30_days");
  const [customStartDate, setCustomStartDate] = useState(thirtyDaysAgoStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [chartMetric, setChartMetric] = useState<"volume" | "value">("volume");
  const [showQrModal, setShowQrModal] = useState(false);
  const [scannedTag, setScannedTag] = useState("");
  const [alertThreshold, setAlertThreshold] = useState<number>(30);

  // Helper to calculate difference in days
  const getDaysDifference = (dateStr: string) => {
    if (!dateStr || dateStr === "—") return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const targetDate = new Date(year, month, day);
    if (isNaN(targetDate.getTime())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to get formatted alert string
  const getAlertLabel = (days: number) => {
    if (days < 0) {
      const absDays = Math.abs(days);
      return absDays === 1 ? "Expirou ontem" : `Expirou há ${absDays} dias`;
    }
    if (days === 0) return "Expira hoje";
    if (days === 1) return "Expira amanhã";
    return `Expira em ${days} dias`;
  };

  // Calculate alerts memoized
  const expirationAlerts = useMemo(() => {
    const expiredList: Array<{
      id: string;
      rawId: string;
      type: "license" | "asset";
      name: string;
      detail: string;
      date: string;
      daysRemaining: number;
    }> = [];

    const upcomingList: Array<{
      id: string;
      rawId: string;
      type: "license" | "asset";
      name: string;
      detail: string;
      date: string;
      daysRemaining: number;
    }> = [];

    // Process Assets warranties
    assets.forEach((asset) => {
      if (asset.warrantyDate) {
        const days = getDaysDifference(asset.warrantyDate);
        if (days !== null) {
          const item = {
            id: `asset-${asset.id}`,
            rawId: asset.id,
            type: "asset" as const,
            name: asset.name,
            detail: `Garantia • S/N: ${asset.seriesNumber}`,
            date: new Date(asset.warrantyDate).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }),
            daysRemaining: days,
          };
          if (days < 0) {
            expiredList.push(item);
          } else if (days <= alertThreshold) {
            upcomingList.push(item);
          }
        }
      }
    });

    // Process Licenses
    licenses.forEach((license) => {
      if (license.expirationDate) {
        const days = getDaysDifference(license.expirationDate);
        if (days !== null) {
          const item = {
            id: `license-${license.id}`,
            rawId: license.id,
            type: "license" as const,
            name: license.name,
            detail: `Licença • Software: ${license.software}`,
            date: new Date(license.expirationDate).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }),
            daysRemaining: days,
          };
          if (days < 0) {
            expiredList.push(item);
          } else if (days <= alertThreshold) {
            upcomingList.push(item);
          }
        }
      }
    });

    // Sort expired list (closest to expiry date, i.e., expired most recently first)
    expiredList.sort((a, b) => b.daysRemaining - a.daysRemaining);

    // Sort upcoming list (soonest to expire first)
    upcomingList.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return { expired: expiredList, upcoming: upcomingList };
  }, [assets, licenses, alertThreshold]);

  // Dynamic calculations based on state
  const totalAssets = assets.length;
  const inUseAssets = assets.filter(a => a.status === "Atribuído").length;
  const availableAssets = assets.filter(a => a.status === "Disponível").length;
  const maintenanceAssets = assets.filter(a => a.status === "Manutenção").length;

  const allocationRate = totalAssets > 0 ? Math.round((inUseAssets / totalAssets) * 100) : 0;

  // Memoized status data for Recharts PieChart
  const statusChartData = useMemo(() => {
    return [
      { name: "Alocado", value: inUseAssets, color: "#3B82F6" },      // Blue
      { name: "Disponível", value: availableAssets, color: "#10B981" }, // Emerald
      { name: "Manutenção", value: maintenanceAssets, color: "#F59E0B" } // Amber
    ];
  }, [inUseAssets, availableAssets, maintenanceAssets]);

  // Memoized department data for Recharts BarChart
  const departmentChartData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    assets.forEach((asset) => {
      let dept = "Estoque (Não Alocado)";
      if (asset.assignedToUser?.department) {
        dept = asset.assignedToUser.department;
      } else if (asset.assignedToUserId) {
        const matchedUser = users.find((u) => u.id === asset.assignedToUserId);
        if (matchedUser?.department) {
          dept = matchedUser.department;
        }
      }
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    return Object.entries(deptMap).map(([name, value]) => ({
      name,
      quantidade: value,
    })).sort((a, b) => b.quantidade - a.quantidade);
  }, [assets, users]);

  // Chart data setup (interactive)
  const monthlyData = [
    { month: "JAN", volume: 120, value: 125000 },
    { month: "FEV", volume: 245, value: 250000 },
    { month: "MAR", volume: 312, value: 340000 },
    { month: "ABR", volume: 180, value: 195000 },
    { month: "MAI", volume: 420, value: 480000 },
    { month: "JUN", volume: 385, value: 410000 },
    { month: "JUL", volume: 512, value: 580000 },
    { month: "AGO", volume: 390, value: 430000 },
    { month: "SET", volume: 295, value: 310000 },
    { month: "OUT", volume: 340, value: 390000 },
  ];

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = scannedTag.trim().toUpperCase();
    const match = assets.find(a => a.id.toUpperCase() === cleanTag);
    if (match) {
      setSelectedAssetId(match.id);
      setCurrentView("asset-detail");
      setShowQrModal(false);
      showToast("Ativo Escaneado", `Código de barras correspondente a: ${match.name}`, "success");
    } else {
      showToast("Ativo Não Encontrado", `Nenhum ativo com a etiqueta ${cleanTag} foi localizado.`, "warning");
    }
  };

  const handleActivityClick = (act: Activity) => {
    // If target corresponds to an asset in the database, navigate to it
    const match = assets.find(a => a.id.toUpperCase() === act.target.toUpperCase());
    if (match) {
      setSelectedAssetId(match.id);
      setCurrentView("asset-detail");
    } else {
      showToast("Registro Geral", `${act.title}: ${act.details || ""}`, "info");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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
                Você possui acesso completo para consultar métricas, gráficos, status de inventário e alertas. Ações de criação, alteração ou exclusão de dados estão desabilitadas para este perfil.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 bg-amber-200/70 text-amber-900 font-bold uppercase text-[10px] rounded-md tracking-wider shrink-0">
            Apenas Consulta
          </span>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Visão Geral do Sistema</p>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Dashboard Principal</h2>
        </div>
        
        {/* Interactive Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative inline-block">
            <select 
              value={dateFilterType} 
              onChange={(e) => {
                const val = e.target.value as "30_days" | "current_year" | "custom";
                setDateFilterType(val);
                if (val === "30_days") {
                  setCustomStartDate(thirtyDaysAgoStr);
                  setCustomEndDate(todayStr);
                } else if (val === "current_year") {
                  setCustomStartDate(yearStartStr);
                  setCustomEndDate(yearEndStr);
                }
              }}
              className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 pr-10 rounded-lg outline-none cursor-pointer border border-transparent hover:border-slate-300 transition-all shadow-sm"
            >
              <option value="30_days">Últimos 30 Dias</option>
              <option value="current_year">Ano Atual ({currentYear})</option>
              <option value="custom">Personalizado (Digitar intervalo)</option>
            </select>
            <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {dateFilterType === "custom" && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[11px] font-bold text-slate-500 pl-1">De:</span>
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-500">Até:</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium outline-none focus:border-blue-600 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Assets Card */}
        <div 
          onClick={() => setCurrentView("assets")}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-all duration-200 group cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
              <TrendingUp className="w-3 h-3" /> {totalAssets > 0 ? `+${allocationRate}%` : "0%"}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Ativos</p>
          <p className="font-mono text-3xl font-bold text-slate-900">{totalAssets}</p>
        </div>

        {/* Em Uso (Allocation Rate) */}
        <div 
          onClick={() => setCurrentView("assets")}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-all duration-200 group cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {allocationRate}% Alocado
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ativos Em Uso</p>
          <p className="font-mono text-3xl font-bold text-slate-900">{inUseAssets}</p>
        </div>

        {/* Disponíveis (Available) */}
        <div 
          onClick={() => setCurrentView("assets")}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-all duration-200 group cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
              Pronto p/ Envio
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Disponíveis</p>
          <p className="font-mono text-3xl font-bold text-slate-900">{availableAssets}</p>
        </div>

        {/* Maintenance / Critical Status */}
        <div 
          onClick={() => setCurrentView("assets")}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-all duration-200 group cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Pendente / Alerta
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Em Manutenção</p>
          <p className="font-mono text-3xl font-bold text-slate-900">{maintenanceAssets}</p>
        </div>
      </div>

      {/* Expiration Alerts Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-slate-800">Alertas de Vencimento</h3>
              <p className="text-xs text-slate-400">Licenças de software e garantias de hardware sob atenção</p>
            </div>
          </div>

          {/* Threshold Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Verificar para:</span>
            <select
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 outline-none cursor-pointer transition-all"
            >
              <option value={30}>Próximos 30 dias</option>
              <option value={60}>Próximos 60 dias</option>
              <option value={90}>Próximos 90 dias</option>
            </select>
          </div>
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expirando em Breve Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Expira em Breve ({expirationAlerts.upcoming.length})
              </span>
              <span className="text-[10px] text-slate-400">Limite de {alertThreshold} dias</span>
            </div>

            {expirationAlerts.upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <div className="p-2 bg-green-50 text-green-600 rounded-full mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Tudo em conformidade!</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Nenhum ativo ou licença expira nos próximos {alertThreshold} dias.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {expirationAlerts.upcoming.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (alert.type === "asset") {
                        setSelectedAssetId(alert.rawId);
                        setCurrentView("asset-detail");
                      } else {
                        setCurrentView("licenses");
                      }
                    }}
                    className="p-3 bg-amber-50/40 hover:bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                        {alert.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{alert.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        {getAlertLabel(alert.daysRemaining)}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">{alert.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Já Expirados Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Já Expirados ({expirationAlerts.expired.length})
              </span>
              <span className="text-[10px] text-slate-400">Requer atenção imediata</span>
            </div>

            {expirationAlerts.expired.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <div className="p-2 bg-green-50 text-green-600 rounded-full mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Nenhum expirado!</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  Todas as garantias e licenças registradas estão ativas.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {expirationAlerts.expired.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (alert.type === "asset") {
                        setSelectedAssetId(alert.rawId);
                        setCurrentView("asset-detail");
                      } else {
                        setCurrentView("licenses");
                      }
                    }}
                    className="p-3 bg-red-50/40 hover:bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-red-700 transition-colors">
                        {alert.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{alert.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                        {getAlertLabel(alert.daysRemaining)}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Vencido em {alert.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Bento Grid: Charts & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Visualizer with Recharts */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[400px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="font-sans text-base font-bold text-slate-800">Distribuição de Status</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <p className="text-xs text-slate-400 mb-2">Visão geral do estado operacional de todos os patrimônios cadastrados.</p>

          <div className="flex-1 relative flex items-center justify-center min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    fontFamily: "monospace"
                  }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Absolute Center Counter */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block font-mono text-3xl font-black text-slate-800 leading-none">{totalAssets}</span>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-1">Ativos Totais</span>
            </div>
          </div>

          {/* Styled Legend Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] border-t border-slate-50 pt-3">
            <div className="flex flex-col items-center p-1.5 bg-blue-50/50 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span className="text-slate-500 font-bold">Alocados</span>
              </div>
              <span className="font-mono text-slate-800 font-bold mt-0.5">{inUseAssets}</span>
            </div>
            <div className="flex flex-col items-center p-1.5 bg-emerald-50/50 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-slate-500 font-bold">Disponíveis</span>
              </div>
              <span className="font-mono text-slate-800 font-bold mt-0.5">{availableAssets}</span>
            </div>
            <div className="flex flex-col items-center p-1.5 bg-amber-50/50 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-slate-500 font-bold">Manutenção</span>
              </div>
              <span className="font-mono text-slate-800 font-bold mt-0.5">{maintenanceAssets}</span>
            </div>
          </div>
        </div>

        {/* Department Distribution (Interactive Bar Chart with Recharts) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[400px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="font-sans text-base font-bold text-slate-800">Distribuição por Departamento</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Métrica em Tempo Real</span>
          </div>

          <p className="text-xs text-slate-400 mb-6">Volume total de equipamentos atribuídos a cada setor da organização.</p>

          <div className="flex-1 w-full min-h-[220px]">
            {departmentChartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                Nenhum departamento com ativo alocado no momento.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontWeight={500}
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontWeight={500}
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar 
                    dataKey="quantidade" 
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={45}
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? "#4f46e5" : "#6366f1"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity List Module */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-sans text-base font-bold text-slate-800">Atividades Recentes</h3>
          <div className="flex items-center gap-3">
            {activities.length > 0 && canDelete && !isReadOnly && (
              <button 
                onClick={async () => {
                  if (confirm("Deseja apagar permanentemente todo o histórico de atividades recentes?")) {
                    await clearAllActivities();
                  }
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Apagar todo o histórico de atividades"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
            <button 
              onClick={() => showToast("Histórico de Auditoria", "Carregando todos os registros do sistema central...", "info")}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Ver Histórico Completo
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Nenhuma atividade registrada no momento. As ações realizadas no sistema aparecerão aqui em tempo real.
            </div>
          ) : (
            activities.map((act) => (
              <div 
                key={act.id} 
                onClick={() => handleActivityClick(act)}
                className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                {/* Icon classification */}
                <div className={`w-9 h-9 rounded-full flex shrink-0 items-center justify-center ${
                  act.type === "sistema" 
                    ? "bg-blue-50 text-blue-600" 
                    : act.type === "suporte"
                    ? "bg-red-50 text-red-600"
                    : act.type === "automatico"
                    ? "bg-purple-50 text-purple-600"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  <ActivityIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-slate-700 font-medium truncate group-hover:text-blue-600 transition-colors">
                    {act.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{act.time} • {act.category}</p>
                </div>

                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase hidden sm:inline-block">
                  {act.type}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Scan Barcode Action Button */}
      <button 
        onClick={() => setShowQrModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group cursor-pointer border border-slate-800"
        title="Simular Leitura de Ativo por QR / Código de Barras"
      >
        <QrCode className="w-6 h-6 text-white" />
        <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          Simular Scan de Ativo
        </span>
      </button>

      {/* QR/Tag Simulator Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Simulador de Código de Barras</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Leitura de Etiqueta Física</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Digite a Etiqueta de Patrimônio do Ativo (ex: <code className="bg-slate-100 font-mono px-1 rounded font-bold text-slate-800">TAG-2023-0842</code> ou <code className="bg-slate-100 font-mono px-1 rounded font-bold text-slate-800">ASSET-2938</code>) para simular o escaneamento por câmera.
            </p>

            <form onSubmit={handleQrSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="TAG-2023-0842"
                value={scannedTag}
                onChange={(e) => setScannedTag(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-blue-600 font-mono"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Confirmar Scan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
