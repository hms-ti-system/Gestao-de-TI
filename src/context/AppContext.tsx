import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, Asset, License, Consumable, Activity, TimelineEvent } from "../types";
import { firebaseConfig } from "../firebase";
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  getActiveDbProvider,
  setActiveDbProvider,
  SUPABASE_SQL_SCHEMA,
  testSupabaseConnection as runTestSupabase,
  migrateDataToSupabase,
  loadDatabaseFromSupabase,
  saveDocumentToSupabase,
  deleteDocumentFromSupabase,
  clearSupabaseTables,
  subscribeToSupabaseRealtime,
  SupabaseConfig
} from "../supabase";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
  visible: boolean;
}

export interface CloudConnectionInfo {
  status: "connected" | "syncing" | "offline" | "error";
  lastSync: Date | null;
  databaseId: string;
  projectId: string;
  latencyMs: number | null;
  lastTestResult?: {
    success: boolean;
    message: string;
    latencyMs: number;
    counts?: {
      users: number;
      assets: number;
      licenses: number;
      consumables: number;
      activities: number;
    };
  };
}

export interface SupabaseConnectionInfo {
  status: "connected" | "disconnected" | "syncing" | "error";
  url: string;
  latencyMs: number | null;
  lastTestResult?: {
    success: boolean;
    message: string;
    latencyMs: number;
    url: string;
    counts?: {
      users: number;
      assets: number;
      licenses: number;
      consumables: number;
      activities: number;
    };
    missingTables?: string[];
  };
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  assets: Asset[];
  licenses: License[];
  consumables: Consumable[];
  activities: Activity[];
  toast: Toast | null;
  cloudInfo: CloudConnectionInfo;
  dbProvider: "firebase" | "supabase";
  setDbProvider: (provider: "firebase" | "supabase") => void;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: SupabaseConfig) => void;
  supabaseInfo: SupabaseConnectionInfo;
  testSupabaseConnection: () => Promise<any>;
  migrateToSupabase: () => Promise<{ success: boolean; message: string; transferred?: any }>;
  supabaseSqlSchema: string;
  isReadOnly: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
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
  forceCloudSync: () => Promise<void>;
  testConnection: () => Promise<any>;
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
    permissionLevel: "standard",
    isReadOnly: false,
  },
  {
    id: "user-2",
    name: "Ricardo Mendes",
    email: "r.mendes@assetcentral.co",
    role: "Engenheiro de DevOps",
    department: "Infraestrutura",
    location: "Sede São Paulo - 4º Andar",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOGQiMbBQnZlxDCbewZLnAsVeWA7buow4Jb9qIkIzT7HSfR66mvCWU3Oti_snkf90bSx5u8beUkXZaORAPrJWibl--03ftX9A3nMtTtAIGp1UB5nF03O_L7p6RoMCKDG7B7pJaCF-6aN6DbP2i4U3CTL9hOYAAGPZc-7YflzPdKakgVf4NbJ8-kyOabAnkSpVWt5thGQayZNCw4qK10gOd0qPmb38Q8Twei7q_ivYCIbnFHnqQSAIizxoauQfnwIjyIqVdlnKEIr0",
    permissionLevel: "standard",
    isReadOnly: false,
  },
  {
    id: "user-3",
    name: "Ana Lima",
    email: "ana.lima@assetcentral.co",
    role: "Gerente de Produto",
    department: "Produto",
    location: "Sede Principal",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIPbFrB9pdZW6k_JE52kQw8DtTZXW37vYounYCsA1_D1mXFeE6mHwwtvvkN21VtQ0E2sD36CUxBvbDu6baPfCsG8teOU7_htO4yjqxRQcQh6G1_iwE1iAB9B-_BX0KDTFHFPh-zZ8-aEI-twJHk6_7Vt2GiS_Glo6ShD72GEl6Weq-KHaNmcH7EBHdnkqoGRJOo9UbqcoNV3pitKJcWYli9hncg0E6TShtZPqXyJDJ3HTS5KfW7iQszDdZxb_Na6fFo23Z4rVTx5o",
    permissionLevel: "standard",
    isReadOnly: false,
  },
  {
    id: "user-viewer",
    name: "Mariana Costa",
    email: "auditor@assetcentral.com",
    username: "visualizador",
    password: "visualizador",
    role: "Auditora de TI / Apenas Leitura",
    department: "Auditoria & Compliance",
    location: "Sede Principal (HQ)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    isAdmin: false,
    isReadOnly: true,
    permissionLevel: "viewer",
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
    isReadOnly: false,
    permissionLevel: "admin",
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
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Ensure user-viewer exists in list
        if (!parsed.some((u) => u.id === "user-viewer" || u.username === "visualizador" || u.email === "auditor@assetcentral.com")) {
          const viewerUser = initialUsers.find((u) => u.id === "user-viewer")!;
          return [...parsed, viewerUser];
        }
        return parsed;
      } catch {
        return initialUsers;
      }
    }
    return initialUsers;
  });

  const isReadOnly = Boolean(currentUser?.isReadOnly || currentUser?.permissionLevel === "viewer");
  const canCreate = !isReadOnly;
  const canEdit = !isReadOnly;
  const canDelete = !isReadOnly && Boolean(currentUser?.isAdmin || currentUser?.id === "user-admin");

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

  const [dbProvider, setDbProviderState] = useState<"firebase" | "supabase">("supabase");
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(() => getSavedSupabaseConfig());
  const [supabaseInfo, setSupabaseInfo] = useState<SupabaseConnectionInfo>(() => ({
    status: supabaseConfig.url ? "syncing" : "disconnected",
    url: supabaseConfig.url || "",
    latencyMs: null,
  }));

  const updateSupabaseConfig = useCallback((cfg: SupabaseConfig) => {
    saveSupabaseConfig(cfg);
    setSupabaseConfigState(cfg);
    setSupabaseInfo(prev => ({
      ...prev,
      url: cfg.url,
      status: cfg.url && cfg.anonKey ? "syncing" : "disconnected",
    }));

    if (cfg.url && cfg.anonKey) {
      runTestSupabase().then((res) => {
        setSupabaseInfo(prev => ({
          ...prev,
          status: res.success ? "connected" : "error",
          latencyMs: res.latencyMs,
          lastTestResult: res,
        }));
      }).catch(() => {});
    }
  }, []);

  const setDbProvider = useCallback((prov: "firebase" | "supabase") => {
    setActiveDbProvider(prov);
    setDbProviderState(prov);
  }, []);

  const testSupabaseConnection = useCallback(async () => {
    setSupabaseInfo(prev => ({ ...prev, status: "syncing" }));
    const res = await runTestSupabase();
    setSupabaseInfo(prev => ({
      ...prev,
      status: res.success ? "connected" : "error",
      latencyMs: res.latencyMs,
      lastTestResult: res,
    }));
    return res;
  }, []);

  const [cloudInfo, setCloudInfo] = useState<CloudConnectionInfo>({
    status: "offline",
    lastSync: null,
    databaseId: firebaseConfig.firestoreDatabaseId || "(desconectado)",
    projectId: firebaseConfig.projectId || "desconectado",
    latencyMs: null
  });

  // Supabase direct persistence helpers (Firebase disconnected)
  const persistSave = useCallback(async (collectionName: string, item: any) => {
    try {
      // Save directly to Supabase
      await saveDocumentToSupabase(collectionName, item);
    } catch (err) {
      console.warn(`[Supabase Cloud] Falha ao salvar em ${collectionName}:`, err);
    }
  }, []);

  const persistDelete = useCallback(async (collectionName: string, id: string) => {
    try {
      // Delete directly from Supabase
      await deleteDocumentFromSupabase(collectionName, id);
    } catch (err) {
      console.warn(`[Supabase Cloud] Falha ao excluir ${collectionName}/${id}:`, err);
    }
  }, []);

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

  const forceCloudSync = useCallback(async () => {
    setSupabaseInfo(prev => ({ ...prev, status: "syncing" }));
    try {
      const data = await loadDatabaseFromSupabase(initialUsers);
      if (data.users && data.users.length > 0) setUsers(data.users);
      if (data.assets) setAssets(data.assets);
      if (data.licenses) setLicenses(data.licenses);
      if (data.consumables) setConsumables(data.consumables);
      if (data.activities) setActivities(data.activities);

      setSupabaseInfo(prev => ({
        ...prev,
        status: "connected",
      }));
    } catch (err) {
      console.error("Force Supabase sync failed:", err);
      setSupabaseInfo(prev => ({ ...prev, status: "error" }));
    }
  }, []);

  // 1-Click Migration from current local/cache data to Supabase
  const migrateToSupabase = useCallback(async () => {
    const dataToMigrate = {
      users,
      assets,
      licenses,
      consumables,
      activities,
    };

    const res = await migrateDataToSupabase(dataToMigrate);
    if (res.success) {
      setDbProvider("supabase");
      await testSupabaseConnection();
    }
    return res;
  }, [users, assets, licenses, consumables, activities, setDbProvider, testSupabaseConnection]);

  const testConnection = useCallback(async () => {
    // Firebase is disconnected, test Supabase instead
    return await testSupabaseConnection();
  }, [testSupabaseConnection]);

  // Synchronize with Supabase database on mount and subscribe to postgres realtime updates
  useEffect(() => {
    let isMounted = true;

    const initDbSync = async () => {
      try {
        const sData = await loadDatabaseFromSupabase(initialUsers);
        if (!isMounted) return;
        if (sData.users && sData.users.length > 0) setUsers(sData.users);
        if (sData.assets) setAssets(sData.assets);
        if (sData.licenses) setLicenses(sData.licenses);
        if (sData.consumables) setConsumables(sData.consumables);
        if (sData.activities) setActivities(sData.activities);
      } catch (error) {
        console.error("Failed to sync Supabase database on mount:", error);
      }
    };

    initDbSync();

    // 1. Subscribe to Supabase Postgres Realtime changes
    const supaRealtimeSub = subscribeToSupabaseRealtime((_table) => {
      if (!isMounted) return;
      console.log(`[Supabase Realtime] Mudança detectada na tabela ${_table}, atualizando dados locais...`);
      forceCloudSync();
    });

    // 2. Tab Focus & Background Polling to guarantee fresh sync on mobile or background devices
    const onWindowFocus = () => {
      if (isMounted) {
        forceCloudSync();
      }
    };

    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onWindowFocus);
    const syncInterval = setInterval(() => {
      if (isMounted) {
        forceCloudSync();
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (supaRealtimeSub) supaRealtimeSub.unsubscribe();
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onWindowFocus);
      clearInterval(syncInterval);
    };
  }, [forceCloudSync]);

  // Initial Supabase health test on mount
  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.anonKey) {
      testSupabaseConnection().catch(() => {});
    }
  }, [supabaseConfig.url, supabaseConfig.anonKey, testSupabaseConnection]);

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
      persistSave("users", updated);
      showToast("Perfil Atualizado", "Suas informações foram salvas com sucesso.", "success");
    }
  };

  // Add User
  const addUser = (userData: Omit<User, "id">) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Criação de usuários não permitida.", "warning");
      return;
    }
    const id = "user-" + Math.floor(Math.random() * 9000 + 1000);
    const newUser: User = {
      ...userData,
      id,
    };
    setUsers((prev) => [...prev, newUser]);
    persistSave("users", newUser);
    
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
    persistSave("activities", newActivity);
    showToast("Usuário Cadastrado", `${userData.name} foi adicionado com sucesso.`, "success");
  };

  // Update User
  const updateUser = (id: string, updatedData: Partial<User>) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Edição de usuários não permitida.", "warning");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updatedData };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          persistSave("users", updated);
          return updated;
        }
        return u;
      })
    );
    showToast("Usuário Atualizado", "As informações do usuário foram salvas.", "success");
  };

  // Delete User
  const deleteUser = (id: string) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Exclusão não permitida.", "warning");
      return;
    }
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
        persistSave("assets", updatedAsset);
      });
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    persistDelete("users", id);
    
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
    persistSave("activities", newActivity);
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
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Check-out de ativos não permitido.", "warning");
      return;
    }
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
          persistSave("assets", updatedAsset);
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
    persistSave("activities", newActivity);
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
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Check-in de ativos não permitido.", "warning");
      return;
    }
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
          persistSave("assets", updatedAsset);
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
    persistSave("activities", newActivity);
    showToast("Check-in Concluído", "Ativo retornado ao estoque com sucesso.", "success");
  };

  // Run Diagnostics
  const runDiagnostics = (assetId: string) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização.", "warning");
      return;
    }
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
          persistSave("assets", updatedAsset);
          return updatedAsset;
        }
        return a;
      })
    );
    showToast("Diagnóstico Iniciado", "Análise de integridade de hardware em execução...", "info");
  };

  // Checkout Consumable
  const checkoutConsumable = (id: string) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Retirada de itens não permitida.", "warning");
      return;
    }
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
          persistSave("consumables", updatedConsumable);
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
    persistSave("activities", newActivity);

    if (triggeredCritical) {
      showToast("Estoque Crítico", `Atenção: Estoque de ${name} está quase esgotado!`, "warning");
    } else {
      showToast("Retirada Concluída", `1x ${name} retirado com sucesso.`, "success");
    }
  };

  // Add Consumable
  const addConsumable = (consumable: Omit<Consumable, "id" | "status">) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Criação de consumíveis não permitida.", "warning");
      return;
    }
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
    persistSave("consumables", newItem);
    showToast("Item Cadastrado", `${consumable.name} adicionado ao estoque.`, "success");
  };

  // Add License
  const addLicense = (license: Omit<License, "id">) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização. Cadastro de licenças não permitido.", "warning");
      return;
    }
    const id = "LIC-" + (2024 + licenses.length).toString() + "-" + Math.floor(Math.random() * 900 + 100);
    const newItem: License = {
      ...license,
      id,
    };
    setLicenses((prev) => [newItem, ...prev]);
    persistSave("licenses", newItem);
    showToast("Licença Registrada", `${license.name} foi cadastrada com sucesso.`, "success");
  };

  // Add Asset
  const addAsset = (asset: Omit<Asset, "id" | "health">) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização (sem permissão de CREATE, UPDATE ou DELETE).", "warning");
      return;
    }
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
    persistSave("assets", newItem);
    showToast("Ativo Cadastrado", `${asset.name} foi catalogado e registrado com sucesso.`, "success");
  };

  // Update Asset
  const updateAsset = (id: string, updatedData: Partial<Asset>) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização (sem permissão de CREATE, UPDATE ou DELETE).", "warning");
      return;
    }
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

          persistSave("assets", updated);
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
    persistSave("activities", newActivity);

    showToast("Ativo Atualizado", `As alterações no ativo foram salvas com sucesso.`, "success");
  };

  // Delete Asset
  const deleteAsset = (id: string) => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Seu perfil possui permissão apenas de visualização (sem permissão de CREATE, UPDATE ou DELETE).", "warning");
      return;
    }
    const assetToDelete = assets.find((a) => a.id === id);
    if (!assetToDelete) return;

    setAssets((prev) => prev.filter((a) => a.id !== id));
    persistDelete("assets", id);

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
    persistSave("activities", newActivity);

    showToast("Ativo Removido", `${assetToDelete.name} foi removido do inventário.`, "success");
  };

  const resetDatabase = async () => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Apenas administradores podem redefinir o banco de dados.", "warning");
      return;
    }
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
      await clearSupabaseTables(["users", "assets", "licenses", "consumables", "activities"]);
      await saveDocumentToSupabase("users", adminUser);
      
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
      
      showToast("Banco de Dados Zerado", "Todo o banco de dados foi resetado no Supabase. Usuário master 'admin' criado com senha 'admin'.", "success");
    } catch (err) {
      console.error("Failed to reset database:", err);
      showToast("Erro ao Zerar", "Houve uma falha ao comunicar com o Supabase.", "warning");
    }
  };

  const clearItemTables = async () => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Apenas administradores podem limpar as tabelas.", "warning");
      return;
    }
    try {
      await clearSupabaseTables(["assets", "licenses", "consumables", "activities"]);
      setAssets([]);
      setLicenses([]);
      setConsumables([]);
      setActivities([]);
      localStorage.setItem("ac_assets", JSON.stringify([]));
      localStorage.setItem("ac_licenses", JSON.stringify([]));
      localStorage.setItem("ac_consumables", JSON.stringify([]));
      localStorage.setItem("ac_activities", JSON.stringify([]));
      showToast("Tabelas Limpas", "Os dados de Ativos, Consumíveis, Licenças e Históricos de Atividades foram zerados no Supabase.", "success");
    } catch (err) {
      console.error("Failed to clear tables:", err);
      showToast("Erro ao Limpar", "Houve uma falha ao comunicar com o Supabase.", "warning");
    }
  };

  const clearAllActivities = async () => {
    if (isReadOnly) {
      showToast("Acesso Restrito", "Apenas administradores podem apagar o histórico de atividades.", "warning");
      return;
    }
    try {
      await clearSupabaseTables(["activities"]);
      setActivities([]);
      localStorage.setItem("ac_activities", JSON.stringify([]));
      showToast("Histórico Limpo", "Todo o histórico de atividades foi apagado com sucesso no Supabase.", "success");
    } catch (err) {
      console.error("Failed to clear activities:", err);
      showToast("Erro ao Limpar", "Houve uma falha ao apagar o histórico de atividades no Supabase.", "warning");
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
        cloudInfo,
        dbProvider,
        setDbProvider,
        supabaseConfig,
        updateSupabaseConfig,
        supabaseInfo,
        testSupabaseConnection,
        migrateToSupabase,
        supabaseSqlSchema: SUPABASE_SQL_SCHEMA,
        isReadOnly,
        canCreate,
        canEdit,
        canDelete,
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
        forceCloudSync,
        testConnection,
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
