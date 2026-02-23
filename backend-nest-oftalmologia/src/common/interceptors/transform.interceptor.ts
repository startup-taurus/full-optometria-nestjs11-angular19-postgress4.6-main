import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as messages from '../../responses/messages.json';

export interface Response<T> {
  statusCode: number;
  status: string;
  message: {
    es: string;
    en: string;
  };
  data: T | { result: T[]; totalCount: number };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200;
        let messageKey = data?.messageKey || 'SUCCESS';
        let responseData = data;
        let totalCount = undefined;

        if (data && typeof data === 'object' && 'messageKey' in data) {
          messageKey = data.messageKey;
          responseData = data.data || data;
          totalCount = data.totalCount;
          delete data.messageKey;
        }

        const messageObj = messages[messageKey] || {
          es: 'Operación completada',
          en: 'Operation completed',
        };

        let formattedData;
        if (Array.isArray(responseData)) {
          formattedData = {
            result: responseData,
            totalCount: totalCount || responseData.length,
          };
        } else if (
          responseData &&
          typeof responseData === 'object' &&
          'result' in responseData
        ) {
          formattedData = responseData;
        } else {
          formattedData = responseData;
        }

        return {
          statusCode,
          status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
          message: messageObj,
          data: formattedData,
        };
      })
    );
  }
}
