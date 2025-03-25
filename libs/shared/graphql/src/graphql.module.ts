import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { NODE_ENV } from '@shared/common';
import { GraphQLLogger } from './plugins';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';

type GraphQLModuleFactoryResult =
  | Promise<Omit<ApolloDriverConfig, 'driver'>>
  | Omit<ApolloDriverConfig, 'driver'>;

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: (conf: ConfigService): GraphQLModuleFactoryResult => {
        return {
          playground: conf.getOrThrow('node_env') === NODE_ENV.DEVELOPMENT,
          plugins: [ApolloServerPluginLandingPageLocalDefault()],
          autoSchemaFile: join(process.cwd(), "assets", "schema.gql"),
          installSubscriptionHandlers: true,
          logger: new GraphQLLogger(),
          subscriptions: {
            'graphql-ws': true,
          },
          sortSchema: true,
          autoTransformHttpErrors: true,
        };
      },
    }),
  ],
})
export class GraphqlModule {}
