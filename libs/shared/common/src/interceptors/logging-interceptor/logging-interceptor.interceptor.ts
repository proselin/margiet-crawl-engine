import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { HttpLoggingStrategy } from './strategy/http-logging.strategy';
import { LoggingInterceptStrategy } from './strategy/logging-intercept-strategy';
import { GraphqlLoggingStrategy } from './strategy/graphql-logging.strategy';
import { CONTEXT_TYPE } from '../../index';

export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const loggerStrategy = this.getLoggerStrategy(context);
    loggerStrategy?.logRequestStart();
    return next.handle().pipe(
      tap({
        next: (arg) => loggerStrategy?.logRequestComplete(arg),
        error: (err) => loggerStrategy?.logRequestError(err),
      }),
    );
  }

  private getLoggerStrategy(
    context: ExecutionContext,
  ): LoggingInterceptStrategy | null {
    switch (context.getType<CONTEXT_TYPE>()) {
      case CONTEXT_TYPE.GraphQL:
        return new GraphqlLoggingStrategy(context);
      case CONTEXT_TYPE.HTTP:
        return new HttpLoggingStrategy(context);
      default:
        return null;
    }
  }
}
