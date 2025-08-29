/**
 * Test environment setup based on .env.example
 */
export const TEST_ENV_CONFIG = {
  // Server settings
  node_env: 'test',
  'server.host': 'localhost',
  'server.port': 3005,
  'server.doc-prefix': '/swagger',
  'server.prefix': 'api',

  // Redis config (mock values)
  'redis.host': 'localhost',
  'redis.port': 6379,
  'redis.username': '',
  'redis.password': '',

  // Database config (mock values)
  'database.host': 'localhost',
  'database.port': 5432,
  'database.name': 'test_db',
  'database.username': 'test_user',
  'database.password': 'test_password',

  // Minio config (mock values)
  'minio.endpoint': 'localhost',
  'minio.port': 9001,
  'minio.ssl': false,
  'minio.access-key': 'test_access_key',
  'minio.secret-key': 'test_secret_key',
  'minio.bucket': 'margiet-crawl-image',

  // Cache config
  'cache.ttl': 360000,
  'cache.max': 1000,
  'cache.refreshThreshold': 300000,

  // Google Drive Config (mock values)
  'google-drive.upload-image-folder-id': 'test_folder_id',
  'google-drive.client-id': 'test_client_id',
  'google-drive.client-secret': 'test_client_secret',
  'google-drive.redirect-url': 'http://localhost:3000/auth/callback',
  'google-drive.refresh-token': 'test_refresh_token',

  // Crawl Queue Config
  'queue.crawl.concurrency': 6,
};

// Mock Google Drive configuration
export const MOCK_GOOGLE_DRIVE_CONFIG = {
  clientId: 'test_client_id',
  clientSecret: 'test_client_secret',
  redirectUrl: 'http://localhost:3000/auth/callback',
  refreshToken: 'test_refresh_token',
  uploadImageFolderId: 'test_folder_id',
};