import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Asset, License, Consumable, Activity, TimelineEvent } from "../types";
import { loadDatabaseFromFirestore, saveDocument, deleteDocument, clearAllCollectionsAndCreateAdmin, clearSpecificCollections } from "../firebase";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
  visible: boolean;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  assets: Asset[];
  licenses: License[];
  consumables: Consumable[];
  activities: Activity[];
  toast: Toast | null;
  login: (identifier: string, password?: string) => boolean;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => void;
  showToast: (title: string, message: string, type?: "success" | "info" | "warning") => void;
  hideToast: () => void;
  checkoutAsset: (assetId: string, userId: string, location: string, date: string, returnDate?: string, notes?: string) => void;
  checkinAsset: (assetId: string, status: "Disponível" | "Atribuído" | "Manutenção", condition: string, location: string, notes: string) => void;
  runDiagnostics: (assetId: string) => void;
  addConsumable: (consumable: Omit<Consumable, "id" | "status">) => void;
  checkoutConsumable: (id: string) => void;
  addLicense: (license: Omit<License, "id">) => void;
  addAsset: (asset: Omit<Asset, "id" | "health">) => void;
  updateAsset: (id: string, updatedData: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, updatedData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetDatabase: () => Promise<void>;
  clearItemTables: () => Promise<void>;
  clearAllActivities: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial mock data based precisely on UI specs and screenshots
const initialUsers: User[] = [
  {
    id: "user-1",
    name: "Sarah Jenkins",
    email: "s.jenkins@assetcentral.co",
    role: "Designer de Produto Sênior",
    department: "Design & Inovação",
    location: "Sede Nova York - 12º Andar",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaEVl7ZYpdPvU_yqwhu2nz1E1pHIwIvTaJu6jX5ZfguzaM5bBinsTchavTA-kNXVzg1XJkH0sEJ5wU0n6_4JUqmTf8ZlzvGZxbaWHxrdhvyauoGl3hHNtxJK6geTv6ETDpuWVJ751pdtMhOtY_Z6voV3XE9dSmeqJSipYMWwpGmj59HEPRzRz5nJd3OlEpRW0TbFBbBnp9MsQbJV2p2ifNg2_NER09Q2RODT5m4UcxkuhWTrvJe9LzbKFlHGQqKiDB0Y68Y3d_x7k",
  },
  {
    id: "user-2",
    name: "Ricardo Mendes",
    email: "r.mendes@assetcentral.co",
    role: "Engenheiro de DevOps",
    department: "Infraestrutura",
    location: "Sede São Paulo - 4º Andar",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGQiMbBQnZlxDCbewZLnAsVeWA7buow4Jb9qIkIzT7HSfR66mvCWU3Oti_snkf90bSx5u8beUkXZaORAPrJWibl--03ftX9A3nMtTtAIGp1UB5nF03O_L7p6RoMCKDG7B7pJaCF-6aN6DbP2i4U3CTL9hOYAAGPZc-7YflzPdKakgVf4NbJ8-kyOabAnkSpVWt5thGQayZNCw4qK10gOd0qPmb38Q8Twei7q_ivYCIbnFHnqQSAIizxoauQfnwIjyIqVdlnKEIr0",
  },
  {
    id: "user-3",
    name: "Ana Lima",
    email: "ana.lima@assetcentral.co",
    role: "Gerente de Produto",
    department: "Produto",
    location: "Sede Principal",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIPbFrB9pdZW6k_JE52kQw8DtTZXW37vYounYCsA1_D1mXFeE6mHwwtvvkN21VtQ0E2sD36CUxBvbDu6baPfCsG8teOU7_htO4yjqxRQcQh6G1_iwE1iAB9B-_BX0KDTFHFPh-zZ8-aEI-twJHk6_7Vt2GiS_Glo6ShD72GEl6Weq-KHaNmcH7EBHdnkqoGRJOo9UbqcoNV3pitKJcWYli9hncg0E6TShtZPqXyJDJ3HTS5KfW7iQszDdZxb_Na6fFo23Z4rVTx5o",
  },
  {
    id: "user-admin",
    name: "Admin Global",
    email: "admin@assetcentral.com",
    username: "admin",
    password: "admin",
    role: "Gestor de Ativos TI",
    department: "Tecnologia da Informação",
    location: "Sede Principal (HQ)",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUgS7fDbdjDDbHbn2iIu7i2JpVr8ZV57e7bMCZxI0oW4wvOe1EtGhDwQwGGtmzcXglqhyhWrbNp8MAEWZD4RGKx-DbHh-MUwv_Kh5iLshA6iGla5fFX50Ja_C_UXv7M8tVMmahFmBWAxaFGhE66FPaJSfCOH7R5QGcZDojaRxniHoQAESB2vnzVrW8FluC97ObSf7q3l53iq1ZGa2ZAjL-obKpeDYM1_Uy1lP6Xb2Ba1806vNp00naBpvXJtyhyeXo4Mo-IygrbiU",
    isAdmin: true,
  },
];

const initialAssets = (): Asset[] => [];

const initialLicenses: License[] = [];

const initialConsumables: Consumable[] = [];

const initialActivities: Activity[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("ac_user");
    return saved ? JSON.parse(saved) : initialUsers[3]; // Default to Admin
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("ac_users");
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem("ac_assets");
    return saved ? JSON.parse(saved) : initialAssets();
  });

  const [licenses, setLicenses] = useState<License[]>(() => {
    const saved = localStorage.getItem("ac_licenses");
    return saved ? JSON.parse(saved) : initialLicenses;
  });

  const [consumables, setConsumables] = useState<Consumable[]>(() => {
    const saved = localStorage.getItem("ac_consumables");
    return saved ? JSON.parse(saved) : initialConsumables;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("ac_activities");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [toast, setToast] = useState<Toast | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("ac_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("ac_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("ac_assets", JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("ac_licenses", JSON.stringify(licenses));
  }, [licenses]);

  useEffect(() => {
    localStorage.setItem("ac_consumables", JSON.stringify(consumables));
  }, [consumables]);

  useEffect(() => {
    localStorage.setItem("ac_activities", JSON.stringify(activities));
  }, [activities]);

  // Synchronize with Firestore on component mount - preserves all saved items in the database
  useEffect(() => {
    const syncWithFirebase = async () => {
      try {
        const data = await loadDatabaseFromFirestore(initialUsers);
        
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
        }
        if (data.assets) {
          setAssets(data.assets);
        }
        if (data.licenses) {
          setLicenses(data.licenses);
        }
        if (data.consumables) {
          setConsumables(data.consumables);
        }
        if (data.activities) {
          setActivities(data.activities);
        }
        
        // Ensure current logged-in user is in sync with latest DB state
        if (currentUser && data.users) {
          const match = data.users.find((u) => u.id === currentUser.id);
          if (match) {
            setCurrentUser(match);
          }
        }
      } catch (error) {
        console.error("Failed to sync with Firestore on mount:", error);
      }
    };
    syncWithFirebase();
  }, []);

  const showToast = (title: string, message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Date.now().toString();
    setToast({ id, title, message, type, visible: true });
  };

  const hideToast = () => {
    if (toast) {
      setToast({ ...toast, visible: false });
    }
  };

  // Auth Operations
  const login = (identifier: string, password?: string): boolean => {
    const match = users.find((u) => 
      u.email.toLowerCase() === identifier.toLowerCase() || 
      (u.username && u.username.toLowerCase() === identifier.toLowerCase())
    );
    if (match) {
      if (match.password && password && password !== "********" && match.password !== password) {
        return false;
      }
      setCurrentUser(match);
      showToast("Acesso Autorizado", `Bem-vindo de volta, ${match.name}!`, "success");
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast("Sessão Encerrada", "Você saiu do Gestor de Ativos.", "info");
  };

  const updateUserProfile = (userData: Partial<User>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...userData };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => u.id === currentUser.id ? updated : u));
      saveDocument("users", updated);
      showToast("Perfil Atualizado", "Suas informações foram salvas com sucesso.", "success");
    }
  };

  // Add User
  const addUser = (userData: Omit<User, "id">) => {
    const id = "user-" + Math.floor(Math.random() * 9000 + 1000);
    const newUser: User = {
      ...userData,
      id,
    };
    setUsers((prev) => [...prev, newUser]);
    saveDocument("users", newUser);
    
    // Add activity
    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `${currentUser?.name || "Admin"} cadastrou o usuário ${userData.name}`,
      user: currentUser?.name || "Admin",
      action: "Cadastro Usuário",
      target: userData.name,
      details: `Cargo: ${userData.role} | Departamento: ${userData.department}`,
      time: "Agora mesmo",
      type: "administrativo",
      category: "Governança",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);
    showToast("Usuário Cadastrado", `${userData.name} foi adicionado com sucesso.`, "success");
  };

  // Update User
  const updateUser = (id: string, updatedData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updatedData };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          saveDocument("users", updated);
          return updated;
        }
        return u;
      })
    );
    showToast("Usuário Atualizado", "As informações do usuário foram salvas.", "success");
  };

  // Delete User
  const deleteUser = (id: string) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) return;

    if (currentUser && currentUser.id === id) {
      showToast("Ação Bloqueada", "Você não pode excluir a sua própria conta ativa.", "warning");
      return;
    }
    
    // Deallocate any assets assigned to this user
    const userAssets = assets.filter((a) => a.assignedToUserId === id);
    if (userAssets.length > 0) {
      userAssets.forEach((asset) => {
        const updatedAsset: Asset = {
          ...asset,
          status: "Disponível",
          assignedToUserId: null,
          assignedToUser: null,
          history: [
            {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
              title: "Devolução Automática",
              date: new Date().toISOString().split("T")[0],
              description: `Ativo retornado ao estoque devido à exclusão do usuário ${userToDelete.name}.`,
              type: "info",
              user: currentUser?.name || "Sistema",
            },
            ...(asset.history || []),
          ],
        };
        setAssets((prev) => prev.map((a) => a.id === asset.id ? updatedAsset : a));
        saveDocument("assets", updatedAsset);
      });
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteDocument("users", id);
    
    // Add activity
    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `${currentUser?.name || "Admin"} removeu o usuário ${userToDelete.name}`,
      user: currentUser?.name || "Admin",
      action: "Exclusão Usuário",
      target: userToDelete.name,
      details: userAssets.length > 0 ? `${userAssets.length} ativo(s) foram devolvidos ao estoque.` : undefined,
      time: "Agora mesmo",
      type: "administrativo",
      category: "Governança",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);
    showToast(
      "Usuário Removido", 
      `${userToDelete.name} foi excluído do sistema${userAssets.length > 0 ? ` e ${userAssets.length} ativo(s) retornaram ao estoque.` : "."}`, 
      "success"
    );
  };

  // Checkout (Saída)
  const checkoutAsset = (
    assetId: string,
    userId: string,
    location: string,
    date: string,
    returnDate?: string,
    notes?: string
  ) => {
    const userObj = users.find((u) => u.id === userId) || users[0];
    
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          const newEvent: TimelineEvent = {
            id: Date.now().toString(),
            title: `Atribuído a ${userObj.name}`,
            date: new Date(date).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }),
            description: `Checkout efetuado para o local: ${location}. Notas: ${notes || "Nenhuma"}`,
            type: "success",
            user: currentUser?.name || "Admin",
          };
          const updatedAsset = {
            ...a,
            status: "Atribuído" as const,
            assignedToUserId: userId,
            assignedToUser: userObj,
            history: [newEvent, ...(a.history || [])],
          };
          saveDocument("assets", updatedAsset);
          return updatedAsset;
        }
        return a;
      })
    );

    // Append to activities
    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `${currentUser?.name || "Admin"} realizou o Check-out de ${assetId} para ${userObj.name}`,
      user: currentUser?.name || "Admin",
      action: "Check-out",
      target: assetId,
      details: notes || `Checkout para ${location}`,
      time: "Agora mesmo",
      type: "sistema",
      category: "Notebooks",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);
    showToast("Saída Confirmada", `${userObj.name} recebeu o ativo com sucesso.`, "success");
  };

  // Check-in (Devolução)
  const checkinAsset = (
    assetId: string,
    status: "Disponível" | "Atribuído" | "Manutenção",
    condition: string,
    location: string,
    notes: string
  ) => {
    const prevAsset = assets.find((a) => a.id === assetId);
    const prevUser = prevAsset?.assignedToUser;

    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          const conditionLabel = condition === "good" ? "Bom Estado" : condition === "damaged" ? "Danificado" : "Necessita Reparo";
          const newEvent: TimelineEvent = {
            id: Date.now().toString(),
            title: `Devolvido por ${prevUser?.name || "Usuário"}`,
            date: new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }),
            description: `Check-in realizado. Estado: ${conditionLabel}. Notas: ${notes || "Nenhuma"}`,
            type: condition === "good" ? "info" : "warning",
            user: currentUser?.name || "Admin",
          };

          const updatedAsset = {
            ...a,
            status,
            assignedToUserId: null,
            assignedToUser: null,
            health: condition === "good" ? 95 : condition === "damaged" ? 40 : 65,
            history: [newEvent, ...(a.history || [])],
          };
          saveDocument("assets", updatedAsset);
          return updatedAsset;
        }
        return a;
      })
    );

    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `Check-in de ${assetId} concluído por ${currentUser?.name || "Admin"}`,
      user: currentUser?.name || "Admin",
      action: "Check-in",
      target: assetId,
      details: `Devolvido em estado: ${condition}. Destino: ${location}`,
      time: "Agora mesmo",
      type: "suporte",
      category: "Inventário",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);
    showToast("Check-in Concluído", "Ativo retornado ao estoque com sucesso.", "success");
  };

  // Run Diagnostics
  const runDiagnostics = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          const newEvent: TimelineEvent = {
            id: Date.now().toString(),
            title: "Diagnóstico Automático Executado",
            date: "Agora mesmo",
            description: "Todos os sistemas e baterias verificados via Cloud Agent. Nenhuma anomalia crítica.",
            type: "success",
            user: "Sistema Central",
          };
          const updatedAsset = {
            ...a,
            health: Math.min(100, (a.health || 80) + 5),
            history: [newEvent, ...(a.history || [])],
          };
          saveDocument("assets", updatedAsset);
          return updatedAsset;
        }
        return a;
      })
    );
    showToast("Diagnóstico Iniciado", "Análise de integridade de hardware em execução...", "info");
  };

  // Checkout Consumable
  const checkoutConsumable = (id: string) => {
    let triggeredCritical = false;
    let name = "";

    setConsumables((prev) =>
      prev.map((c) => {
        if (c.id === id && c.quantityRemaining > 0) {
          name = c.name;
          const remaining = c.quantityRemaining - 1;
          let status = c.status;
          
          const ratio = remaining / c.quantityTotal;
          if (ratio <= 0.05) {
            status = "Crítico";
            triggeredCritical = true;
          } else if (ratio <= 0.2) {
            status = "Estoque Baixo";
          } else if (ratio <= 0.5) {
            status = "Estoque Médio";
          }

          const updatedConsumable = {
            ...c,
            quantityRemaining: remaining,
            status,
          };
          saveDocument("consumables", updatedConsumable);
          return updatedConsumable;
        }
        return c;
      })
    );

    // Append activity
    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `Consumível dispensado: 1 unidade de ${name}`,
      user: currentUser?.name || "Admin",
      action: "Saída Estoque",
      target: name,
      time: "Agora mesmo",
      type: triggeredCritical ? "suporte" : "sistema",
      category: "Consumíveis",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);

    if (triggeredCritical) {
      showToast("Estoque Crítico", `Atenção: Estoque de ${name} está quase esgotado!`, "warning");
    } else {
      showToast("Retirada Concluída", `1x ${name} retirado com sucesso.`, "success");
    }
  };

  // Add Consumable
  const addConsumable = (consumable: Omit<Consumable, "id" | "status">) => {
    const id = "C-" + (consumables.length + 1);
    const ratio = consumable.quantityRemaining / consumable.quantityTotal;
    let status: Consumable["status"] = "Disponível";
    if (ratio <= 0.05) status = "Crítico";
    else if (ratio <= 0.2) status = "Estoque Baixo";
    else if (ratio <= 0.5) status = "Estoque Médio";

    const newItem: Consumable = {
      ...consumable,
      id,
      status,
    };

    setConsumables((prev) => [...prev, newItem]);
    saveDocument("consumables", newItem);
    showToast("Item Cadastrado", `${consumable.name} adicionado ao estoque.`, "success");
  };

  // Add License
  const addLicense = (license: Omit<License, "id">) => {
    const id = "LIC-" + (2024 + licenses.length).toString() + "-" + Math.floor(Math.random() * 900 + 100);
    const newItem: License = {
      ...license,
      id,
    };
    setLicenses((prev) => [newItem, ...prev]);
    saveDocument("licenses", newItem);
    showToast("Licença Registrada", `${license.name} foi cadastrada com sucesso.`, "success");
  };

  // Add Asset
  const addAsset = (asset: Omit<Asset, "id" | "health">) => {
    const id = "ASSET-" + Math.floor(Math.random() * 9000 + 1000);
    const now = new Date();
    const nowIso = now.toISOString();
    const formattedDate = now.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
    const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const newItem: Asset = {
      ...asset,
      id,
      health: 100,
      createdAt: asset.createdAt || nowIso,
      registrationDate: asset.registrationDate || nowIso.split("T")[0],
      history: [
        {
          id: Date.now().toString(),
          title: "Ativo Cadastrado",
          date: `${formattedDate} às ${formattedTime}`,
          description: `Entrada e registro do ativo ${asset.name} no sistema.`,
          type: "success",
          user: currentUser?.name || "Admin",
        },
        ...(asset.history || [])
      ],
    };

    setAssets((prev) => [newItem, ...prev]);
    saveDocument("assets", newItem);
    showToast("Ativo Cadastrado", `${asset.name} foi catalogado e registrado com sucesso.`, "success");
  };

  // Update Asset
  const updateAsset = (id: string, updatedData: Partial<Asset>) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
    const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const editEvent: TimelineEvent = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            title: "Ativo Editado / Atualizado",
            date: `${formattedDate} às ${formattedTime}`,
            description: `Informações do ativo foram alteradas por ${currentUser?.name || "Admin"}.`,
            type: "info",
            user: currentUser?.name || "Admin",
          };

          const updated: Asset = {
            ...a,
            ...updatedData,
            history: [editEvent, ...(a.history || [])],
          };

          saveDocument("assets", updated);
          return updated;
        }
        return a;
      })
    );

    // Register activity
    const targetName = updatedData.name || id;
    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `${currentUser?.name || "Admin"} editou os dados do ativo ${targetName}`,
      user: currentUser?.name || "Admin",
      action: "Edição Ativo",
      target: targetName,
      details: updatedData.category ? `Categoria: ${updatedData.category} | Modelo: ${updatedData.model || "-"}` : undefined,
      time: "Agora mesmo",
      type: "administrativo",
      category: "Inventário",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);

    showToast("Ativo Atualizado", `As alterações no ativo foram salvas com sucesso.`, "success");
  };

  // Delete Asset
  const deleteAsset = (id: string) => {
    const assetToDelete = assets.find((a) => a.id === id);
    if (!assetToDelete) return;

    setAssets((prev) => prev.filter((a) => a.id !== id));
    deleteDocument("assets", id);

    const newActivity: Activity = {
      id: Date.now().toString(),
      title: `${currentUser?.name || "Admin"} removeu o ativo ${assetToDelete.name} (${id})`,
      user: currentUser?.name || "Admin",
      action: "Exclusão Ativo",
      target: assetToDelete.name,
      time: "Agora mesmo",
      type: "administrativo",
      category: "Inventário",
    };
    setActivities((prev) => [newActivity, ...prev]);
    saveDocument("activities", newActivity);

    showToast("Ativo Removido", `${assetToDelete.name} foi removido do inventário.`, "success");
  };

  const resetDatabase = async () => {
    const adminUser = {
      id: "user-admin",
      name: "Admin Global",
      email: "admin@assetcentral.com",
      username: "admin",
      password: "admin",
      role: "Gestor de Ativos TI",
      department: "Tecnologia da Informação",
      location: "Sede Principal (HQ)",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUgS7fDbdjDDbHbn2iIu7i2JpVr8ZV57e7bMCZxI0oW4wvOe1EtGhDwQwGGtmzcXglqhyhWrbNp8MAEWZD4RGKx-DbHh-MUwv_Kh5iLshA6iGla5fFX50Ja_C_UXv7M8tVMmahFmBWAxaFGhE66FPaJSfCOH7R5QGcZDojaRxniHoQAESB2vnzVrW8FluC97ObSf7q3l53iq1ZGa2ZAjL-obKpeDYM1_Uy1lP6Xb2Ba1806vNp00naBpvXJtyhyeXo4Mo-IygrbiU",
      isAdmin: true,
    };
    
    try {
      await clearAllCollectionsAndCreateAdmin(adminUser);
      
      // Update local React state
      setUsers([adminUser]);
      setAssets([]);
      setLicenses([]);
      setConsumables([]);
      setActivities([]);
      setCurrentUser(adminUser);
      
      // Reset localStorage
      localStorage.setItem("ac_user", JSON.stringify(adminUser));
      localStorage.setItem("ac_users", JSON.stringify([adminUser]));
      localStorage.setItem("ac_assets", JSON.stringify([]));
      localStorage.setItem("ac_licenses", JSON.stringify([]));
      localStorage.setItem("ac_consumables", JSON.stringify([]));
      localStorage.setItem("ac_activities", JSON.stringify([]));
      
      showToast("Banco de Dados Zerado", "Todo o banco de dados foi resetado. Usuário master 'admin' criado com senha 'admin'.", "success");
    } catch (err) {
      console.error("Failed to reset database:", err);
      showToast("Erro ao Zerar", "Houve uma falha ao comunicar com o Firestore.", "warning");
    }
  };

  const clearItemTables = async () => {
    try {
      await clearSpecificCollections(["assets", "licenses", "consumables", "activities"]);
      setAssets([]);
      setLicenses([]);
      setConsumables([]);
      setActivities([]);
      localStorage.setItem("ac_assets", JSON.stringify([]));
      localStorage.setItem("ac_licenses", JSON.stringify([]));
      localStorage.setItem("ac_consumables", JSON.stringify([]));
      localStorage.setItem("ac_activities", JSON.stringify([]));
      showToast("Tabelas Limpas", "Os dados de Ativos, Consumíveis, Licenças e Históricos de Atividades foram zerados com sucesso.", "success");
    } catch (err) {
      console.error("Failed to clear tables:", err);
      showToast("Erro ao Limpar", "Houve uma falha ao comunicar com o Firestore.", "warning");
    }
  };

  const clearAllActivities = async () => {
    try {
      await clearSpecificCollections(["activities"]);
      setActivities([]);
      localStorage.setItem("ac_activities", JSON.stringify([]));
      showToast("Histórico Limpo", "Todo o histórico de atividades foi apagado com sucesso.", "success");
    } catch (err) {
      console.error("Failed to clear activities:", err);
      showToast("Erro ao Limpar", "Houve uma falha ao apagar o histórico de atividades.", "warning");
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        assets,
        licenses,
        consumables,
        activities,
        toast,
        login,
        logout,
        updateUserProfile,
        showToast,
        hideToast,
        checkoutAsset,
        checkinAsset,
        runDiagnostics,
        addConsumable,
        checkoutConsumable,
        addLicense,
        addAsset,
        updateAsset,
        deleteAsset,
        addUser,
        updateUser,
        deleteUser,
        resetDatabase,
        clearItemTables,
        clearAllActivities,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
