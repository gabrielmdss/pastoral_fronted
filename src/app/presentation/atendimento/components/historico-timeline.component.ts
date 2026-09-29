import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { HistoricoEvento } from '../../../domain/atendimento/historico.model';
import { DataBrPipe, formatarDataBr } from '../../../shared/pipes/data-br.pipe';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import type { IconName } from '../../../shared/ui/icons';

type Tom = 'success' | 'warning' | 'danger' | 'info' | 'primary';

const TIPO_VISUAL: Record<string, { icon: IconName; tom: Tom }> = {
  ADMISSAO: { icon: 'user', tom: 'success' },
  ALTERACAO_GRUPO: { icon: 'layers', tom: 'info' },
  RETIRADA: { icon: 'package-open', tom: 'success' },
  RETIRADA_ESTORNADA: { icon: 'x-circle', tom: 'danger' },
  AUSENCIA: { icon: 'alert-triangle', tom: 'warning' },
  JUSTIFICATIVA: { icon: 'file-warning', tom: 'info' },
  CESTA_ADICIONAL: { icon: 'package-plus', tom: 'primary' },
  DESLIGAMENTO: { icon: 'log-out', tom: 'danger' },
  REATIVACAO: { icon: 'refresh', tom: 'success' },
  CRIACAO: { icon: 'plus', tom: 'primary' },
  REMARCACAO: { icon: 'calendar', tom: 'warning' },
  ABERTURA: { icon: 'package-open', tom: 'primary' },
  LIBERACAO_CESTAS: { icon: 'package', tom: 'info' },
  ENCERRAMENTO: { icon: 'check-circle', tom: 'success' },
};
const DATA_ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

const TIPO_LABELS: Record<string, string> = {
  ADMISSAO: 'Admissão',
  ALTERACAO_GRUPO: 'Alteração de grupo',
  RETIRADA: 'Retirada',
  RETIRADA_ESTORNADA: 'Retirada estornada',
  AUSENCIA: 'Ausência',
  JUSTIFICATIVA: 'Justificativa',
  CESTA_ADICIONAL: 'Cesta adicional',
  DESLIGAMENTO: 'Desligamento',
  REATIVACAO: 'Reativação',
  CRIACAO: 'Criação',
  REMARCACAO: 'Remarcação',
  ABERTURA: 'Abertura',
  LIBERACAO_CESTAS: 'Liberação de cestas',
  ENCERRAMENTO: 'Encerramento',
};

const DETALHE_LABELS: Record<string, string> = {
  grupoOrigem: 'Grupo de origem',
  grupoDestino: 'Grupo de destino',
  motivo: 'Motivo',
  tipo: 'Tipo',
  status: 'Status',
  decisao: 'Decisão',
  momento: 'Momento',
  quantidade: 'Quantidade',
  observacao: 'Observação',
  data: 'Data',
  dataAnterior: 'Data anterior',
  dataNova: 'Nova data',
  statusInicial: 'Status inicial',
};

interface EventoView {
  tipo: string;
  label: string;
  icon: IconName;
  tom: Tom;
  ocorridoEm: string;
  detalhes: { chave: string; valor: string }[];
  distribuicaoId: string | null;
  beneficiarioId: string | null;
}

/** Linha do tempo somente leitura; exibe os eventos na ordem enviada pelo backend. */
@Component({
  selector: 'app-historico-timeline',
  imports: [DataBrPipe, RouterLink, EmptyStateComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!itens().length) {
      <app-empty-state icon="scroll-text" title="Nenhum evento registrado" message="Os eventos aparecerão aqui conforme acontecerem." />
    } @else {
      <ol class="ui-timeline" [attr.aria-label]="rotulo()">
        @for (e of itens(); track $index) {
          <li class="ui-timeline__item" [attr.data-tipo]="e.tipo">
            <span [class]="'ui-tone ui-tone--' + e.tom">
              <app-icon [name]="e.icon" />
            </span>
            <div class="ui-timeline__body">
              <div class="ui-timeline__head">
                <strong>{{ e.label }}</strong>
                <time class="ui-timeline__meta" [attr.datetime]="e.ocorridoEm" [title]="e.ocorridoEm | dataBr: 'relativa'">
                  {{ e.ocorridoEm | dataBr: 'dataHora' }}
                </time>
              </div>
              @if (e.detalhes.length || e.distribuicaoId || e.beneficiarioId) {
                <p class="ui-timeline__details">
                  @for (d of e.detalhes; track d.chave) {
                    <span class="ui-chip">{{ d.chave }}: {{ d.valor }}</span>
                  }
                  @if (e.distribuicaoId && linkDistribuicao()) {
                    <a [routerLink]="['/distribuicoes', e.distribuicaoId]">Ver distribuição</a>
                  }
                  @if (e.beneficiarioId && linkBeneficiario()) {
                    <a [routerLink]="['/beneficiarios', e.beneficiarioId]">Ver beneficiário</a>
                  }
                </p>
              }
            </div>
          </li>
        }
      </ol>
    }
  `,
})
export class HistoricoTimelineComponent {
  readonly eventos = input.required<readonly HistoricoEvento[]>();
  readonly rotulo = input('Linha do tempo');
  readonly linkDistribuicao = input(true);
  readonly linkBeneficiario = input(true);

  readonly itens = computed<EventoView[]>(() =>
    this.eventos().map((e) => ({
      tipo: e.tipo,
      label: TIPO_LABELS[e.tipo] ?? e.tipo,
      icon: TIPO_VISUAL[e.tipo]?.icon ?? 'info',
      tom: TIPO_VISUAL[e.tipo]?.tom ?? 'info',
      ocorridoEm: e.ocorridoEm,
      detalhes: Object.entries(e.detalhes)
        .filter(([k, v]) => !k.endsWith('Id') && v !== null && v !== undefined && v !== '')
        .map(([k, v]) => ({ chave: DETALHE_LABELS[k] ?? k, valor: valorLabel(v) })),
      distribuicaoId: idOuNull(e.detalhes['distribuicaoId']),
      beneficiarioId: idOuNull(e.detalhes['beneficiarioId']),
    })),
  );
}

function idOuNull(v: unknown): string | null {
  return typeof v === 'string' || typeof v === 'number' ? String(v) : null;
}

/** Datas ISO nos detalhes (ex.: dataAnterior/dataNova) viram dd/MM/yyyy; demais valores seguem como texto. */
function valorLabel(v: unknown): string {
  const texto = String(v);
  if (!DATA_ISO.test(texto)) return texto;
  return formatarDataBr(texto, texto.includes('T') ? 'dataHora' : 'data', texto);
}
