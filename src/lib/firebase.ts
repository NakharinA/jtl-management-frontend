import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDt8GjFPaHdS3Zzmw1nYl4ycLHJv_ZSYEg",
  authDomain: "jtl-management.firebaseapp.com",
  projectId: "jtl-management",
  storageBucket: "jtl-management.firebasestorage.app",
  messagingSenderId: "343698606044",
  appId: "1:343698606044:web:168bc36d64e5e0723a3119",
  measurementId: "G-89CPWZJ5WR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
