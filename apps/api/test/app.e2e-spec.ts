import '../src/load-env';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Wallet E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let user2Token: string;
  let transferId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register - should register user 1', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: 'user1@test.com',
        password: 'password123',
      })
      .expect(201);

    accessToken = res.body.tokens.accessToken;
    expect(res.body.user.email).toBe('user1@test.com');
  });

  it('POST /api/auth/register - should register user 2', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@test.com',
        password: 'password123',
      })
      .expect(201);

    user2Token = res.body.tokens.accessToken;
  });

  it('POST /api/transactions/deposit - should deposit money', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transactions/deposit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 200, description: 'Initial deposit' })
      .expect(201);

    expect(res.body.type).toBe('DEPOSIT');
    expect(res.body.amount).toBe('200');
  });

  it('GET /api/wallet/balance - should show balance 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.balance).toBe('200');
  });

  it('POST /api/transactions/transfer - should transfer to user 2', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientEmail: 'user2@test.com',
        amount: 50,
        description: 'Payment',
      })
      .expect(201);

    transferId = res.body.id;
    expect(res.body.type).toBe('TRANSFER');
  });

  it('POST /api/transactions/transfer - should fail with insufficient balance', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientEmail: 'user2@test.com',
        amount: 9999,
      })
      .expect(400);
  });

  it('POST /api/transactions/:id/reverse - should reverse transfer', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/transactions/${transferId}/reverse`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.type).toBe('REVERSAL');
  });

  it('GET /api/wallet/balance - user1 balance restored to 200 after reversal', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.balance).toBe('200');
  });

  it('GET /api/wallet/balance - user2 balance back to 0 after reversal', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(res.body.balance).toBe('0');
  });
});
