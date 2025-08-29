import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TEST_ENV_CONFIG } from './test-setup';

describe('Application Integration Tests', () => {
  describe('Core Module Loading', () => {
    it('should load ConfigModule with validation', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            validate: jest.fn().mockReturnValue(TEST_ENV_CONFIG),
          }),
        ],
      }).compile();

      expect(moduleRef).toBeDefined();
      
      const configModule = moduleRef.get(ConfigModule);
      expect(configModule).toBeDefined();

      await moduleRef.close();
    });

    it('should load HttpModule globally', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          HttpModule.register({
            global: true,
          }),
        ],
      }).compile();

      expect(moduleRef).toBeDefined();
      await moduleRef.close();
    });
  });

  describe('Environment Configuration', () => {
    it('should provide all required configuration keys', () => {
      const requiredKeys = [
        'server.host',
        'server.port',
        'database.host',
        'database.name',
        'database.username',
        'database.password',
        'redis.host',
        'redis.port',
      ];

      requiredKeys.forEach(key => {
        expect(TEST_ENV_CONFIG[key]).toBeDefined();
      });
    });

    it('should have valid server configuration', () => {
      expect(typeof TEST_ENV_CONFIG['server.host']).toBe('string');
      expect(typeof TEST_ENV_CONFIG['server.port']).toBe('number');
      expect(TEST_ENV_CONFIG['server.port']).toBeGreaterThan(0);
      expect(TEST_ENV_CONFIG['server.port']).toBeLessThan(65536);
    });

    it('should have valid database configuration', () => {
      expect(typeof TEST_ENV_CONFIG['database.host']).toBe('string');
      expect(typeof TEST_ENV_CONFIG['database.name']).toBe('string');
      expect(typeof TEST_ENV_CONFIG['database.username']).toBe('string');
      expect(typeof TEST_ENV_CONFIG['database.password']).toBe('string');
    });

    it('should have valid redis configuration', () => {
      expect(typeof TEST_ENV_CONFIG['redis.host']).toBe('string');
      expect(typeof TEST_ENV_CONFIG['redis.port']).toBe('number');
      expect(TEST_ENV_CONFIG['redis.port']).toBeGreaterThan(0);
      expect(TEST_ENV_CONFIG['redis.port']).toBeLessThan(65536);
    });
  });
});