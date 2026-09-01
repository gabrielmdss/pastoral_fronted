import { describe, expect, it } from 'vitest';
import { mapAuthenticatedUser } from './auth-api.mapper';
describe('Auth API mapper', () => {
  it('mapeia ids e copia permissões', () =>
    expect(
      mapAuthenticatedUser({ id: '9', login: 'u', ativo: true, perfis: ['P'], permissoes: ['X'] }),
    ).toEqual({ id: '9', login: 'u', ativo: true, perfis: ['P'], permissoes: ['X'] }));
});
