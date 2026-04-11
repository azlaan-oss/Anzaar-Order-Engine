"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [orderNotifications, setOrderNotifications] = useState([]);
  const [inventoryNotifications, setInventoryNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    // 1. Listen for Pending Orders
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'order',
        title: 'New Protocol Detected',
        message: `Order #${doc.data().orderId} from ${doc.data().customer?.name || 'Unknown'} is pending authorization.`,
        timestamp: doc.data().timestamp,
        ...doc.data()
      }));
      setOrderNotifications(orders);
      setLoading(false);
    }, (err) => {
      console.error("Orders Notification Stream Error:", err);
    });

    // 2. Listen for Low Stock Items
    const inventoryQuery = query(
      collection(db, "products"),
      where("isStockOut", "==", true),
      limit(10)
    );

    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'inventory',
        title: 'Inventory Depletion',
        message: `Strategic Unit "${doc.data().name}" is currently stock-out.`,
        timestamp: doc.data().updatedAt?.toMillis() || Date.now(),
        ...doc.data()
      }));
      setInventoryNotifications(inventory);
    }, (err) => {
      console.error("Inventory Notification Stream Error:", err);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeInventory();
    };
  }, []);

  const totalCount = orderNotifications.length + inventoryNotifications.length;
  const allNotifications = [...orderNotifications, ...inventoryNotifications]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <NotificationContext.Provider value={{ 
      orderNotifications, 
      inventoryNotifications, 
      allNotifications, 
      totalCount,
      loading 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
