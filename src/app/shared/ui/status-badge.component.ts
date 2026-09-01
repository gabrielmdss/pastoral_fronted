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
};
@Component({
  selector: 'app-status-badge',
  template: '<span class="status-badge" [attr.data-status]="status()">{{label()}}</span>',
  styles: [
    '.status-badge{display:inline-flex;padding:.3rem .55rem;border-radius:999px;background:var(--color-primary-soft);color:var(--color-primary-dark);font-size:.75rem;font-weight:800}.status-badge[data-status="DESLIGADO"],.status-badge[data-status="CANCELADO"],.status-badge[data-status="NAO_LOCALIZADO"]{background:var(--color-danger-soft);color:var(--color-danger)}.status-badge[data-status="AGUARDANDO"],.status-badge[data-status="CONVOCADO"]{background:#fff3d4;color:#855b00}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = computed(
    () => labels[this.status()] ?? this.status().replaceAll('_', ' ').toLocaleLowerCase('pt-BR'),
  );
}
