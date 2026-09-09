import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Boxes, Mail, Lock, ShieldAlert, ArrowRight, Eye, EyeOff, ShieldCheck, UserCheck } from "lucide-react";
import { motion } from "motion/react";

export const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error || "Login ou senha incorretos.");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs leading-relaxed"
            >
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Usuário ou E-mail
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin ou seu.email@empresa.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm text-slate-800 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Senha Secreta
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm text-slate-800 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70"
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

        {/* Informative Badge about Access Policy */}
        <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 block">Acesso Restrito ao Sistema</span>
              <span>
                Apenas perfis <strong>Administrador</strong> e <strong>Operador</strong> possuem credenciais de acesso ao painel.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 justify-center px-2 text-center">
            <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Colaboradores são registrados exclusivamente para custódia e atribuição de ativos.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
