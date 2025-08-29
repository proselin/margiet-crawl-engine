import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TEST_ENV_CONFIG } from '../test-setup';

describe('Configuration Service Integration', () => {
  let configService: ConfigService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
              return TEST_ENV_CONFIG[key] || defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const value = TEST_ENV_CONFIG[key];
              if (value === undefined) {
                throw new Error(`Configuration key "${key}" not found`);
              }
              return value;
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

  it('should provide configuration service', () => {
    expect(configService).toBeDefined();
  });

  it('should get server configuration', () => {
    expect(configService.get('server.host')).toBe('localhost');
    expect(configService.get('server.port')).toBe(3005);
    expect(configService.get('server.prefix')).toBe('api');
  });

  it('should get database configuration', () => {
    expect(configService.getOrThrow('database.host')).toBe('localhost');
    expect(configService.getOrThrow('database.name')).toBe('test_db');
    expect(configService.getOrThrow('database.username')).toBe('test_user');
  });

  it('should get redis configuration', () => {
    expect(configService.getOrThrow('redis.host')).toBe('localhost');
    expect(configService.getOrThrow('redis.port')).toBe(6379);
  });

  it('should throw error for missing configuration', () => {
    expect(() => configService.getOrThrow('non.existent.key')).toThrow();
  });

  it('should return default value for missing optional config', () => {
    expect(configService.get('non.existent.key', 'default')).toBe('default');
  });
});