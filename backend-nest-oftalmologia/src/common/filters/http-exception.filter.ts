import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as messages from '../../responses/messages.json';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse['message'] &&
      typeof exceptionResponse['message'] === 'object' &&
      (exceptionResponse['message']['es'] || exceptionResponse['message']['en'])
    ) {
      return response.status(status).json(exceptionResponse);
    }

    let messageKey = 'ERROR.INTERNAL';
    let errorMessage = exception.message;
    const extracted = this.extractErrorMessageAndDetails(exceptionResponse);

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
      exceptionResponse['messageKey']
    ) {
      messageKey = exceptionResponse['messageKey'];
    }

    const messageObj = messages[messageKey] || {
      es: 'Error interno del servidor',
      en: 'Internal server error',
    };

    if (extracted.errorMessage) {
      errorMessage = extracted.errorMessage;
    }

    response.status(status).json({
      statusCode: status,
      status: 'error',
      message: messageObj,
      data: {
        localizedMessage: messageObj,
        error: errorMessage,
        details: extracted.errorDetails,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private extractErrorMessageAndDetails(exceptionResponse: unknown): {
    errorMessage: string | null;
    errorDetails: string[] | null;
  } {
    if (!exceptionResponse || typeof exceptionResponse !== 'object') {
      return {
        errorMessage: null,
        errorDetails: null,
      };
    }

    const response = exceptionResponse as Record<string, unknown>;
    const message = response.message;

    if (Array.isArray(message)) {
      const details = message
        .map((item) =>
          typeof item === 'string' ? item : JSON.stringify(item)
        )
        .filter((item) => item && item !== '{}');

      return {
        errorMessage: details[0] || null,
        errorDetails: details.length ? details : null,
      };
    }

    if (typeof message === 'string') {
      return {
        errorMessage: message,
        errorDetails: null,
      };
    }

    return {
      errorMessage: null,
      errorDetails: null,
    };
  }
}
