import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../../config/app-config';
import type { UsuariosApiPort } from '../../../application/usuarios/usuarios-api.port';
import type { NovoUsuario } from '../../../domain/usuarios/usuario.model';
import type { CriarUsuarioDto, PerfilDto, UsuarioCriadoDto } from './usuarios-api.contracts';
@Injectable()
export class UsuariosApiService implements UsuariosApiPort {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.url = config.apiBaseUrl + '/admin';
  }
  listarPerfis() {
    return this.http
      .get<{ data: PerfilDto[] }>(this.url + '/perfis')
      .pipe(map((r) => r.data.map(({ id, codigo, nome }) => ({ id: String(id), codigo, nome }))));
  }
  criar(input: NovoUsuario) {
    const body: CriarUsuarioDto = {
      login: input.login.trim(),
      senha: input.senha,
      perfilIds: input.perfilIds.map(String),
    };
    return this.http
      .post<{ data: UsuarioCriadoDto }>(this.url + '/usuarios', body)
      .pipe(map(({ data }) => ({ id: String(data.id), login: data.login, perfis: [...data.perfis] })));
  }
}
