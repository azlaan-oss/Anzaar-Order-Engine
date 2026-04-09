"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ROLES } from './permissions';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Listen for user role updates in real-time
        const userDocRef = doc(db, "users", user.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // New user - default to Viewer or handle initial admin setup
            const initialData = {
              email: user.email,
              role: ROLES.VIEWER,
              name: user.displayName || 'Unnamed Agent',
              createdAt: new Date().toISOString()
            };
            setDoc(userDocRef, initialData);
            setUserData(initialData);
          }
        });

        setLoading(false);
        return () => unsubDoc();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const signup = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // Profile created automatically by the snapshot listener effect above
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, signup }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
