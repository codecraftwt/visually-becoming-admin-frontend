/**
 * Firebase Client Configuration
 * 
 * This file initializes Firebase client SDK for direct client-side uploads to Firebase Storage.
 * This bypasses Vercel's 4.5MB body size limit by uploading files directly from the browser.
 */

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// These should match your Firebase project settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'affirm-2722c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'affirm-2722c.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field] || firebaseConfig[field] === '');

if (missingFields.length > 0) {
  console.error('❌ Firebase configuration is missing required fields:', missingFields);
  console.error('Please set the following environment variables in your .env file:');
  missingFields.forEach(field => {
    console.error(`  - VITE_FIREBASE_${field.toUpperCase().replace(/([A-Z])/g, '_$1').slice(1)}`);
  });
  throw new Error(`Firebase configuration incomplete. Missing: ${missingFields.join(', ')}`);
}

// Initialize Firebase
let app;
let storage;

try {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Initialize Firebase Storage
export { storage };

export default app;