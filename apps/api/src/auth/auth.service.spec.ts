import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY } from './repositories/auth.repository.interface';
import { PrismaService } from '../prisma/prisma.module';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
} from '../common/exceptions/business.exceptions';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn(),
}));

import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  const authRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const prisma = {
    $transaction: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
    verifyAsync: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => `${key}-value`),
    get: jest.fn((_key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should register a new user and create wallet', async () => {
    authRepository.findByEmail.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (fn) =>
      fn({
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'user-1',
            name: 'João',
            email: 'joao@test.com',
          }),
        },
        wallet: { create: jest.fn().mockResolvedValue({}) },
      }),
    );

    const result = await service.register({
      name: 'João',
      email: 'joao@test.com',
      password: 'secret123',
    });

    expect(result.user.email).toBe('joao@test.com');
    expect(result.tokens.accessToken).toBe('token');
    expect(argon2.hash).toHaveBeenCalledWith('secret123');
  });

  it('should throw when email already exists', async () => {
    authRepository.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      service.register({ name: 'João', email: 'joao@test.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
  });

  it('should login with valid credentials', async () => {
    authRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'João',
      email: 'joao@test.com',
      passwordHash: 'hashed-password',
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'joao@test.com',
      password: 'secret123',
    });

    expect(result.user.id).toBe('user-1');
    expect(result.tokens.refreshToken).toBe('token');
  });

  it('should reject invalid credentials', async () => {
    authRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'joao@test.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });
});
