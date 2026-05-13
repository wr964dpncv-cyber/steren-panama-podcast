import bcrypt from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function validatePassword(password: string): string | null {
  if (typeof password !== "string") return "Contraseña inválida.";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (password.length > 200) return "La contraseña es demasiado larga.";
  return null;
}
