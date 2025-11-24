
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: แทนที่ด้วยค่าจริงจาก Firebase Console ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
