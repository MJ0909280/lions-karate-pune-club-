import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAnmwufw2XWibN1-kXA0ipm8gOH2UxsUtQ",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0852121768.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0852121768",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0852121768.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "427557354151",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:427557354151:web:c4ecd823051003f6943982",
  measurementId: "",
  firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-baab1072-c05e-471a-891d-ef9f81c21754"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function findYash() {
  console.log("=== SEARCHING FOR YASH NITESH MORE ===");
  const admSnap = await getDocs(collection(db, 'admissions'));
  admSnap.forEach(d => {
    const data = d.data();
    if (data.fullName && data.fullName.toLowerCase().includes('yash')) {
      console.log("Found in ADMISSIONS:", d.id, JSON.stringify(data, null, 2));
    }
  });

  const examSnap = await getDocs(collection(db, 'exams'));
  examSnap.forEach(d => {
    const data = d.data();
    if (data.studentName && data.studentName.toLowerCase().includes('yash')) {
      console.log("Found in EXAMS:", d.id, JSON.stringify(data, null, 2));
    }
  });
}

findYash().then(() => process.exit(0));
