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

@Component({
    selector: 'app-distribuicao-detail-page',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule, CestasAdicionaisComponent],
    templateUrl: './distribuicao-detail.page.html',
    styleUrl: './distribuicao-detail.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DistribuicaoDetailPage {
    private readonly remarcarDistribuicao = inject(RemarcarDistribuicaoUseCase);
    readonly podeRemarcar = inject(SessionFacade).hasPermission('DISTRIBUICAO_REMARCAR');
    readonly remarcando = signal(false);
    readonly remarcacaoError = signal('');
    readonly remarcacaoFeedback = signal('');
    readonly remarcacao = new FormGroup({
        novaData: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        motivo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(1000)] }),
    });
    remarcar(): void {
        const item = this.distribuicao();
        if (!item || !this.podeRemarcar || this.remarcando() || this.remarcacao.invalid ||
            !['PLANEJADA', 'PREPARADA'].includes(item.status)) return;
        const input = this.remarcacao.getRawValue();
        input.motivo = input.motivo.trim();
        if (input.motivo.length < 3) {
            this.remarcacaoError.set('Informe um motivo com pelo menos 3 caracteres.');
            return;
        }
        if (!window.confirm(`Remarcar a distribuição para ${this.dataLabel(input.novaData)}?\nMotivo: ${input.motivo}`)) return;
        this.remarcando.set(true);
        this.remarcacaoError.set('');
        this.remarcacaoFeedback.set('');
        this.remarcarDistribuicao.execute(item.id, input).pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.remarcando.set(false)),
        ).subscribe({
            next: () => {
                this.remarcacaoFeedback.set('Distribuição remarcada com sucesso.');
                this.remarcacao.reset();
                this.carregar();
            },
            error: error => this.remarcacaoError.set(userErrorMessage(error, 'Não foi possível remarcar a distribuição.')),
        });
    }
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
    readonly podeConsultarLiberacoes = this.session.hasPermission('ESTOQUE_VISUALIZAR');
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

    abrir(): void {
        const distribuicao = this.distribuicao();

        if (!distribuicao) {
            return;
        }

        const confirmar = window.confirm(
            `Deseja abrir a distribuição de ${distribuicao.grupo.nome} em ${this.dataLabel(
                distribuicao.dataPrevista,
            )}?`,
        );

        if (!confirmar) {
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
                },
                error: () => {
                    this.distribuicao.set(null);
                    this.error.set('Não foi possível carregar a distribuição.');
                    this.loading.set(false);
                },
            });
    }

    encerrar(): void {
        const distribuicao = this.distribuicao();

        if (
            !distribuicao ||
            distribuicao.status !== 'ABERTA' ||
            !this.podeEncerrar ||
            this.encerrando()
        ) {
            return;
        }

        const confirmar = window.confirm(
            `Deseja encerrar a distribuição de ${distribuicao.grupo.nome}?\n\n` +
            'Após o encerramento, novos check-ins e retiradas serão bloqueados.',
        );

        if (!confirmar) {
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

    dataLabel(data: string): string {
        const [ano, mes, dia] = data.split('-');

        if (!ano || !mes || !dia) {
            return data;
        }

        return `${dia}/${mes}/${ano}`;
    }

    competenciaLabel(distribuicao: Distribuicao): string {
        const mes = String(distribuicao.competencia.mes).padStart(2, '0');
        return `${mes}/${distribuicao.competencia.ano}`;
    }

    statusLabel(status: Distribuicao['status']): string {
        const labels: Record<Distribuicao['status'], string> = {
            PLANEJADA: 'Planejada',
            PREPARADA: 'Preparada',
            ABERTA: 'Aberta',
            ENCERRADA: 'Encerrada',
        };

        return labels[status];
    }
}
