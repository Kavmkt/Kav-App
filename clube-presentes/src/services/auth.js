import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Autentica o cliente por e-mail e senha.
 * As contas são criadas manualmente pela gestora da Lily Cestas no
 * Firebase Console (Authentication > Users) — não há autocadastro no MVP.
 */
export async function login(email, password) {
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
}

export async function logout() {
  await signOut(auth);
}
