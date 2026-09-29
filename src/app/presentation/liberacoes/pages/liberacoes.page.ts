import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  ListarLiberacoesUseCase,
  LiberarCestasUseCase,
} from '../../../application/liberacoes/liberacoes.use-cases';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { ListarLotesUseCase } from '../../../application/montagem/montagem.use-cases';
import { ListarPlanejamentosUseCase } from '../../../application/planejamento/planejamento.use-cases';
import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import type { LoteMontagem } from '../../../domain/montagem/montagem.model';
import type { Planejamento } from '../../../domain/planejamento/planejamento.model';
import type { LiberacaoCestas } from '../../../domain/liberacoes/liberacao.model';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { DataBrPipe, formatarDataBr } from '../../../shared/pipes/data-br.pipe';
import { CompetenciaPipe, formatarCompetencia } from '../../../shared/pipes/competencia.pipe';
import { Confirmacao, ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';

@Component({
  selector: 'app-liberacoes',
  imports: [ConfirmDialogComponent, DecimalPipe, ReactiveFormsModule, RouterLink, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent, PageHeaderComponent, SectionCardComponent, MetricCardComponent, StatusBadgeComponent, IconComponent, DataBrPipe, CompetenciaPipe],
  templateUrl: './liberacoes.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LiberacoesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly obterDistribuicao = inject(ObterDistribuicaoUseCase);
  private readonly listar = inject(ListarLiberacoesUseCase);
  private readonly liberarUC = inject(LiberarCestasUseCase);
  private readonly listarLotes = inject(ListarLotesUseCase);
  private readonly listarPlanos = inject(ListarPlanejamentosUseCase);
  readonly session = inject(SessionFacade);
  readonly podeLiberar = this.session.hasPermission('CESTA_LIBERAR_DISTRIBUICAO');
  readonly podeAtender = this.session.hasPermission('DISTRIBUICAO_TRIAGEM');
  readonly id = signal<string | null>(null);
  readonly distribuicao = signal<Distribuicao | null>(null);
  readonly lotes = signal<LoteMontagem[]>([]);
  readonly planos = signal<Planejamento[]>([]);
  readonly liberacoes = signal<LiberacaoCestas[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  /** Confirmação das operações irreversíveis (substitui window.confirm). */
  readonly confirmacao = new Confirmacao();
  readonly error = signal('');
  readonly mutationError = signal('');
  readonly feedback = signal('');
  readonly lotePorId = computed(() => new Map(this.lotes().map((l) => [l.id, l])));
  readonly planoPorId = computed(() => new Map(this.planos().map((p) => [p.id, p])));
  readonly utilizaveis = computed(() =>
    this.lotes().filter((l) => l.status === 'ATIVO' && l.quantidadeDisponivel > 0),
  );
  readonly form = inject(FormBuilder).nonNullable.group({
    loteMontagemId: ['', Validators.required],
    quantidade: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });
  private epoch = 0;
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.id.set(params.get('id'));
      this.distribuicao.set(null);
      this.form.reset();
      this.feedback.set('');
      this.mutationError.set('');
      void this.carregar();
    });
  }
  async carregar() {
    const epoch = ++this.epoch,
      id = this.id();
    this.error.set('');
    if (!id) {
      this.error.set('Distribuição não informada.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    try {
      const result = await firstValueFrom(
        forkJoin({
          distribuicao: this.obterDistribuicao.execute(id),
          liberacoes: this.listar.execute(id),
          lotes: this.listarLotes.execute(),
          planos: this.listarPlanos.execute(),
        }).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (epoch !== this.epoch) return;
      this.distribuicao.set(result.distribuicao);
      this.liberacoes.set(result.liberacoes);
      this.lotes.set(result.lotes);
      this.planos.set(result.planos);
      if (!result.distribuicao) this.error.set('Distribuição não encontrada.');
      if (!this.utilizaveis().some((l) => l.id === this.form.controls.loteMontagemId.value))
        this.form.controls.loteMontagemId.setValue('');
    } catch (e) {
      if (!this.destroy.destroyed && epoch === this.epoch)
        this.error.set(userErrorMessage(e, 'Não foi possível consultar as liberações.'));
    } finally {
      if (epoch === this.epoch) this.loading.set(false);
    }
  }
  loteLabel(lote: LoteMontagem): string {
    const plano = this.planoPorId().get(lote.planejamento.id);
    return `Lote ${lote.id} · ${plano?.modelo ?? 'Modelo não retornado'} · Versão ${lote.planejamento.numeroVersao} do planejamento`;
  }
  destinoLabel(d: Distribuicao): string {
    return `${d.grupo.nome} · ${formatarCompetencia(d.competencia, 'numerica')} · ${formatarDataBr(d.dataPrevista)}`;
  }
  async liberar() {
    const d = this.distribuicao();
    if (
      !d ||
      !this.podeLiberar ||
      d.status === 'ENCERRADA' ||
      this.saving() ||
      this.loading() ||
      this.error() ||
      this.form.invalid
    )
      return;
    const input = this.form.getRawValue();
    const lote = this.utilizaveis().find((l) => l.id === input.loteMontagemId);
    if (!lote) return;
    const confirmado = await this.confirmacao.pedir({
      title: 'Liberar cestas',
      message: `Liberar ${input.quantidade} cestas de ${this.loteLabel(lote)} para ${this.destinoLabel(d)}? A disponibilidade será verificada pelo estoque.`,
      confirmLabel: 'Liberar cestas',
    });
    if (!confirmado || this.saving()) return;
    this.saving.set(true);
    this.feedback.set('');
    this.mutationError.set('');
    try {
      await firstValueFrom(
        this.liberarUC.execute(d.id, input).pipe(takeUntilDestroyed(this.destroy)),
      );
      if (this.destroy.destroyed || this.id() !== d.id) return;
      this.form.reset();
      this.feedback.set('Liberação confirmada. Os saldos serão consultados novamente.');
      this.toast.success('Liberação confirmada. Os saldos serão consultados novamente.');
      await this.carregar();
    } catch (e) {
      if (!this.destroy.destroyed && this.id() === d.id) {
        this.mutationError.set(
          userErrorMessage(e) +
            (e instanceof HttpErrorResponse && e.status === 409
              ? ' A disponibilidade ou o estado pode ter mudado em outra operação. Consulte os dados atualizados antes de tentar novamente.'
              : ''),
        );
        await this.carregar();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
