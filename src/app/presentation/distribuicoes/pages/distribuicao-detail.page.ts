import { CommonModule } from '@angular/common';
import { CestasAdicionaisComponent } from '../../atendimento/components/cestas-adicionais.component';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RemarcarDistribuicaoUseCase } from '../../../application/distribuicoes/remarcar-distribuicao.use-case';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { AbrirDistribuicaoUseCase } from '../../../application/distribuicoes/abrir-distribuicao.use-case';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { MetricCardComponent } from '../../../shared/ui/metric-card.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { SectionCardComponent } from '../../../shared/ui/section-card.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { DataBrPipe, formatarDataBr } from '../../../shared/pipes/data-br.pipe';
import { CompetenciaPipe } from '../../../shared/pipes/competencia.pipe';
import { HistoricoTimelineComponent } from '../../atendimento/components/historico-timeline.component';
import { ObterHistoricoDistribuicaoUseCase } from '../../../application/atendimento/use-cases/obter-historico.use-cases';
import type { HistoricoEvento } from '../../../domain/atendimento/historico.model';
import { MeterComponent } from '../../../shared/ui/meter.component';
import { Confirmacao, ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog.component';

@Component({
    selector: 'app-distribuicao-detail-page',
    standalone: true,
    imports: [ConfirmDialogComponent, MeterComponent, CommonModule, RouterLink, ReactiveFormsModule, CestasAdicionaisComponent, LoadingStateComponent, ErrorStateComponent, MetricCardComponent, HistoricoTimelineComponent, PageHeaderComponent, SectionCardComponent, StatusBadgeComponent, IconComponent, DataBrPipe, CompetenciaPipe],
    templateUrl: './distribuicao-detail.page.html',
    styleUrl: './distribuicao-detail.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DistribuicaoDetailPage {
    private readonly remarcarDistribuicao = inject(RemarcarDistribuicaoUseCase);
    readonly podeRemarcar = inject(SessionFacade).hasPermission('DISTRIBUICAO_REMARCAR');
    readonly remarcando = signal(false);
    /** Confirmação das operações irreversíveis (substitui window.confirm). */
    readonly confirmacao = new Confirmacao();
    readonly remarcacaoError = signal('');
    readonly remarcacaoFeedback = signal('');
    readonly remarcacao = new FormGroup({
        novaData: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        motivo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(1000)] }),
    });
    async remarcar(): Promise<void> {
        const item = this.distribuicao();
        if (!item || !this.podeRemarcar || this.remarcando() || this.remarcacao.invalid ||
            !['PLANEJADA', 'PREPARADA'].includes(item.status)) return;
        const input = this.remarcacao.getRawValue();
        input.motivo = input.motivo.trim();
        if (input.motivo.length < 3) {
            this.remarcacaoError.set('Informe um motivo com pelo menos 3 caracteres.');
            return;
        }
        const confirmado = await this.confirmacao.pedir({
            title: `Remarcar a distribuição para ${formatarDataBr(input.novaData)}?`,
            message: `Motivo: ${input.motivo}`,
            confirmLabel: 'Remarcar',
        });
        if (!confirmado || this.remarcando()) return;
        this.remarcando.set(true);
        this.remarcacaoError.set('');
        this.remarcacaoFeedback.set('');
        this.remarcarDistribuicao.execute(item.id, input).pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.remarcando.set(false)),
        ).subscribe({
            next: () => {
                this.remarcacaoFeedback.set('Distribuição remarcada com sucesso.');
                this.toast.success('Distribuição remarcada com sucesso.');
                this.remarcacao.reset();
                this.carregar();
            },
            error: error => this.remarcacaoError.set(userErrorMessage(error, 'Não foi possível remarcar a distribuição.')),
        });
    }
    private readonly toast = inject(ToastService);
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly obterDistribuicao = inject(ObterDistribuicaoUseCase);
    private readonly abrirDistribuicao =
        inject(AbrirDistribuicaoUseCase);
    private readonly encerrarDistribuicao =
        inject(EncerrarDistribuicaoUseCase);
    private readonly session = inject(SessionFacade);

    readonly podeAbrir = this.session.hasPermission('DISTRIBUICAO_ABRIR');
    readonly podeCestasAdicionais = this.session.hasPermission('CESTA_ADICIONAL_AUTORIZAR') || this.session.hasPermission('RETIRADA_REGISTRAR');
    // Mirrors the /distribuicoes/:id/liberacoes route guards.
    readonly podeConsultarLiberacoes = this.session.hasPermission('BENEFICIARIO_VISUALIZAR') && this.session.hasPermission('ESTOQUE_VISUALIZAR');
    private readonly obterHistorico = inject(ObterHistoricoDistribuicaoUseCase);
    readonly historico = signal<HistoricoEvento[]>([]);
    readonly historicoLoading = signal(false);
    readonly historicoError = signal<string | null>(null);
    readonly podeEncerrar = this.session.hasPermission('DISTRIBUICAO_ENCERRAR');
    readonly podeAtender = this.session.hasPermission('DISTRIBUICAO_TRIAGEM');

    readonly encerrando = signal(false);

    readonly abrindo = signal(false);
    readonly distribuicao = signal<Distribuicao | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    constructor() {
        this.carregar();
    }

    async abrir(): Promise<void> {
        const distribuicao = this.distribuicao();

        if (!distribuicao) {
            return;
        }

        const confirmar = await this.confirmacao.pedir({
            title: 'Abrir distribuição',
            message: `Deseja abrir a distribuição de ${distribuicao.grupo.nome} em ${formatarDataBr(distribuicao.dataPrevista)}?`,
            confirmLabel: 'Abrir distribuição',
        });

        if (!confirmar || this.abrindo()) {
            return;
        }

        this.abrindo.set(true);
        this.error.set(null);

        this.abrirDistribuicao
            .execute(distribuicao.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.abrindo.set(false);
                    this.toast.success('Distribuição aberta para atendimento.');
                    this.carregar();
                },
                error: () => {
                    this.abrindo.set(false);
                    this.error.set(
                        'Não foi possível abrir a distribuição.',
                    );
                },
            });
    }

    carregar(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (!id) {
            this.loading.set(false);
            this.error.set('Distribuição não informada.');
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        this.obterDistribuicao
            .execute(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (distribuicao) => {
                    this.distribuicao.set(distribuicao);
                    this.loading.set(false);
                    this.carregarHistorico(distribuicao.id);
                },
                error: () => {
                    this.distribuicao.set(null);
                    this.error.set('Não foi possível carregar a distribuição.');
                    this.loading.set(false);
                },
            });
    }

    carregarHistorico(id = this.distribuicao()?.id): void {
        if (!id) return;
        this.historicoLoading.set(true);
        this.historicoError.set(null);
        this.obterHistorico
            .execute(id)
            .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.historicoLoading.set(false)))
            .subscribe({
                next: (h) => this.historico.set(h.eventos),
                error: (error: unknown) => {
                    this.historico.set([]);
                    this.historicoError.set(userErrorMessage(error, 'Não foi possível carregar o histórico da distribuição.'));
                },
            });
    }

    async encerrar(): Promise<void> {
        const distribuicao = this.distribuicao();

        if (
            !distribuicao ||
            distribuicao.status !== 'ABERTA' ||
            !this.podeEncerrar ||
            this.encerrando()
        ) {
            return;
        }

        const confirmar = await this.confirmacao.pedir({
            title: `Deseja encerrar a distribuição de ${distribuicao.grupo.nome}?`,
            message: 'Após o encerramento, novos check-ins e retiradas serão bloqueados.',
            confirmLabel: 'Encerrar distribuição',
            danger: true,
        });

        if (!confirmar || this.encerrando()) {
            return;
        }

        this.encerrando.set(true);
        this.error.set(null);

        this.encerrarDistribuicao
            .execute(distribuicao.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.encerrando.set(false);
                    this.toast.success('Distribuição encerrada.');
                    this.carregar();
                },
                error: (error: unknown) => {
                    this.encerrando.set(false);
                    this.error.set(
                        userErrorMessage(error, 'Não foi possível encerrar a distribuição.'),
                    );
                },
            });
    }
}
