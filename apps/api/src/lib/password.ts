import { hash, compare } from 'bcryptjs';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// Verify a password against a hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}
