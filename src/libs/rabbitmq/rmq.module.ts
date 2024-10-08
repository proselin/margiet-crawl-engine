import { DynamicModule, Module } from '@nestjs/common';
import { IRmqOptions } from '@/libs/rabbitmq/type/rmq.options';
import {
  getConfigProvideToken,
  getServiceProvideToken,
} from '@/libs/rabbitmq/utils';
import { RmqService } from '@/libs/rabbitmq/services/rmq.service';

@Module({})
export class RmqModule {
  static registerAsync(configuration: {
    connectionName: string;
    useFactory: (...arg: any[]) => Promise<IRmqOptions> | IRmqOptions;
    inject?: any[];
  }): DynamicModule {
    const configProvideToken = getConfigProvideToken(
      configuration.connectionName,
    );
    const serviceProvideToken = getServiceProvideToken(
      configuration.connectionName,
    );

    return {
      module: RmqModule,
      providers: [
        {
          provide: configProvideToken,
          useFactory: configuration.useFactory,
          inject: configuration.inject ?? [],
        },
        {
          provide: serviceProvideToken,
          inject: [configProvideToken],
          useFactory: (config: IRmqOptions) => new RmqService(config),
        },
      ],
      exports: [
        {
          provide: serviceProvideToken,
          useExisting: serviceProvideToken,
        },
      ],
    };
  }
}
