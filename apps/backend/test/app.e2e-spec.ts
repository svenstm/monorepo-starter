import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AppController } from '../src/app.controller';
import type { NestExpressApplication } from '@nestjs/platform-express';
import supertest from 'supertest';
import { DB_DEFAULT_CONNECTION } from '../src/constants';
import { DatabaseService } from '@monorepo-starter/mongo';
import { ConfigService } from '../src/config/config.service';
import { LoggerService } from '@monorepo-starter/logger';

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
      ],
      controllers: [AppController],
    }).overrideProvider(DB_DEFAULT_CONNECTION)
      .useFactory({
        factory: async (db: DatabaseService, config: ConfigService, logger: LoggerService) => db.connect(config.getMongoDefaultUrl(), logger),
        inject: [DatabaseService, ConfigService, LoggerService]})
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    await app.init();
    console.log('app initialized')
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/ (GET)', () => {
    it('should return hello world', async () => {
      const res = await supertest(app.getHttpServer())
        .get('/');
      expect(res.status).toBe(200);
      expect(res.text).toBe('Hello World!');
    });
  });
});
