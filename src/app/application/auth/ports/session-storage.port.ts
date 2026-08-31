import { InjectionToken } from '@angular/core';

export interface SessionStoragePort {
  getAccessToken(): string | null;
  setAccessToken(token: string): void;
  clear(): void;
}
export const SESSION_STORAGE = new InjectionToken<SessionStoragePort>('SESSION_STORAGE');
