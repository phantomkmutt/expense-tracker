import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuCqtB4i078WPMove_4_iNmxvFqslFEhA",
  authDomain: "airi-expense-tracker.firebaseapp.com",
  projectId: "airi-expense-tracker",
  storageBucket: "airi-expense-tracker.firebasestorage.app",
  messagingSenderId: "290689713230",
  appId: "1:290689713230:web:c22fde33b6e771abd1af1f",
  measurementId: "G-4SD06GGC7Q"
};

// เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);

// เปิดใช้งานระบบ Authentication (Login)
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// เปิดใช้งานระบบ Database (Firestore) สำหรับเก็บข้อมูลรายรับรายจ่ายในอนาคต
export const db = getFirestore(app);
