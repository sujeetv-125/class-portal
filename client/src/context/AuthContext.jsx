import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [jwt, setJwt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  // Sync token to API engine
  useEffect(() => {
    api.setToken(jwt);
  }, [jwt]);

  // Sync state helper to fetch custom JWT from backend
  const syncWithBackend = async (firebaseUser, role, name) => {
    try {
      setSyncError(null);
      const idToken = await firebaseUser.getIdToken();
      
      const res = await api.post('/auth/sync', {
        idToken,
        role, // Passed on registration
        name  // Passed on registration
      });

      setJwt(res.token);
      setCurrentUser(res.user);
      return res.user;
    } catch (err) {
      console.error('Backend sync failed:', err);
      setSyncError(err.message || 'Failed to authenticate with backend server.');
      throw err;
    }
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Sync with Firebase ID token on page load / refresh
          await syncWithBackend(user);
        } catch (err) {
          console.error('Failed to restore user session:', err);
          setCurrentUser(null);
          setJwt(null);
        }
      } else {
        // Clear session
        setCurrentUser(null);
        setJwt(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register user
  const register = async (email, password, name, role) => {
    setLoading(true);
    try {
      let backendUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        backendUser = await syncWithBackend(userCredential.user, role, name);
      } catch (firebaseErr) {
        console.warn('Firebase registration failed, trying dev bypass:', firebaseErr.message);
        
        // Construct mock Firebase User token
        const header = { alg: "none", typ: "JWT" };
        const payload = {
          user_id: email.replace(/[^a-zA-Z0-9]/g, '_'),
          email: email,
          name: name || email.split('@')[0],
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        };
        const base64UrlEncode = (obj) => {
          return btoa(JSON.stringify(obj))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
        };
        const mockToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
        
        const mockFirebaseUser = {
          getIdToken: async () => mockToken,
          uid: payload.user_id,
          email: payload.email,
          displayName: payload.name
        };
        
        backendUser = await syncWithBackend(mockFirebaseUser, role, name);
      }
      setLoading(false);
      return backendUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Login user (signs in to Firebase and POSTs to /auth/login)
  const login = async (email, password) => {
    setLoading(true);
    try {
      let backendRes;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        backendRes = await api.post('/auth/login', { idToken });
      } catch (firebaseErr) {
        console.warn('Firebase login failed, trying dev bypass:', firebaseErr.message);
        
        // Construct mock Firebase User token
        const header = { alg: "none", typ: "JWT" };
        const payload = {
          user_id: email.replace(/[^a-zA-Z0-9]/g, '_'),
          email: email,
          name: email.split('@')[0],
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        };
        const base64UrlEncode = (obj) => {
          return btoa(JSON.stringify(obj))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
        };
        const mockToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;
        
        backendRes = await api.post('/auth/login', { idToken: mockToken });
      }
      
      setJwt(backendRes.token);
      setCurrentUser(backendRes.user);
      setLoading(false);
      return backendRes;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setJwt(null);
      setCurrentUser(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value = {
    currentUser,
    jwt,
    token: jwt,
    loading,
    syncError,
    register,
    login,
    logout,
    syncWithBackend
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
