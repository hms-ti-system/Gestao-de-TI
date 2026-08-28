import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { User, Asset, License, Consumable, Activity } from "./types";

const LOCAL_STORAGE_KEY_URL = "assetcentral_supabase_url";
const LOCAL_STORAGE_KEY_KEY = "assetcentral_supabase_key";
const LOCAL_STORAGE_KEY_PROVIDER = "assetcentral_db_provider";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || "";
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || "";

  const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEY_URL) || envUrl;
  const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY_KEY) || envKey;

  return {
    url: savedUrl.trim(),
    anonKey: savedKey.trim(),
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  if (config.url) {
    localStorage.setItem(LOCAL_STORAGE_KEY_URL, config.url.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_URL);
  }

  if (config.anonKey) {
    localStorage.setItem(LOCAL_STORAGE_KEY_KEY, config.anonKey.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY_KEY);
  }

  cachedClient = null;
}

export function getActiveDbProvider(): "firebase" | "supabase" {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROVIDER);
  if (saved === "supabase" || saved === "firebase") {
    return saved;
  }
  return "firebase";
}

export function setActiveDbProvider(provider: "firebase" | "supabase") {
  localStorage.setItem(LOCAL_STORAGE_KEY_PROVIDER, provider);
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSavedSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error("Erro ao inicializar Supabase Client:", error);
    return null;
  }
}

/**
 * Complete SQL Schema script ready for Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- SCRIPT DE CRIAÇÃO DE TABELAS SUPABASE (POSTGRESQL) - GESTOR DE ATIVOS
-- Cole este script no "SQL Editor" do seu painel Supabase e clique em RUN
-- ====================================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT,
    department TEXT,
    location TEXT,
    avatar TEXT,
    username TEXT,
    password TEXT,
    is_admin BOOLEAN DEFAULT false,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE ATIVOS / EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    series_number TEXT,
    manufacturer TEXT,
    model TEXT,
    category TEXT,
    status TEXT NOT NULL,
    assigned_to_user_id TEXT,
    assigned_to_user JSONB,
    image TEXT,
    description TEXT,
    health INTEGER DEFAULT 100,
    specs JSONB,
    history JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE LICENÇAS DE SOFTWARE
CREATE TABLE IF NOT EXISTS public.licenses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    software TEXT NOT NULL,
    supplier TEXT,
    key TEXT,
    seats_total INTEGER DEFAULT 1,
    seats_used INTEGER DEFAULT 0,
    expiration_date TEXT,
    status TEXT DEFAULT 'Ativo',
    icon_type TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE CONSUMÍVEIS
CREATE TABLE IF NOT EXISTS public.consumables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    quantity_remaining INTEGER DEFAULT 0,
    quantity_total INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Disponível',
    icon_name TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA DE ATIVIDADES E LOGS
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    title TEXT,
    "user" TEXT,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT,
    time TEXT,
    type TEXT,
    category TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- HABILITAR POLÍTICAS DE ACESSO PÚBLICO (ANON KEY)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Total Anon Users" ON public.users;
CREATE POLICY "Acesso Total Anon Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon Assets" ON public.assets;
CREATE POLICY "Acesso Total Anon Assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon Licenses" ON public.licenses;
CREATE POLICY "Acesso Total Anon Licenses" ON public.licenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon Consumables" ON public.consumables;
CREATE POLICY "Acesso Total Anon Consumables" ON public.consumables FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon Activities" ON public.activities;
CREATE POLICY "Acesso Total Anon Activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
`;

/**
 * Test live connection to Supabase instance
 */
export async function testSupabaseConnection(): Promise<{
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
}> {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return {
      success: false,
      message: "URL e Chave Anon do Supabase não configuradas.",
      latencyMs: 0,
      url: config.url || "Não configurado",
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: "Falha ao inicializar o cliente Supabase. Verifique a URL e a Chave Anon.",
      latencyMs: 0,
      url: config.url,
    };
  }

  const start = performance.now();
  const missingTables: string[] = [];

  try {
    const [uRes, aRes, lRes, cRes, actRes] = await Promise.all([
      client.from("users").select("id", { count: "exact", head: true }),
      client.from("assets").select("id", { count: "exact", head: true }),
      client.from("licenses").select("id", { count: "exact", head: true }),
      client.from("consumables").select("id", { count: "exact", head: true }),
      client.from("activities").select("id", { count: "exact", head: true }),
    ]);

    const latencyMs = Math.round(performance.now() - start);

    if (uRes.error) missingTables.push("users");
    if (aRes.error) missingTables.push("assets");
    if (lRes.error) missingTables.push("licenses");
    if (cRes.error) missingTables.push("consumables");
    if (actRes.error) missingTables.push("activities");

    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Conexão bem sucedida, porém as seguintes tabelas não foram encontradas no Supabase: ${missingTables.join(", ")}. Execute o script SQL no SQL Editor do Supabase.`,
        latencyMs,
        url: config.url,
        missingTables,
      };
    }

    return {
      success: true,
      message: "Conexão com o banco de dados Supabase (PostgreSQL) estabelecida e verificada com sucesso!",
      latencyMs,
      url: config.url,
      counts: {
        users: uRes.count ?? 0,
        assets: aRes.count ?? 0,
        licenses: lRes.count ?? 0,
        consumables: cRes.count ?? 0,
        activities: actRes.count ?? 0,
      },
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      message: error?.message || "Erro desconhecido ao conectar com Supabase.",
      latencyMs,
      url: config.url,
    };
  }
}

/**
 * Formatters and Parsers
 */
function formatUserForSupabase(user: User): any {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || null,
    department: user.department || null,
    location: user.location || null,
    avatar: user.avatar || null,
    username: user.username || null,
    password: user.password || null,
    is_admin: user.isAdmin ?? false,
    raw_data: user,
  };
}

function parseUserFromSupabase(row: any): User {
  if (row.raw_data && typeof row.raw_data === "object") {
    return { ...row.raw_data, id: row.id };
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || "",
    department: row.department || "",
    location: row.location || "",
    avatar: row.avatar || "",
    username: row.username,
    password: row.password,
    isAdmin: row.is_admin,
  };
}

function formatAssetForSupabase(asset: Asset): any {
  return {
    id: asset.id,
    name: asset.name,
    series_number: asset.seriesNumber || null,
    manufacturer: asset.manufacturer || null,
    model: asset.model || null,
    category: asset.category,
    status: asset.status,
    assigned_to_user_id: asset.assignedToUserId || null,
    assigned_to_user: asset.assignedToUser || null,
    image: asset.image || null,
    description: asset.description || null,
    health: asset.health ?? 100,
    specs: {
      cpu: asset.cpu,
      ram: asset.ram,
      storage: asset.storage,
      os: asset.os,
      macAddress: asset.macAddress,
    },
    history: asset.history || [],
    raw_data: asset,
  };
}

function parseAssetFromSupabase(row: any): Asset {
  if (row.raw_data && typeof row.raw_data === "object") {
    return { ...row.raw_data, id: row.id };
  }
  return {
    id: row.id,
    name: row.name,
    seriesNumber: row.series_number || "",
    manufacturer: row.manufacturer || "",
    model: row.model || "",
    category: row.category || "Equipamento",
    status: row.status || "Disponível",
    assignedToUserId: row.assigned_to_user_id,
    assignedToUser: row.assigned_to_user,
    image: row.image,
    description: row.description,
    health: row.health ?? 100,
    history: row.history || [],
  };
}

function formatLicenseForSupabase(license: License): any {
  return {
    id: license.id,
    name: license.name,
    software: license.software,
    supplier: license.supplier || null,
    key: license.key || null,
    seats_total: license.seatsTotal,
    seats_used: license.seatsUsed,
    expiration_date: license.expirationDate || null,
    status: license.status,
    icon_type: license.iconType || "diamond",
    raw_data: license,
  };
}

function parseLicenseFromSupabase(row: any): License {
  if (row.raw_data && typeof row.raw_data === "object") {
    return { ...row.raw_data, id: row.id };
  }
  return {
    id: row.id,
    name: row.name,
    software: row.software,
    supplier: row.supplier,
    key: row.key,
    seatsTotal: row.seats_total,
    seatsUsed: row.seats_used,
    expirationDate: row.expiration_date,
    status: row.status,
    iconType: row.icon_type,
  };
}

function formatConsumableForSupabase(consumable: Consumable): any {
  return {
    id: consumable.id,
    name: consumable.name,
    category: consumable.category,
    description: consumable.description || null,
    quantity_remaining: consumable.quantityRemaining,
    quantity_total: consumable.quantityTotal,
    status: consumable.status,
    icon_name: consumable.iconName || "print",
    raw_data: consumable,
  };
}

function parseConsumableFromSupabase(row: any): Consumable {
  if (row.raw_data && typeof row.raw_data === "object") {
    return { ...row.raw_data, id: row.id };
  }
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    quantityRemaining: row.quantity_remaining,
    quantityTotal: row.quantity_total,
    status: row.status,
    iconName: row.icon_name,
  };
}

function formatActivityForSupabase(act: Activity): any {
  return {
    id: act.id,
    title: act.title || null,
    user: act.user || null,
    action: act.action,
    target: act.target,
    details: act.details || null,
    time: act.time || null,
    type: act.type || null,
    category: act.category || null,
    raw_data: act,
  };
}

function parseActivityFromSupabase(row: any): Activity {
  if (row.raw_data && typeof row.raw_data === "object") {
    return { ...row.raw_data, id: row.id };
  }
  return {
    id: row.id,
    title: row.title,
    user: row.user,
    action: row.action,
    target: row.target,
    details: row.details,
    time: row.time,
    type: row.type,
    category: row.category,
  };
}

/**
 * Migration function: Upload all documents to Supabase tables
 */
export async function migrateDataToSupabase(data: {
  users: User[];
  assets: Asset[];
  licenses: License[];
  consumables: Consumable[];
  activities: Activity[];
}): Promise<{
  success: boolean;
  message: string;
  transferred: {
    users: number;
    assets: number;
    licenses: number;
    consumables: number;
    activities: number;
  };
}> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase não configurado. Por favor, preencha a URL e a Chave Anon antes de migrar.");
  }

  const transferred = {
    users: 0,
    assets: 0,
    licenses: 0,
    consumables: 0,
    activities: 0,
  };

  // 1. Migrate Users
  if (data.users.length > 0) {
    const formattedUsers = data.users.map(formatUserForSupabase);
    const { error } = await client.from("users").upsert(formattedUsers);
    if (error) throw new Error(`Falha ao migrar usuários para Supabase: ${error.message}`);
    transferred.users = formattedUsers.length;
  }

  // 2. Migrate Assets
  if (data.assets.length > 0) {
    const formattedAssets = data.assets.map(formatAssetForSupabase);
    const { error } = await client.from("assets").upsert(formattedAssets);
    if (error) throw new Error(`Falha ao migrar ativos para Supabase: ${error.message}`);
    transferred.assets = formattedAssets.length;
  }

  // 3. Migrate Licenses
  if (data.licenses.length > 0) {
    const formattedLicenses = data.licenses.map(formatLicenseForSupabase);
    const { error } = await client.from("licenses").upsert(formattedLicenses);
    if (error) throw new Error(`Falha ao migrar licenças para Supabase: ${error.message}`);
    transferred.licenses = formattedLicenses.length;
  }

  // 4. Migrate Consumables
  if (data.consumables.length > 0) {
    const formattedConsumables = data.consumables.map(formatConsumableForSupabase);
    const { error } = await client.from("consumables").upsert(formattedConsumables);
    if (error) throw new Error(`Falha ao migrar consumíveis para Supabase: ${error.message}`);
    transferred.consumables = formattedConsumables.length;
  }

  // 5. Migrate Activities
  if (data.activities.length > 0) {
    const formattedActivities = data.activities.map(formatActivityForSupabase);
    const { error } = await client.from("activities").upsert(formattedActivities);
    if (error) throw new Error(`Falha ao migrar histórico de atividades para Supabase: ${error.message}`);
    transferred.activities = formattedActivities.length;
  }

  return {
    success: true,
    message: "Migração concluída! Todos os dados foram sincronizados com sucesso no Supabase.",
    transferred,
  };
}

/**
 * Load all data from Supabase
 */
export async function loadDatabaseFromSupabase(defaultUsers: User[]): Promise<{
  users: User[];
  assets: Asset[];
  licenses: License[];
  consumables: Consumable[];
  activities: Activity[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      users: defaultUsers,
      assets: [],
      licenses: [],
      consumables: [],
      activities: [],
    };
  }

  try {
    const [uRes, aRes, lRes, cRes, actRes] = await Promise.all([
      client.from("users").select("*"),
      client.from("assets").select("*"),
      client.from("licenses").select("*"),
      client.from("consumables").select("*"),
      client.from("activities").select("*").order("created_at", { ascending: false }),
    ]);

    let users = (uRes.data || []).map(parseUserFromSupabase);
    if (users.length === 0 && defaultUsers.length > 0) {
      const formatted = defaultUsers.map(formatUserForSupabase);
      await client.from("users").upsert(formatted);
      users = defaultUsers;
    }

    const assets = (aRes.data || []).map(parseAssetFromSupabase);
    const licenses = (lRes.data || []).map(parseLicenseFromSupabase);
    const consumables = (cRes.data || []).map(parseConsumableFromSupabase);
    const activities = (actRes.data || []).map(parseActivityFromSupabase);

    return {
      users,
      assets,
      licenses,
      consumables,
      activities,
    };
  } catch (error) {
    console.error("Erro ao carregar dados do Supabase:", error);
    return {
      users: defaultUsers,
      assets: [],
      licenses: [],
      consumables: [],
      activities: [],
    };
  }
}

/**
 * Supabase Document CRUD operations
 */
export async function saveDocumentToSupabase(collectionName: string, item: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    let payload: any = item;
    if (collectionName === "users") payload = formatUserForSupabase(item);
    else if (collectionName === "assets") payload = formatAssetForSupabase(item);
    else if (collectionName === "licenses") payload = formatLicenseForSupabase(item);
    else if (collectionName === "consumables") payload = formatConsumableForSupabase(item);
    else if (collectionName === "activities") payload = formatActivityForSupabase(item);

    const { error } = await client.from(collectionName).upsert(payload);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao salvar no Supabase (${collectionName}):`, error);
    return false;
  }
}

export async function deleteDocumentFromSupabase(collectionName: string, id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from(collectionName).delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao deletar no Supabase (${collectionName}/${id}):`, error);
    return false;
  }
}

export async function clearSupabaseTables(tables: string[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    for (const tbl of tables) {
      await client.from(tbl).delete().neq("id", "___non_existent___");
    }
    return true;
  } catch (error) {
    console.error("Erro ao limpar tabelas do Supabase:", error);
    return false;
  }
}
