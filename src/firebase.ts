import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import config from "../firebase-applet-config.json";

const app = initializeApp(config);

// Use custom database ID if provided in config
export const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId) 
  : getFirestore(app);

// Helper to fetch all documents from a collection
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

// Helper to save a single document (add or overwrite)
export async function saveDocument<T extends { id: string }>(collectionName: string, data: T): Promise<void> {
  try {
    const { id, ...rest } = data;
    await setDoc(doc(db, collectionName, id), rest);
  } catch (error) {
    console.error(`Error saving document in ${collectionName}:`, error);
  }
}

// Helper to update a document partially
export async function updateDocument(collectionName: string, id: string, data: Record<string, any>): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
  }
}

// Helper to delete a document
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting document in ${collectionName}:`, error);
  }
}

// Helper to load all application collections from Firestore without erasing or resetting saved data
export async function loadDatabaseFromFirestore(
  defaultUsers: any[]
): Promise<{
  users: any[];
  assets: any[];
  licenses: any[];
  consumables: any[];
  activities: any[];
}> {
  try {
    // 1. Fetch Users
    let usersList = await getCollectionData<any>("users");
    if (usersList.length === 0) {
      console.log("Users collection is empty in Firestore. Seeding default users...");
      const usersBatch = writeBatch(db);
      defaultUsers.forEach((u) => {
        const { id, ...rest } = u;
        usersBatch.set(doc(db, "users", id), rest);
      });
      await usersBatch.commit();
      usersList = defaultUsers;
    }

    // 2. Fetch Assets, Licenses, Consumables, Activities directly from Firestore
    const assetsList = await getCollectionData<any>("assets");
    const licensesList = await getCollectionData<any>("licenses");
    const consumablesList = await getCollectionData<any>("consumables");
    const activitiesList = await getCollectionData<any>("activities");

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
      users: defaultUsers,
      assets: [],
      licenses: [],
      consumables: [],
      activities: []
    };
  }
}

// Deprecated alias for backwards compatibility
export const initializeDbIfEmpty = async (
  initialUsers: any[],
  _initialAssets: any[],
  _initialLicenses: any[],
  _initialConsumables: any[],
  _initialActivities: any[]
) => {
  return loadDatabaseFromFirestore(initialUsers);
};

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
  await setDoc(doc(db, "users", id), rest);
  console.log("Master Admin user recreated in Firestore successfully!");
}
