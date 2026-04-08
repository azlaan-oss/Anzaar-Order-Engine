import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Logs a system-wide activity event
 * @param {string} userName - The name of the user/moderator
 * @param {string} action - Descriptive action (e.g., "Created Order", "Updated Settings")
 * @param {object} details - Additional metadata (orderId, oldPrice, newPrice, etc.)
 */
export const logActivity = async (userName, action, details = {}) => {
  try {
    await addDoc(collection(db, "activity_logs"), {
      user: userName || "Moderator",
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Critical logging failure:", error);
  }
};
