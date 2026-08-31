import type { AuthenticatedUser } from '../../../domain/auth/authenticated-user.model';
import type { AuthenticatedUserDto } from './auth-api.contracts';
export function mapAuthenticatedUser(dto: AuthenticatedUserDto): AuthenticatedUser {
  return { id: String(dto.id), login: dto.login, ativo: dto.ativo, perfis: [...dto.perfis], permissoes: [...dto.permissoes] };
}
