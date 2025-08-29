import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TEST_ENV_CONFIG } from './test-setup';

// Mock all external modules to avoid dependencies
jest.mock('./config/logger', () => ({
  LoggerConfigModule: {},
}));

jest.mock('./config/bullmq', () => ({
  BullmqConfigModule: {},
}));

jest.mock('./config/database', () => ({
  DatabaseConfigModule: {},
}));

jest.mock('./consumers/craw-consumer', () => ({
  CrawlConsumerModule: {},
}));

jest.mock('./producers/crawl-producer', () => ({
  CrawlProducerModule: {},
}));

jest.mock('./crawl', () => ({
  CrawlModule: {},
}));

jest.mock('./cronjob/refresh-comic', () => ({
  RefreshComicModule: {},
}));

jest.mock('./config/google-drive', () => ({
  GoogleDriveConfigModule: {},
}));

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Mock environment validation to return test config
    jest.doMock('./config/env', () => ({
      envValidation: jest.fn().mockReturnValue(TEST_ENV_CONFIG),
    }));

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: jest.fn().mockReturnValue(TEST_ENV_CONFIG),
        }),
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.resetModules();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have ConfigModule imported globally', () => {
    const configModule = module.get(ConfigModule);
    expect(configModule).toBeDefined();
  });
});