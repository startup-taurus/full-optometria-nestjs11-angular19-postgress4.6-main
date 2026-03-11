import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as messages from '../../responses/messages.json';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const extracted = this.extractErrorMessageAndDetails(exceptionResponse);

      let messageKey = 'ERROR.INTERNAL';
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          messageKey = 'ERROR.VALIDATION';
          break;
        case HttpStatus.UNAUTHORIZED:
          messageKey = 'ERROR.UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          messageKey = 'ERROR.FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          messageKey = 'ERROR.NOT_FOUND';
          break;
        case HttpStatus.CONFLICT:
          messageKey = 'ERROR.VALIDATION';
          break;
        default:
          messageKey = 'ERROR.INTERNAL';
      }

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse &&
        'messageKey' in exceptionResponse
      ) {
        messageKey = String((exceptionResponse as Record<string, unknown>).messageKey);
      }

      const messageObj = messages[messageKey] || {
        es: 'Error interno del servidor',
        en: 'Internal server error',
      };

      const friendlyError = `${messageObj.es} / ${messageObj.en}`;

      // Para conflicto o not_found también pasamos el mensaje localizado del throw
      const dataError =
        status === HttpStatus.BAD_REQUEST
          ? friendlyError
          : (extracted.errorMessage ?? friendlyError);

      return response.status(status).json({
        statusCode: status,
        status: 'error',
        message: messageObj,
        data: {
          error: dataError,
          details: extracted.errorDetails,
          localizedMessage: extracted.localizedMessage,
          timestamp: new Date().toISOString(),
        },
      });
    }


    const message =
      exception instanceof Error ? exception.message : String(exception);


    const shortMessage = this.sanitizeMessage(message);

    this.logger.error(
      `[${(request as any).method ?? ''} ${(request as any).url ?? ''}] ${shortMessage}`
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      status: 'error',
      message: {
        es: 'Error interno del servidor',
        en: 'Internal server error',
      },
    });
  }

  private sanitizeMessage(msg: string): string {
    const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|WITH|FROM)\b/i;
    const match = sqlKeywords.exec(msg);
    if (match && match.index > 0) {
      return msg.substring(0, match.index).trim();
    }

    if (sqlKeywords.test(msg)) {
      return msg.substring(0, 120) + '...';
    }
    return msg;
  }

  private extractErrorMessageAndDetails(exceptionResponse: unknown): {
    errorMessage: string | null;
    errorDetails: string[] | null;
    localizedMessage: { es: string; en: string } | null;
  } {
    if (!exceptionResponse || typeof exceptionResponse !== 'object') {
      return { errorMessage: null, errorDetails: null, localizedMessage: null };
    }

    const response = exceptionResponse as Record<string, unknown>;
    const message = response.message;

    // Objeto con claves de idioma { es, en } — caso del ConflictException de turnos
    if (
      message &&
      typeof message === 'object' &&
      !Array.isArray(message) &&
      ('es' in (message as object) || 'en' in (message as object))
    ) {
      const msg = message as Record<string, string>;
      const localizedMessage = { es: msg['es'] || '', en: msg['en'] || '' };
      // Enviamos ambos idiomas separados por " / " para que el frontend elija
      const combined = [msg['es'], msg['en']].filter(Boolean).join(' / ');
      return {
        errorMessage: combined || null,
        errorDetails: null,
        localizedMessage,
      };
    }

    if (Array.isArray(message)) {
      const details = message
        .map((item) =>
          typeof item === 'string' ? item : JSON.stringify(item)
        )
        .filter((item) => item && item !== '{}');

      return {
        errorMessage: details[0] || null,
        errorDetails: details.length ? details : null,
        localizedMessage: null,
      };
    }

    if (typeof message === 'string') {
      return {
        errorMessage: message,
        errorDetails: null,
        localizedMessage: null,
      };
    }

    return { errorMessage: null, errorDetails: null, localizedMessage: null };
  }
}
