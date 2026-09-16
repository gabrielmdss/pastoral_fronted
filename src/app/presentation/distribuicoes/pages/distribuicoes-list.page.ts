import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import { ListarDistribuicoesUseCase } from '../../../application/distribuicoes/listar-distribuicoes.use-case';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';

@Component({
  selector: 'app-distribuicoes-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './distribuicoes-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DistribuicoesListPage {
  private readonly listarDistribuicoes =
    inject(ListarDistribuicoesUseCase);

  readonly distribuicoes = signal<Distribuicao[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set(null);

    this.listarDistribuicoes.execute().subscribe({
      next: (distribuicoes) => {
        this.distribuicoes.set(distribuicoes);
        this.loading.set(false);
      },

      error: () => {
        this.error.set(
          'Não foi possível carregar as distribuições.',
        );

        this.loading.set(false);
      },
    });
  }

  competenciaLabel(distribuicao: Distribuicao): string {
    const mes = String(distribuicao.competencia.mes)
      .padStart(2, '0');

    return `${mes}/${distribuicao.competencia.ano}`;
  }

  dataLabel(data: string): string {
    const [ano, mes, dia] = data.split('-');

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }
}