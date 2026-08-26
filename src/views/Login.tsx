import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Boxes, Mail, Lock, ShieldAlert, ArrowRight, Trash2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export const Login: React.FC = () => {
  const { login, users, resetDatabase, clearItemTables } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [clearingItems, setClearingItems] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (!success) {
        setError("Login ou senha incorretos ou não cadastrados.");
      }
    }, 800);
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword("********");
    setError("");
    setLoading(true);
    setTimeout(() => {
      login(quickEmail, "********");
      setLoading(false);
    }, 400);
  };

  const handleResetDb = async () => {
    if (confirm("ATENÇÃO: Isso irá apagar permanentemente todos os ativos, licenças, consumíveis e histórico do Firestore, e criará apenas o usuário master 'admin' com senha 'admin'. Tem certeza de que deseja zerar o banco de dados?")) {
      setResetting(true);
      setError("");
      try {
        await resetDatabase();
      } catch (err) {
        setError("Ocorreu um erro ao tentar zerar o banco de dados.");
      } finally {
        setResetting(false);
      }
    }
  };

  const handleClearItems = async () => {
    if (confirm("Deseja apagar permanentemente todos os dados das tabelas de Ativos, Consumíveis e Licenças do sistema?")) {
      setClearingItems(true);
      setError("");
      try {
        await clearItemTables();
      } catch (err) {
        setError("Ocorreu um erro ao tentar limpar as tabelas de itens.");
      } finally {
        setClearingItems(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl"
      >
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-blue-500/20">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 leading-none">Gestor de Ativos</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-2">Portal de Governança de TI</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário ou E-mail</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin ou exemplo@empresa.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg text-sm text-slate-800 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Senha Secreta</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg text-sm text-slate-800 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Access Panel */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">Escolha um Perfil para Acesso Rápido</p>
          <div className="grid grid-cols-1 gap-2.5">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u.email)}
                className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-lg text-left transition-all duration-150 group"
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{u.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{u.role} ({u.department})</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Reset Database Panel */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Ferramentas de Administração</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
            <button
              type="button"
              onClick={handleClearItems}
              disabled={clearingItems || resetting}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-amber-200 shadow-sm active:scale-[0.98]"
            >
              {clearingItems ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Limpando tabelas...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Ativos, Consumíveis e Licenças</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetDb}
              disabled={clearingItems || resetting}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-red-200 shadow-sm active:scale-[0.98]"
            >
              {resetting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Zerando BD...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar Tudo (BD Master)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
