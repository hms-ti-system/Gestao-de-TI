import { 
  Asset, 
  License, 
  Consumable, 
  Activity, 
  User, 
  AssetStatus, 
  LicenseStatus, 
  ConsumableStatus, 
  ActivityType 
} from "../types";

export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  owners?: { displayName: string; emailAddress: string; photoLink?: string }[];
  size?: string;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface GoogleSpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: {
    title: string;
    locale?: string;
    timeZone?: string;
  };
  sheets: {
    properties: SheetTabInfo;
  }[];
}

export interface SheetValuesResult {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * List spreadsheets from user's Google Drive
 */
export async function listUserSpreadsheets(
  accessToken: string,
  searchQuery?: string
): Promise<GoogleDriveFile[]> {
  let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", q);
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("fields", "files(id, name, modifiedTime, webViewLink, iconLink, owners, size)");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao listar planilhas do Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Get spreadsheet details and sheets metadata
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<GoogleSpreadsheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao carregar metadados da planilha (${response.status})`);
  }

  return response.json();
}

/**
 * Get values from a specific sheet range
 */
export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<SheetValuesResult> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao ler dados da planilha (${response.status})`);
  }

  return response.json();
}

export interface SheetCreationPayload {
  title: string;
  data?: (string | number | boolean | null)[][];
}

/**
 * Creates a new Google Spreadsheet with provided sheets and data
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string,
  sheets: SheetCreationPayload[]
): Promise<GoogleSpreadsheetMetadata> {
  const url = "https://sheets.googleapis.com/v4/spreadsheets";

  const sheetsConfig = sheets.map((s, idx) => ({
    properties: {
      sheetId: idx,
      title: s.title,
      gridProperties: {
        frozenRowCount: s.data && s.data.length > 0 ? 1 : 0,
      },
    },
    data: s.data && s.data.length > 0 ? [
      {
        startRow: 0,
        startColumn: 0,
        rowData: s.data.map((row, rowIndex) => ({
          values: row.map((cell) => {
            const isHeader = rowIndex === 0;
            return {
              userEnteredValue: 
                typeof cell === "number"
                  ? { numberValue: cell }
                  : typeof cell === "boolean"
                  ? { boolValue: cell }
                  : { stringValue: String(cell ?? "") },
              userEnteredFormat: isHeader ? {
                backgroundColor: { red: 0.12, green: 0.22, blue: 0.44 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true,
                  fontSize: 10,
                },
                horizontalAlignment: "LEFT",
              } : {
                textFormat: { fontSize: 10 },
              }
            };
          }),
        })),
      }
    ] : undefined,
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: sheetsConfig,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao criar planilha no Google Sheets (${response.status})`);
  }

  return response.json();
}

/**
 * Appends rows to an existing spreadsheet
 */
export async function appendRowsToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rows: (string | number | boolean | null)[][]
): Promise<{ updates: { updatedRows: number; updatedColumns: number; updatedCells: number } }> {
  const encodedRange = encodeURIComponent(`${sheetName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: "ROWS",
      values: rows,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao anexar linhas na planilha (${response.status})`);
  }

  return response.json();
}

/**
 * Clears cell values in a specified range
 */
export async function clearSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:clear`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.warn(`[Google Sheets] Warning clearing range ${range}:`, err);
  }
  return response.json().catch(() => ({}));
}

/**
 * Updates cell values in a specified range
 */
export async function updateCellValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null)[][]
): Promise<any> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      range,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao atualizar dados na planilha (${response.status})`);
  }

  return response.json();
}

// ----------------------------------------------------
// STRUCTURED GOOGLE SHEETS DATABASE PROVISIONER & ENGINE
// ----------------------------------------------------

export interface DatabaseCreationOptions {
  includeSampleData?: boolean;
  databaseName?: string;
  customPrefix?: string;
}

export interface ParsedDatabaseData {
  assets: Asset[];
  licenses: License[];
  consumables: Consumable[];
  users: User[];
  activities: Activity[];
  metadata?: {
    version?: string;
    createdAt?: string;
    lastUpdated?: string;
    appSource?: string;
  };
}

/**
 * Creates a fully-fledged, relational-style structured Google Sheets Database
 */
export async function createStructuredDatabaseSpreadsheet(
  accessToken: string,
  currentData: {
    assets: Asset[];
    licenses: License[];
    consumables: Consumable[];
    users: User[];
    activities: Activity[];
  },
  options: DatabaseCreationOptions = {}
): Promise<GoogleSpreadsheetMetadata> {
  const dbName = options.databaseName || `Base de Dados TI - Enterprise DB (${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")})`;

  // 1. Metadata Sheet
  const metaSheetRows = [
    ["CHAVE_CONFIG", "VALOR", "DESCRICAO"],
    ["DB_NAME", dbName, "Nome da base de dados corporativa"],
    ["DB_VERSION", "2.4.0-RELATIONAL", "Versão do schema estruturado"],
    ["DB_SCHEMA_TYPE", "ENTERPRISE_IT_ASSETS", "Modelo de dados da aplicação"],
    ["CREATED_AT", new Date().toISOString(), "Data e hora de criação da base"],
    ["LAST_SYNC_AT", new Date().toISOString(), "Última sincronização bidirecional realizada"],
    ["SYSTEM_SOURCE", "Gestor de Ativos TI - Google AI Studio", "Aplicação de origem"],
    ["TOTAL_TABELAS", "5", "Quantidade de tabelas relacionais integradas"],
    ["STATUS_BASE", "ATIVA / OPERACIONAL", "Status de integridade do banco de dados"],
    ["", "", ""],
    ["TABELA", "CHAVE_PRIMARIA", "FINALIDADE"],
    ["TB_ATIVOS", "id (Tag)", "Equipamentos físicos, notebooks, desktops e servidores"],
    ["TB_LICENCAS", "id (ID Licença)", "Softwares corporativos, assinaturas SaaS e chaves"],
    ["TB_CONSUMIVEIS", "id (ID Item)", "Insumos de TI, suprimentos e controle de estoque"],
    ["TB_COLABORADORES", "id (ID Usuário)", "Cadastro de usuários e departamentos"],
    ["TB_AUDITORIA", "id (ID Atividade)", "Trilha de auditoria e log de operações"]
  ];

  // 2. TB_ATIVOS Sheet
  const assetsHeaders = [
    "id",
    "nome",
    "categoria",
    "fabricante",
    "modelo",
    "numero_serie",
    "status",
    "usuario_atribuido",
    "departamento_local",
    "custo_compra",
    "data_compra",
    "garantia_ate",
    "saude_pct",
    "bateria_status",
    "sistema_operacional",
    "processador_cpu",
    "memoria_ram",
    "armazenamento",
    "endereco_mac",
    "descricao_observacoes",
    "atualizado_em"
  ];

  const userMap = new Map(currentData.users.map(u => [u.id, u.name]));
  const assetsRows = currentData.assets.map(a => {
    const assignedName = a.assignedToUserId ? (userMap.get(a.assignedToUserId) || a.assignedToUserId) : (a.assignedToUser?.name || "");
    return [
      a.id,
      a.name,
      a.category,
      a.manufacturer,
      a.model,
      a.seriesNumber,
      a.status,
      assignedName,
      a.assignedToUser?.department || "",
      a.cost || "",
      a.purchaseDate || a.createdAt || "",
      a.warrantyDate || "",
      a.health ?? 100,
      a.battery || "Boa",
      a.os || "",
      a.cpu || "",
      a.ram || "",
      a.storage || "",
      a.macAddress || "",
      a.description || "",
      new Date().toISOString()
    ];
  });

  // 3. TB_LICENCAS Sheet
  const licensesHeaders = [
    "id",
    "nome_software",
    "fornecedor",
    "chave_serial",
    "assentos_totais",
    "assentos_usados",
    "assentos_disponiveis",
    "data_expiracao",
    "status",
    "icone_tipo",
    "atualizado_em"
  ];

  const licensesRows = currentData.licenses.map(l => [
    l.id,
    l.name,
    l.supplier,
    l.key,
    l.seatsTotal,
    l.seatsUsed,
    Math.max(0, l.seatsTotal - l.seatsUsed),
    l.expirationDate,
    l.status,
    l.iconType || "cloud",
    new Date().toISOString()
  ]);

  // 4. TB_CONSUMIVEIS Sheet
  const consumablesHeaders = [
    "id",
    "nome_item",
    "categoria",
    "quantidade_restante",
    "quantidade_total",
    "nivel_estoque_pct",
    "status",
    "descricao",
    "icone_tipo",
    "atualizado_em"
  ];

  const consumablesRows = currentData.consumables.map(c => {
    const pct = c.quantityTotal > 0 ? Math.round((c.quantityRemaining / c.quantityTotal) * 100) : 0;
    return [
      c.id,
      c.name,
      c.category,
      c.quantityRemaining,
      c.quantityTotal,
      `${pct}%`,
      c.status,
      c.description,
      c.iconName || "package",
      new Date().toISOString()
    ];
  });

  // 5. TB_COLABORADORES Sheet
  const usersHeaders = [
    "id",
    "nome",
    "email",
    "cargo",
    "departamento",
    "status",
    "perfil_acesso",
    "atualizado_em"
  ];

  const usersRows = currentData.users.map(u => [
    u.id,
    u.name,
    u.email,
    u.role || "Colaborador",
    u.department || "TI",
    "Ativo",
    u.role === "Administrador" ? "ADMIN" : "USER",
    new Date().toISOString()
  ]);

  // 6. TB_AUDITORIA Sheet
  const activitiesHeaders = [
    "id",
    "data_hora",
    "usuario_responsavel",
    "acao",
    "alvo_item",
    "categoria",
    "tipo_registro",
    "detalhes"
  ];

  const activitiesRows = currentData.activities.map(act => [
    act.id,
    act.time,
    act.user || "Sistema",
    act.action,
    act.target,
    act.category,
    act.type,
    act.details || ""
  ]);

  // Define tab specifications with specialized enterprise color palettes
  const sheetsPayload: SheetCreationPayload[] = [
    { title: "_CONFIG_BASE", data: metaSheetRows },
    { title: "TB_ATIVOS", data: [assetsHeaders, ...assetsRows] },
    { title: "TB_LICENCAS", data: [licensesHeaders, ...licensesRows] },
    { title: "TB_CONSUMIVEIS", data: [consumablesHeaders, ...consumablesRows] },
    { title: "TB_COLABORADORES", data: [usersHeaders, ...usersRows] },
    { title: "TB_AUDITORIA", data: [activitiesHeaders, ...activitiesRows] }
  ];

  return createGoogleSpreadsheet(accessToken, dbName, sheetsPayload);
}

/**
 * Reads all structured tables from a connected Google Sheets Database
 */
export async function fetchCompleteDatabaseFromSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<ParsedDatabaseData> {
  const meta = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const sheetTitles = meta.sheets.map(s => s.properties.title);

  // Helper to fetch sheet values safely
  const fetchTable = async (titleMatch: string): Promise<string[][]> => {
    const actualTitle = sheetTitles.find(t => t.toLowerCase() === titleMatch.toLowerCase() || t.toLowerCase().includes(titleMatch.toLowerCase()));
    if (!actualTitle) return [];
    try {
      const res = await getSheetValues(accessToken, spreadsheetId, `${actualTitle}!A1:Z500`);
      return res.values || [];
    } catch (e) {
      console.warn(`Could not read table ${titleMatch}:`, e);
      return [];
    }
  };

  // Read tables in parallel
  const [assetsRaw, licensesRaw, consumablesRaw, usersRaw, activitiesRaw, configRaw] = await Promise.all([
    fetchTable("TB_ATIVOS"),
    fetchTable("TB_LICENCAS"),
    fetchTable("TB_CONSUMIVEIS"),
    fetchTable("TB_COLABORADORES"),
    fetchTable("TB_AUDITORIA"),
    fetchTable("_CONFIG_BASE")
  ]);

  // Parse Assets
  const parsedAssets: Asset[] = [];
  if (assetsRaw.length > 1) {
    const headers = assetsRaw[0].map(h => String(h || "").toLowerCase().trim());
    const idIdx = headers.findIndex(h => h === "id" || h.includes("tag") || h.includes("código"));
    const nameIdx = headers.findIndex(h => h === "nome" || h.includes("equipamento"));
    const catIdx = headers.findIndex(h => h === "categoria");
    const manuIdx = headers.findIndex(h => h === "fabricante" || h.includes("marca"));
    const modelIdx = headers.findIndex(h => h === "modelo");
    const snIdx = headers.findIndex(h => h.includes("serie") || h.includes("serial"));
    const statusIdx = headers.findIndex(h => h === "status");
    const userIdx = headers.findIndex(h => h.includes("usuario") || h.includes("atribuido"));
    const deptIdx = headers.findIndex(h => h.includes("departamento") || h.includes("local"));
    const costIdx = headers.findIndex(h => h.includes("custo") || h.includes("valor"));
    const dateIdx = headers.findIndex(h => h.includes("data_compra") || h.includes("compra"));
    const warIdx = headers.findIndex(h => h.includes("garantia"));
    const healthIdx = headers.findIndex(h => h.includes("saude") || h.includes("health"));
    const batIdx = headers.findIndex(h => h.includes("bateria"));
    const osIdx = headers.findIndex(h => h.includes("sistema") || h.includes("os"));
    const cpuIdx = headers.findIndex(h => h.includes("processador") || h.includes("cpu"));
    const ramIdx = headers.findIndex(h => h.includes("ram") || h.includes("memoria"));
    const storageIdx = headers.findIndex(h => h.includes("armazenamento") || h.includes("disco"));
    const macIdx = headers.findIndex(h => h.includes("mac"));
    const descIdx = headers.findIndex(h => h.includes("descricao") || h.includes("observacoes"));

    assetsRaw.slice(1).forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => c && String(c).trim() !== "")) return;
      const rawStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() : "Disponível";
      let status: AssetStatus = "Disponível";
      if (rawStatus.toLowerCase().includes("atrib") || rawStatus.toLowerCase().includes("uso")) status = "Atribuído";
      else if (rawStatus.toLowerCase().includes("manu") || rawStatus.toLowerCase().includes("repar")) status = "Manutenção";

      parsedAssets.push({
        id: idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `AST-${i + 1}`,
        name: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Ativo #${i + 1}`,
        category: catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : "Notebooks",
        manufacturer: manuIdx !== -1 && row[manuIdx] ? String(row[manuIdx]).trim() : "Dell",
        model: modelIdx !== -1 && row[modelIdx] ? String(row[modelIdx]).trim() : "Latitude",
        seriesNumber: snIdx !== -1 && row[snIdx] ? String(row[snIdx]).trim() : `SN-${i + 1000}`,
        status,
        assignedToUser: userIdx !== -1 && row[userIdx] ? {
          id: `U-${i + 1}`,
          name: String(row[userIdx]).trim(),
          email: "",
          role: "Colaborador",
          location: "Matriz",
          department: deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : "TI",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        } : undefined,
        cost: costIdx !== -1 && row[costIdx] ? String(row[costIdx]).trim() : "R$ 4.500,00",
        purchaseDate: dateIdx !== -1 && row[dateIdx] ? String(row[dateIdx]).trim() : "2024-01-15",
        warrantyDate: warIdx !== -1 && row[warIdx] ? String(row[warIdx]).trim() : "2027-01-15",
        health: healthIdx !== -1 && row[healthIdx] ? parseInt(String(row[healthIdx]), 10) || 100 : 100,
        battery: batIdx !== -1 && row[batIdx] ? String(row[batIdx]).trim() : "Boa",
        os: osIdx !== -1 && row[osIdx] ? String(row[osIdx]).trim() : "Windows 11 Pro",
        cpu: cpuIdx !== -1 && row[cpuIdx] ? String(row[cpuIdx]).trim() : "Intel Core i7",
        ram: ramIdx !== -1 && row[ramIdx] ? String(row[ramIdx]).trim() : "16 GB",
        storage: storageIdx !== -1 && row[storageIdx] ? String(row[storageIdx]).trim() : "512 GB SSD NVMe",
        macAddress: macIdx !== -1 && row[macIdx] ? String(row[macIdx]).trim() : "00:1A:2B:3C:4D:5E",
        description: descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : "Sincronizado via Google Sheets DB"
      });
    });
  }

  // Parse Licenses
  const parsedLicenses: License[] = [];
  if (licensesRaw.length > 1) {
    const headers = licensesRaw[0].map(h => String(h || "").toLowerCase().trim());
    const idIdx = headers.findIndex(h => h === "id");
    const nameIdx = headers.findIndex(h => h.includes("nome") || h.includes("software"));
    const suppIdx = headers.findIndex(h => h.includes("fornecedor") || h.includes("supplier"));
    const keyIdx = headers.findIndex(h => h.includes("chave") || h.includes("serial") || h.includes("key"));
    const totalIdx = headers.findIndex(h => h.includes("total") || h.includes("assentos_totais"));
    const usedIdx = headers.findIndex(h => h.includes("usados") || h.includes("assentos_usados"));
    const expIdx = headers.findIndex(h => h.includes("expiracao") || h.includes("data"));
    const statusIdx = headers.findIndex(h => h === "status");

    licensesRaw.slice(1).forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => c && String(c).trim() !== "")) return;
      const rawStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() : "Ativo";
      let status: LicenseStatus = "Ativo";
      if (rawStatus.toLowerCase().includes("expir")) status = "Expirado";
      else if (rawStatus.toLowerCase().includes("12 dias") || rawStatus.toLowerCase().includes("esgot")) status = "Expira em 12 dias";

      parsedLicenses.push({
        id: idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `LIC-${i + 1}`,
        name: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Software #${i + 1}`,
        software: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Software #${i + 1}`,
        supplier: suppIdx !== -1 && row[suppIdx] ? String(row[suppIdx]).trim() : "Microsoft",
        key: keyIdx !== -1 && row[keyIdx] ? String(row[keyIdx]).trim() : "XXXXX-XXXXX-XXXXX-XXXXX",
        seatsTotal: totalIdx !== -1 && row[totalIdx] ? parseInt(String(row[totalIdx]), 10) || 10 : 10,
        seatsUsed: usedIdx !== -1 && row[usedIdx] ? parseInt(String(row[usedIdx]), 10) || 0 : 0,
        expirationDate: expIdx !== -1 && row[expIdx] ? String(row[expIdx]).trim() : "2026-12-31",
        status,
        iconType: "cloud"
      });
    });
  }

  // Parse Consumables
  const parsedConsumables: Consumable[] = [];
  if (consumablesRaw.length > 1) {
    const headers = consumablesRaw[0].map(h => String(h || "").toLowerCase().trim());
    const idIdx = headers.findIndex(h => h === "id");
    const nameIdx = headers.findIndex(h => h.includes("nome") || h.includes("item"));
    const catIdx = headers.findIndex(h => h === "categoria");
    const remIdx = headers.findIndex(h => h.includes("restante") || h.includes("quantidade_restante"));
    const totIdx = headers.findIndex(h => h.includes("total") || h.includes("quantidade_total"));
    const statusIdx = headers.findIndex(h => h === "status");
    const descIdx = headers.findIndex(h => h === "descricao");

    consumablesRaw.slice(1).forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => c && String(c).trim() !== "")) return;
      const rawStatus = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim() : "Disponível";
      let status: ConsumableStatus = "Disponível";
      if (rawStatus.toLowerCase().includes("crit")) status = "Crítico";
      else if (rawStatus.toLowerCase().includes("baix")) status = "Estoque Baixo";
      else if (rawStatus.toLowerCase().includes("med") || rawStatus.toLowerCase().includes("méd")) status = "Estoque Médio";

      parsedConsumables.push({
        id: idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `CON-${i + 1}`,
        name: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Consumível #${i + 1}`,
        category: catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : "Periféricos",
        quantityRemaining: remIdx !== -1 && row[remIdx] ? parseInt(String(row[remIdx]), 10) || 10 : 10,
        quantityTotal: totIdx !== -1 && row[totIdx] ? parseInt(String(row[totIdx]), 10) || 20 : 20,
        status,
        description: descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : "Insumo de TI",
        iconName: "print"
      });
    });
  }

  // Parse Users
  const parsedUsers: User[] = [];
  if (usersRaw.length > 1) {
    const headers = usersRaw[0].map(h => String(h || "").toLowerCase().trim());
    const idIdx = headers.findIndex(h => h === "id");
    const nameIdx = headers.findIndex(h => h === "nome");
    const emailIdx = headers.findIndex(h => h === "email");
    const roleIdx = headers.findIndex(h => h === "cargo");
    const deptIdx = headers.findIndex(h => h === "departamento");

    usersRaw.slice(1).forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => c && String(c).trim() !== "")) return;
      parsedUsers.push({
        id: idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `USR-${i + 1}`,
        name: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Usuário ${i + 1}`,
        email: emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : `usuario${i+1}@empresa.com`,
        role: roleIdx !== -1 && row[roleIdx] ? String(row[roleIdx]).trim() : "Colaborador",
        department: deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : "Operações",
        location: "Matriz",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
      });
    });
  }

  // Parse Activities
  const parsedActivities: Activity[] = [];
  if (activitiesRaw.length > 1) {
    const headers = activitiesRaw[0].map(h => String(h || "").toLowerCase().trim());
    const idIdx = headers.findIndex(h => h === "id");
    const timeIdx = headers.findIndex(h => h.includes("data") || h.includes("time"));
    const userIdx = headers.findIndex(h => h.includes("usuario") || h.includes("user"));
    const actionIdx = headers.findIndex(h => h.includes("acao") || h.includes("action"));
    const targetIdx = headers.findIndex(h => h.includes("alvo") || h.includes("target"));
    const catIdx = headers.findIndex(h => h.includes("categoria"));
    const descIdx = headers.findIndex(h => h.includes("detalhes"));

    activitiesRaw.slice(1).forEach((row, i) => {
      if (!row || row.length === 0 || !row.some(c => c && String(c).trim() !== "")) return;
      parsedActivities.push({
        id: idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : `ACT-${i + 1}`,
        title: actionIdx !== -1 && row[actionIdx] ? String(row[actionIdx]).trim() : "Operação de Dados",
        time: timeIdx !== -1 && row[timeIdx] ? String(row[timeIdx]).trim() : new Date().toISOString(),
        user: userIdx !== -1 && row[userIdx] ? String(row[userIdx]).trim() : "Sistema",
        action: actionIdx !== -1 && row[actionIdx] ? String(row[actionIdx]).trim() : "Operação de Dados",
        target: targetIdx !== -1 && row[targetIdx] ? String(row[targetIdx]).trim() : "Base Google Sheets",
        category: catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : "Sincronização",
        type: "automatico",
        details: descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : ""
      });
    });
  }

  return {
    assets: parsedAssets,
    licenses: parsedLicenses,
    consumables: parsedConsumables,
    users: parsedUsers,
    activities: parsedActivities
  };
}

/**
 * Pushes entire application state to all tables in the connected Google Sheets Database
 */
export async function pushCompleteDatabaseToSheets(
  accessToken: string,
  spreadsheetId: string,
  data: {
    assets: Asset[];
    licenses: License[];
    consumables: Consumable[];
    users: User[];
    activities: Activity[];
  }
): Promise<{ success: boolean; updatedTables: string[] }> {
  const updatedTables: string[] = [];

  // Fetch spreadsheet meta to find matching tabs
  const meta = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const sheetTitles = meta.sheets.map(s => s.properties.title);

  const findMatchingTab = (match: string): string | undefined => {
    return sheetTitles.find(t => t.toLowerCase() === match.toLowerCase() || t.toLowerCase().includes(match.toLowerCase()));
  };

  // Helper to safely clear and update a table
  const clearAndWrite = async (tabName: string, values: (string | number | boolean | null)[][]) => {
    try {
      await clearSheetValues(accessToken, spreadsheetId, `${tabName}!A1:Z2000`);
    } catch (e) {
      console.warn(`[Clear ${tabName}] fallback:`, e);
    }
    await updateCellValues(accessToken, spreadsheetId, `${tabName}!A1`, values);
    updatedTables.push(tabName);
  };

  // 1. Update Config timestamp & record counts
  const configTab = findMatchingTab("_CONFIG_BASE") || findMatchingTab("CONFIG");
  if (configTab) {
    try {
      const nowIso = new Date().toISOString();
      const metaRows = [
        ["CHAVE_CONFIG", "VALOR", "DESCRICAO"],
        ["DB_NAME", meta.properties.title || "Base de Dados TI", "Nome da base de dados corporativa"],
        ["DB_VERSION", "2.4.0-RELATIONAL", "Versão do schema estruturado"],
        ["DB_SCHEMA_TYPE", "ENTERPRISE_IT_ASSETS", "Modelo de dados da aplicação"],
        ["LAST_SYNC_AT", nowIso, "Última sincronização bidirecional realizada"],
        ["TOTAL_ATIVOS", String(data.assets.length), "Total de ativos cadastrados"],
        ["TOTAL_LICENCAS", String(data.licenses.length), "Total de licenças cadastradas"],
        ["TOTAL_CONSUMIVEIS", String(data.consumables.length), "Total de consumíveis cadastrados"],
        ["TOTAL_COLABORADORES", String(data.users.length), "Total de colaboradores cadastrados"],
        ["SYSTEM_SOURCE", "Gestor de Ativos TI - Google AI Studio", "Aplicação de origem"],
        ["STATUS_BASE", "ATIVA / OPERACIONAL", "Status de integridade do banco de dados"],
      ];
      await clearAndWrite(configTab, metaRows);
    } catch (e) {
      console.warn("Config update error:", e);
    }
  }

  // 2. Format and update TB_ATIVOS
  const assetsTab = findMatchingTab("TB_ATIVOS") || findMatchingTab("ATIVOS") || "TB_ATIVOS";
  try {
    const assetsData = formatAssetsForSheet(data.assets, data.users);
    await clearAndWrite(assetsTab, assetsData);
  } catch (e) {
    console.warn("TB_ATIVOS update error:", e);
  }

  // 3. Format and update TB_LICENCAS
  const licensesTab = findMatchingTab("TB_LICENCAS") || findMatchingTab("LICENCAS") || "TB_LICENCAS";
  try {
    const licData = formatLicensesForSheet(data.licenses);
    await clearAndWrite(licensesTab, licData);
  } catch (e) {
    console.warn("TB_LICENCAS update error:", e);
  }

  // 4. Format and update TB_CONSUMIVEIS
  const conTab = findMatchingTab("TB_CONSUMIVEIS") || findMatchingTab("CONSUMIVEIS") || "TB_CONSUMIVEIS";
  try {
    const conData = formatConsumablesForSheet(data.consumables);
    await clearAndWrite(conTab, conData);
  } catch (e) {
    console.warn("TB_CONSUMIVEIS update error:", e);
  }

  // 5. Format and update TB_COLABORADORES / TB_USUARIOS
  const usersTab = findMatchingTab("TB_COLABORADORES") || findMatchingTab("TB_USUARIOS") || findMatchingTab("USUARIOS") || "TB_COLABORADORES";
  try {
    const usersData = formatUsersForSheet(data.users);
    await clearAndWrite(usersTab, usersData);
  } catch (e) {
    console.warn("TB_COLABORADORES update error:", e);
  }

  // 6. Format and update TB_AUDITORIA
  const actTab = findMatchingTab("TB_AUDITORIA") || findMatchingTab("AUDITORIA") || "TB_AUDITORIA";
  try {
    const actData = formatActivitiesForSheet(data.activities);
    await clearAndWrite(actTab, actData);
  } catch (e) {
    console.warn("TB_AUDITORIA update error:", e);
  }

  // 7. Format and update RESUMO_EXECUTIVO if present
  const summaryTab = findMatchingTab("RESUMO_EXECUTIVO") || findMatchingTab("RESUMO");
  if (summaryTab) {
    try {
      const summaryData = formatSummarySheet(data.assets, data.licenses, data.consumables, data.users);
      await clearAndWrite(summaryTab, summaryData);
    } catch (e) {
      console.warn("RESUMO_EXECUTIVO update error:", e);
    }
  }

  return { success: true, updatedTables };
}

export function formatAssetsForSheet(assets: Asset[], users: User[]): (string | number | null)[][] {
  const userMap = new Map(users.map(u => [u.id, u.name]));

  const headers = [
    "id",
    "nome",
    "categoria",
    "fabricante",
    "modelo",
    "numero_serie",
    "status",
    "usuario_atribuido",
    "departamento_local",
    "custo_compra",
    "data_compra",
    "garantia_ate",
    "saude_pct",
    "bateria_status",
    "sistema_operacional",
    "processador_cpu",
    "memoria_ram",
    "armazenamento",
    "endereco_mac",
    "descricao_observacoes",
    "atualizado_em"
  ];

  const rows = assets.map((a) => {
    const assignedName = a.assignedToUserId ? (userMap.get(a.assignedToUserId) || a.assignedToUserId) : (a.assignedToUser?.name || "");
    const assignedDept = a.assignedToUser?.department || "";
    return [
      a.id,
      a.name,
      a.category,
      a.manufacturer,
      a.model,
      a.seriesNumber,
      a.status,
      assignedName,
      assignedDept,
      a.cost || "",
      a.purchaseDate || a.createdAt || "",
      a.warrantyDate || "",
      a.health ?? 100,
      a.battery || "Boa",
      a.os || "",
      a.cpu || "",
      a.ram || "",
      a.storage || "",
      a.macAddress || "",
      a.description || "",
      new Date().toISOString()
    ];
  });

  return [headers, ...rows];
}

export function formatLicensesForSheet(licenses: License[]): (string | number | null)[][] {
  const headers = [
    "id",
    "nome_software",
    "fornecedor",
    "chave_serial",
    "assentos_totais",
    "assentos_usados",
    "assentos_disponiveis",
    "data_expiracao",
    "status",
    "icone_tipo",
    "atualizado_em"
  ];

  const rows = licenses.map((l) => [
    l.id,
    l.name,
    l.supplier,
    l.key,
    l.seatsTotal,
    l.seatsUsed,
    Math.max(0, l.seatsTotal - l.seatsUsed),
    l.expirationDate,
    l.status,
    l.iconType || "cloud",
    new Date().toISOString()
  ]);

  return [headers, ...rows];
}

export function formatConsumablesForSheet(consumables: Consumable[]): (string | number | null)[][] {
  const headers = [
    "id",
    "nome_item",
    "categoria",
    "quantidade_restante",
    "quantidade_total",
    "nivel_estoque_pct",
    "status",
    "descricao",
    "icone_tipo",
    "atualizado_em"
  ];

  const rows = consumables.map((c) => {
    const pct = c.quantityTotal > 0 ? Math.round((c.quantityRemaining / c.quantityTotal) * 100) : 0;
    return [
      c.id,
      c.name,
      c.category,
      c.quantityRemaining,
      c.quantityTotal,
      `${pct}%`,
      c.status,
      c.description,
      c.iconName || "package",
      new Date().toISOString()
    ];
  });

  return [headers, ...rows];
}

export function formatUsersForSheet(users: User[]): (string | number | null)[][] {
  const headers = [
    "id",
    "nome",
    "email",
    "cargo",
    "departamento",
    "status",
    "perfil_acesso",
    "atualizado_em"
  ];

  const rows = users.map(u => [
    u.id,
    u.name,
    u.email,
    u.role || "Colaborador",
    u.department || "TI",
    "Ativo",
    u.isAdmin || u.role === "Administrador" ? "ADMIN" : "USER",
    new Date().toISOString()
  ]);

  return [headers, ...rows];
}

export function formatActivitiesForSheet(activities: Activity[]): (string | number | null)[][] {
  const headers = [
    "id",
    "data_hora",
    "usuario_responsavel",
    "acao",
    "alvo_item",
    "categoria",
    "tipo_registro",
    "detalhes"
  ];

  const rows = activities.map((act) => [
    act.id,
    act.time,
    act.user || "Sistema",
    act.action,
    act.target,
    act.category,
    act.type,
    act.details || ""
  ]);

  return [headers, ...rows];
}

export interface HandshakeResult {
  success: boolean;
  latencyMs: number;
  statusCode?: number;
  message: string;
  endpointTested: string;
  spreadsheetTitle?: string;
  sheetsCount?: number;
  errorDetails?: string;
  timestamp: string;
}

/**
 * Performs an active API handshake test against Google Sheets API v4
 */
export async function testGoogleSheetsApiHandshake(
  accessToken: string,
  spreadsheetId?: string
): Promise<HandshakeResult> {
  const startTime = Date.now();
  const targetId = spreadsheetId || localStorage.getItem("ac_sheets_db_id");
  const timestamp = new Date().toISOString();

  if (!accessToken) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      statusCode: 401,
      endpointTested: "https://sheets.googleapis.com/v4/spreadsheets",
      message: "Falha de Autenticação: Token de acesso OAuth 2.0 não encontrado.",
      errorDetails: "O usuário não possui token ativo no momento. Realize login com a conta Google.",
      timestamp
    };
  }

  try {
    if (targetId) {
      const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${targetId}?includeGridData=false`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        let errJson: any = {};
        try {
          errJson = await response.json();
        } catch {
          // ignore
        }

        const errMsg = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        let guidance = "Verifique as permissões da planilha no Google Drive.";
        if (response.status === 401) guidance = "Token de acesso expirado ou inválido. Reconecte a conta Google.";
        if (response.status === 403) guidance = "Permissão insuficiente (escopo 'spreadsheets' ou acesso de leitura negado pelo proprietário).";
        if (response.status === 404) guidance = `Planilha ID '${targetId}' não foi encontrada ou foi movida para a lixeira.`;

        return {
          success: false,
          latencyMs,
          statusCode: response.status,
          endpointTested: endpoint,
          message: `Falha no Handshake (${response.status}): ${errMsg}`,
          errorDetails: guidance,
          timestamp
        };
      }

      const meta = await response.json();
      return {
        success: true,
        latencyMs,
        statusCode: 200,
        endpointTested: endpoint,
        spreadsheetTitle: meta.properties?.title || "Planilha Google",
        sheetsCount: meta.sheets?.length || 0,
        message: `Handshake bem-sucedido (${latencyMs}ms) - Planilha "${meta.properties?.title || targetId}" acessível com ${meta.sheets?.length || 0} abas.`,
        timestamp
      };
    } else {
      // Test drive listing endpoint as general handshake
      const endpoint = "https://www.googleapis.com/drive/v3/files?pageSize=1&q=mimeType%3D'application/vnd.google-apps.spreadsheet'";
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          success: false,
          latencyMs,
          statusCode: response.status,
          endpointTested: endpoint,
          message: `Erro na API Google Drive/Sheets: ${errJson?.error?.message || response.statusText}`,
          errorDetails: response.status === 401 ? "Token expirado. Refaça o login." : "Verifique os escopos OAuth.",
          timestamp
        };
      }

      return {
        success: true,
        latencyMs,
        statusCode: 200,
        endpointTested: endpoint,
        message: `Handshake API Google v4 bem-sucedido (${latencyMs}ms). Nenhuma planilha ativa selecionada.`,
        timestamp
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      latencyMs,
      statusCode: 0,
      endpointTested: "https://sheets.googleapis.com/v4/",
      message: `Erro de Conectividade / Rede: ${err?.message || "Falha na requisição fetch"}`,
      errorDetails: "Não foi possível contactar os servidores da API do Google. Verifique sua conexão com a internet.",
      timestamp
    };
  }
}

export function formatSummarySheet(
  assets: Asset[],
  licenses: License[],
  consumables: Consumable[],
  users: User[]
): (string | number | null)[][] {
  const totalAssets = assets.length;
  const availableAssets = assets.filter(a => a.status === "Disponível").length;
  const assignedAssets = assets.filter(a => a.status === "Atribuído").length;
  const maintenanceAssets = assets.filter(a => a.status === "Manutenção").length;

  const totalLicenses = licenses.length;
  const totalSeats = licenses.reduce((sum, l) => sum + (l.seatsTotal || 0), 0);
  const usedSeats = licenses.reduce((sum, l) => sum + (l.seatsUsed || 0), 0);

  const totalConsumables = consumables.length;
  const lowStockConsumables = consumables.filter(c => c.status === "Crítico" || c.status === "Estoque Baixo").length;

  return [
    ["RESUMO EXECUTIVO DO PARQUE DE TI", ""],
    ["Data de Emissão", new Date().toLocaleString("pt-BR")],
    ["Gerado por", "Gestor de Ativos (Google Sheets Integration)"],
    ["", ""],
    ["MÉTRICA GERAL DE ATIVOS", "VALOR"],
    ["Total de Equipamentos Cadastrados", totalAssets],
    ["Equipamentos em Uso (Atribuídos)", assignedAssets],
    ["Equipamentos Disponíveis em Estoque", availableAssets],
    ["Equipamentos em Manutenção", maintenanceAssets],
    ["", ""],
    ["MÉTRICA DE LICENÇAS E SOFTWARES", "VALOR"],
    ["Softwares Cadastrados", totalLicenses],
    ["Total de Assentos Contratados", totalSeats],
    ["Assentos Atribuídos", usedSeats],
    ["Assentos Livres", Math.max(0, totalSeats - usedSeats)],
    ["", ""],
    ["MÉTRICA DE CONSUMÍVEIS & SUPRIMENTOS", "VALOR"],
    ["Itens Monitorados", totalConsumables],
    ["Itens em Nível Crítico / Baixo", lowStockConsumables],
    ["", ""],
    ["COLABORADORES CADASTRADOS", users.length]
  ];
}

/**
 * Permanently delete or trash a spreadsheet file from Google Drive
 */
export async function deleteGoogleDriveSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok || response.status === 204) {
      return {
        success: true,
        message: "Planilha excluída do Google Drive com sucesso."
      };
    }

    // Try moving to trash if direct deletion is disallowed by token scopes
    const trashResponse = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trashed: true }),
    });

    if (trashResponse.ok) {
      return {
        success: true,
        message: "Planilha movida para a lixeira do Google Drive."
      };
    }

    const err = await response.json().catch(() => ({}));
    return {
      success: false,
      message: err.error?.message || `Não foi possível excluir no Google Drive (HTTP ${response.status}).`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Falha de comunicação com o Google Drive."
    };
  }
}

/**
 * Remove all Google Sheets database references and sync logs from local storage
 */
export function clearStoredSheetsDatabase(): void {
  localStorage.removeItem("ac_sheets_db_id");
  localStorage.removeItem("ac_sheets_db_name");
  localStorage.removeItem("ac_sheets_db_url");
  localStorage.removeItem("ac_sheets_db_last_sync");
  localStorage.removeItem("ac_sheets_sync_logs");
  window.dispatchEvent(new Event("ac-sheets-updated"));
  window.dispatchEvent(new Event("storage"));
}
