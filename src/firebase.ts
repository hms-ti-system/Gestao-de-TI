import { initializeApp } from "firebase/app";
import { 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  onSnapshot, 
  Unsubscribe 
} from "firebase/firestore";
import config from "../firebase-applet-config.json";
import { 
  defaultUsers, 
  defaultAssets, 
  defaultLicenses, 
  defaultConsumables, 
  defaultActivities 
} from "./data/defaultData";

export const firebaseConfig = config;

const app = initializeApp(config);

// Initialize Firestore with autoDetectLongPolling and ignoreUndefinedProperties for robust connection across networks/sandboxes
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  },
  (config as any).firestoreDatabaseId || undefined
);

// Sanitizer to remove undefined values and ensure clean objects for Firestore
export function sanitizeForFirestore<T>(data: T): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data as Record<string, any>)) {
    const val = (data as Record<string, any>)[key];
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

// Test live Firestore connectivity with real read & write verification
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
  databaseId: string;
  projectId: string;
  counts?: {
    users: number;
    assets: number;
    licenses: number;
    consumables: number;
    activities: number;
  };
}> {
  const start = performance.now();
  const dbId = (config as any).firestoreDatabaseId || "(default)";
  const projId = config.projectId || "gen-lang-client";
  
  try {
    // 1. Write a test verification ping document
    const testDocRef = doc(db, "_system_status", "connection_check");
    const testPayload = {
      lastChecked: new Date().toISOString(),
      timestamp: Date.now(),
      status: "connected",
      environment: "production"
    };
    await setDoc(testDocRef, testPayload);

    // 2. Read it back
    const snap = await getDoc(testDocRef);
    if (!snap.exists()) {
      throw new Error("O documento de verificação foi gravado mas não pôde ser lido de volta.");
    }

    // 3. Count documents in main collections
    const [uSnap, aSnap, lSnap, cSnap, actSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "assets")),
      getDocs(collection(db, "licenses")),
      getDocs(collection(db, "consumables")),
      getDocs(collection(db, "activities"))
    ]);

    const latencyMs = Math.round(performance.now() - start);

    return {
      success: true,
      message: "Conexão com o Firebase Firestore ativa e verificada com sucesso em nuvem.",
      latencyMs,
      databaseId: dbId,
      projectId: projId,
      counts: {
        users: uSnap.size,
        assets: aSnap.size,
        licenses: lSnap.size,
        consumables: cSnap.size,
        activities: actSnap.size
      }
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    console.error("Firestore connection test failed:", error);
    return {
      success: false,
      message: error?.message || "Não foi possível comunicar com o Firebase Firestore.",
      latencyMs,
      databaseId: dbId,
      projectId: projId
    };
  }
}

// Helper to fetch all documents from a collection with proper error handling
export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data: T[] = [];
    querySnapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
    });
    return data;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

// Real-time subscription to a collection
export function subscribeToCollection<T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ ...docSnap.data(), id: docSnap.id } as unknown as T);
      });
      callback(data);
    },
    (error) => {
      console.warn(`Realtime snapshot error on ${collectionName}:`, error);
      if (onError) onError(error);
    }
  );
}

// Helper to save a single document (add or overwrite) to Firestore
export async function saveDocument<T extends { id: string }>(collectionName: string, data: T): Promise<boolean> {
  try {
    const cleanData = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, data.id), cleanData, { merge: true });
    console.log(`[Firestore Cloud] Documento salvo com sucesso em "${collectionName}/${data.id}"`);
    return true;
  } catch (error) {
    console.error(`[Firestore Cloud Error] Falha ao salvar documento em ${collectionName}/${data.id}:`, error);
    throw error;
  }
}

// Helper to update a document partially
export async function updateDocument(collectionName: string, id: string, data: Record<string, any>): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    const cleanData = sanitizeForFirestore(data);
    await updateDoc(docRef, cleanData);
    console.log(`[Firestore Cloud] Documento atualizado em "${collectionName}/${id}"`);
    return true;
  } catch (error) {
    console.error(`[Firestore Cloud Error] Falha ao atualizar documento em ${collectionName}/${id}:`, error);
    throw error;
  }
}

// Helper to delete a document
export async function deleteDocument(collectionName: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    console.log(`[Firestore Cloud] Documento excluído de "${collectionName}/${id}"`);
    return true;
  } catch (error) {
    console.error(`[Firestore Cloud Error] Falha ao excluir documento de ${collectionName}/${id}:`, error);
    throw error;
  }
}

// Helper to load all application collections from Firestore without erasing or resetting saved data
export async function loadDatabaseFromFirestore(
  defaultUsersList?: any[],
  fallbackAssets?: any[],
  fallbackLicenses?: any[],
  fallbackConsumables?: any[],
  fallbackActivities?: any[]
): Promise<{
  users: any[];
  assets: any[];
  licenses: any[];
  consumables: any[];
  activities: any[];
}> {
  try {
    const targetDefaultUsers = defaultUsersList && defaultUsersList.length > 0 ? defaultUsersList : defaultUsers;

    // 1. Fetch Users
    let usersList = await getCollectionData<any>("users");
    if (usersList.length === 0) {
      console.log("Users collection is empty in Firestore. Seeding default users...");
      const usersBatch = writeBatch(db);
      targetDefaultUsers.forEach((u) => {
        usersBatch.set(doc(db, "users", u.id), sanitizeForFirestore(u));
      });
      await usersBatch.commit();
      usersList = targetDefaultUsers;
    }

    // 2. Fetch Assets
    let assetsList = await getCollectionData<any>("assets");
    if (assetsList.length === 0) {
      const toSeed = (fallbackAssets && fallbackAssets.length > 0) ? fallbackAssets : defaultAssets;
      console.log(`Assets collection is empty in Firestore. Seeding ${toSeed.length} assets...`);
      const assetsBatch = writeBatch(db);
      toSeed.forEach((a) => {
        assetsBatch.set(doc(db, "assets", a.id), sanitizeForFirestore(a));
      });
      await assetsBatch.commit();
      assetsList = toSeed;
    }

    // 3. Fetch Licenses
    let licensesList = await getCollectionData<any>("licenses");
    if (licensesList.length === 0) {
      const toSeed = (fallbackLicenses && fallbackLicenses.length > 0) ? fallbackLicenses : defaultLicenses;
      console.log(`Licenses collection is empty in Firestore. Seeding ${toSeed.length} licenses...`);
      const licBatch = writeBatch(db);
      toSeed.forEach((l) => {
        licBatch.set(doc(db, "licenses", l.id), sanitizeForFirestore(l));
      });
      await licBatch.commit();
      licensesList = toSeed;
    }

    // 4. Fetch Consumables
    let consumablesList = await getCollectionData<any>("consumables");
    if (consumablesList.length === 0) {
      const toSeed = (fallbackConsumables && fallbackConsumables.length > 0) ? fallbackConsumables : defaultConsumables;
      console.log(`Consumables collection is empty in Firestore. Seeding ${toSeed.length} consumables...`);
      const conBatch = writeBatch(db);
      toSeed.forEach((c) => {
        conBatch.set(doc(db, "consumables", c.id), sanitizeForFirestore(c));
      });
      await conBatch.commit();
      consumablesList = toSeed;
    }

    // 5. Fetch Activities
    let activitiesList = await getCollectionData<any>("activities");
    if (activitiesList.length === 0) {
      const toSeed = (fallbackActivities && fallbackActivities.length > 0) ? fallbackActivities : defaultActivities;
      console.log(`Activities collection is empty in Firestore. Seeding ${toSeed.length} activities...`);
      const actBatch = writeBatch(db);
      toSeed.forEach((act) => {
        actBatch.set(doc(db, "activities", act.id), sanitizeForFirestore(act));
      });
      await actBatch.commit();
      activitiesList = toSeed;
    }

    console.log(`Firestore data loaded successfully: ${usersList.length} users, ${assetsList.length} assets, ${licensesList.length} licenses, ${consumablesList.length} consumables, ${activitiesList.length} activities.`);

    return {
      users: usersList,
      assets: assetsList,
      licenses: licensesList,
      consumables: consumablesList,
      activities: activitiesList
    };
  } catch (error) {
    console.error("Error loading database from Firestore:", error);
    return {
      users: defaultUsersList || defaultUsers,
      assets: fallbackAssets || defaultAssets,
      licenses: fallbackLicenses || defaultLicenses,
      consumables: fallbackConsumables || defaultConsumables,
      activities: fallbackActivities || defaultActivities
    };
  }
}

// Save system configuration (Supabase URL, Anon Key, Active provider) to Firestore
export interface SystemDbConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  activeProvider?: "firebase" | "supabase";
  updatedAt?: string;
}

export async function saveSystemDbConfigToFirestore(cfg: SystemDbConfig): Promise<boolean> {
  try {
    const docRef = doc(db, "system_config", "database_settings");
    const clean = sanitizeForFirestore({
      ...cfg,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, clean, { merge: true });
    console.log("[Firestore] Configurações de banco de dados salvas em nuvem no Firestore.");
    return true;
  } catch (err) {
    console.error("Error saving database settings to Firestore:", err);
    return false;
  }
}

export async function loadSystemDbConfigFromFirestore(): Promise<SystemDbConfig | null> {
  try {
    const docRef = doc(db, "system_config", "database_settings");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemDbConfig;
    }
    return null;
  } catch (err) {
    console.error("Error loading database settings from Firestore:", err);
    return null;
  }
}

export function subscribeToSystemDbConfig(callback: (cfg: SystemDbConfig | null) => void): Unsubscribe {
  const docRef = doc(db, "system_config", "database_settings");
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as SystemDbConfig);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn("Error listening to system database settings:", err);
    }
  );
}

// Function to delete specific collections from Firestore
export async function clearSpecificCollections(colNames: string[]): Promise<void> {
  for (const colName of colNames) {
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`Successfully cleared collection: ${colName}`);
    } catch (error) {
      console.error(`Error clearing collection ${colName}:`, error);
    }
  }
}

// Function to delete all records from Firestore and add a master Admin user
export async function clearAllCollectionsAndCreateAdmin(adminUser: any): Promise<void> {
  const collections = ["users", "assets", "licenses", "consumables", "activities"];
  for (const colName of collections) {
    try {
      const querySnapshot = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`Successfully cleared collection: ${colName}`);
    } catch (error) {
      console.error(`Error clearing collection ${colName}:`, error);
    }
  }
  
  // Save the admin user
  const { id, ...rest } = adminUser;
  await setDoc(doc(db, "users", id), sanitizeForFirestore(rest));
  console.log("Master Admin user recreated in Firestore successfully!");
}

// Function to migrate all in-memory or cached data to Firebase Firestore
export async function migrateDataToFirebase(data: {
  users?: any[];
  assets?: any[];
  licenses?: any[];
  consumables?: any[];
  activities?: any[];
}): Promise<{ success: boolean; message: string; counts?: any }> {
  try {
    let uCount = 0;
    let aCount = 0;
    let lCount = 0;
    let cCount = 0;
    let actCount = 0;

    if (data.users && data.users.length > 0) {
      const batch = writeBatch(db);
      data.users.forEach((u) => {
        batch.set(doc(db, "users", u.id), sanitizeForFirestore(u));
        uCount++;
      });
      await batch.commit();
    }
    if (data.assets && data.assets.length > 0) {
      const batch = writeBatch(db);
      data.assets.forEach((a) => {
        batch.set(doc(db, "assets", a.id), sanitizeForFirestore(a));
        aCount++;
      });
      await batch.commit();
    }
    if (data.licenses && data.licenses.length > 0) {
      const batch = writeBatch(db);
      data.licenses.forEach((l) => {
        batch.set(doc(db, "licenses", l.id), sanitizeForFirestore(l));
        lCount++;
      });
      await batch.commit();
    }
    if (data.consumables && data.consumables.length > 0) {
      const batch = writeBatch(db);
      data.consumables.forEach((c) => {
        batch.set(doc(db, "consumables", c.id), sanitizeForFirestore(c));
        cCount++;
      });
      await batch.commit();
    }
    if (data.activities && data.activities.length > 0) {
      const batch = writeBatch(db);
      data.activities.forEach((act) => {
        batch.set(doc(db, "activities", act.id), sanitizeForFirestore(act));
        actCount++;
      });
      await batch.commit();
    }

    return {
      success: true,
      message: `Migração para o Firebase concluída com sucesso (${uCount} usuários, ${aCount} ativos, ${lCount} licenças, ${cCount} consumíveis, ${actCount} atividades).`,
      counts: { users: uCount, assets: aCount, licenses: lCount, consumables: cCount, activities: actCount }
    };
  } catch (error: any) {
    console.error("Migration to Firebase failed:", error);
    return {
      success: false,
      message: error?.message || "Erro durante a migração para o Firebase Firestore."
    };
  }
}
