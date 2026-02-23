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

    let errorDetails = null;
    if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
      if (Array.isArray(exceptionResponse['message'])) {
        errorDetails = exceptionResponse['message'];
      } else {
        errorMessage = exceptionResponse['message'];
      }
    }

    response.status(status).json({
      statusCode: status,
      status: 'error',
      message: messageObj,
      data: {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
