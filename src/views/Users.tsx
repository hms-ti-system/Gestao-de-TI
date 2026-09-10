import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  Mail, 
  Building, 
  MapPin, 
  Search, 
  Trash2, 
  Edit, 
  Check, 
  FileSpreadsheet, 
  Users as UsersIcon, 
  ShieldCheck,
  Plus,
  Camera,
  Sliders,
  Lock,
  UserCheck,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, UserPrivilege } from "../types";
import { getUserPrivilege, getPrivilegeLabel } from "../utils/permissions";
import { AvatarUploader } from "../components/AvatarUploader";

export const Users: React.FC = () => {
  const { users, currentUser, assets, addUser, updateUser, deleteUser, showToast } = useApp();
  
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Forms state
  const [userIdToEdit, setUserIdToEdit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState("");
  const [privilege, setPrivilege] = useState<UserPrivilege>("user");
  const [password, setPassword] = useState("");

  const presetAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEVl7ZYpdPvU_yqwhu2nz1E1pHIwIvTaJu6jX5ZfguzaM5bBinsTchavTA-kNXVzg1XJkH0sEJ5wU0n6_4JUqmTf8ZlzvGZxbaWHxrdhvyauoGl3hHNtxJK6geTv6ETDpuWVJ751pdtMhOtY_Z6voV3XE9dSmeqJSipYMWwpGmj59HEPRzRz5nJd3OlEpRW0TbFBbBnp9MsQbJV2p2ifNg2_NER09Q2RODT5m4UcxkuhWTrvJe9LzbKFlHGQqKiDB0Y68Y3d_x7k",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGQiMbBQnZlxDCbewZLnAsVeWA7buow4Jb9qIkIzT7HSfR66mvCWU3Oti_snkf90bSx5u8beUkXZaORAPrJWibl--03ftX9A3nMtTtAIGp1UB5nF03O_L7p6RoMCKDG7B7pJaCF-6aN6DbP2i4U3CTL9hOYAAGPZc-7YflzPdKakgVf4NbJ8-kyOabAnkSpVWt5thGQayZNCw4qK10gOd0qPmb38Q8Twei7q_ivYCIbnFHnqQSAIizxoauQfnwIjyIqVdlnKEIr0",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBIPbFrB9pdZW6k_JE52kQw8DtTZXW37vYounYCsA1_D1mXFeE6mHwwtvvkN21VtQ0E2sD36CUxBvbDu6baPfCsG8teOU7_htO4yjqxRQcQh6G1_iwE1iAB9B-_BX0KDTFHFPh-zZ8-aEI-twJHk6_7Vt2GiS_Glo6ShD72GEl6Weq-KHaNmcH7EBHdnkqoGRJOo9UbqcoNV3pitKJcWYli9hncg0E6TShtZPqXyJDJ3HTS5KfW7iQszDdZxb_Na6fFo23Z4rVTx5o",
  ];

  // Calculations
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase()) ||
    (u.location && u.location.toLowerCase().includes(search.toLowerCase()))
  );

  const uniqueDepartments = Array.from(new Set([
    "Tecnologia da Informação",
    "Operações & Logística",
    "Design & Inovação",
    "Produto",
    "Infraestrutura",
    "Recursos Humanos",
    "Finanças",
    ...users.map(u => u.department)
  ].filter(Boolean)));

  const PRESET_LOCATIONS = [
    "Pátio 1",
    "Pátio 2",
    "Sede Principal (HQ)",
    "Sede São Paulo - 4º Andar",
    "Sede Nova York - 12º Andar",
    "Remoto (Home Office)",
  ];

  const uniqueLocations = Array.from(new Set([
    ...PRESET_LOCATIONS,
    ...users.map(u => u.location)
  ].filter(Boolean)));

  const getAssignedAssetsCount = (userId: string) => {
    return assets.filter(a => a.assignedToUserId === userId).length;
  };

  const handleOpenAddModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("");
    setDepartment("");
    setLocation("");
    setAvatar("");
    setPrivilege("user");
    setShowAddModal(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      showToast("E-mail duplicado", "Já existe um usuário cadastrado com este e-mail.", "warning");
      return;
    }

    const isLoginUser = privilege === "admin" || privilege === "operator";

    addUser({
      name: name.trim(),
      email: email.trim(),
      username: email.trim().split("@")[0].toLowerCase(),
      role: role.trim(),
      department: department.trim() || "Geral",
      location: location.trim() || "Pátio 1",
      avatar: avatar.trim(),
      isAdmin: privilege === "admin",
      privilege,
      password: isLoginUser ? (password.trim() || "123456") : undefined,
    });

    showToast("Colaborador Cadastrado", `${name.trim()} foi registrado com sucesso!`, "success");
    setShowAddModal(false);
  };

  const handleOpenEditModal = (user: User) => {
    setUserIdToEdit(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || "");
    setRole(user.role);
    setDepartment(user.department);
    setLocation(user.location || "Pátio 1");
    setAvatar(user.avatar);
    setPrivilege(getUserPrivilege(user));
    setShowEditModal(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdToEdit) return;

    // Check email uniqueness if modified
    const otherWithEmail = users.find(u => u.id !== userIdToEdit && u.email.toLowerCase() === email.trim().toLowerCase());
    if (otherWithEmail) {
      showToast("E-mail duplicado", "Outro usuário já está utilizando este endereço de e-mail.", "warning");
      return;
    }

    // Safety: don't let current admin demote themselves by accident
    if (userIdToEdit === currentUser?.id && privilege !== "admin") {
      showToast("Acesso Negado", "Você não pode remover seus próprios privilégios de Administrador Global.", "warning");
      return;
    }

    const isLoginUser = privilege === "admin" || privilege === "operator";
    const existingUser = users.find(u => u.id === userIdToEdit);

    updateUser(userIdToEdit, {
      name: name.trim(),
      email: email.trim(),
      username: email.trim().split("@")[0].toLowerCase(),
      role: role.trim(),
      department,
      location: location.trim() || "Pátio 1",
      avatar,
      isAdmin: privilege === "admin",
      privilege,
      password: isLoginUser ? (password.trim() || existingUser?.password || "123456") : undefined,
    });

    showToast("Dados Atualizados", `Cadastro de ${name.trim()} atualizado com sucesso!`, "success");
    setShowEditModal(false);
  };

  const handleOpenDeleteModal = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast("Ação Inválida", "Você não pode deletar a sua própria conta ativa.", "warning");
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleCyclePrivilege = (user: User) => {
    if (user.id === currentUser?.id && getUserPrivilege(user) === "admin") {
      showToast("Ação Bloqueada", "Você não pode revogar seus próprios privilégios de administrador.", "warning");
      return;
    }
    const currentPriv = getUserPrivilege(user);
    let nextPriv: UserPrivilege = "user";
    if (currentPriv === "user") nextPriv = "operator";
    else if (currentPriv === "operator") nextPriv = "admin";
    else nextPriv = "user";

    updateUser(user.id, {
      isAdmin: nextPriv === "admin",
      privilege: nextPriv,
    });

    const label = getPrivilegeLabel(nextPriv);
    showToast(
      "Permissão Atualizada",
      `${user.name} agora possui o nível de acesso: ${label}.`,
      "info"
    );
  };

  const handleExport = () => {
    try {
      const headers = [
        "ID do Usuário",
        "Nome Completo",
        "E-mail Corporativo",
        "Cargo",
        "Departamento",
        "Localização",
        "Permissão",
        "Equipamentos Alocados"
      ];

      const csvRows = [
        headers.join(","),
        ...filteredUsers.map(u => {
          const row = [
            u.id,
            u.name,
            u.email,
            u.role,
            u.department,
            u.location,
            getPrivilegeLabel(getUserPrivilege(u)),
            getAssignedAssetsCount(u.id)
          ];

          return row.map(val => {
            const cleanVal = typeof val === "string" ? val : String(val);
            const escaped = cleanVal.replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(",");
        })
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `usuarios_governanca_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Exportação Concluída", `CSV gerado com sucesso contendo ${filteredUsers.length} usuários.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Erro na Exportação", "Houve uma falha ao gerar o arquivo CSV de usuários.", "warning");
    }
  };

  const adminCount = users.filter(u => getUserPrivilege(u) === "admin").length;
  const operatorCount = users.filter(u => getUserPrivilege(u) === "operator").length;
  const standardCount = users.filter(u => getUserPrivilege(u) === "user").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Usuários & Permissões</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Gerencie a equipe corporativa, atribua níveis de acesso (Administrador, Operador, Colaborador) e audite equipamentos alocados.</p>
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
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Metrics segment - 3-tier Privilege View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Usuários</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-900">{users.length}</h3>
            <UsersIcon className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administradores</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-indigo-600">
              {adminCount}
            </h3>
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operadores</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-blue-600">
              {operatorCount}
            </h3>
            <Sliders className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colaboradores Comuns</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-700">
              {standardCount}
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              Padrão
            </span>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, cargo, filial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 transition-all outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">Exibindo {filteredUsers.length} de {users.length} cadastros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departamento & Filial</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ativos sob Guarda</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Privilégio de Acesso</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const assignedAssetsCount = getAssignedAssetsCount(user.id);
                const userPrivilege = getUserPrivilege(user);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* User profile capsule */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                            {user.name ? user.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() : <UsersIcon className="w-5 h-5 text-slate-400" />}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 leading-snug">{user.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department & location details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-slate-700">
                        <span className="font-semibold flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {user.department}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          {user.location || "Pátio 1"}
                        </span>
                      </div>
                    </td>

                    {/* Active assets count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          assignedAssetsCount > 0 
                            ? "bg-blue-50 text-blue-700 border border-blue-100" 
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {assignedAssetsCount} {assignedAssetsCount === 1 ? "Ativo" : "Ativos"}
                        </span>
                      </div>
                    </td>

                    {/* Permission Status & Toggle access direct click */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCyclePrivilege(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer shadow-xs ${
                          userPrivilege === "admin"
                            ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                            : userPrivilege === "operator"
                            ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                        title="Clique para alternar: Colaborador → Operador → Administrador"
                      >
                        {userPrivilege === "admin" && (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Administrador</span>
                          </>
                        )}
                        {userPrivilege === "operator" && (
                          <>
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>Operador</span>
                          </>
                        )}
                        {userPrivilege === "user" && (
                          <>
                            <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>Colaborador</span>
                            <span className="text-[9px] font-semibold text-slate-400 normal-case ml-0.5">(Sem login)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Row Action Panel */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          className="p-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md border border-red-100 transition-colors cursor-pointer"
                          title="Remover Usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW USER REGISTER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-2xl max-w-xl w-full my-auto shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Cadastrar Novo Colaborador</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Gestão de Equipe & Controle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: s.connor@empresa.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Cargo do Colaborador</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Analista de Segurança Sênior"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Departamento</label>
                  <input
                    type="text"
                    required
                    list="add-departments"
                    placeholder="Ex: Recursos Humanos"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs"
                  />
                  <datalist id="add-departments">
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-600 text-xs uppercase tracking-wide">Sede / Filial</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setLocation("Pátio 1")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          location === "Pátio 1"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        Pátio 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation("Pátio 2")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          location === "Pátio 2"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        Pátio 2
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    list="add-locations"
                    placeholder="Pátio 1, Pátio 2 ou digite outra filial..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 text-xs bg-white"
                  />
                  <datalist id="add-locations">
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                  <span className="text-[10px] text-slate-400 block">
                    Disponível <strong>Pátio 1</strong>, <strong>Pátio 2</strong> ou você pode digitar livremente.
                  </span>
                </div>
              </div>

              {/* Avatar Selector Uploader */}
              <AvatarUploader
                value={avatar}
                onChange={setAvatar}
                presets={presetAvatars}
                label="Foto de Perfil (Opcional)"
                sublabel="Opcional: deixe sem foto, faça upload ou selecione um preset"
              />

              {/* Atribuição de Privilégios & Nível de Acesso */}
              <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-700 text-xs uppercase tracking-wide block">
                  Atribuição de Privilégios de Acesso
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Administrador */}
                  <div
                    onClick={() => setPrivilege("admin")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      privilege === "admin"
                        ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Administrador</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">Total</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Acesso total: gerenciar usuários, deletar dados e auditar o sistema.
                      </p>
                    </div>
                  </div>

                  {/* Operador */}
                  <div
                    onClick={() => setPrivilege("operator")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      privilege === "operator"
                        ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-400 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          <span>Operador</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Operar</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Permissões operacionais: registrar, consultar e movimentar ativos e consumíveis.
                      </p>
                    </div>
                  </div>

                  {/* Colaborador */}
                  <div
                    onClick={() => setPrivilege("user")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      privilege === "user"
                        ? "bg-slate-100 border-slate-300 ring-1 ring-slate-400 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Colaborador</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">Padrão</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Colaborador para custódia e atribuição de ativos da empresa.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password only if privilege is admin or operator - custody banner completely removed */}
                {privilege !== "user" && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Senha de Acesso ao Sistema</span>
                      </label>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded">
                        {privilege === "admin" ? "Administrador" : "Operador"}
                      </span>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Defina a senha de acesso (padrão: 123456)"
                      className="w-full bg-white border border-blue-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      O usuário poderá acessar utilizando o e-mail ou o usuário <strong className="text-slate-700">{email ? email.split("@")[0].toLowerCase() : "exemplo"}</strong> e esta senha.
                    </p>
                  </div>
                )}
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
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm text-center cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT USER REGISTER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-2xl max-w-xl w-full my-auto shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Editar Detalhes de Colaborador</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Sincronização de Credenciais</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Cargo do Colaborador</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Departamento</label>
                  <input
                    type="text"
                    required
                    list="edit-departments"
                    placeholder="Ex: Recursos Humanos"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 text-xs"
                  />
                  <datalist id="edit-departments">
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-600 text-xs uppercase tracking-wide">Sede / Filial</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setLocation("Pátio 1")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          location === "Pátio 1"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        Pátio 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation("Pátio 2")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                          location === "Pátio 2"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        Pátio 2
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    list="edit-locations"
                    placeholder="Pátio 1, Pátio 2 ou digite outra filial..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 text-xs bg-white"
                  />
                  <datalist id="edit-locations">
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                  <span className="text-[10px] text-slate-400 block">
                    Disponível <strong>Pátio 1</strong>, <strong>Pátio 2</strong> ou você pode digitar livremente.
                  </span>
                </div>
              </div>

              {/* Edit Avatar Option */}
              <AvatarUploader
                value={avatar}
                onChange={setAvatar}
                presets={presetAvatars}
                label="Foto de Perfil (Opcional)"
                sublabel="Opcional: deixe sem foto, faça upload ou selecione um preset"
              />

              {/* Atribuição de Privilégios & Nível de Acesso */}
              <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-700 text-xs uppercase tracking-wide block">
                  Atribuição de Privilégios de Acesso
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Administrador */}
                  <div
                    onClick={() => setPrivilege("admin")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      privilege === "admin"
                        ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Administrador</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">Total</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Acesso total: gerenciar usuários, deletar dados e auditar o sistema.
                      </p>
                    </div>
                  </div>

                  {/* Operador */}
                  <div
                    onClick={() => setPrivilege("operator")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      privilege === "operator"
                        ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-400 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          <span>Operador</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Operar</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Permissões operacionais: registrar, consultar e movimentar ativos e consumíveis.
                      </p>
                    </div>
                  </div>

                  {/* Colaborador */}
                  <div
                    onClick={() => setPrivilege("user")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      privilege === "user"
                        ? "bg-slate-100 border-slate-300 ring-1 ring-slate-400 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Colaborador</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">Padrão</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Colaborador para custódia e atribuição de ativos da empresa.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password only if privilege is admin or operator - custody banner completely removed */}
                {privilege !== "user" && (
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Senha de Acesso ao Sistema</span>
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded">
                        {privilege === "admin" ? "Administrador" : "Operador"}
                      </span>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Defina ou altere a senha de acesso"
                      className="w-full bg-white border border-indigo-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      O usuário poderá acessar utilizando o e-mail ou o usuário <strong className="text-slate-700">{email ? email.split("@")[0].toLowerCase() : "exemplo"}</strong> e esta senha.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-semibold transition-colors text-center cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm text-center cursor-pointer"
                >
                  Salvar Detalhes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Excluir Colaborador</h4>
                <p className="text-xs text-slate-400">Esta ação removerá o usuário permanentemente</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 flex items-center gap-3">
              {userToDelete.avatar ? (
                <img 
                  src={userToDelete.avatar} 
                  alt={userToDelete.name} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center shrink-0">
                  {userToDelete.name ? userToDelete.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() : <UsersIcon className="w-6 h-6 text-slate-400" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{userToDelete.name}</p>
                <p className="text-xs text-slate-500 truncate">{userToDelete.email}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{userToDelete.role} • {userToDelete.department}</p>
              </div>
            </div>

            {getAssignedAssetsCount(userToDelete.id) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Este colaborador possui <strong>{getAssignedAssetsCount(userToDelete.id)} ativo(s)</strong> sob sua guarda. Ao confirmar a exclusão, esses equipamentos serão automaticamente devolvidos ao estoque com status <em>Disponível</em>.
                </span>
              </div>
            )}

            <p className="text-xs text-slate-600 mb-6">
              Tem certeza de que deseja remover permanentemente o acesso de <strong>{userToDelete.name}</strong>? Esta ação é irreversível.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Confirmar Exclusão
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
