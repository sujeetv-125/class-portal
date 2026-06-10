import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase client configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock_api_key_placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234:web:abcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export default app;
