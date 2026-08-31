import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SESSION_STORAGE } from '../../application/auth/ports/session-storage.port';
import { APP_CONFIG } from '../config/app-config';
import { SessionStateService } from './session-state.service';
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG), storage = inject(SESSION_STORAGE), router = inject(Router), state = inject(SessionStateService);
  return next(request).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401 && request.url.startsWith(config.apiBaseUrl) && !request.url.endsWith('/auth/login')) {
      storage.clear(); state.clear(); void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};
