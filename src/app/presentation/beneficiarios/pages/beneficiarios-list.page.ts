import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  map,
  merge,
  Subject,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import {
  AdmitirBeneficiarioUseCase,
  BuscarBeneficiariosUseCase,
} from '../../../application/beneficiarios/beneficiarios.use-cases';
import type { BeneficiarioResumo } from '../../../domain/beneficiarios/beneficiario.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { PessoaSearchFieldComponent } from '../../shared/pessoas/pessoa-search-field.component';
import { ListarGruposUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
import type { GrupoDistribuicao } from '../../../application/beneficiarios/catalogos.models';
import type { Pessoa } from '../../../domain/pessoas/pessoa.model';
@Component({
  selector: 'app-beneficiarios-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    PessoaSearchFieldComponent,
  ],
  templateUrl: './beneficiarios-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BeneficiariosListPage {
  readonly items = signal<BeneficiarioResumo[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly dialog = signal(false);
  readonly mutation = signal(false);
  readonly feedback = signal('');
  readonly grupos = signal<GrupoDistribuicao[]>([]);
  readonly pessoa = signal<Pessoa | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly filters = new FormGroup({
    status: new FormControl('', { nonNullable: true }),
    grupoId: new FormControl('', { nonNullable: true }),
  });
  readonly admission = new FormGroup({
    grupoId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    autorizarAcimaCapacidade: new FormControl(false, { nonNullable: true }),
    justificativaExcecao: new FormControl<string | null>(null, [Validators.minLength(10)]),
  });
  private readonly destroy = inject(DestroyRef);
  private readonly refreshRequested = new Subject<void>();
  constructor(
    private readonly buscar: BuscarBeneficiariosUseCase,
    private readonly admitir: AdmitirBeneficiarioUseCase,
    grupos: ListarGruposUseCase,
    readonly session: SessionFacade,
  ) {
    this.connectSearch();
    grupos
      .execute()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((items) => this.grupos.set(items));
  }
  private connectSearch(): void {
    merge(
      this.search.valueChanges.pipe(
        map((term) => term.trim()),
        debounceTime(350),
        distinctUntilChanged(),
      ),
      this.refreshRequested,
    ).pipe(
        startWith(undefined),
        switchMap(() => {
          const term = this.search.value.trim();
          this.loading.set(true);
          this.error.set('');
          const f = {
            ...this.filters.getRawValue(),
            ...(term ? (/^\d+$/.test(term) ? { documento: term } : { nome: term }) : {}),
          };
          return this.buscar.execute(f).pipe(
            catchError((e) => {
              this.error.set(userErrorMessage(e, 'Não foi possível buscar beneficiários.'));
              return of([]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((x) => this.items.set(x));
  }
  applyFilters(): void {
    this.refreshRequested.next();
  }
  openAdmission(): void {
    this.pessoa.set(null);
    this.admission.reset({
      grupoId: '',
      autorizarAcimaCapacidade: false,
      justificativaExcecao: null,
    });
    this.dialog.set(true);
  }
  closeAdmission(): void {
    this.dialog.set(false);
    this.pessoa.set(null);
  }
  async submitAdmission(): Promise<void> {
    if (this.admission.invalid || this.mutation() || !this.pessoa()) return;
    this.mutation.set(true);
    this.feedback.set('');
    const v = this.admission.getRawValue();
    try {
      await firstValueFrom(
        this.admitir.execute({
          ...v,
          pessoaId: this.pessoa()!.id,
          justificativaExcecao: v.justificativaExcecao?.trim() || null,
        }),
      );
      this.feedback.set('Beneficiário admitido com sucesso.');
      this.closeAdmission();
      this.applyFilters();
    } catch (e) {
      this.feedback.set(userErrorMessage(e));
    } finally {
      this.mutation.set(false);
    }
  }
}
