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

const collections = [
  'admissions', 
  'exams', 
  'batches', 
  'parent_queries', 
  'receipts', 
  'exam_schedules', 
  'attendance', 
  'seo_indexing_logs',
  'settings'
];

async function run() {
  for (const collName of collections) {
    try {
      console.log(`Searching collection: ${collName}`);
      const snap = await getDocs(collection(db, collName));
      console.log(`- Loaded ${snap.size} docs from ${collName}`);
      snap.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('lkcp-2026-107-2802')) {
          console.log(`[FOUND in ${collName}] docId: ${doc.id}`);
          console.log(JSON.stringify(data, null, 2));
        }
      });
    } catch (err) {
      console.log(`- Error reading ${collName}: ${err.message}`);
    }
  }
}

run().catch(console.error);
