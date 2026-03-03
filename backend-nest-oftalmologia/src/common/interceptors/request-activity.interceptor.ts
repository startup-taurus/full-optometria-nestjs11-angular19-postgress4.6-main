import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class RequestActivityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();

    const handlerName = `${context.getClass().name}.${context.getHandler().name}`;
    const requestLabel = `${request.method} ${request.originalUrl || request.url}`;

    return next.handle().pipe(
      tap(() => {
        const elapsedMs = Date.now() - startedAt;
        const statusCode = response.statusCode;

        console.log(
          `${requestLabel}  status=${statusCode}  ${elapsedMs}ms`
        );
      }),
      catchError((error) => {
        const elapsedMs = Date.now() - startedAt;
        const statusCode = error?.status || response.statusCode || 500;
        const errorMessage =
          error?.message || 'Error durante la ejecución del método';

        console.error(
          `${requestLabel} status=${statusCode} ${elapsedMs}ms ${errorMessage}`
        );

        return throwError(() => error);
      })
    );
  }
}
