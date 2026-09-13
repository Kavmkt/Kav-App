import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// ---------------------------------------------------------------------------
// users/{uid} — { email, name, packageId, isActive }
// ---------------------------------------------------------------------------
export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// ---------------------------------------------------------------------------
// packages/{packageId} — { name, description, price, totalDates,
//                          intervalMonths, datesAllowed: [] }
// ---------------------------------------------------------------------------
export async function getPackage(packageId) {
  if (!packageId) return null;
  const ref = doc(db, 'packages', packageId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// ---------------------------------------------------------------------------
// items/{itemId} — { name, description, imageUrl, category, isActive }
// ---------------------------------------------------------------------------
export async function getActiveItems() {
  const itemsRef = collection(db, 'items');
  const activeItemsQuery = query(itemsRef, where('isActive', '==', true));
  const snapshot = await getDocs(activeItemsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

// ---------------------------------------------------------------------------
// subscriptions/{subscriptionId} — { userId, packageId, startDate, endDate,
//                                     status, selectedDates: [] }
// `selectedDates` é a agenda de datas de presente já definida pela gestora
// para essa assinatura (ex.: as 2 datas do Bronze ou as 4 datas do Plus).
// ---------------------------------------------------------------------------
export async function getActiveSubscription(userId) {
  const subscriptionsRef = collection(db, 'subscriptions');
  const activeSubscriptionQuery = query(
    subscriptionsRef,
    where('userId', '==', userId),
    where('status', '==', 'active'),
  );
  const snapshot = await getDocs(activeSubscriptionQuery);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// ---------------------------------------------------------------------------
// selections/{subscriptionId_date} — { userId, subscriptionId, date, itemId,
//                                       confirmed, changedAt }
// Um doc por (assinatura, data), com id determinístico para evitar
// duplicados quando o cliente troca de ideia antes do prazo fechar.
// ---------------------------------------------------------------------------
export async function getSelections(subscriptionId) {
  if (!subscriptionId) return [];
  const selectionsRef = collection(db, 'selections');
  const selectionsQuery = query(
    selectionsRef,
    where('subscriptionId', '==', subscriptionId),
  );
  const snapshot = await getDocs(selectionsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function selectionDocId(subscriptionId, date) {
  return `${subscriptionId}_${date}`;
}

/**
 * Cria ou atualiza a escolha de item do cliente para uma data específica.
 * A validação do prazo de 15 dias é feita antes de chamar esta função
 * (ver src/utils/dateHelpers.js#canChangeSelection) — mantenha essa checagem
 * também nas regras de segurança do Firestore antes de ir para produção.
 */
export async function saveSelection({ userId, subscriptionId, date, itemId }) {
  const id = selectionDocId(subscriptionId, date);
  const ref = doc(db, 'selections', id);
  await setDoc(
    ref,
    {
      userId,
      subscriptionId,
      date,
      itemId,
      confirmed: true,
      changedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}
