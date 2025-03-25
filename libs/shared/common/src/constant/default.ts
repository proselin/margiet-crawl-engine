export const enum DEFAULT {
  NODE_ENV = 'development',
  SERVER_PREFIX = 'api',
  SERVER_TIMEOUT = 60 * 5 * 60, // 5 minutes
  SERVER_NAME = 'Margiet-crawl-engine',

  MINIO_USE_SSL = 0, //false
  MINIO_BUCKET = 'crawl-engine-image',

  //Default of cache manager
  CACHE_MAX = 100,
  CACHE_REFRESH_THRESHOLD = '1h',
  CACHE_TTL = '50m',
}
