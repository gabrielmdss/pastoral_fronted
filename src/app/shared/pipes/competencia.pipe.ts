import { Pipe, type PipeTransform } from '@angular/core';
import { MESES_PT } from './data-br.pipe';

export interface MesAno {
  mes: number;
  ano: number;
}
export type EntradaCompetencia = MesAno | string | null | undefined;
export type FormatoCompetencia = 'longa' | 'curta' | 'numerica';

/** Aceita `{ mes, ano }` (mes 1-12) ou string `YYYY-MM` / `YYYY-MM-DD`. */
export function formatarCompetencia(
  valor: EntradaCompetencia,
  formato: FormatoCompetencia = 'longa',
  fallback = '—',
): string {
  if (!valor) return fallback;
  let mes: number;
  let ano: number;
  if (typeof valor === 'string') {
    const m = /^(\d{4})-(\d{2})/.exec(valor.trim());
    if (!m) return fallback;
    ano = Number(m[1]);
    mes = Number(m[2]);
  } else {
    ({ mes, ano } = valor);
  }
  if (!Number.isInteger(mes) || !Number.isInteger(ano) || mes < 1 || mes > 12) return fallback;
  const nome = MESES_PT[mes - 1];
  if (formato === 'numerica') return `${String(mes).padStart(2, '0')}/${ano}`;
  if (formato === 'curta') return `${nome.slice(0, 3)}/${ano}`;
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)}/${ano}`;
}

/** Uso: `{{ c | competencia }}` → "Setembro/2026"; `'curta'` → "set/2026"; `'numerica'` → "09/2026". */
@Pipe({ name: 'competencia' })
export class CompetenciaPipe implements PipeTransform {
  transform(valor: EntradaCompetencia, formato: FormatoCompetencia = 'longa', fallback = '—'): string {
    return formatarCompetencia(valor, formato, fallback);
  }
}
