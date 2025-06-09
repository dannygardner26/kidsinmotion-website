import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBxIdOtPIZdvXjZPTY7gSL7dQeG6yJSPjc",
  authDomain: "kimwebsite-cd33a.firebaseapp.com",
  projectId: "kimwebsite-cd33a",
  storageBucket: "kimwebsite-cd33a.firebasestorage.app",
  messagingSenderId: "644454554071",
  appId: "1:644454554071:web:7e9751b1ddea843dd95392",
  measurementId: "G-QWJY0T2PWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

export { auth, analytics, db, storage, messaging };
