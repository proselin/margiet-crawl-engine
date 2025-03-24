import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { v4 } from 'uuid';

export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.getArgs()[0];
    const uuid =
      request?.cookies?.['msgid'] ?? request?.header?.['msgid'] ?? v4();
    const frsys =
      request?.cookies?.['frsys'] ?? request?.header?.['frsys'] ?? 'N/A';
    const processId = process.pid;
    const handler = context.getHandler().name;
    const type = context.getType();
    const className = context.getClass().name;

    Logger.log(
      `[${uuid}:${processId}][${frsys}][${handler}]:[${type}]::Request on\nParams ${JSON.stringify(request.params)}\nBody ${JSON.stringify(request.body)} \n`,
      className,
    );
    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          Logger.log(
            `[${uuid}:${processId}][${frsys}][${handler}]:[${type}]::Complete in ${Date.now() - now} ms`,
            className,
          );
        },
        error: (err) => {
          Logger.error(
            `[${uuid}:${processId}][${frsys}][${handler}]:[${type}]:: ${JSON.stringify(err)}`,
          );
        },
      }),
    );
  }
}
