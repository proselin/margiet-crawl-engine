import Joi from 'joi';
import { DEFAULT, NODE_ENV } from '../../common/src';

export function envValidation(config: Record<string, unknown>) {
  const appEnv = {
    ['node_env']: Joi.string()
      .allow(NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION)
      .default(NODE_ENV.DEVELOPMENT),

    ['server.host']: Joi.string().required(),
    ['server.port']: Joi.number().port().required(),
    ['server.prefix']: Joi.string().default(DEFAULT.SERVER_PREFIX),
    ['server.name']: Joi.string().default(DEFAULT.SERVER_NAME),
    ['server.timeout']: Joi.number().default(DEFAULT.SERVER_TIMEOUT),
  };

  // const redisEnv = {
  //   ['redis.host']: Joi.string().required(),
  //   ['redis.port']: Joi.number().port().required(),
  //   ['redis.username']: Joi.string().allow(''),
  //   ['redis.password']: Joi.string().allow(''),
  // };

  // const minioEnv = {
  //   ['minio.endpoint']: Joi.string().required(),
  //   ['minio.port']: Joi.number().port().required(),
  //   ['minio.ssl']: Joi.boolean().default(DEFAULT.MINIO_USE_SSL),
  //   ['minio.access-key']: Joi.string().required(),
  //   ['minio.secret-key']: Joi.string().required(),
  //   ['minio.bucket']: Joi.string().default(DEFAULT.MINIO_BUCKET),
  // };
  const databaseEnv = {
    ['database.host']: Joi.string().required(),
    ['database.port']: Joi.number().port(),
    ['database.name']: Joi.string().required(),
    ['database.username']: Joi.string().required(),
    ['database.password']: Joi.string().required(),
  };

  const cacheEnv = {
    ['cache.max']: Joi.number().default(DEFAULT.CACHE_MAX),
    ['cache.refresh-threshold']: Joi.any().default(
      DEFAULT.CACHE_REFRESH_THRESHOLD,
    ),
    ['cache.ttl']: Joi.any().default(DEFAULT.CACHE_TTL),
  };

  const queueEnv = {};

  const { value, error } = Joi.object({
    ...appEnv,
    // ...redisEnv,
    // ...minioEnv,
    ...queueEnv,
    ...databaseEnv,
    ...cacheEnv,
  })
    .unknown(true)
    .validate(config);

  if (error) {
    throw new Error(`Environment variable validation error: ${error.message}`);
  }

  return value;
}
