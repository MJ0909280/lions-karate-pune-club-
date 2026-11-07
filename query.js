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
  const admSnap = await getDocs(collection(db, 'admissions'));
  const examSnap = await getDocs(collection(db, 'exams'));

  console.log("\n--- ALL ADMISSIONS CONTAINING 'DESHMUKH' ---");
  admSnap.forEach(doc => {
    const data = doc.data();
    if ((data.fullName || '').toLowerCase().includes('deshmukh')) {
      console.log(`Document ID: ${doc.id}`);
      console.log(`Full Name: ${data.fullName}`);
      console.log(`Phone: ${data.phone}`);
      console.log(`Student ID: ${data.studentId}`);
    }
  });

  console.log("\n--- ALL EXAMS CONTAINING 'DESHMUKH' ---");
  examSnap.forEach(doc => {
    const data = doc.data();
    if ((data.studentName || '').toLowerCase().includes('deshmukh')) {
      console.log(`Document ID: ${doc.id}`);
      console.log(`Student Name: ${data.studentName}`);
      console.log(`Parent Phone: ${data.parentPhone}`);
      console.log(`Student ID: ${data.studentId}`);
    }
  });
}

run().catch(console.error);
