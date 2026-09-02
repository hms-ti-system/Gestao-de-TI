import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  Plus, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Percent,
  Search
} from "lucide-react";
import { motion } from "motion/react";
import { License } from "../types";

export const Licenses: React.FC = () => {
  const { licenses, addLicense, showToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);

  // New license state
  const [name, setName] = useState("");
  const [software, setSoftware] = useState("");
  const [supplier, setSupplier] = useState("Adobe Systems");
  const [key, setKey] = useState("");
  const [seatsTotal, setSeatsTotal] = useState(10);
  const [expirationDate, setExpirationDate] = useState("2027-12-12");
  const [iconType, setIconType] = useState<License["iconType"]>("cloud");

  // Calculations
  const totalSeats = licenses.reduce((sum, l) => sum + l.seatsTotal, 0);
  const totalUsed = licenses.reduce((sum, l) => sum + l.seatsUsed, 0);
  const utilizationPercent = totalSeats > 0 ? Math.round((totalUsed / totalSeats) * 100) : 0;
  const estimatedCostK = totalSeats > 0 ? Math.round((totalSeats * 450) / 1000) : 0;

  const expiringSoon = licenses.filter(l => l.status === "Expira em 12 dias").length;

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim() === "") {
      showToast("Validação", "Por favor forneça uma chave de ativação válida.", "warning");
      return;
    }

    addLicense({
      name,
      software,
      supplier,
      key,
      seatsTotal: Number(seatsTotal),
      seatsUsed: 0,
      expirationDate,
      status: "Ativo",
      iconType,
    });

    setShowAddModal(false);
    // Reset fields
    setName("");
    setSoftware("");
    setKey("");
  };

  const handleToggleReveal = (id: string) => {
    if (revealKeyId === id) {
      setRevealKeyId(null);
    } else {
      setRevealKeyId(id);
    }
  };

  const filteredLicenses = licenses.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.software.toLowerCase().includes(search.toLowerCase()) ||
    l.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    try {
      // CSV headers in Portuguese corresponding to the table columns and details
      const headers = [
        "ID da Assinatura",
        "Nome da Assinatura",
        "Software",
        "Distribuidor/Fornecedor",
        "Chave Secreta",
        "Assentos Totais",
        "Assentos Usados",
        "Taxa de Ocupação (%)",
        "Data de Expiração",
        "Status"
      ];

      // Convert rows to CSV strings
      const csvRows = [
        headers.join(","), // Header row
        ...filteredLicenses.map(lic => {
          const seatsPercent = lic.seatsTotal > 0 ? Math.round((lic.seatsUsed / lic.seatsTotal) * 100) : 0;
          const row = [
            lic.id,
            lic.name,
            lic.software,
            lic.supplier,
            lic.key,
            lic.seatsTotal,
            lic.seatsUsed,
            `${seatsPercent}%`,
            lic.expirationDate,
            lic.status
          ];

          // Escape commas and double quotes
          return row.map(val => {
            const cleanVal = typeof val === "string" ? val : String(val);
            const escaped = cleanVal.replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(",");
        })
      ];

      const csvContent = csvRows.join("\n");
      
      // Use UTF-8 with BOM to support Portuguese characters properly in Excel
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `licencas_software_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Exportação Concluída", `CSV de licenças gerado com sucesso contendo ${filteredLicenses.length} assinaturas.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Erro na Exportação", "Houve uma falha ao gerar o arquivo CSV de licenças.", "warning");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Licenças de Softwares</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Gerencie chaves de ativação, acentos disponíveis e auditorias de conformidade legal.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Licença</span>
          </button>
        </div>
      </div>

      {/* Metrics segment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Assinaturas</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{licenses.length}</h3>
            <KeyRound className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxa de Ocupação</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{utilizationPercent}%</h3>
            <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600" style={{ width: `${utilizationPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Licenças Expirando</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-amber-600">{expiringSoon}</h3>
            {expiringSoon > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                RENOVAR
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo Anual Estimado</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">
              {estimatedCostK > 0 ? `R$ ${estimatedCostK}k` : "R$ 0"}
            </h3>
            <TrendingDown className="w-4 h-4 text-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Grid: Compliance Audit & Licenses List Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Software Table List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Filtrar assinaturas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 transition-all outline-none"
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {filteredLicenses.length} softwares</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Software</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chave de Ativação</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acentos</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLicenses.map((lic) => {
                  const seatsPercent = Math.round((lic.seatsUsed / lic.seatsTotal) * 100);
                  const isRevealed = revealKeyId === lic.id;
                  
                  return (
                    <tr key={lic.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 leading-snug">{lic.name}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{lic.software} • {lic.supplier}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-slate-600 font-medium">
                            {isRevealed ? lic.key : "••••-••••-••••-••••"}
                          </span>
                          <button
                            onClick={() => handleToggleReveal(lic.id)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title={isRevealed ? "Ocultar Chave" : "Exibir Chave de Ativação"}
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col w-28">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>{lic.seatsUsed}/{lic.seatsTotal}</span>
                            <span>{seatsPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                seatsPercent > 90 
                                  ? "bg-red-500" 
                                  : seatsPercent > 50
                                  ? "bg-blue-600"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${seatsPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          lic.status === "Ativo"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : lic.status === "Expira em 12 dias"
                            ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            : lic.status === "Esgotado"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}>
                          {lic.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Optimization & Compliance block (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Cost Optimization Insights */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500 animate-bounce" />
              Otimizações de Custo (AI)
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  Assentos Subutilizados
                </h4>
                <p className="text-slate-600 mt-1 leading-snug">
                  Identificamos 15 contas do Microsoft 365 sem atividade nos últimos 30 dias. Economia potencial de <strong>R$ 1.250,00/mês</strong>.
                </p>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Upgrade Adobe CC
                </h4>
                <p className="text-slate-600 mt-1 leading-snug">
                  Sua assinatura do Adobe CC está em 90% da capacidade total. Considere unificar as contas para obter desconto por volume.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Checklist Compliance card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Auditoria de Conformidade
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="mt-0.5 accent-green-600 cursor-pointer" 
                />
                <div>
                  <h4 className="font-semibold text-slate-800">Conformidade Adobe CC</h4>
                  <p className="text-[10px] text-slate-400">Revisado há 5 dias. 100% Ok.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="mt-0.5 accent-green-600 cursor-pointer" 
                />
                <div>
                  <h4 className="font-semibold text-slate-800">Assentos JetBrains</h4>
                  <p className="text-[10px] text-slate-400">Nenhum over-seat detectado.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  defaultChecked={false} 
                  className="mt-0.5 accent-green-600 cursor-pointer" 
                />
                <div>
                  <h4 className="font-semibold text-slate-800">Expurgar Sketch Pro</h4>
                  <p className="text-[10px] text-slate-400 text-amber-600">Licença vencida. Desinstalação pendente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW LICENSE REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Registrar Nova Licença</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Gestão de Direitos Autorais</p>
              </div>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome da Assinatura</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Figma Professional Teams"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome do Software</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Figma Editor Core"
                  value={software}
                  onChange={(e) => setSoftware(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Distribuidor / Fornecedor</label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Adobe Systems">Adobe Systems</option>
                    <option value="Microsoft Corp.">Microsoft Corp.</option>
                    <option value="JetBrains s.r.o.">JetBrains s.r.o.</option>
                    <option value="Figma Inc.">Figma Inc.</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Ícone de Assinatura</label>
                  <select
                    value={iconType}
                    onChange={(e) => setIconType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="cloud">Cloud Suite</option>
                    <option value="brush">Design Tools</option>
                    <option value="terminal">IDE Developer Pack</option>
                    <option value="diamond">Pro Vectors</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Chave Serial Secreta</label>
                <input
                  type="text"
                  required
                  placeholder="ex: XXXX-ABCD-9921-KFGT"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Acentos Contratados</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={seatsTotal}
                    onChange={(e) => setSeatsTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
