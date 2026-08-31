import { Injectable } from '@angular/core';
import type { SessionStoragePort } from '../../application/auth/ports/session-storage.port';
const TOKEN_KEY = 'pastoral.accessToken';
@Injectable()
export class BrowserSessionStorageService implements SessionStoragePort {
  getAccessToken(): string | null { return sessionStorage.getItem(TOKEN_KEY); }
  setAccessToken(token: string): void { sessionStorage.setItem(TOKEN_KEY, token); }
  clear(): void { sessionStorage.removeItem(TOKEN_KEY); }
}
