import { User } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { name: string; email: string; passwordHash: string }): Promise<User>;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
