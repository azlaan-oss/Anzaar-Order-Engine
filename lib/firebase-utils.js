import { db, storage } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Products ---
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const getProducts = async () => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

// --- Images ---
export const uploadProductImage = async (file, path) => {
  // Bypassing Firebase Storage (which requires billing upgrade)
  // We compress images to <50KB using our compression util, so they fit safely inside Firestore 1MB limits as Base64 strings.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// --- Orders ---
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const updateOrder = async (orderId, updateData, moderator = "System") => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const currentOrder = await getDoc(orderRef);
    const existingHistory = currentOrder.exists() ? (currentOrder.data().history || []) : [];
    
    // Create history entry if status is changing
    const newHistory = [...existingHistory];
    if (updateData.status && (!currentOrder.exists() || currentOrder.data().status !== updateData.status)) {
      newHistory.push({
        status: updateData.status,
        timestamp: new Date().toISOString(),
        note: `Status changed to ${updateData.status}`,
        user: moderator
      });
    }

    await updateDoc(orderRef, {
      ...updateData,
      history: newHistory,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const updateProduct = async (productId, updateData) => {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  return moveToTrash("products", productId);
};

// --- Trash System ---
export const moveToTrash = async (collectionName, docId) => {
  try {
    console.log(`[TRASH-DEBUG] Move initiated for: "${docId}" in collection: "${collectionName}"`);
    if (!docId) throw new Error("No document ID provided for deletion");

    const safeId = String(docId).trim();
    let docRef = doc(db, collectionName, safeId);
    let docSnap = await getDoc(docRef);
    
    // Fallback logic if direct doc(id) fails
    if (!docSnap.exists()) {
      console.warn(`[TRASH-DEBUG] Document not found by Firestore ID: ${safeId}. Attempting field-based search...`);
      
      // Strategy 1: Search for documents where the 'id' field matches our docId
      const q1 = query(collection(db, collectionName), where("id", "==", docId));
      const snap1 = await getDocs(q1);
      
      if (!snap1.empty) {
        docRef = snap1.docs[0].ref;
        docSnap = snap1.docs[0];
        console.log(`[TRASH-DEBUG] Match found via 'id' field: ${docRef.id}`);
      } else {
        // Strategy 2: If we have an object/data passed by mistake, try to extract ID
        const possibleId = typeof docId === 'object' ? (docId.id || docId._id) : null;
        if (possibleId) {
          console.log(`[TRASH-DEBUG] Extracted ID ${possibleId} from object. Retrying...`);
          const docRefRetry = doc(db, collectionName, String(possibleId));
          const docSnapRetry = await getDoc(docRefRetry);
          if (docSnapRetry.exists()) {
            docRef = docRefRetry;
            docSnap = docSnapRetry;
          }
        }
        
        // Strategy 3: Search by name as a last resort (might match multiple, we take the first)
        if (!docSnap.exists()) {
          console.warn(`[TRASH-DEBUG] Still not found. Attempting name-based search...`);
          const q2 = query(collection(db, collectionName), where("name", "==", docId));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            docRef = snap2.docs[0].ref;
            docSnap = snap2.docs[0];
            console.log(`[TRASH-DEBUG] Match found via 'name' field: ${docRef.id}`);
          }
        }
      }
    }

    if (!docSnap.exists()) {
      console.error(`[TRASH-DEBUG] Failure: Document "${docId}" could not be located using any strategy.`);
      throw new Error(`Item vault entry not found (Search Strategy Exhausted)`);
    }
    
    const data = docSnap.data();
    const actualDocId = docSnap.id;
    
    try {
      // Add to trash
      await addDoc(collection(db, "trash"), {
        originalId: actualDocId,
        originalCollection: collectionName,
        data: data,
        deletedAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      console.log(`[TRASH] Successfully archived legacy of ${actualDocId}`);
    } catch (trashErr) {
      console.warn("[TRASH] Archival failed, proceeding with direct purging:", trashErr);
    }
    
    // Remove from original
    await deleteDoc(docRef);
    console.log(`[TRASH] ${actualDocId} purged from active collection.`);
  } catch (error) {
    console.error(`[TRASH CRITICAL] Operation failed for ${docId}:`, error);
    throw error;
  }
};

export const getTrashItems = async () => {
  try {
    const q = query(collection(db, "trash"), orderBy("deletedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ trashId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching trash:", error);
    return [];
  }
};

export const restoreFromTrash = async (trashId) => {
  try {
    const trashRef = doc(db, "trash", trashId);
    const trashSnap = await getDoc(trashRef);
    if (!trashSnap.exists()) throw new Error("Trash item expired or not found");
    
    const { originalCollection, originalId, data } = trashSnap.data();
    
    // Restore to original collection
    await addDoc(collection(db, originalCollection), {
      ...data,
      restoredAt: serverTimestamp()
    });
    
    // Remove from trash
    await deleteDoc(trashRef);
  } catch (error) {
    console.error("Error restoring from trash:", error);
    throw error;
  }
};

export const cleanupTrash = async () => {
  try {
    const q = query(collection(db, "trash"), where("expiresAt", "<=", Timestamp.now()));
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Trash cleanup error:", error);
  }
};

export const getCustomerOrderStats = async (phone) => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("customer.phone", "==", phone));
    const querySnapshot = await getDocs(q);
    
    let totalSpent = 0;
    let orderCount = 0;
    
    querySnapshot.forEach(doc => {
      totalSpent += doc.data().totals?.total || 0;
      orderCount++;
    });
    
    return { totalSpent, orderCount };
  } catch (error) {
    console.error("Error getting customer stats:", error);
    return { totalSpent: 0, orderCount: 0 };
  }
};

// --- Settings ---
export const updateSettings = async (settings) => {
  const settingsRef = doc(db, "settings", "global");
  await updateDoc(settingsRef, settings);
};
