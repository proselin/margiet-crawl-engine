import { CONTEXT_TYPE } from '@shared/common';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    switch (ctx?.['contextType']) {
      case CONTEXT_TYPE.GraphQL: {
        this.handleGraphqlException(exception);
        break;
      }
      case CONTEXT_TYPE.HTTP: {
        this.handleHttpException(exception, host);
        break;
      }
      default:
        throw new InternalServerErrorException();
    }
  }

  handleHttpException(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    switch (true) {
      case exception instanceof HttpException:
        {
          let errorObject: Record<string, any>;
          const exceptionRes = exception.getResponse();
          switch (true) {
            case typeof exceptionRes === 'object' &&
              !Array.isArray(exceptionRes): {
              errorObject = exception.getResponse() as Record<string, any>;
              break;
            }
            case typeof exceptionRes === 'object' &&
              Array.isArray(exceptionRes): {
              errorObject = { chain: exceptionRes };
              break;
            }
            default:
              errorObject = { message: exceptionRes };
          }

          response.status(exception.getStatus()).json({
            statusCode: exception.getStatus(),
            timestamp: new Date().toISOString(),
            path: request.url,
            ...errorObject,
          });
        }
        break;

      default:
        exception = new InternalServerErrorException(exception);
        response
          .status((exception as InternalServerErrorException).getStatus())
          .json({
            statusCode: (exception as InternalServerErrorException).getStatus(),
            timestamp: new Date().toISOString(),
            path: request.url,
            message: (exception as InternalServerErrorException).getResponse(),
          });
        break;
    }
  }
  handleGraphqlException(exception: unknown) {
    return exception;
  }
}
