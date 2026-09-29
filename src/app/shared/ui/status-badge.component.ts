import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const labels: Record<string, string> = {
  ATIVO: 'Ativo',
  ATIVA: 'Ativa',
  INATIVO: 'Inativo',
  REGULAR: 'Regular',
  ATENCAO: 'Atenção',
  CRITICO: 'Crítico',
  SEM_SALDO: 'Sem saldo',
  SAUDAVEL: 'Saudável',
  SEM_PLANEJAMENTO: 'Sem planejamento',
  EM_ANALISE: 'Em análise',
  CONFIRMADA: 'Confirmada',
  VALIDA: 'Válida',
  AJUSTADO: 'Ajustado',
  // Cestas adicionais (domain/atendimento)
  AUTORIZADA: 'Autorizada',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada',
  // Tipo de doador
  PESSOA: 'Pessoa',
  INSTITUICAO: 'Instituição',
  PENDENTE: 'Pendente',
  BLOQUEADO: 'Bloqueado',
  REJEITADA: 'Rejeitada',
  ESTORNADA: 'Estornada',
  DESLIGADO: 'Desligado',
  AGUARDANDO: 'Aguardando',
  CONVOCADO: 'Convocado',
  ADMITIDO: 'Admitido',
  NAO_LOCALIZADO: 'Não localizado',
  DESISTIU: 'Desistiu',
  CANCELADO: 'Cancelado',
  // Distribuição (domain/distribuicoes/distribuicao.model.ts)
  PLANEJADA: 'Planejada',
  PREPARADA: 'Preparada',
  ABERTA: 'Aberta',
  ENCERRADA: 'Encerrada',
  // Planejamento (domain/planejamento/planejamento.model.ts)
  SIMULACAO: 'Simulação',
  APROVADA: 'Aprovada',
  SUBSTITUIDA: 'Substituída',
  CONCLUIDA: 'Concluída',
  // Montagem (domain/montagem/montagem.model.ts)
  ESGOTADO: 'Esgotado',
  DESMONTADO: 'Desmontado',
  // Inventário (domain/estoque/inventario.model.ts)
  ABERTO: 'Aberto',
  CONCLUIDO: 'Concluído',
};

/** Rótulo pt-BR de um status (mesmo texto exibido pelo badge). */
export function rotuloStatus(status: string): string {
  return labels[status] ?? status.replaceAll('_', ' ').toLocaleLowerCase('pt-BR');
}

/**
 * Chip de status em pílula com ponto colorido. O tom vem do mapa `data-status` em
 * src/styles/_components.scss; `tone` força um tom; `label` substitui o texto.
 * <app-status-badge [status]="d.status" />  <app-status-badge status="X" tone="warning" label="Atenção" />
 */
@Component({
  selector: 'app-status-badge',
  template:
    '<span class="status-badge" [class]="toneClass()" [class.status-badge--plain]="!dot()" [attr.data-status]="tone() ? null : status()">{{ text() }}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly tone = input<BadgeTone | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly dot = input(true);
  protected readonly toneClass = computed(() => {
    const tone = this.tone();
    return tone ? `status-badge ui-badge--${tone}` : 'status-badge';
  });
  readonly text = computed(() => this.label() ?? rotuloStatus(this.status()));
}
