import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { AuthApiPort } from '../../../application/auth/ports/auth-api.port';
import type { LoginInput, LoginResult } from '../../../application/auth/models/login.model';
import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import type { LoginResponseDto, MeResponseDto } from './auth-api.contracts';
import { mapAuthenticatedUser } from './auth-api.mapper';
@Injectable()
export class AuthApiService implements AuthApiPort {
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}
  login(input: LoginInput): Observable<LoginResult> {
    return this.http.post<LoginResponseDto>(`${this.config.apiBaseUrl}/auth/login`, input).pipe(
      map(({ data }) => ({
        accessToken: data.accessToken,
        usuario: mapAuthenticatedUser(data.usuario),
      })),
    );
  }
  me(): Observable<AuthenticatedUser> {
    return this.http
      .get<MeResponseDto>(`${this.config.apiBaseUrl}/auth/me`)
      .pipe(map(({ data }) => mapAuthenticatedUser(data)));
  }
}
