import Joi from "joi";
import { DEFAULT, NODE_ENV } from "../../common";

export function envValidation(config: Record<string, unknown>) {
  const appEnv = {
    ["node_env"]: Joi.string().allow(NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION).default(NODE_ENV.DEVELOPMENT),

    ["server.host"]: Joi.string().default(DEFAULT.SERVER_HOST),
    ["server.port"]: Joi.number().port().default(DEFAULT.SERVER_PORT),
    ["server.prefix"]: Joi.string().default(DEFAULT.SERVER_PREFIX),
  };

  const redisEnv = {
    ["redis.host"]: Joi.string().default(DEFAULT.REDIS_HOST),
    ["redis.port"]: Joi.number().port().default(DEFAULT.REDIS_PORT),
    ["redis.username"]: Joi.string().allow(""),
    ["redis.password"]: Joi.string().allow(""),
  };

  const googleEnv = {

  }

  const databaseEnv = {
    ["database.host"]: Joi.string().required(),
    ["database.port"]: Joi.number().port(),
    ["database.name"]: Joi.string().required(),
    ["database.username"]: Joi.string().required(),
    ["database.password"]: Joi.string().required(),
  };

  const queueEnv = {};

  const { value, error } = Joi.object({
    ...appEnv,
    ...redisEnv,
    ...queueEnv,
    ...databaseEnv,
    ...googleEnv,
  })
    .unknown(true)
    .validate(config);

  if (error) {
    throw new Error(`Environment variable validation error: ${error.message}`);
  }

  return value;
}
