import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  User, 
  MapPin, 
  Building, 
  Mail, 
  Laptop, 
  Clock, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  AlertCircle,
  Camera,
  RotateCcw,
  KeyRound,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import { Asset } from "../types";
import { AvatarUploader } from "../components/AvatarUploader";

const presetAvatars = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEVl7ZYpdPvU_yqwhu2nz1E1pHIwIvTaJu6jX5ZfguzaM5bBinsTchavTA-kNXVzg1XJkH0sEJ5wU0n6_4JUqmTf8ZlzvGZxbaWHxrdhvyauoGl3hHNtxJK6geTv6ETDpuWVJ751pdtMhOtY_Z6voV3XE9dSmeqJSipYMWwpGmj59HEPRzRz5nJd3OlEpRW0TbFBbBnp9MsQbJV2p2ifNg2_NER09Q2RODT5m4UcxkuhWTrvJe9LzbKFlHGQqKiDB0Y68Y3d_x7k",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGQiMbBQnZlxDCbewZLnAsVeWA7buow4Jb9qIkIzT7HSfR66mvCWU3Oti_snkf90bSx5u8beUkXZaORAPrJWibl--03ftX9A3nMtTtAIGp1UB5nF03O_L7p6RoMCKDG7B7pJaCF-6aN6DbP2i4U3CTL9hOYAAGPZc-7YflzPdKakgVf4NbJ8-kyOabAnkSpVWt5thGQayZNCw4qK10gOd0qPmb38Q8Twei7q_ivYCIbnFHnqQSAIizxoauQfnwIjyIqVdlnKEIr0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBIPbFrB9pdZW6k_JE52kQw8DtTZXW37vYounYCsA1_D1mXFeE6mHwwtvvkN21VtQ0E2sD36CUxBvbDu6baPfCsG8teOU7_htO4yjqxRQcQh6G1_iwE1iAB9B-_BX0KDTFHFPh-zZ8-aEI-twJHk6_7Vt2GiS_Glo6ShD72GEl6Weq-KHaNmcH7EBHdnkqoGRJOo9UbqcoNV3pitKJcWYli9hncg0E6TShtZPqXyJDJ3HTS5KfW7iQszDdZxb_Na6fFo23Z4rVTx5o",
];

interface UserProfileViewProps {
  setCurrentView?: (view: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ setCurrentView }) => {
  const { currentUser, assets, updateUserProfile, checkinAsset, showToast } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState(currentUser?.name || "");
  const [role, setRole] = useState(currentUser?.role || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [department, setDepartment] = useState(currentUser?.department || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [password, setPassword] = useState(currentUser?.password || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");

  const headerFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleHeaderPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Arquivo inválido", "Por favor, selecione uma imagem.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const newAvatar = canvas.toDataURL("image/jpeg", 0.88);
            setAvatar(newAvatar);
            updateUserProfile({ avatar: newAvatar });
            showToast("Foto Atualizada", "Sua foto de perfil foi atualizada com sucesso.", "success");
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // If not logged in
  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-4">
        <p className="text-slate-500 font-medium">Faça login para visualizar seu perfil.</p>
      </div>
    );
  }

  // Find assets assigned to this specific user
  const assignedAssets = assets.filter(a => a.assignedToUserId === currentUser.id);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      role,
      location,
      department,
      avatar,
      username: username || undefined,
      password: password || undefined,
    });
    setIsEditing(false);
  };

  const handleReturnAsset = (assetId: string) => {
    checkinAsset(assetId, "Disponível", "good", "hq", "Devolvido diretamente via perfil do portador.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div>
        <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Perfil de Usuário</h2>
        <p className="text-sm text-slate-400 font-medium mt-1">Veja seus ativos alocados, permissões de segurança e histórico de governança.</p>
      </div>

      {/* Profile Card Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div 
          onClick={() => headerFileInputRef.current?.click()}
          className="relative group shrink-0 cursor-pointer"
          title="Clique para trocar sua foto de perfil"
        >
          <input
            ref={headerFileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
            onChange={handleHeaderPhotoChange}
            className="hidden"
          />
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 shadow-inner group-hover:border-blue-500 transition-colors"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white mb-0.5" />
            <span className="text-[9px] text-white font-bold">Alterar Foto</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="font-sans text-xl font-bold text-slate-900 leading-none">{currentUser.name}</h3>
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{currentUser.role}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              {currentUser.department}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {currentUser.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {currentUser.email}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 shadow-sm flex items-center gap-2"
        >
          <SettingsIcon className="w-4 h-4" />
          <span>{isEditing ? "Cancelar" : "Editar Detalhes"}</span>
        </button>
      </div>

      {/* Main Grid split: Info/Assigned hardware vs Settings edit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Assigned Hardware list & history (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Assigned hardware card list */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Laptop className="w-5 h-5 text-slate-400" />
                Ativos sob sua Responsabilidade
              </h4>
              <span className="bg-blue-50 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
                {assignedAssets.length} Equipamentos
              </span>
            </div>

            {assignedAssets.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                Nenhum notebook ou monitor alocado para o seu perfil no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedAssets.map((asset) => (
                  <div key={asset.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-800 leading-snug">{asset.name}</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                          Patrimônio: {asset.id} • N/S: {asset.seriesNumber}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturnAsset(asset.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 uppercase tracking-wide"
                      title="Sinalizar devolução imediata do ativo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Devolver</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User History Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h4 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Sua Atividade de TI
            </h4>

            <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6 text-xs">
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-blue-500"></span>
                <div>
                  <div className="flex items-center gap-3">
                    <h5 className="font-bold text-slate-800">Login Concluído no Sistema</h5>
                    <span className="text-[9px] font-bold text-slate-400 font-mono">AGORA MESMO</span>
                  </div>
                  <p className="text-slate-500 mt-1">Acesso autenticado com sucesso a partir do portal de governança corporativo.</p>
                </div>
              </div>

              {assignedAssets.length > 0 && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white bg-green-500"></span>
                  <div>
                    <div className="flex items-center gap-3">
                      <h5 className="font-bold text-slate-800">Check-out de Ativo Efetuado</h5>
                      <span className="text-[9px] font-bold text-slate-400 font-mono">HÁ 2 DIAS</span>
                    </div>
                    <p className="text-slate-500 mt-1">Você recebeu a guarda legal e termo de responsabilidade de 1x {assignedAssets[0].name}.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Settings Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {isEditing ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in slide-in-from-right duration-200">
              <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Editar Informações de Perfil</h4>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Cargo Corporativo</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Departamento</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Filial / Localização</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <AvatarUploader
                    value={avatar}
                    onChange={setAvatar}
                    presets={presetAvatars}
                    label="Foto de Perfil / Avatar"
                    sublabel="Envie do dispositivo, informe um link de imagem ou escolha um preset"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Nome de Usuário (Login)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: admin"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Senha de Acesso</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ex: admin"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Salvar Informações
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Details Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Detalhes da Conta
                  </h4>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                    Conta Ativa
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Nome de Usuário:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      @{currentUser.username || currentUser.email.split("@")[0]}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">E-mail Corporativo:</span>
                    <span className="font-semibold text-slate-800">{currentUser.email}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Departamento:</span>
                    <span className="font-semibold text-slate-800">{currentUser.department}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Localidade:</span>
                    <span className="font-semibold text-slate-800">{currentUser.location}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Tipo de Acesso:</span>
                    <span className="font-semibold text-blue-700">
                      {currentUser.id === "user-admin" ? "Administrador Master" : "Colaborador"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Editar Meus Dados
                </button>
              </div>

              {/* Shortcut to Settings menu */}
              {setCurrentView && (
                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs">Configurações do Sistema</h5>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Banco de dados Firestore, credenciais e ferramentas
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentView("settings")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Acessar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
