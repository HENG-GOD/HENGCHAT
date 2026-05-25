import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') message = resp;
      else if (typeof resp === 'object' && resp !== null) {
        message = (resp as any).message ?? message;
        code = (resp as any).error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
    }

    res.status(status).json({
      success: false,
      error: {
        code: code ?? this.codeFor(status),
        message,
        path: req.url,
      },
    });
  }

  private codeFor(status: number) {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return 'INTERNAL_ERROR';
    }
  }
}
