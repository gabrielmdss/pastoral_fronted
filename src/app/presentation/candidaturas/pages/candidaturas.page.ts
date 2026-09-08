import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  AdmitirCandidaturaUseCase,
  CriarCandidaturaUseCase,
  ListarCandidaturasUseCase,
  MarcarNaoLocalizadoUseCase,
  PriorizarCandidaturaUseCase,
  RegistrarContatoUseCase,
} from '../../../application/candidaturas/candidaturas.use-cases';
import type { Candidatura } from '../../../domain/candidaturas/candidatura.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { PessoaSearchFieldComponent } from '../../shared/pessoas/pessoa-search-field.component';
import { ListarGruposUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
import type { GrupoDistribuicao } from '../../../application/beneficiarios/catalogos.models';
import type { Pessoa } from '../../../domain/pessoas/pessoa.model';
type Mode = 'nova' | 'priorizar' | 'contato' | 'nao-localizado' | 'admitir';
@Component({
  selector: 'app-candidaturas-page',
  imports: [
    ReactiveFormsModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    StatusBadgeComponent,
    PessoaSearchFieldComponent,
  ],
  templateUrl: './candidaturas.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CandidaturasPage {
  readonly items = signal<Candidatura[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly mode = signal<Mode | null>(null);
  readonly selected = signal<Candidatura | null>(null);
  readonly mutation = signal(false);
  readonly feedback = signal('');
  readonly grupos = signal<GrupoDistribuicao[]>([]);
  readonly pessoa = signal<Pessoa | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly prioridade = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });
  readonly contato = new FormGroup({
    resultado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    observacao: new FormControl<string | null>(null),
  });
  readonly admissao = new FormGroup({
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
    private readonly listar: ListarCandidaturasUseCase,
    private readonly criar: CriarCandidaturaUseCase,
    private readonly priorizar: PriorizarCandidaturaUseCase,
    private readonly registrar: RegistrarContatoUseCase,
    private readonly naoLocalizado: MarcarNaoLocalizadoUseCase,
    private readonly admitir: AdmitirCandidaturaUseCase,
    grupos: ListarGruposUseCase,
    readonly session: SessionFacade,
  ) {
    this.connect();
    grupos
      .execute()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe((items) => this.grupos.set(items));
  }
  private connect() {
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
            status: this.status.value,
            ...(term ? (/^\d+$/.test(term) ? { documento: term } : { nome: term }) : {}),
          };
          return this.listar.execute(f).pipe(
            catchError((e) => {
              this.error.set(userErrorMessage(e, 'Não foi possível carregar a lista de espera.'));
              return of([]);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((x) => this.items.set(x));
  }
  refresh() {
    this.refreshRequested.next();
  }
  open(mode: Mode, item: Candidatura | null = null) {
    if (mode === 'nova') this.pessoa.set(null);
    this.selected.set(item);
    this.mode.set(mode);
    this.feedback.set('');
  }
  active(c: Candidatura) {
    return c.status === 'AGUARDANDO' || c.status === 'CONVOCADO';
  }
  async submit() {
    const mode = this.mode(),
      item = this.selected();
    if (!mode || this.mutation()) return;
    this.mutation.set(true);
    try {
      if (mode === 'nova') {
        if (!this.pessoa()) return;
        await firstValueFrom(this.criar.execute(this.pessoa()!.id));
      }
      if (mode === 'priorizar' && item) {
        if (this.prioridade.invalid) return;
        await firstValueFrom(this.priorizar.execute(item.id, this.prioridade.value));
      }
      if (mode === 'contato' && item) {
        if (this.contato.invalid) return;
        await firstValueFrom(this.registrar.execute(item.id, this.contato.getRawValue()));
      }
      if (mode === 'nao-localizado' && item)
        await firstValueFrom(this.naoLocalizado.execute(item.id));
      if (mode === 'admitir' && item) {
        if (this.admissao.invalid) return;
        const v = this.admissao.getRawValue();
        await firstValueFrom(
          this.admitir.execute(item.id, {
            ...v,
            justificativaExcecao: v.justificativaExcecao?.trim() || null,
          }),
        );
      }
      this.feedback.set('Operação concluída com sucesso.');
      this.mode.set(null);
      this.pessoa.set(null);
      this.refresh();
    } catch (e) {
      this.feedback.set(userErrorMessage(e));
    } finally {
      this.mutation.set(false);
    }
  }
}
