import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<any>> {
    return next.handle().pipe(
      map((data) => {
        // Allow already-wrapped responses (e.g. webhook returns plain object)
        if (data && typeof data === 'object' && 'success' in data) return data;
        return { success: true, data };
      }),
    );
  }
}
