// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFeceeN7B5KnXcUgvYrj9kTJ5YSbR8qCI",
  authDomain: "studio-4344422468-c2966.firebaseapp.com",
  projectId: "studio-4344422468-c2966",
  storageBucket: "studio-4344422468-c2966.firebasestorage.app",
  messagingSenderId: "530084788593",
  appId: "1:530084788593:web:2ece7ec1431270f2635ed0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);