import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TEST_ENV_CONFIG } from '../../test-setup';

describe('BullmqConfigModule', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              return TEST_ENV_CONFIG[key];
            }),
          },
        },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ConfigService', () => {
    expect(configService).toBeDefined();
  });

  it('should return correct redis configuration', () => {
    expect(configService.getOrThrow('redis.host')).toBe('localhost');
    expect(configService.getOrThrow('redis.port')).toBe(6379);
  });
});