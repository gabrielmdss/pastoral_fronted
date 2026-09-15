import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
const labels: Record<string, string> = {
  ATIVO: 'Ativo',
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
@Component({
  selector: 'app-status-badge',
  template: '<span class="status-badge" [attr.data-status]="status()">{{label()}}</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = computed(
    () => labels[this.status()] ?? this.status().replaceAll('_', ' ').toLocaleLowerCase('pt-BR'),
  );
}
