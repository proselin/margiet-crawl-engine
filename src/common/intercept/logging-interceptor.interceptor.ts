import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.getArgs()[0];
    const uuid = request?.cookies?.['msgid'] ?? Date.now();
    const frsys = request?.cookies?.['frsys'] ?? '';
    const handler = context.getHandler().name;
    const type = context.getType();
    const className = context.getClass().name;

    Logger.log(
      `[${uuid}:${frsys}][${handler}]:[${type}]::Request on \n Params ${JSON.stringify(request.params)} \n  Body ${JSON.stringify(request.body)} \n`,
      className,
    );
    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          Logger.log(
            `[${uuid}:${frsys}][${handler}]:[${type}]::Complete in ${Date.now() - now} ms`,
            className,
          );
        },
        error: (err) => {
          Logger.error(
            `[${uuid}:${frsys}][${handler}]:[${type}]:: Request error`,
            className,
          );
          Logger.error(err, className);
        },
      }),
    );
  }
}
