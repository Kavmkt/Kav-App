import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Todas as chaves vêm de variáveis de ambiente (ver .env.example) — nenhum
// segredo fica hardcoded no código. As chaves de config do Firebase Web SDK
// não são secretas (ficam expostas no bundle do cliente), mas mesmo assim
// preferimos mantê-las fora do versionamento para facilitar trocar de
// projeto (dev/staging/produção) sem editar código.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey && import.meta.env.DEV) {
  console.warn(
    '[firebase] Variáveis VITE_FIREBASE_* não encontradas. Copie .env.example ' +
      'para .env e preencha com os dados do seu projeto no Firebase Console.',
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
