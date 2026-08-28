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
  Eye,
  Camera,
  X,
  Lock,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, UserPermission } from "../types";
import { AvatarUploader } from "../components/AvatarUploader";

export const Users: React.FC = () => {
  const { users, currentUser, assets, addUser, updateUser, deleteUser, isReadOnly, showToast } = useApp();
  
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Forms state
  const [userIdToEdit, setUserIdToEdit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileType, setProfileType] = useState<"admin" | "standard" | "viewer">("standard");

  const presetAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEVl7ZYpdPvU_yqwhu2nz1E1pHIwIvTaJu6jX5ZfguzaM5bBinsTchavTA-kNXVzg1XJkH0sEJ5wU0n6_4JUqmTf8ZlzvGZxbaWHxrdhvyauoGl3hHNtxJK6geTv6ETDpuWVJ751pdtMhOtY_Z6voV3XE9dSmeqJSipYMWwpGmj59HEPRzRz5nJd3OlEpRW0TbFBbBnp9MsQbJV2p2ifNg2_NER09Q2RODT5m4UcxkuhWTrvJe9LzbKFlHGQqKiDB0Y68Y3d_x7k",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGQiMbBQnZlxDCbewZLnAsVeWA7buow4Jb9qIkIzT7HSfR66mvCWU3Oti_snkf90bSx5u8beUkXZaORAPrJWibl--03ftX9A3nMtTtAIGp1UB5nF03O_L7p6RoMCKDG7B7pJaCF-6aN6DbP2i4U3CTL9hOYAAGPZc-7YflzPdKakgVf4NbJ8-kyOabAnkSpVWt5thGQayZNCw4qK10gOd0qPmb38Q8Twei7q_ivYCIbnFHnqQSAIizxoauQfnwIjyIqVdlnKEIr0",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBIPbFrB9pdZW6k_JE52kQw8DtTZXW37vYounYCsA1_D1mXFeE6mHwwtvvkN21VtQ0E2sD36CUxBvbDu6baPfCsG8teOU7_htO4yjqxRQcQh6G1_iwE1iAB9B-_BX0KDTFHFPh-zZ8-aEI-twJHk6_7Vt2GiS_Glo6ShD72GEl6Weq-KHaNmcH7EBHdnkqoGRJOo9UbqcoNV3pitKJcWYli9hncg0E6TShtZPqXyJDJ3HTS5KfW7iQszDdZxb_Na6fFo23Z4rVTx5o",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  ];

  // Calculations
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueDepartments = Array.from(new Set([
    "Tecnologia da Informação",
    "Design & Inovação",
    "Produto",
    "Infraestrutura",
    "Auditoria & Compliance",
    "Recursos Humanos",
    "Finanças",
    ...users.map(u => u.department)
  ].filter(Boolean)));

  const uniqueLocations = Array.from(new Set([
    "Sede Principal (HQ)",
    "Sede São Paulo - 4º Andar",
    "Sede Nova York - 12º Andar",
    "Remoto (Home Office)",
    ...users.map(u => u.location)
  ].filter(Boolean)));

  const getAssignedAssetsCount = (userId: string) => {
    return assets.filter(a => a.assignedToUserId === userId).length;
  };

  const handleOpenAddModal = () => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil é somente de visualização. Criação de usuários não é permitida.", "warning");
      return;
    }
    setName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setRole("");
    setDepartment("Tecnologia da Informação");
    setLocation("Sede Principal (HQ)");
    setAvatar(presetAvatars[0]);
    setProfileType("standard");
    setShowAddModal(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      showToast("E-mail duplicado", "Já existe um usuário cadastrado com este e-mail.", "warning");
      return;
    }

    const isAdmin = profileType === "admin";
    const isReadOnlyUser = profileType === "viewer";
    const permissionLevel: UserPermission = profileType;

    addUser({
      name: name.trim(),
      email: email.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
      role: role.trim(),
      department,
      location,
      avatar: avatar || presetAvatars[0],
      isAdmin,
      isReadOnly: isReadOnlyUser,
      permissionLevel,
    });

    setShowAddModal(false);
  };

  const handleOpenEditModal = (user: User) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil é somente de visualização. Edição de usuários não é permitida.", "warning");
      return;
    }
    setUserIdToEdit(user.id);
    setName(user.name);
    setEmail(user.email);
    setUsername(user.username || "");
    setPassword(user.password || "");
    setRole(user.role);
    setDepartment(user.department);
    setLocation(user.location);
    setAvatar(user.avatar);
    
    if (user.isAdmin || user.id === "user-admin") {
      setProfileType("admin");
    } else if (user.isReadOnly || user.permissionLevel === "viewer") {
      setProfileType("viewer");
    } else {
      setProfileType("standard");
    }

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

    const isAdmin = profileType === "admin";
    const isReadOnlyUser = profileType === "viewer";
    const permissionLevel: UserPermission = profileType;

    // Safety: don't let current admin demote themselves by accident
    if (userIdToEdit === currentUser?.id && !isAdmin && currentUser?.isAdmin) {
      showToast("Acesso Negado", "Você não pode remover seus próprios privilégios de Administrador Global.", "warning");
      return;
    }

    updateUser(userIdToEdit, {
      name: name.trim(),
      email: email.trim(),
      username: username.trim() || undefined,
      password: password || undefined,
      role: role.trim(),
      department,
      location,
      avatar,
      isAdmin,
      isReadOnly: isReadOnlyUser,
      permissionLevel,
    });

    setShowEditModal(false);
  };

  const handleOpenDeleteModal = (user: User) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil é somente de visualização. Exclusão de usuários não é permitida.", "warning");
      return;
    }
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

  const handleCycleRole = (user: User) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização.", "warning");
      return;
    }
    if (user.id === currentUser?.id) {
      showToast("Ação Bloqueada", "Você não pode alterar seu próprio perfil de forma rápida.", "warning");
      return;
    }

    // Cycle: standard -> viewer -> admin -> standard
    let newAdmin = false;
    let newReadOnly = false;
    let newPerm: UserPermission = "standard";
    let desc = "";

    if (user.isAdmin) {
      // Admin -> Standard
      newAdmin = false;
      newReadOnly = false;
      newPerm = "standard";
      desc = "Colaborador Operacional";
    } else if (user.isReadOnly || user.permissionLevel === "viewer") {
      // Viewer -> Admin
      newAdmin = true;
      newReadOnly = false;
      newPerm = "admin";
      desc = "Administrador Global";
    } else {
      // Standard -> Viewer
      newAdmin = false;
      newReadOnly = true;
      newPerm = "viewer";
      desc = "Visualizador (Somente Leitura)";
    }

    updateUser(user.id, { 
      isAdmin: newAdmin, 
      isReadOnly: newReadOnly,
      permissionLevel: newPerm 
    });

    showToast(
      "Perfil Atualizado",
      `Perfil de ${user.name} alterado para: ${desc}.`,
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
        "Perfil de Acesso",
        "Permissão de Edição (CRUD)",
        "Equipamentos Alocados"
      ];

      const csvRows = [
        headers.join(","),
        ...filteredUsers.map(u => {
          const profileName = u.isAdmin || u.id === "user-admin" 
            ? "Administrador Global" 
            : u.isReadOnly || u.permissionLevel === "viewer"
              ? "Visualizador (Somente Leitura)"
              : "Colaborador Padrão";
          
          const crudAllowed = u.isReadOnly || u.permissionLevel === "viewer" ? "Não (Apenas Consulta)" : "Sim";

          const row = [
            u.id,
            u.name,
            u.email,
            u.role,
            u.department,
            u.location,
            profileName,
            crudAllowed,
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Read Only Warning Banner */}
      {isReadOnly && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 flex items-start gap-3 shadow-sm">
          <Eye className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm text-sky-950">Perfil de Visualização Ativo</p>
            <p className="mt-0.5 text-sky-800 leading-relaxed">
              Você está logado em um perfil <strong>Somente Leitura</strong>. Todas as funcionalidades de consulta, relatórios e exportação de CSV estão ativas, porém a criação, edição ou exclusão de registros (CREATE, UPDATE e DELETE) estão desabilitadas.
            </p>
          </div>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Usuários & Perfis</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Gerencie a equipe corporativa, configure perfis de acesso e audite permissões de CRUD.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
          
          {!isReadOnly && (
            <button 
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics segment */}
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
              {users.filter(u => u.isAdmin || u.id === "user-admin").length}
            </h3>
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Somente Visualização</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-sky-600">
              {users.filter(u => (u.isReadOnly || u.permissionLevel === "viewer") && !u.isAdmin && u.id !== "user-admin").length}
            </h3>
            <Eye className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colaboradores Comuns</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="font-mono text-2xl font-bold text-slate-700">
              {users.filter(u => !u.isAdmin && !u.isReadOnly && u.permissionLevel !== "viewer" && u.id !== "user-admin").length}
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              Operacional
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
              placeholder="Buscar por nome, e-mail, cargo..."
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil de Acesso</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const assignedAssetsCount = getAssignedAssetsCount(user.id);
                const isUserAdmin = user.isAdmin || user.id === "user-admin";
                const isUserViewer = (user.isReadOnly || user.permissionLevel === "viewer") && !isUserAdmin;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* User profile capsule */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
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
                        <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {user.location}
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

                    {/* Permission Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => !isReadOnly && handleCycleRole(user)}
                        disabled={isReadOnly}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          isReadOnly ? "cursor-default" : "cursor-pointer"
                        } ${
                          isUserAdmin
                            ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                            : isUserViewer
                              ? "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                        title={isReadOnly ? "Visualização de permissão" : "Clique para alternar perfil (Admin / Visualizador / Colaborador)"}
                      >
                        {isUserAdmin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Administrador</span>
                          </>
                        ) : isUserViewer ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Somente Leitura (Sem CRUD)</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span>Colaborador</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Row Action Panel */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!isReadOnly ? (
                          <>
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
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Somente leitura</span>
                        )}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Cadastrar Novo Usuário / Perfil</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Definição de Credenciais & Permissões</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Costa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: m.costa@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Usuário de Login (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: visualizador"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Cargo do Colaborador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Auditora de TI / Consulta"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Senha Secreta (Opcional)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Departamento</label>
                  <input
                    type="text"
                    required
                    list="add-departments"
                    placeholder="Ex: Auditoria & Compliance"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                  <datalist id="add-departments">
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Sede / Filial</label>
                  <input
                    type="text"
                    required
                    list="add-locations"
                    placeholder="Ex: Sede Principal (HQ)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  />
                  <datalist id="add-locations">
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Profile / Permission Type Selector */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-slate-700 block uppercase tracking-wide text-[11px]">
                  Nível de Permissão & Perfil
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProfileType("viewer")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      profileType === "viewer"
                        ? "bg-sky-50 border-sky-400 ring-2 ring-sky-200 text-sky-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Eye className="w-4 h-4 text-sky-600" />
                      <span>Visualizador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Somente Leitura. Sem permissão de CREATE, UPDATE ou DELETE.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileType("standard")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      profileType === "standard"
                        ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200 text-blue-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Colaborador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Acesso operacional padrão para checkouts e manutenção.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileType("admin")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      profileType === "admin"
                        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 text-indigo-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Administrador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Acesso irrestrito a todos os recursos, BD e permissões.
                    </p>
                  </button>
                </div>
              </div>

              {/* Avatar Selector Uploader */}
              <AvatarUploader
                value={avatar}
                onChange={setAvatar}
                presets={presetAvatars}
                label="Foto de Perfil / Avatar"
                sublabel="Selecione um arquivo do dispositivo, informe um link ou escolha um preset"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Editar Detalhes de Usuário</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Sincronização de Credenciais & Nível de Acesso</p>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Usuário de Login (Opcional)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Cargo do Colaborador</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Senha Secreta (Opcional)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Departamento</label>
                  <input
                    type="text"
                    required
                    list="edit-departments"
                    placeholder="Ex: Recursos Humanos"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                  />
                  <datalist id="edit-departments">
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wide">Sede / Filial</label>
                  <input
                    type="text"
                    required
                    list="edit-locations"
                    placeholder="Ex: Rio de Janeiro"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
                  />
                  <datalist id="edit-locations">
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Profile / Permission Type Selector */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-slate-700 block uppercase tracking-wide text-[11px]">
                  Nível de Permissão & Perfil
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProfileType("viewer")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      profileType === "viewer"
                        ? "bg-sky-50 border-sky-400 ring-2 ring-sky-200 text-sky-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Eye className="w-4 h-4 text-sky-600" />
                      <span>Visualizador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Somente Leitura. Sem permissão de CREATE, UPDATE ou DELETE.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileType("standard")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      profileType === "standard"
                        ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200 text-blue-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Colaborador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Acesso operacional padrão para checkouts e manutenção.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileType("admin")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      profileType === "admin"
                        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200 text-indigo-900"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Administrador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Acesso irrestrito a todos os recursos, BD e permissões.
                    </p>
                  </button>
                </div>
              </div>

              {/* Edit Avatar Option */}
              <AvatarUploader
                value={avatar}
                onChange={setAvatar}
                presets={presetAvatars}
                label="Foto de Perfil / Avatar"
                sublabel="Carregue uma foto do computador, cole um link ou selecione um preset"
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
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
              <img 
                src={userToDelete.avatar} 
                alt={userToDelete.name} 
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                referrerPolicy="no-referrer"
              />
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
