import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ListarPlanejamentosUseCase } from '../../../application/planejamento/planejamento.use-cases';
import type { Planejamento } from '../../../domain/planejamento/planejamento.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { CompetenciaPipe } from '../../../shared/pipes/competencia.pipe';
@Component({
  selector: 'app-planejamentos-list',
  host: { class: 'ui-page' },
  imports: [
    RouterLink,
    DecimalPipe,
    DataBrPipe,
    CompetenciaPipe,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    SectionCardComponent,
    IconComponent,
  ],
  templateUrl: './planejamentos-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PlanejamentosListPage {
  private readonly listar = inject(ListarPlanejamentosUseCase);
  private readonly destroy = inject(DestroyRef);
  readonly session = inject(SessionFacade);
  readonly items = signal<Planejamento[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  constructor() {
    this.carregar();
  }
  carregar() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.listar
      .execute()
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (items) => this.items.set(items),
        error: (e) =>
          this.error.set(userErrorMessage(e, 'Não foi possível consultar planejamentos.')),
      });
  }
}
