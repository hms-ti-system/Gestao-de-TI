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

// Helper to initialize database with mock data if empty
export async function initializeDbIfEmpty(
  initialUsers: any[],
  initialAssets: any[],
  initialLicenses: any[],
  initialConsumables: any[],
  initialActivities: any[]
): Promise<{
  users: any[];
  assets: any[];
  licenses: any[];
  consumables: any[];
  activities: any[];
}> {
  try {
    // Check users collection first
    const usersList = await getCollectionData<any>("users");
    if (usersList.length > 0) {
      // Database already has data, fetch everything
      const assetsList = await getCollectionData<any>("assets");
      const licensesList = await getCollectionData<any>("licenses");
      const consumablesList = await getCollectionData<any>("consumables");
      const activitiesList = await getCollectionData<any>("activities");
      return {
        users: usersList,
        assets: assetsList,
        licenses: licensesList,
        consumables: consumablesList,
        activities: activitiesList
      };
    }

    // Database is empty, seed it with mock data
    console.log("Firestore is empty. Seeding database with initial mock data...");
    
    // Seed Users
    const usersBatch = writeBatch(db);
    initialUsers.forEach((u) => {
      const { id, ...rest } = u;
      usersBatch.set(doc(db, "users", id), rest);
    });
    await usersBatch.commit();

    // Seed Assets
    const assetsBatch = writeBatch(db);
    initialAssets.forEach((a) => {
      const { id, ...rest } = a;
      assetsBatch.set(doc(db, "assets", id), rest);
    });
    await assetsBatch.commit();

    // Seed Licenses
    const licensesBatch = writeBatch(db);
    initialLicenses.forEach((l) => {
      const { id, ...rest } = l;
      licensesBatch.set(doc(db, "licenses", id), rest);
    });
    await licensesBatch.commit();

    // Seed Consumables
    const consumablesBatch = writeBatch(db);
    initialConsumables.forEach((c) => {
      const { id, ...rest } = c;
      consumablesBatch.set(doc(db, "consumables", id), rest);
    });
    await consumablesBatch.commit();

    // Seed Activities
    const activitiesBatch = writeBatch(db);
    initialActivities.forEach((act) => {
      const { id, ...rest } = act;
      activitiesBatch.set(doc(db, "activities", id), rest);
    });
    await activitiesBatch.commit();

    console.log("Database seeded successfully!");
    return {
      users: initialUsers,
      assets: initialAssets,
      licenses: initialLicenses,
      consumables: initialConsumables,
      activities: initialActivities
    };
  } catch (error) {
    console.error("Error initializing database:", error);
    return {
      users: initialUsers,
      assets: initialAssets,
      licenses: initialLicenses,
      consumables: initialConsumables,
      activities: initialActivities
    };
  }
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
  await setDoc(doc(db, "users", id), rest);
  console.log("Master Admin user recreated in Firestore successfully!");
}
