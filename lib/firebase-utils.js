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
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Item not found in vault");
    
    const data = docSnap.data();
    
    // Add to trash
    await addDoc(collection(db, "trash"), {
      originalId: docId,
      originalCollection: collectionName,
      data: data,
      deletedAt: serverTimestamp(),
      // Calculate 7 days expiry
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Remove from original
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error moving to trash:", error);
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
