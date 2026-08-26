import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  Printer, 
  Cable, 
  Keyboard, 
  Mouse, 
  Power, 
  Package, 
  Plus, 
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Boxes,
  HelpCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { motion } from "motion/react";
import { Consumable } from "../types";

export const Consumables: React.FC = () => {
  const { consumables, checkoutConsumable, addConsumable, showToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  // Add consumable form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Impressoras");
  const [description, setDescription] = useState("");
  const [qtyRemaining, setQtyRemaining] = useState(10);
  const [qtyTotal, setQtyTotal] = useState(50);
  const [iconName, setIconName] = useState<Consumable["iconName"]>("keyboard");

  // Calculations
  const totalItems = consumables.reduce((sum, c) => sum + c.quantityRemaining, 0);
  const criticalItems = consumables.filter(c => c.status === "Crítico" || c.status === "Estoque Baixo").length;
  const openOrders = consumables.filter(c => c.status === "Crítico" || c.status === "Estoque Baixo").length;
  const monthlyConsumption = consumables.reduce((sum, c) => sum + Math.max(0, c.quantityTotal - c.quantityRemaining), 0);

  const getIcon = (name: Consumable["iconName"]) => {
    switch (name) {
      case "print": return Printer;
      case "settings_input_hdmi": return Cable;
      case "keyboard": return Keyboard;
      case "mouse": return Mouse;
      default: return Power;
    }
  };

  const handleCreateConsumable = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyRemaining > qtyTotal) {
      showToast("Erro de Validação", "A quantidade restante não pode exceder o estoque total.", "warning");
      return;
    }

    addConsumable({
      name,
      category,
      description,
      quantityRemaining: Number(qtyRemaining),
      quantityTotal: Number(qtyTotal),
      iconName,
    });

    setShowAddModal(false);
    setName("");
    setDescription("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Consumíveis de TI</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Monitore e dispense acessórios de escritório e periféricos de rápida substituição.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Consumível</span>
        </button>
      </div>

      {/* Top statistics overview block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total em Estoque</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{totalItems} <span className="text-xs text-slate-400 font-sans">un.</span></h3>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itens Críticos</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-red-600">{criticalItems}</h3>
            {criticalItems > 0 && (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
                RECOMPRA
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pedidos Abertos</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{openOrders} <span className="text-xs text-slate-400 font-sans">lotes</span></h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consumo Mensal</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{monthlyConsumption} <span className="text-xs text-slate-400 font-sans">un.</span></h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        </div>
      </div>

      {/* Grid of Consumables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {consumables.map((item) => {
          const Icon = getIcon(item.iconName);
          const ratio = (item.quantityRemaining / item.quantityTotal) * 100;
          
          return (
            <div 
              key={item.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition-all duration-200 shadow-sm flex flex-col justify-between h-[230px]"
            >
              <div>
                {/* Header card info */}
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                    <Icon className="w-6 h-6 text-slate-700" />
                  </div>

                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    item.status === "Disponível"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : item.status === "Estoque Médio"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : item.status === "Estoque Baixo"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="font-sans text-sm font-bold text-slate-800 leading-snug">{item.name}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1 leading-snug">{item.description}</p>
                </div>
              </div>

              {/* Progress and checkout CTA */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold">Quantidade</span>
                  <span className="font-mono font-bold text-slate-700">
                    {item.quantityRemaining} de {item.quantityTotal}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        item.status === "Disponível"
                          ? "bg-green-500"
                          : item.status === "Estoque Médio"
                          ? "bg-blue-500"
                          : item.status === "Estoque Baixo"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${ratio}%` }}
                    ></div>
                  </div>

                  {/* Checkout trigger */}
                  <button
                    onClick={() => checkoutConsumable(item.id)}
                    disabled={item.quantityRemaining === 0}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold rounded transition-colors uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dash block to Register New Consumable */}
        <div 
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center h-[230px] cursor-pointer group"
        >
          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-105 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-500 group-hover:text-blue-600 transition-colors mt-4">Novo Suprimento</span>
          <p className="text-[10px] text-slate-400 text-center mt-1 leading-normal max-w-[200px]">Adicione suprimentos de TI, adaptadores ou periféricos ao estoque.</p>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Cadastrar Consumível</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Gestão de Peças e Suprimentos</p>
              </div>
            </div>

            <form onSubmit={handleCreateConsumable} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome do Item</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mouse Sem Fio Logitech"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Impressoras">Impressoras</option>
                    <option value="Cabos">Cabos & Conexões</option>
                    <option value="Periféricos">Periféricos</option>
                    <option value="Adaptadores">Adaptadores</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Ícone do Cartão</label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="keyboard">Teclado</option>
                    <option value="mouse">Mouse</option>
                    <option value="print">Impressora</option>
                    <option value="settings_input_hdmi">Cabo / Conector</option>
                    <option value="power">Adaptador de Tomada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Descrição Curta</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Conexão USB-C, comprimento 1.8 metros."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Quantidade Restante</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={qtyRemaining}
                    onChange={(e) => setQtyRemaining(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Estoque Total Máximo</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={qtyTotal}
                    onChange={(e) => setQtyTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
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
                  Adicionar ao Estoque
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
