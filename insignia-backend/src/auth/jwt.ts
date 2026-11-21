import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'insignia-assignment-secret-key-2026';

export function signJwt(payload: object, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyJwt(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
