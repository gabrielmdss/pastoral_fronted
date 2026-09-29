import { Pipe, type PipeTransform } from '@angular/core';

export type FormatoDataBr = 'data' | 'dataHora' | 'hora' | 'longa' | 'mesAno' | 'relativa';
export type EntradaData = string | number | Date | null | undefined;

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const SOMENTE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIA_MS = 86_400_000;

/**
 * Converte a entrada em Date. Strings `YYYY-MM-DD` (sem hora) são tratadas como data LOCAL,
 * evitando o deslocamento de fuso de `new Date('2026-09-01')` (meia-noite UTC).
 */
export function parseDataBr(valor: EntradaData): Date | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'number') return parseDataBr(new Date(valor));
  const texto = valor.trim();
  const somenteData = SOMENTE_DATA.exec(texto);
  if (somenteData) {
    const [a, m, d] = somenteData.slice(1).map(Number);
    const data = new Date(a, m - 1, d);
    return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d ? data : null;
  }
  return parseDataBr(new Date(texto));
}

const dois = (n: number) => String(n).padStart(2, '0');
const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function relativa(data: Date, agora: Date): string {
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(data)) / DIA_MS);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias === -1) return 'amanhã';
  const abs = Math.abs(dias);
  let texto: string;
  if (abs < 30) texto = `${abs} dias`;
  else if (abs < 365) {
    const meses = Math.round(abs / 30);
    texto = meses === 1 ? '1 mês' : `${meses} meses`;
  } else {
    const anos = Math.round(abs / 365);
    texto = anos === 1 ? '1 ano' : `${anos} anos`;
  }
  return dias > 0 ? `há ${texto}` : `em ${texto}`;
}

/** Formata datas em pt-BR sem depender do fuso para datas "somente dia". */
export function formatarDataBr(
  valor: EntradaData,
  formato: FormatoDataBr = 'data',
  fallback = '—',
  agora: Date = new Date(),
): string {
  const data = parseDataBr(valor);
  if (!data) return fallback;
  const dataCurta = `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()}`;
  const hora = `${dois(data.getHours())}:${dois(data.getMinutes())}`;
  switch (formato) {
    case 'dataHora':
      return `${dataCurta} ${hora}`;
    case 'hora':
      return hora;
    case 'longa':
      return `${DIAS_SEMANA[data.getDay()]}, ${data.getDate()} de ${MESES_PT[data.getMonth()]} de ${data.getFullYear()}`;
    case 'mesAno':
      return `${MESES_PT[data.getMonth()]} de ${data.getFullYear()}`;
    case 'relativa':
      return relativa(data, agora);
    default:
      return dataCurta;
  }
}

/**
 * Uso: `{{ valor | dataBr }}`, `{{ valor | dataBr: 'dataHora' }}`, `{{ valor | dataBr: 'longa' }}`,
 * `{{ valor | dataBr: 'relativa' }}`, `{{ valor | dataBr: 'data' : 'Sem data' }}`.
 */
@Pipe({ name: 'dataBr' })
export class DataBrPipe implements PipeTransform {
  transform(valor: EntradaData, formato: FormatoDataBr = 'data', fallback = '—'): string {
    return formatarDataBr(valor, formato, fallback);
  }
}
