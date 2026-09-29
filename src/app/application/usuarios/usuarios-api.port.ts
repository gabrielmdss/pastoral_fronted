import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { NovoUsuario, Perfil, UsuarioCriado } from '../../domain/usuarios/usuario.model';
export interface UsuariosApiPort {
  listarPerfis(): Observable<Perfil[]>;
  criar(input: NovoUsuario): Observable<UsuarioCriado>;
}
export const USUARIOS_API = new InjectionToken<UsuariosApiPort>('USUARIOS_API');
