/**
 * Saviya — Account Setup Script
 * Creates 8 Admin accounts + GN test account.
 * Run: node setup-accounts.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs   = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, 'frontend', '.env');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Account List ─────────────────────────────────────────────────────────────
const accounts = [
  // ── 8 Admins ──
  { email: 'nishin.admin@saviya.lk',   password: 'Nish@2025', displayName: 'Nishin',   role: 'admin' },
  { email: 'suwasah.admin@saviya.lk',  password: 'Suwa@2025', displayName: 'Suwasah',  role: 'admin' },
  { email: 'dinushi.admin@saviya.lk',  password: 'Dinu@2025', displayName: 'Dinushi',  role: 'admin' },
  { email: 'sayuru.admin@saviya.lk',   password: 'Sayu@2025', displayName: 'Sayuru',   role: 'admin' },
  { email: 'danuka.admin@saviya.lk',   password: 'Danu@2025', displayName: 'Danuka',   role: 'admin' },
  { email: 'osidhu.admin@saviya.lk',   password: 'Osid@2025', displayName: 'Osidhu',   role: 'admin' },
  { email: 'manvidhu.admin@saviya.lk', password: 'Manv@2025', displayName: 'Manvidhu', role: 'admin' },
  { email: 'kulidu.admin@saviya.lk',   password: 'Kuli@2025', displayName: 'Kulidu',   role: 'admin' },
  // ── GN Test Account ──
  { email: 'gn@saviya.lk',            password: 'GNOfficer@2025', displayName: 'GN Officer - Colombo', role: 'gn',
    gnProfile: { officialId: 'GN-00001', village: 'Kolonnawa', gsDivision: 'Kolonnawa', district: 'Colombo' } },
];

// ── Create Accounts ───────────────────────────────────────────────────────────
async function createAccount(account) {
  const { email, password, displayName, role, gnProfile } = account;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const userData = {
      uid: cred.user.uid, email, displayName, role,
      accountStatus: 'active',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    if (gnProfile) userData.gnProfile = gnProfile;

    await setDoc(doc(db, 'users', cred.user.uid), userData);
    console.log(`  ✅  [${role.toUpperCase().padEnd(5)}]  ${email.padEnd(38)}  Password: ${password}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`  ⚠️   [${role.toUpperCase().padEnd(5)}]  ${email.padEnd(38)}  Already exists`);
    } else {
      console.error(`  ❌  [${role.toUpperCase().padEnd(5)}]  ${email.padEnd(38)}  Error: ${err.message}`);
    }
  }
}

(async () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║             Saviya — Account Setup Script                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for (const account of accounts) {
    await createAccount(account);
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    ADMIN CREDENTIALS                          ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const admins = accounts.filter(a => a.role === 'admin');
  admins.forEach(a => {
    console.log(`║  ${a.email.padEnd(38)}  ${a.password.padEnd(14)}║`);
  });
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║                     GN CREDENTIALS                            ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  const gns = accounts.filter(a => a.role === 'gn');
  gns.forEach(a => {
    console.log(`║  ${a.email.padEnd(38)}  ${a.password.padEnd(14)}║`);
  });
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
})();
