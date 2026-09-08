import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  ListarLotesUseCase,
  ObterLoteUseCase,
  MontarLoteUseCase,
  AjustarLoteUseCase,
  DesmontarLoteUseCase,
} from '../../../application/montagem/montagem.use-cases';
import {
  ListarPlanejamentosUseCase,
  ObterPlanejamentoUseCase,
} from '../../../application/planejamento/planejamento.use-cases';
import { ListarInsumosUseCase } from '../../../application/estoque/estoque.use-cases';
import type { LoteMontagem } from '../../../domain/montagem/montagem.model';
import type {
  Planejamento,
  PlanejamentoDetalhe,
} from '../../../domain/planejamento/planejamento.model';
import type { InsumoSaldo } from '../../../domain/estoque/estoque.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';

@Component({
  selector: 'app-montagem',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './montagem.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MontagemPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);
  private readonly listar = inject(ListarLotesUseCase);
  private readonly obter = inject(ObterLoteUseCase);
  private readonly montarUC = inject(MontarLoteUseCase);
  private readonly ajustarUC = inject(AjustarLoteUseCase);
  private readonly desmontarUC = inject(DesmontarLoteUseCase);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly planosUC = inject(ListarPlanejamentosUseCase);
  private readonly planoUC = inject(ObterPlanejamentoUseCase);
  private readonly estoqueUC = inject(ListarInsumosUseCase);
  readonly session = inject(SessionFacade);
  readonly podeMontar = this.session.hasPermission('CESTA_MONTAR');
  readonly id = signal<string | null>(null);
  readonly lotes = signal<LoteMontagem[]>([]);
  readonly lote = signal<LoteMontagem | null>(null);
  readonly planos = signal<Planejamento[]>([]);
  readonly plano = signal<PlanejamentoDetalhe | null>(null);
  readonly estoque = signal<InsumoSaldo[]>([]);
  readonly loading = signal(false);
  readonly planLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly planError = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly criando = signal(false);
  readonly acao = signal<'ajuste' | 'desmontagem' | null>(null);
  readonly podeAjustar = computed(
    () => this.session.hasPermission('CESTA_AJUSTAR_LOTE') && this.lote()?.podeAjustar === true,
  );
  readonly podeDesmontar = computed(
    () => this.session.hasPermission('CESTA_DESMONTAR') && this.lote()?.podeDesmontar === true,
  );
  readonly ajusteForm = this.fb.group({
    quantidadeCestasAfetadas: [
      1,
      [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
    ],
    motivo: ['', [Validators.required, Validators.pattern(/\S/)]],
    itens: this.fb.array([this.novoItemAjuste()]),
  });
  readonly desmontagemForm = this.fb.group({
    quantidade: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    motivo: ['', [Validators.required, Validators.pattern(/\S/)]],
  });
  readonly planoPorId = computed(() => new Map(this.planos().map((p) => [p.id, p])));
  readonly insumoPorId = computed(() => new Map(this.estoque().map((i) => [i.apresentacaoId, i])));
  readonly aprovadas = computed(
    () => this.plano()?.versoes.filter((v) => v.status === 'APROVADA') ?? [],
  );
  readonly form = inject(FormBuilder).nonNullable.group({
    planejamentoId: ['', Validators.required],
    planejamentoVersaoId: ['', Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });
  private loadVersion = 0;
  private planVersion = 0;
  constructor() {
    this.form.controls.planejamentoId.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => {
        void this.carregarPlano();
      });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.id.set(params.get('id'));
      this.lote.set(null);
      this.criando.set(false);
      this.acao.set(null);
      this.planVersion++;
      this.planLoading.set(false);
      this.plano.set(null);
      this.planError.set('');
      this.form.reset({}, { emitEvent: false });
      this.mutationError.set('');
      this.feedback.set(
        this.router.getCurrentNavigation()?.extras.state?.['montado'] === true
          ? 'Lote montado. Confira os dados retornados abaixo.'
          : '',
      );
      void this.carregar();
    });
  }
  async carregar() {
    const version = ++this.loadVersion,
      id = this.id();
    this.loading.set(true);
    this.error.set('');
    try {
      const [data, planos, estoque] = await firstValueFrom(
        forkJoin([
          id ? this.obter.execute(id) : this.listar.execute(),
          this.planosUC.execute(),
          this.estoqueUC.execute(),
        ]).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (version !== this.loadVersion) return;
      this.planos.set(planos);
      this.estoque.set(estoque);
      if (id) {
        this.lote.set(data as LoteMontagem | null);
        if (!data) this.error.set('Lote não encontrado.');
      } else this.lotes.set(data as LoteMontagem[]);
    } catch (e) {
      if (!this.destroy.destroyed && version === this.loadVersion)
        this.error.set(userErrorMessage(e, 'Não foi possível consultar os lotes.'));
    } finally {
      if (version === this.loadVersion) this.loading.set(false);
    }
  }
  async carregarPlano() {
    const version = ++this.planVersion,
      id = this.form.controls.planejamentoId.value;
    this.plano.set(null);
    this.planError.set('');
    this.form.controls.planejamentoVersaoId.setValue('');
    this.planLoading.set(false);
    if (!id) return;
    this.planLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.planoUC.execute(id).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (version !== this.planVersion) return;
      this.plano.set(result);
      if (!result) this.planError.set('Planejamento não encontrado. Atualize a consulta.');
    } catch (e) {
      if (!this.destroy.destroyed && version === this.planVersion)
        this.planError.set(userErrorMessage(e));
    } finally {
      if (version === this.planVersion) this.planLoading.set(false);
    }
  }
  private novoItemAjuste() {
    return this.fb.group({
      apresentacaoInsumoId: ['', Validators.required],
      operacao: this.fb.control<'ADICIONAR' | 'REMOVER'>('ADICIONAR', Validators.required),
      quantidadePorCesta: [
        1,
        [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
      ],
    });
  }
  adicionarItemAjuste() {
    if (!this.saving()) this.ajusteForm.controls.itens.push(this.novoItemAjuste());
  }
  removerItemAjuste(index: number) {
    if (!this.saving() && this.ajusteForm.controls.itens.length > 1)
      this.ajusteForm.controls.itens.removeAt(index);
  }
  abrirAcao(acao: 'ajuste' | 'desmontagem') {
    if (
      this.saving() ||
      this.loading() ||
      this.error() ||
      !(acao === 'ajuste' ? this.podeAjustar() : this.podeDesmontar())
    )
      return;
    this.mutationError.set('');
    this.feedback.set('');
    const lote = this.lote();
    this.desmontagemForm.reset({
      quantidade:
        (lote?.permiteDesmontagemParcial ? lote.quantidadeDisponivel : lote?.quantidadeMontada) ??
        1,
      motivo: '',
    });
    this.acao.set(acao);
  }
  async confirmarAcao() {
    const acao = this.acao(),
      lote = this.lote(),
      id = this.id();
    if (!acao || !lote || !id || this.saving() || this.loading() || this.error()) return;
    const ajuste = acao === 'ajuste';
    if (!(ajuste ? this.podeAjustar() : this.podeDesmontar())) return;
    const form = ajuste ? this.ajusteForm : this.desmontagemForm;
    form.markAllAsTouched();
    if (form.invalid) return;
    const quantidade = lote.permiteDesmontagemParcial
      ? this.desmontagemForm.controls.quantidade.value
      : lote.quantidadeMontada;
    if (
      !window.confirm(
        ajuste
          ? `Confirmar ajuste no lote ${id}? Os itens informados serão adicionados ou removidos fisicamente do lote.`
          : `Desmontar ${quantidade} cestas do lote ${id}? O conteúdo efetivo será devolvido ao estoque.`,
      )
    )
      return;
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      if (ajuste) {
        const input = this.ajusteForm.getRawValue();
        await firstValueFrom(
          this.ajustarUC
            .execute(id, { ...input, motivo: input.motivo.trim() })
            .pipe(takeUntilDestroyed(this.destroy)),
        );
      } else {
        await firstValueFrom(
          this.desmontarUC
            .execute(id, {
              quantidade,
              motivo: this.desmontagemForm.controls.motivo.value.trim(),
            })
            .pipe(takeUntilDestroyed(this.destroy)),
        );
      }
      if (!this.destroy.destroyed && this.id() === id) {
        this.acao.set(null);
        if (ajuste) {
          this.ajusteForm.reset({ quantidadeCestasAfetadas: 1, motivo: '' });
          this.ajusteForm.controls.itens.clear();
          this.ajusteForm.controls.itens.push(this.novoItemAjuste());
        }
        this.feedback.set(ajuste ? 'Ajuste confirmado.' : 'Desmontagem confirmada.');
        await this.carregar();
      }
    } catch (e) {
      if (!this.destroy.destroyed && this.id() === id) {
        this.mutationError.set(
          userErrorMessage(e) +
            (e instanceof HttpErrorResponse && e.status === 409
              ? ' O estado ou o estoque pode ter mudado em outra operação. Os dados serão reconsultados.'
              : ''),
        );
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
  async montar() {
    if (
      !this.podeMontar ||
      this.id() ||
      this.saving() ||
      this.loading() ||
      this.error() ||
      this.planLoading() ||
      this.planError() ||
      this.form.invalid
    )
      return;
    const { planejamentoVersaoId, quantidade } = this.form.getRawValue();
    const versao = this.aprovadas().find((v) => v.id === planejamentoVersaoId);
    if (!versao) return;
    if (
      !window.confirm(
        `Montar ${quantidade} cestas de ${this.plano()?.modelo}, versão ${versao.numeroVersao} do planejamento? A operação consumirá os insumos conforme validação do estoque.`,
      )
    )
      return;
    this.saving.set(true);
    this.mutationError.set('');
    this.feedback.set('');
    try {
      const result = await firstValueFrom(
        this.montarUC
          .execute({ planejamentoVersaoId, quantidade })
          .pipe(takeUntilDestroyed(this.destroy)),
      );
      if (!this.destroy.destroyed) {
        this.feedback.set('Montagem confirmada.');
        await this.carregar();
        await this.router.navigate(['/montagem', result.id], { state: { montado: true } });
      }
    } catch (e) {
      if (!this.destroy.destroyed) {
        this.mutationError.set(
          userErrorMessage(e) +
            (e instanceof HttpErrorResponse && e.status === 409
              ? ' O estado ou o estoque pode ter mudado em outra operação. Os dados serão reconsultados.'
              : ''),
        );
        await this.carregar();
        await this.carregarPlano();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
