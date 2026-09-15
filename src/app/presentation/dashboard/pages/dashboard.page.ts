import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GetDashboardUseCase } from '../../../application/dashboard/get-dashboard.use-case';
import type { Dashboard } from '../../../application/dashboard/dashboard.model';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { SearchFieldComponent } from '../../../shared/ui/search-field.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card.component';
import { RouterLink } from '@angular/router';

type InsumoCritico = Dashboard['insumosCriticos'][number] & { nivelPercentual: number };

type AlertaExibicao = Dashboard['alertas'][number] & { icone: string; rota: string | null };

const SEVERIDADE_ORDEM: Record<string, number> = { CRITICO: 0, ATENCAO: 1, INFO: 2 };
const SEVERIDADE_ICONE: Record<string, string> = { CRITICO: '⛔', ATENCAO: '⚠️', INFO: 'ℹ️' };
const ROTA_POR_CODIGO: Array<{ termo: string; rota: string }> = [
  { termo: 'ESTOQUE', rota: '/estoque' },
  { termo: 'INSUMO', rota: '/estoque' },
  { termo: 'MONTAGEM', rota: '/montagem' },
  { termo: 'CESTA', rota: '/montagem' },
  { termo: 'DISTRIBUICAO', rota: '/distribuicoes' },
  { termo: 'CAPACIDADE', rota: '/capacidade' },
  { termo: 'BENEFICIARIO', rota: '/beneficiarios' },
];

function rotaParaAlerta(codigo: string): string | null {
  const encontrada = ROTA_POR_CODIGO.find(({ termo }) => codigo.toUpperCase().includes(termo));
  return encontrada?.rota ?? null;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [LoadingStateComponent, ErrorStateComponent, PageHeaderComponent, SearchFieldComponent, MetricCardComponent, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardPage implements OnInit {
  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly refreshing = signal(false);
  readonly insumoFiltro = signal('');

  readonly alertas = computed<AlertaExibicao[]>(() => {
    const lista = this.data()?.alertas ?? [];
    return [...lista]
      .sort((a, b) => (SEVERIDADE_ORDEM[a.nivel] ?? 99) - (SEVERIDADE_ORDEM[b.nivel] ?? 99))
      .map((alerta) => ({
        ...alerta,
        icone: SEVERIDADE_ICONE[alerta.nivel] ?? 'ℹ️',
        rota: rotaParaAlerta(alerta.codigo),
      }));
  });

  readonly insumosCriticos = computed<InsumoCritico[]>(() => {
    const lista = this.data()?.insumosCriticos ?? [];
    return lista.map((item) => ({
      ...item,
      nivelPercentual: item.capacidade > 0 ? Math.min(100, Math.round((item.disponivel / item.capacidade) * 100)) : 0,
    }));
  });

  readonly insumosFiltrados = computed(() => {
    const termo = this.insumoFiltro().toLowerCase();
    const lista = this.insumosCriticos();
    const filtrados = termo ? lista.filter((item) => item.nome.toLowerCase().includes(termo)) : lista;
    return filtrados.slice(0, 8);
  });

  readonly coberturaStatusLabel = computed(() => {
    const status = this.data()?.saude.proximaDistribuicao.status ?? '';
    return status.replace('_', ' ');
  });

  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const isFirstLoad = this.data() === null;
    this.loading.set(isFirstLoad);
    this.refreshing.set(!isFirstLoad);
    this.error.set('');
    try {
      this.data.set(await firstValueFrom(this.getDashboard.execute()));
    } catch (e) {
      this.error.set(userErrorMessage(e, 'Não foi possível carregar o dashboard.'));
    } finally {
      this.loading.set(false);
      this.refreshing.set(false);
    }
  }

  onInsumoFiltroChange(termo: string): void {
    this.insumoFiltro.set(termo);
  }
}
