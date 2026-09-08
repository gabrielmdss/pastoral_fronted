import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import type {
  CheckIn,
  CheckInMotivoBloqueio,
} from '../../../domain/atendimento/check-in.model';

@Component({
  selector: 'app-check-in-feedback',
  standalone: true,
  templateUrl: './check-in-feedback.component.html',
  styleUrl: './check-in-feedback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInFeedbackComponent {
  readonly checkIn = input.required<CheckIn>();
  readonly fecharSolicitado = output<void>();

  get isRegular(): boolean {
    return this.checkIn().classificacao === 'REGULAR';
  }

  get isPendente(): boolean {
    return this.checkIn().classificacao === 'PENDENTE';
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

  fechar(): void {
    this.fecharSolicitado.emit();
  }
}
