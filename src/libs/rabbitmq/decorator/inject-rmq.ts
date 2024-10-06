import { Inject } from '@nestjs/common';
import { getServiceProvideToken } from '@libs/rabbitmq/utils';

export const InjectRmq = (connectionName: string) =>
  Inject(getServiceProvideToken(connectionName));