import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, type Observable, type Subscription } from 'rxjs';
import * as U from '../../../application/relatorios/relatorios.use-cases';
import type * as M from '../../../domain/relatorios/relatorios.model';
import { ListarGruposUseCase } from '../../../application/beneficiarios/catalogos.use-cases';
import type { GrupoDistribuicao } from '../../../application/beneficiarios/catalogos.models';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
@Component({
  selector: 'app-relatorios',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './relatorios.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RelatoriosPage {
  private readonly session = inject(SessionFacade);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly distribuicoesUC = inject(U.RelatorioDistribuicoesUseCase);
  private readonly beneficiariosUC = inject(U.RelatorioBeneficiariosUseCase);
  private readonly estoqueUC = inject(U.RelatorioEstoqueUseCase);
  private readonly gruposUC = inject(ListarGruposUseCase);
  readonly tipos = (
    [
      {
        id: 'distribuicoes',
        nome: 'Distribuições / atendimentos',
        permission: 'BENEFICIARIO_VISUALIZAR',
      },
      { id: 'beneficiarios', nome: 'Beneficiários', permission: 'BENEFICIARIO_VISUALIZAR' },
      { id: 'estoque', nome: 'Estoque', permission: 'ESTOQUE_VISUALIZAR' },
    ] as const
  ).filter((t) => this.session.hasPermission(t.permission));
  readonly tipo = new FormControl<M.RelatorioTipo>(this.tipos[0]?.id ?? 'distribuicoes', {
    nonNullable: true,
  });
  readonly form = this.fb.group({
    limit: [
      50,
      [Validators.required, Validators.min(1), Validators.max(100), Validators.pattern(/^\d+$/)],
    ],
    grupoId: '',
    competencia: '',
    dataInicio: '',
    dataFim: '',
    dataAdmissaoInicio: '',
    dataAdmissaoFim: '',
    insumo: ['', Validators.maxLength(100)],
    statusDistribuicao: this.fb.control<M.StatusDistribuicaoRelatorio | ''>(''),
    statusBeneficiario: this.fb.control<M.StatusBeneficiarioRelatorio | ''>(''),
    tipoMovimento: this.fb.control<M.TipoMovimentoRelatorio | ''>(''),
  });
  readonly grupos = signal<GrupoDistribuicao[]>([]);
  readonly gruposLoading = signal(false);
  readonly gruposError = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly resultado = signal<M.ResultadoRelatorio | null>(null);
  readonly movimentos: readonly M.TipoMovimentoRelatorio[] = [
    'ENTRADA',
    'CONSUMO_MONTAGEM',
    'RETORNO_DESMONTAGEM',
    'PERDA',
    'AJUSTE_INVENTARIO',
  ];
  private request: Subscription | undefined;
  private epoch = 0;
  private paginaConsultada = 1;
  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => this.invalidar());
    this.tipo.valueChanges.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => {
      this.form.reset({}, { emitEvent: false });
      this.invalidar();
    });
    this.carregarGrupos();
  }
  carregarGrupos() {
    if (!this.session.hasPermission('BENEFICIARIO_VISUALIZAR') || this.gruposLoading()) return;
    this.gruposLoading.set(true);
    this.gruposError.set('');
    this.gruposUC
      .execute()
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => this.gruposLoading.set(false)),
      )
      .subscribe({
        next: (g) => this.grupos.set(g),
        error: (e) =>
          this.gruposError.set(userErrorMessage(e, 'Não foi possível consultar os grupos.')),
      });
  }
  private invalidar() {
    this.epoch++;
    this.request?.unsubscribe();
    this.loading.set(false);
    this.resultado.set(null);
    this.error.set('');
    this.paginaConsultada = 1;
  }
  consultar(page = 1) {
    if (
      !this.tipos.some((t) => t.id === this.tipo.value) ||
      this.form.invalid ||
      !Number.isInteger(page) ||
      page < 1
    )
      return;
    this.invalidar();
    this.paginaConsultada = page;
    const epoch = this.epoch;
    const v = this.form.getRawValue(),
      base = { page, limit: v.limit };
    let request: Observable<M.ResultadoRelatorio>;
    switch (this.tipo.value) {
      case 'distribuicoes':
        request = this.distribuicoesUC
          .execute({
            ...base,
            ...(v.grupoId ? { grupoId: v.grupoId } : {}),
            ...(v.competencia ? { competencia: v.competencia } : {}),
            ...(v.statusDistribuicao ? { status: v.statusDistribuicao } : {}),
            ...(v.dataInicio ? { dataInicio: v.dataInicio } : {}),
            ...(v.dataFim ? { dataFim: v.dataFim } : {}),
          })
          .pipe(map((pagina) => ({ tipo: 'distribuicoes' as const, pagina })));
        break;
      case 'beneficiarios':
        request = this.beneficiariosUC
          .execute({
            ...base,
            ...(v.grupoId ? { grupoId: v.grupoId } : {}),
            ...(v.statusBeneficiario ? { status: v.statusBeneficiario } : {}),
            ...(v.dataAdmissaoInicio ? { dataAdmissaoInicio: v.dataAdmissaoInicio } : {}),
            ...(v.dataAdmissaoFim ? { dataAdmissaoFim: v.dataAdmissaoFim } : {}),
          })
          .pipe(map((pagina) => ({ tipo: 'beneficiarios' as const, pagina })));
        break;
      case 'estoque':
        request = this.estoqueUC
          .execute({
            ...base,
            ...(v.insumo.trim() ? { insumo: v.insumo.trim() } : {}),
            ...(v.tipoMovimento ? { tipoMovimento: v.tipoMovimento } : {}),
            ...(v.dataInicio ? { dataInicio: v.dataInicio } : {}),
            ...(v.dataFim ? { dataFim: v.dataFim } : {}),
          })
          .pipe(map((pagina) => ({ tipo: 'estoque' as const, pagina })));
        break;
    }
    this.loading.set(true);
    this.request = request
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          if (epoch === this.epoch) this.loading.set(false);
        }),
      )
      .subscribe({
        next: (r) => {
          if (epoch === this.epoch) this.resultado.set(r);
        },
        error: (e) => {
          if (epoch === this.epoch)
            this.error.set(userErrorMessage(e, 'Não foi possível consultar o relatório.'));
        },
      });
  }
  retry() {
    this.consultar(this.paginaConsultada);
  }
  anterior() {
    const page = this.resultado()?.pagina.meta.page;
    if (page && page > 1) this.consultar(page - 1);
  }
  proxima() {
    const meta = this.resultado()?.pagina.meta;
    if (meta && meta.page < meta.totalPages) this.consultar(meta.page + 1);
  }
}
