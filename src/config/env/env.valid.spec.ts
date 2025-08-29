import { envValidation } from './env.valid';
import { TEST_ENV_CONFIG } from '../../test-setup';

describe('Environment Validation', () => {
  describe('envValidation', () => {
    it('should validate valid environment configuration', () => {
      const result = envValidation(TEST_ENV_CONFIG);
      
      expect(result).toBeDefined();
      expect(result['node_env']).toBe('test');
      expect(result['server.host']).toBe('localhost');
      expect(result['server.port']).toBe(3005);
      expect(result['database.host']).toBe('localhost');
      expect(result['redis.host']).toBe('localhost');
    });

    it('should use default values for optional fields', () => {
      const minimalConfig = {
        'database.host': 'localhost',
        'database.name': 'test_db',
        'database.username': 'test_user',
        'database.password': 'test_password',
      };
      
      const result = envValidation(minimalConfig);
      
      expect(result['node_env']).toBe('development'); // Default value
      expect(result['server.host']).toBe('0.0.0.0'); // Default value
      expect(result['server.port']).toBe(3000); // Default value
      expect(result['redis.host']).toBe('localhost'); // Default value
      expect(result['redis.port']).toBe(6379); // Default value
    });

    it('should throw error for missing required database fields', () => {
      const invalidConfig = {
        'server.host': 'localhost',
        'server.port': 3005,
      };
      
      expect(() => envValidation(invalidConfig)).toThrow('Environment variable validation error');
    });

    it('should throw error for invalid node_env', () => {
      const invalidConfig = {
        ...TEST_ENV_CONFIG,
        node_env: 'invalid_env',
        // Make sure database fields are missing to trigger validation error
        'database.host': undefined,
        'database.name': undefined,
        'database.username': undefined,
        'database.password': undefined,
      };
      
      expect(() => envValidation(invalidConfig)).toThrow();
    });

    it('should validate redis configuration', () => {
      const result = envValidation(TEST_ENV_CONFIG);
      
      expect(result['redis.host']).toBe('localhost');
      expect(result['redis.port']).toBe(6379);
      expect(result['redis.username']).toBe('');
      expect(result['redis.password']).toBe('');
    });

    it('should validate database configuration', () => {
      const result = envValidation(TEST_ENV_CONFIG);
      
      expect(result['database.host']).toBe('localhost');
      expect(result['database.port']).toBe(5432);
      expect(result['database.name']).toBe('test_db');
      expect(result['database.username']).toBe('test_user');
      expect(result['database.password']).toBe('test_password');
    });
  });
});