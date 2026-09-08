import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subject, startWith, switchMap, catchError, of, map } from 'rxjs';
import { GerarCompetenciaUseCase, ListarCompetenciasUseCase, ObterCompetenciaUseCase } from '../../../application/competencias/competencias.use-cases';
import type { Competencia } from '../../../domain/competencias/competencia.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';

@Component({
  selector: 'app-competencias-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './competencias.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CompetenciasPage {
  private readonly listar = inject(ListarCompetenciasUseCase);
  private readonly obter = inject(ObterCompetenciaUseCase);
  private readonly gerar = inject(GerarCompetenciaUseCase);
  private readonly destroy = inject(DestroyRef);
  private readonly refreshRequested = new Subject<void>();
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly podeGerar = inject(SessionFacade).hasPermission('DISTRIBUICAO_ABRIR');
  readonly items = signal<Competencia[]>([]);
  readonly detalhe = signal<Competencia | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly form = new FormGroup({
    ano: new FormControl<number | null>(null, [Validators.required, Validators.min(2000), Validators.max(2200), Validators.pattern(/^\d+$/)]),
    mes: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(12), Validators.pattern(/^\d+$/)]),
  });
  constructor() {
    this.refreshRequested.pipe(
      startWith(undefined),
      switchMap(() => {
        this.loading.set(true);
        this.error.set('');
        const request = this.id ? this.obter.execute(this.id).pipe(map(item => [item])) : this.listar.execute();
        return request.pipe(
          catchError(e => { this.error.set(userErrorMessage(e, 'Não foi possível consultar competências.')); return of([]); }),
          finalize(() => this.loading.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroy),
    ).subscribe(items => { this.items.set(items); this.detalhe.set(this.id ? items[0] ?? null : null); });
  }
  carregar() { this.refreshRequested.next(); }
  gerarCompetencia() {
    if (!this.podeGerar || this.saving() || this.form.invalid) return;
    const { ano, mes } = this.form.getRawValue();
    if (ano === null || mes === null) return;
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    this.gerar.execute({ ano, mes }).pipe(
      takeUntilDestroyed(this.destroy),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: item => {
        this.feedback.set(`Competência ${item.mes}/${item.ano} gerada com sucesso.`);
        this.carregar();
      },
      error: e => this.mutationError.set(userErrorMessage(e, 'Não foi possível gerar a competência.')),
    });
  }
}
