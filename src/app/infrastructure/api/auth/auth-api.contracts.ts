export interface AuthenticatedUserDto { id: string; login: string; ativo: boolean; perfis: string[]; permissoes: string[]; }
export interface LoginResponseDto { data: { accessToken: string; usuario: AuthenticatedUserDto } }
export interface MeResponseDto { data: AuthenticatedUserDto }
