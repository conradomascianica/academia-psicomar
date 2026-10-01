import bcrypt from "bcryptjs";

export function hashearPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, 12);
}

export function verificarPassword(
  plano: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}
