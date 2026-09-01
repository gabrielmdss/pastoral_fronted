import { Inject, Injectable, signal, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LoginInput } from '../../application/auth/models/login.model';
import {
  SESSION_STORAGE,
  type SessionStoragePort,
} from '../../application/auth/ports/session-storage.port';
import { GetCurrentUserUseCase } from '../../application/auth/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.use-case';
import type { AuthenticatedUser } from '../../domain/auth/authenticated-user.model';
import { SessionStateService } from './session-state.service';
@Injectable()
export class SessionFacade {
  readonly currentUser: Signal<AuthenticatedUser | null>;
  readonly loading = signal(false);
  readonly isAuthenticated: Signal<boolean>;
  readonly permissions: Signal<string[]>;
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    @Inject(SESSION_STORAGE) private readonly storage: SessionStoragePort,
    private readonly state: SessionStateService,
  ) {
    this.currentUser = state.currentUser;
    this.isAuthenticated = state.isAuthenticated;
    this.permissions = state.permissions;
  }
  async login(input: LoginInput): Promise<void> {
    this.loading.set(true);
    try {
      this.state.setUser(await firstValueFrom(this.loginUseCase.execute(input)));
    } catch (error) {
      this.storage.clear();
      throw error;
    } finally {
      this.loading.set(false);
    }
  }
  async restore(): Promise<void> {
    if (!this.storage.getAccessToken()) return;
    this.loading.set(true);
    try {
      this.state.setUser(await firstValueFrom(this.getCurrentUser.execute()));
    } catch {
      this.clear();
    } finally {
      this.loading.set(false);
    }
  }
  hasPermission(code: string): boolean {
    return this.permissions().includes(code);
  }
  clear(): void {
    this.logoutUseCase.execute();
    this.state.clear();
  }
  logout(): void {
    this.clear();
  }
}
