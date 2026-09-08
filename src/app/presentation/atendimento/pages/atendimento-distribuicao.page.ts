import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    inject,
    signal,
    viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import type { Distribuicao } from '../../../domain/distribuicoes/distribuicao.model';
import { ObterDistribuicaoUseCase } from '../../../application/distribuicoes/obter-distribuicao.use-case';
import { ListarCheckInsUseCase } from '../../../application/atendimento/use-cases/listar-check-ins.use-case';
import type {
    CheckIn,
    CheckInMotivoBloqueio,
} from '../../../domain/atendimento/check-in.model';
import { RegistrarCheckInUseCase } from '../../../application/atendimento/use-cases/registrar-check-in.use-case';
import { BuscarBeneficiariosUseCase } from '../../../application/beneficiarios/beneficiarios.use-cases';
import { BeneficiarioResumo } from '../../../domain/beneficiarios/beneficiario.model';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { CheckInFeedbackComponent } from '../components/check-in-feedback.component';
import { ListarRetiradasUseCase } from '../../../application/atendimento/use-cases/listar-retiradas.use-case';
import { RegistrarRetiradaUseCase } from '../../../application/atendimento/use-cases/registrar-retirada.use-case';
import type { Retirada } from '../../../domain/atendimento/retirada.model';
import { userErrorMessage } from '../../../shared/errors/user-error';
import { EstornarRetiradaUseCase } from '../../../application/atendimento/use-cases/estornar-retirada.use-case';
import { SessionFacade } from '../../../infrastructure/auth/session.facade';
import type { RetiradaRepresentanteInput } from '../../../domain/atendimento/retirada.model';
import { EncerrarDistribuicaoUseCase } from '../../../application/distribuicoes/encerrar-distribuicao.use-case';
import { ListarAusenciasBeneficiarioUseCase } from '../../../application/atendimento/use-cases/listar-ausencias-beneficiario.use-case';
import { RegistrarJustificativaUseCase } from '../../../application/atendimento/use-cases/registrar-justificativa.use-case';
import { AvaliarJustificativaUseCase } from '../../../application/atendimento/use-cases/avaliar-justificativa.use-case';
import type { AusenciaAtendimento, DecisaoJustificativa, MomentoJustificativa } from '../../../domain/atendimento/justificativa.model';

@Component({
    selector: 'app-atendimento-distribuicao-page',
    standalone: true,
    imports: [CommonModule, RouterLink, CheckInFeedbackComponent],
    templateUrl: './atendimento-distribuicao.page.html',
    styleUrl: './atendimento-distribuicao.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AtendimentoDistribuicaoPage {
    private readonly route = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);
    private readonly obterDistribuicao = inject(ObterDistribuicaoUseCase);
    private readonly listarCheckIns = inject(ListarCheckInsUseCase);
    private readonly buscarBeneficiarios = inject(BuscarBeneficiariosUseCase);
    private readonly registrarCheckIn = inject(RegistrarCheckInUseCase);
    private readonly listarRetiradas = inject(ListarRetiradasUseCase);
    private readonly registrarRetirada = inject(RegistrarRetiradaUseCase);
    private readonly estornarRetirada = inject(EstornarRetiradaUseCase);
    private readonly session = inject(SessionFacade);
    private readonly encerrarDistribuicao = inject(EncerrarDistribuicaoUseCase);
    private readonly listarAusencias = inject(ListarAusenciasBeneficiarioUseCase);
    private readonly registrarJustificativaUseCase = inject(RegistrarJustificativaUseCase);
    private readonly avaliarJustificativaUseCase = inject(AvaliarJustificativaUseCase);

    readonly filaRegular = signal<CheckIn[]>([]);
    readonly filaPendente = signal<CheckIn[]>([]);
    readonly busca = signal('');
    readonly resultadosBusca = signal<BeneficiarioResumo[]>([]);
    readonly buscando = signal(false);
    readonly checkInEmAndamento = signal(false);
    readonly ultimoCheckIn = signal<CheckIn | null>(null);
    readonly buscaError = signal<string | null>(null);
    readonly retiradas = signal<Retirada[]>([]);
    readonly loadingRetiradas = signal(false);
    readonly retiradasError = signal<string | null>(null);
    readonly retiradaEmAndamentoId = signal<string | null>(null);
    readonly retiradaFeedback = signal<string | null>(null);
    readonly estornoEmAndamentoId = signal<string | null>(null);
    readonly encerrando = signal(false);
    readonly encerramentoError = signal<string | null>(null);
    readonly historicoCheckIns = signal<CheckIn[]>([]);
    readonly loadingHistoricoCheckIns = signal(false);
    readonly historicoCheckInsError = signal<string | null>(null);
    readonly podeAcessarRetiradas = this.session.hasPermission('RETIRADA_REGISTRAR');
    readonly podeEncerrar = this.session.hasPermission('DISTRIBUICAO_ENCERRAR');
    readonly podeCestasAdicionais = this.session.hasPermission('CESTA_ADICIONAL_AUTORIZAR') || this.session.hasPermission('RETIRADA_REGISTRAR');
    readonly podeRegistrarJustificativa = this.session.hasPermission('JUSTIFICATIVA_REGISTRAR');
    readonly podeAvaliarJustificativa = this.session.hasPermission('JUSTIFICATIVA_AVALIAR');
    readonly ausenciasPorBeneficiario = signal<Record<string, AusenciaAtendimento[]>>({});
    readonly historicoAusenciaLoadingId = signal<string | null>(null);
    readonly justificativaLoadingId = signal<string | null>(null);
    readonly justificativaError = signal<string | null>(null);
    readonly justificativaFeedback = signal<string | null>(null);

    readonly buscaInput =
        viewChild<ElementRef<HTMLInputElement>>('buscaInput');

    private readonly buscaSubject = new Subject<string>();

    readonly loadingFilas = signal(false);
    readonly filasError = signal<string | null>(null);
    readonly resumoError = signal<string | null>(null);
    readonly distribuicao = signal<Distribuicao | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    private filasPendentes = 0;

    constructor() {
        this.carregar();

        this.buscaSubject
            .pipe(
                debounceTime(350),
                distinctUntilChanged(),
                switchMap((termo) => {
                    this.buscando.set(true);
                    this.buscaError.set(null);

                    const valor = termo.trim();

                    if (!valor) {
                        this.resultadosBusca.set([]);
                        this.buscando.set(false);

                        return of([]);
                    }

                    const filtro = /^\d/.test(valor)
                        ? { documento: valor, status: 'ATIVO' }
                        : { nome: valor, status: 'ATIVO' };

                    return this.buscarBeneficiarios.execute(filtro).pipe(
                        catchError(() => {
                            this.resultadosBusca.set([]);
                            this.buscando.set(false);
                            this.buscaError.set(
                                'Não foi possível buscar beneficiários.',
                            );
                            return of([] as BeneficiarioResumo[]);
                        }),
                    );
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (beneficiarios) => {
                    this.resultadosBusca.set(beneficiarios);
                    this.buscando.set(false);
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
                    this.resumoError.set(null);
                    this.loading.set(false);

                    this.carregarFilas(distribuicao.id);
                    this.carregarRetiradas(distribuicao.id);
                    if (distribuicao.status === 'ENCERRADA') {
                        this.carregarHistoricoCheckIns(distribuicao.id);
                    } else {
                        this.historicoCheckIns.set([]);
                    }
                },

                error: () => {
                    this.distribuicao.set(null);
                    this.error.set(
                        'Não foi possível carregar os dados da distribuição.',
                    );
                    this.loading.set(false);
                },
            });
    }

    carregarFilas(distribuicaoId?: string): void {

        const id = distribuicaoId ?? this.distribuicao()?.id;

        if (!id) {
            return;
        }

        this.filasPendentes = 2;
        this.loadingFilas.set(true);
        this.filasError.set(null);

        this.listarCheckIns
            .execute(id, 'REGULAR', 'AGUARDANDO')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (checkIns) => {
                    this.filaRegular.set(
                        checkIns.filter(
                            (checkIn) => checkIn.situacaoOperacional === 'AGUARDANDO',
                        ),
                    );
                    this.finalizarCarregamentoFilas();
                },

                error: () => {
                    this.filaRegular.set([]);
                    this.filasError.set(
                        'Não foi possível carregar a fila principal.',
                    );
                    this.finalizarCarregamentoFilas();
                },
            });

        this.listarCheckIns
            .execute(id, 'PENDENTE', 'AGUARDANDO')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (checkIns) => {
                    this.filaPendente.set(
                        checkIns.filter(
                            (checkIn) => checkIn.situacaoOperacional === 'AGUARDANDO',
                        ),
                    );
                    this.finalizarCarregamentoFilas();
                },

                error: () => {
                    this.filaPendente.set([]);
                    this.filasError.set(
                        'Não foi possível carregar a fila secundária.',
                    );
                    this.finalizarCarregamentoFilas();
                },
            });
    }

    registrarChegada(
        beneficiario: BeneficiarioResumo,
    ): void {
        const distribuicao = this.distribuicao();

        if (!distribuicao) {
            return;
        }

        if (distribuicao.status !== 'ABERTA') {
            this.buscaError.set(
                'A distribuição precisa estar aberta para registrar chegada.',
            );
            return;
        }

        this.checkInEmAndamento.set(true);
        this.buscaError.set(null);

        this.registrarCheckIn
            .execute(
                distribuicao.id,
                beneficiario.id,
            )
            .pipe(
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (checkIn) => {
                    this.ultimoCheckIn.set(checkIn);

                    this.checkInEmAndamento.set(false);
                    this.busca.set('');
                    this.resultadosBusca.set([]);

                    this.carregarFilas(distribuicao.id);
                    this.carregarResumoDistribuicao(distribuicao.id);

                    queueMicrotask(() => {
                        this.buscaInput()?.nativeElement.focus();
                    });
                },

                error: () => {
                    this.checkInEmAndamento.set(false);

                    this.buscaError.set(
                        'Não foi possível registrar a chegada do beneficiário.',
                    );
                },
            });
    }

    podeRegistrarRetirada(checkIn: CheckIn): boolean {
        return this.podeAcessarRetiradas && this.distribuicao()?.status === 'ABERTA'
            && checkIn.situacaoOperacional === 'AGUARDANDO'
            && checkIn.podeRetirar;
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

        if (!window.confirm(
            `Encerrar a distribuição de ${distribuicao.grupo.nome}?\n\n` +
            'A distribuição será finalizada e novas ações operacionais serão bloqueadas.',
        )) {
            return;
        }

        this.encerrando.set(true);
        this.encerramentoError.set(null);
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
                    this.encerramentoError.set(
                        userErrorMessage(error, 'Não foi possível encerrar a distribuição.'),
                    );
                },
            });
    }

    carregarHistoricoCheckIns(distribuicaoId: string): void {
        this.loadingHistoricoCheckIns.set(true);
        this.historicoCheckInsError.set(null);
        this.listarCheckIns
            .execute(distribuicaoId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (checkIns) => {
                    this.historicoCheckIns.set(checkIns);
                    this.loadingHistoricoCheckIns.set(false);
                },
                error: () => {
                    this.historicoCheckIns.set([]);
                    this.loadingHistoricoCheckIns.set(false);
                    this.historicoCheckInsError.set(
                        'Não foi possível carregar o histórico de check-ins.',
                    );
                },
            });
    }

    registrarRetiradaTitular(checkIn: CheckIn): void {
        this.confirmarERegistrarRetirada(checkIn);
    }

    registrarRetiradaRepresentante(checkIn: CheckIn): void {
        if (!this.podeRegistrarRetirada(checkIn)) {
            return;
        }

        const nome = window.prompt('Nome completo do representante:')?.trim();
        if (!nome) {
            this.retiradasError.set('Informe o nome do representante.');
            return;
        }

        const autorizada = window.confirm(
            'Confirma que o representante declarou estar autorizado a retirar a cesta?',
        );
        if (!autorizada) {
            return;
        }

        const representante: RetiradaRepresentanteInput = {
            nome,
            documento: null,
            relacao: null,
            autorizacaoDeclaratoria: true,
        };
        this.confirmarERegistrarRetirada(checkIn, representante);
    }

    private confirmarERegistrarRetirada(
        checkIn: CheckIn,
        representante?: RetiradaRepresentanteInput,
    ): void {
        const distribuicao = this.distribuicao();

        if (!distribuicao || !this.podeRegistrarRetirada(checkIn)) {
            return;
        }

        const destinatario = representante
            ? `${representante.nome}, representante de ${checkIn.beneficiario.nomeCompleto}`
            : checkIn.beneficiario.nomeCompleto;
        if (!window.confirm(`Confirmar entrega da cesta para ${destinatario}?`)) {
            return;
        }

        this.retiradaEmAndamentoId.set(checkIn.id);
        this.retiradasError.set(null);
        this.retiradaFeedback.set(null);

        const registro$ = representante
            ? this.registrarRetirada.execute(
                distribuicao.id,
                checkIn.beneficiario.id,
                representante,
            )
            : this.registrarRetirada.execute(distribuicao.id, checkIn.beneficiario.id);

        registro$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.retiradaEmAndamentoId.set(null);
                    this.retiradaFeedback.set(
                        `Cesta entregue para ${checkIn.beneficiario.nomeCompleto}.`,
                    );
                    this.carregarFilas(distribuicao.id);
                    this.carregarResumoDistribuicao(distribuicao.id);
                    this.carregarRetiradas(distribuicao.id);
                },
                error: (error: unknown) => {
                    this.retiradaEmAndamentoId.set(null);
                    this.retiradasError.set(
                        userErrorMessage(error, 'Não foi possível registrar a retirada.'),
                    );
                },
            });
    }

    podeEstornar(retirada: Retirada): boolean {
        if (retirada.status !== 'VALIDA') {
            return false;
        }

        if (this.session.hasPermission('RETIRADA_ESTORNAR_QUALQUER')) {
            return true;
        }

        return this.session.hasPermission('RETIRADA_ESTORNAR_PROPRIA')
            && retirada.operador.id === this.session.currentUser()?.id
            && this.dataSaoPaulo(retirada.ocorridoEm) === this.dataSaoPaulo(new Date());
    }

    solicitarEstorno(retirada: Retirada): void {
        if (!this.podeEstornar(retirada)) {
            return;
        }

        const motivo = window.prompt('Informe o motivo do estorno:');
        if (motivo === null) {
            return;
        }
        if (!motivo.trim()) {
            this.retiradasError.set('Informe o motivo do estorno.');
            return;
        }

        this.estornoEmAndamentoId.set(retirada.id);
        this.retiradasError.set(null);
        this.retiradaFeedback.set(null);
        this.estornarRetirada
            .execute(retirada.id, motivo)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.estornoEmAndamentoId.set(null);
                    this.retiradaFeedback.set(
                        `Retirada de ${retirada.beneficiario.nomeCompleto} estornada.`,
                    );
                    this.carregarRetiradas(retirada.distribuicaoId);
                    this.carregarFilas(retirada.distribuicaoId);
                    this.carregarResumoDistribuicao(retirada.distribuicaoId);
                },
                error: (error: unknown) => {
                    this.estornoEmAndamentoId.set(null);
                    this.retiradasError.set(
                        userErrorMessage(error, 'Não foi possível estornar a retirada.'),
                    );
                },
            });
    }

    carregarRetiradas(distribuicaoId?: string): void {
        if (!this.podeAcessarRetiradas) return;
        const id = distribuicaoId ?? this.distribuicao()?.id;

        if (!id) {
            return;
        }

        this.loadingRetiradas.set(true);
        this.retiradasError.set(null);

        this.listarRetiradas
            .execute(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (retiradas) => {
                    this.retiradas.set(retiradas);
                    this.loadingRetiradas.set(false);
                },
                error: () => {
                    this.retiradas.set([]);
                    this.loadingRetiradas.set(false);
                    this.retiradasError.set('Não foi possível carregar as retiradas.');
                },
            });
    }

    carregarAusencias(beneficiarioId: string): void {
        this.historicoAusenciaLoadingId.set(beneficiarioId);
        this.justificativaError.set(null);
        this.listarAusencias.execute(beneficiarioId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (ausencias) => {
                    this.ausenciasPorBeneficiario.update((state) => ({
                        ...state,
                        [beneficiarioId]: ausencias,
                    }));
                    this.historicoAusenciaLoadingId.set(null);
                },
                error: (error: unknown) => {
                    this.historicoAusenciaLoadingId.set(null);
                    this.justificativaError.set(userErrorMessage(
                        error,
                        'Não foi possível consultar ausências e justificativas.',
                    ));
                },
            });
    }

    registrarJustificativa(beneficiarioId: string, ausencia: AusenciaAtendimento): void {
        if (!this.podeRegistrarJustificativa || this.justificativaLoadingId()) return;
        const descricao = window.prompt('Descreva a justificativa da ausência:')?.trim();
        if (!descricao) return;
        const momentoInformado = window.prompt(
            'Informe o momento: ANTES_DISTRIBUICAO ou DEPOIS_DISTRIBUICAO',
            'DEPOIS_DISTRIBUICAO',
        )?.trim().toUpperCase();
        if (momentoInformado !== 'ANTES_DISTRIBUICAO' && momentoInformado !== 'DEPOIS_DISTRIBUICAO') {
            this.justificativaError.set('Informe ANTES_DISTRIBUICAO ou DEPOIS_DISTRIBUICAO.');
            return;
        }
        const momento: MomentoJustificativa = momentoInformado;
        this.justificativaLoadingId.set(ausencia.id);
        this.justificativaError.set(null);
        this.registrarJustificativaUseCase.execute(ausencia.id, { descricao, momento })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.justificativaLoadingId.set(null);
                    this.justificativaFeedback.set('Justificativa registrada e aguardando avaliação.');
                    this.atualizarAposJustificativa(beneficiarioId);
                },
                error: (error: unknown) => {
                    this.justificativaLoadingId.set(null);
                    this.justificativaError.set(userErrorMessage(error, 'Não foi possível registrar a justificativa.'));
                },
            });
    }

    avaliarJustificativa(
        beneficiarioId: string,
        ausencia: AusenciaAtendimento,
        decisao: Exclude<DecisaoJustificativa, 'PENDENTE'>,
    ): void {
        const justificativaId = ausencia.justificativas.find(
            (justificativa) => justificativa.decisao === 'PENDENTE',
        )?.id;
        if (!this.podeAvaliarJustificativa || !justificativaId || this.justificativaLoadingId()) return;
        if (!window.confirm(`${decisao === 'ACEITA' ? 'Aceitar' : 'Rejeitar'} esta justificativa?`)) return;
        const observacaoInformada = window.prompt('Observação da avaliação (opcional):');
        if (observacaoInformada === null) return;
        const observacao = observacaoInformada.trim() || null;
        this.justificativaLoadingId.set(ausencia.id);
        this.justificativaError.set(null);
        this.avaliarJustificativaUseCase.execute(justificativaId, { decisao, observacao })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.justificativaLoadingId.set(null);
                    this.justificativaFeedback.set(
                        decisao === 'ACEITA' ? 'Justificativa aceita.' : 'Justificativa rejeitada.',
                    );
                    this.atualizarAposJustificativa(beneficiarioId);
                },
                error: (error: unknown) => {
                    this.justificativaLoadingId.set(null);
                    this.justificativaError.set(userErrorMessage(error, 'Não foi possível avaliar a justificativa.'));
                },
            });
    }

    statusAusenciaLabel(status: string): string {
        const labels: Record<string, string> = {
            JUSTIFICATIVA_PENDENTE: 'Justificativa pendente',
            JUSTIFICADA: 'Justificada',
            JUSTIFICATIVA_REJEITADA: 'Justificativa rejeitada',
        };
        return labels[status] ?? status;
    }

    decisaoJustificativaLabel(decisao: DecisaoJustificativa): string {
        return { PENDENTE: 'Pendente', ACEITA: 'Aceita', REJEITADA: 'Rejeitada' }[decisao];
    }

    justificativaPendenteId(ausencia: AusenciaAtendimento): string | null {
        return ausencia.justificativas.find(
            (justificativa) => justificativa.decisao === 'PENDENTE',
        )?.id ?? null;
    }

    private atualizarAposJustificativa(beneficiarioId: string): void {
        const distribuicaoId = this.distribuicao()?.id;
        if (!distribuicaoId) return;
        this.carregarAusencias(beneficiarioId);
        this.carregarFilas(distribuicaoId);
        this.carregarResumoDistribuicao(distribuicaoId);
    }

    private finalizarCarregamentoFilas(): void {
        this.filasPendentes--;

        if (this.filasPendentes <= 0) {
            this.loadingFilas.set(false);
        }
    }

    private carregarResumoDistribuicao(
        id: string,
    ): void {
        this.resumoError.set(null);
        this.obterDistribuicao
            .execute(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                next: (distribuicao) => {
                    this.distribuicao.set(distribuicao);
                },
                error: () => {
                    this.resumoError.set(
                        'Não foi possível atualizar o resumo da distribuição.',
                    );
                },
            });
    }

    onBuscaChange(valor: string): void {
        this.busca.set(valor);
        this.buscaSubject.next(valor);
    }

    horaLabel(ocorridoEm: string): string {
        const data = new Date(ocorridoEm);

        if (Number.isNaN(data.getTime())) {
            return ocorridoEm;
        }

        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(data);
    }

    motivoBloqueioLabel(motivo: CheckInMotivoBloqueio | null): string {
        const labels: Record<CheckInMotivoBloqueio, string> = {
            DIREITO_JA_CONSUMIDO: 'A cesta deste direito já foi retirada.',
            DIREITO_NAO_DISPONIVEL: 'Direito previsto para outra distribuição.',
            BENEFICIARIO_PENDENTE: 'Beneficiário possui pendências para retirada.',
            REGULARES_AGUARDANDO: 'Aguarde o atendimento da fila principal.',
        };

        return motivo ? labels[motivo] : 'Retirada indisponível neste momento.';
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

    tipoRetiradaLabel(tipo: Retirada['tipo']): string {
        const labels: Record<Retirada['tipo'], string> = {
            TITULAR: 'Titular',
            REPRESENTANTE: 'Representante',
            PRIMEIRA_ENTREGA: 'Primeira entrega',
            ANTECIPADA: 'Antecipada',
            CONTINGENCIA: 'Contingência',
        };
        return labels[tipo];
    }

    formaIdentificacaoLabel(forma: Retirada['formaIdentificacao']): string {
        if (!forma) return 'Não informada';
        const labels: Record<NonNullable<Retirada['formaIdentificacao']>, string> = {
            DOCUMENTO: 'Documento',
            FOTO_HISTORICO: 'Foto do histórico',
            REPRESENTANTE: 'Representante',
            CONTINGENCIA: 'Contingência',
        };
        return labels[forma];
    }

    private dataSaoPaulo(value: string | Date): string {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(value));
    }

    fecharFeedbackCheckIn(): void {
        this.ultimoCheckIn.set(null);
    }
}
