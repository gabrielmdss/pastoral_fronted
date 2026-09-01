import { Inject, Injectable } from '@angular/core';
import { SESSION_STORAGE, type SessionStoragePort } from '../ports/session-storage.port';

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(SESSION_STORAGE) private readonly storage: SessionStoragePort) {}
  execute(): void {
    this.storage.clear();
  }
}
