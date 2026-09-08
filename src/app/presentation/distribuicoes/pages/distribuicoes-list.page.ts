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

@Component({
  selector: 'app-distribuicoes-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  templateUrl: './distribuicoes-list.page.html',
  styleUrl: './distribuicoes-list.page.scss',
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

  statusLabel(status: Distribuicao['status']): string {
    const labels: Record<
      Distribuicao['status'],
      string
    > = {
      PLANEJADA: 'Planejada',
      PREPARADA: 'Preparada',
      ABERTA: 'Aberta',
      ENCERRADA: 'Encerrada',
    };

    return labels[status];
  }
}