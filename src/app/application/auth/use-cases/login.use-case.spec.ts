import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { AuthApiPort } from '../ports/auth-api.port';
import type { SessionStoragePort } from '../ports/session-storage.port';
import { LoginUseCase } from './login.use-case';
const user = { id: '1', login: 'admin', ativo: true, perfis: ['ADMIN'], permissoes: ['X'] };
describe('LoginUseCase', () => {
  it('persiste somente o token e confirma o usuário em /me', async () => {
    const api: AuthApiPort = {
      login: vi.fn(() => of({ accessToken: 'jwt', usuario: user })),
      me: vi.fn(() => of(user)),
    };
    const storage: SessionStoragePort = {
      getAccessToken: vi.fn(),
      setAccessToken: vi.fn(),
      clear: vi.fn(),
    };
    const result = await new Promise((resolve) =>
      new LoginUseCase(api, storage)
        .execute({ login: 'admin', senha: 'secret' })
        .subscribe(resolve),
    );
    expect(storage.setAccessToken).toHaveBeenCalledWith('jwt');
    expect(api.me).toHaveBeenCalled();
    expect(result).toEqual(user);
  });
});
