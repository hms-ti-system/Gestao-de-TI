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
  Activity,
  Pencil,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { Consumable } from "../types";
import { canManageConsumables, canDeleteAssets, canOperate } from "../utils/permissions";

export const Consumables: React.FC = () => {
  const { 
    consumables, 
    checkoutConsumable, 
    addConsumable, 
    updateConsumable, 
    deleteConsumable, 
    currentUser, 
    showToast 
  } = useApp();

  const canManage = canManageConsumables(currentUser);
  const canDelete = canDeleteAssets(currentUser);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [deletingConsumable, setDeletingConsumable] = useState<Consumable | null>(null);

  // Add consumable form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Impressoras");
  const [description, setDescription] = useState("");
  const [qtyRemaining, setQtyRemaining] = useState(10);
  const [qtyTotal, setQtyTotal] = useState(50);
  const [iconName, setIconName] = useState<Consumable["iconName"]>("keyboard");

  // Edit consumable form state
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Impressoras");
  const [editDescription, setEditDescription] = useState("");
  const [editQtyRemaining, setEditQtyRemaining] = useState(10);
  const [editQtyTotal, setEditQtyTotal] = useState(50);
  const [editIconName, setEditIconName] = useState<Consumable["iconName"]>("keyboard");

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

  const handleOpenAddModal = () => {
    if (!canManage) {
      showToast("Acesso Restrito", "Apenas administradores e operadores podem cadastrar novos consumíveis no sistema.", "warning");
      return;
    }
    setName("");
    setDescription("");
    setCategory("Impressoras");
    setQtyRemaining(10);
    setQtyTotal(50);
    setIconName("keyboard");
    setShowAddModal(true);
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

  const handleStartEdit = (item: Consumable) => {
    if (!canManage) {
      showToast("Acesso Restrito", "Apenas administradores e operadores podem editar consumíveis.", "warning");
      return;
    }
    setEditingConsumable(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditQtyRemaining(item.quantityRemaining);
    setEditQtyTotal(item.quantityTotal);
    setEditIconName(item.iconName);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsumable) return;

    if (editQtyRemaining > editQtyTotal) {
      showToast("Erro de Validação", "A quantidade restante não pode exceder a quantidade total.", "warning");
      return;
    }

    updateConsumable(editingConsumable.id, {
      name: editName,
      category: editCategory,
      description: editDescription,
      quantityRemaining: Number(editQtyRemaining),
      quantityTotal: Number(editQtyTotal),
      iconName: editIconName,
    });

    setEditingConsumable(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingConsumable) return;
    deleteConsumable(deletingConsumable.id);
    setDeletingConsumable(null);
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
          onClick={handleOpenAddModal}
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

      {/* Empty state alert when zero consumables */}
      {consumables.length === 0 && (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base">Nenhum consumível cadastrado</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todos os consumíveis foram excluídos com sucesso. Você pode cadastrar novos itens do zero clicando no botão abaixo ou no card pontilhado.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Consumível</span>
          </button>
        </div>
      )}

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

                  <div className="flex items-center gap-1.5">
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

                    {(canManage || canDelete) && (
                      <div className="flex items-center gap-0.5 ml-1">
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(item);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Consumível"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingConsumable(item);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Consumível (Administrador)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
          onClick={handleOpenAddModal}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-2xl max-w-md w-full my-auto p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Cadastrar Consumível</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Gestão de Peças e Suprimentos</p>
              </div>
            </div>

            <form onSubmit={handleCreateConsumable} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome do Item</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mouse Sem Fio Logitech"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs bg-white"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs bg-white"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Quantidade Restante</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={qtyRemaining}
                    onChange={(e) => setQtyRemaining(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold transition-colors text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer text-center"
                >
                  Adicionar ao Estoque
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT CONSUMABLE MODAL (Administrador) */}
      {editingConsumable && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-2xl max-w-md w-full my-auto p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Pencil className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Editar Consumível</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Permissão de Administrador</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome do Item</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs bg-white"
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
                    value={editIconName}
                    onChange={(e) => setEditIconName(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs bg-white"
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
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Quantidade Restante</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editQtyRemaining}
                    onChange={(e) => setEditQtyRemaining(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Estoque Total Máximo</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editQtyTotal}
                    onChange={(e) => setEditQtyTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingConsumable(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer text-center"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE CONSUMABLE CONFIRMATION MODAL (Administrador) */}
      {deletingConsumable && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Excluir Consumível</h4>
                <p className="text-xs text-slate-500 font-medium">Permissão: Administrador</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Tem certeza de que deseja excluir o consumível{" "}
              <strong className="text-slate-900 font-bold">{deletingConsumable.name}</strong> do inventário?
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Categoria:</span>
                <span className="font-bold text-slate-800">{deletingConsumable.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estoque atual:</span>
                <span className="font-mono font-bold text-blue-600">{deletingConsumable.quantityRemaining} de {deletingConsumable.quantityTotal} un.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-slate-700">{deletingConsumable.status}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 mb-5">
              <strong>Atenção:</strong> O item será excluído permanentemente do banco de dados e do controle de saídas.
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingConsumable(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm shadow-red-500/20"
              >
                Sim, Excluir Item
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
