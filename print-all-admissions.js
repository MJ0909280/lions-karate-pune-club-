import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAnmwufw2XWibN1-kXA0ipm8gOH2UxsUtQ",
  authDomain: "gen-lang-client-0852121768.firebaseapp.com",
  projectId: "gen-lang-client-0852121768",
  storageBucket: "gen-lang-client-0852121768.firebasestorage.app",
  messagingSenderId: "427557354151",
  appId: "1:427557354151:web:c4ecd823051003f6943982",
  firestoreDatabaseId: "ai-studio-baab1072-c05e-471a-891d-ef9f81c21754"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching all admissions...");
  const snap = await getDocs(collection(db, 'admissions'));
  console.log(`Total: ${snap.size}`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`id: ${doc.id} | studentId: ${data.studentId} | name: ${data.fullName} | phone: ${data.phone}`);
  });
}

run().catch(console.error);
