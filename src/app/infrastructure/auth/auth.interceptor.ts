import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SESSION_STORAGE } from '../../application/auth/ports/session-storage.port';
import { APP_CONFIG } from '../config/app-config';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG),
    storage = inject(SESSION_STORAGE),
    token = storage.getAccessToken();
  const isApiRequest =
    request.url === config.apiBaseUrl || request.url.startsWith(`${config.apiBaseUrl}/`);
  return next(
    token && isApiRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request,
  );
};
