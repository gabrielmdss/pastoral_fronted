import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ListarPlanejamentosUseCase } from '../../../application/planejamento/planejamento.use-cases';
import type { Planejamento } from '../../../domain/planejamento/planejamento.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
@Component({
  selector: 'app-planejamentos-list',
  imports: [RouterLink, DatePipe],
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
