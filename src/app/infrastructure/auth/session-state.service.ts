import { computed, Injectable, signal } from '@angular/core';
import type { AuthenticatedUser } from '../../domain/auth/authenticated-user.model';
@Injectable()
export class SessionStateService {
  private readonly userState = signal<AuthenticatedUser | null>(null);
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly permissions = computed(() => this.userState()?.permissoes ?? []);
  setUser(user: AuthenticatedUser): void {
    this.userState.set(user);
  }
  clear(): void {
    this.userState.set(null);
  }
}
