import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Gera uma senha temporária legível para novos clientes (ex: "kav-4f7x-92qp"). */
export function generateTempPassword(): string {
  const part = () => Math.random().toString(36).slice(2, 6);
  return `kav-${part()}-${part()}`;
}
