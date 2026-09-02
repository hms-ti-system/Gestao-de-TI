export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  department: string;
  location: string;
  avatar: string;
  isAdmin?: boolean;
}

export type AssetStatus = "Disponível" | "Atribuído" | "Manutenção";

export interface Asset {
  id: string; // Tag, e.g., "ASSET-2938" or "TAG-2023-0842"
  name: string;
  seriesNumber: string;
  manufacturer: string;
  model: string;
  category: string;
  status: AssetStatus;
  assignedToUserId?: string | null;
  assignedToUser?: User | null;
  image?: string; // photo base64 or URL
  description?: string; // description of the asset
  cpu?: string;
  ram?: string;
  storage?: string;
  os?: string;
  macAddress?: string;
  createdAt?: string; // Data de registro do ativo
  registrationDate?: string;
  purchaseDate?: string;
  supplier?: string;
  cost?: string;
  warrantyDate?: string;
  health: number; // 0-100
  battery?: string; // "Boa" | "Excelente" | "Substituir"
  cmId?: string;
  batteryLastReplaced?: string;
  batteryNextReplacement?: string;
  linkedAssets?: string[];
  history?: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "success" | "info" | "warning" | "error";
  user?: string;
}

export type LicenseStatus = "Ativo" | "Expira em 12 dias" | "Esgotado" | "Expirado";

export interface License {
  id: string;
  name: string;
  software: string;
  supplier: string;
  key: string;
  seatsTotal: number;
  seatsUsed: number;
  expirationDate: string;
  status: LicenseStatus;
  iconType: "brush" | "cloud" | "terminal" | "diamond";
}

export type ConsumableStatus = "Disponível" | "Estoque Baixo" | "Estoque Médio" | "Crítico";

export interface Consumable {
  id: string;
  name: string;
  category: string;
  description: string;
  quantityRemaining: number;
  quantityTotal: number;
  status: ConsumableStatus;
  iconName: "print" | "settings_input_hdmi" | "keyboard" | "mouse" | "power";
}

export type ActivityType = "sistema" | "suporte" | "automatico" | "administrativo";

export interface Activity {
  id: string;
  title: string;
  user?: string;
  action: string;
  target: string;
  details?: string;
  time: string;
  type: ActivityType;
  category: string;
}
