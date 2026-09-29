import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
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
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { CompetenciaPipe } from '../../../shared/pipes/competencia.pipe';

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
    SectionCardComponent,
    MetricCardComponent,
    IconComponent,
    DataBrPipe,
    CompetenciaPipe,
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
  readonly totais = computed(() =>
    this.distribuicoes().reduce(
      (acc, d) => ({
        previstos: acc.previstos + d.previstos,
        checkIns: acc.checkIns + d.checkIns,
        retiradas: acc.retiradas + d.retiradas,
      }),
      { previstos: 0, checkIns: 0, retiradas: 0 },
    ),
  );

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
}
