import { describe, expect, it } from 'vitest';
import { DataBrPipe, formatarDataBr, parseDataBr } from './data-br.pipe';
import { CompetenciaPipe, formatarCompetencia } from './competencia.pipe';

const pad = (n: number) => String(n).padStart(2, '0');

describe('dataBr', () => {
  it('trata YYYY-MM-DD como data local (sem deslocamento de fuso)', () => {
    expect(formatarDataBr('2026-09-01')).toBe('01/09/2026');
    expect(formatarDataBr('2026-01-01')).toBe('01/01/2026');
    expect(formatarDataBr('2026-12-31')).toBe('31/12/2026');
    const d = parseDataBr('2026-09-01');
    expect([d?.getFullYear(), d?.getMonth(), d?.getDate(), d?.getHours()]).toEqual([2026, 8, 1, 0]);
  });
  it('formata datetime ISO no fuso local', () => {
    expect(formatarDataBr('2026-09-01T08:05:00', 'dataHora')).toBe('01/09/2026 08:05');
    const utc = new Date('2026-09-01T23:30:00Z');
    const esperado = `${pad(utc.getDate())}/${pad(utc.getMonth() + 1)}/${utc.getFullYear()} ${pad(utc.getHours())}:${pad(utc.getMinutes())}`;
    expect(formatarDataBr('2026-09-01T23:30:00Z', 'dataHora')).toBe(esperado);
  });
  it('formato longo e mesAno', () => {
    expect(formatarDataBr('2026-09-01', 'longa')).toBe('terça, 1 de setembro de 2026');
    expect(formatarDataBr('2026-09-07', 'longa')).toBe('segunda, 7 de setembro de 2026');
    expect(formatarDataBr('2026-09-07', 'mesAno')).toBe('setembro de 2026');
  });
  it('formato relativo por dia de calendário', () => {
    const agora = new Date(2026, 8, 10, 0, 30);
    expect(formatarDataBr('2026-09-10', 'relativa', '—', agora)).toBe('hoje');
    expect(formatarDataBr('2026-09-09T23:59:00', 'relativa', '—', agora)).toBe('ontem');
    expect(formatarDataBr('2026-09-11', 'relativa', '—', agora)).toBe('amanhã');
    expect(formatarDataBr('2026-09-07', 'relativa', '—', agora)).toBe('há 3 dias');
    expect(formatarDataBr('2026-09-15', 'relativa', '—', agora)).toBe('em 5 dias');
    expect(formatarDataBr('2026-07-10', 'relativa', '—', agora)).toBe('há 2 meses');
    expect(formatarDataBr('2025-09-10', 'relativa', '—', agora)).toBe('há 1 ano');
  });
  it('retorna fallback para nulo/inválido', () => {
    const pipe = new DataBrPipe();
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform('')).toBe('—');
    expect(pipe.transform('abc')).toBe('—');
    expect(pipe.transform('2026-02-30')).toBe('—');
    expect(pipe.transform(null, 'data', 'Sem data')).toBe('Sem data');
  });
  it('aceita Date', () => {
    expect(new DataBrPipe().transform(new Date(2026, 0, 5, 14, 7), 'dataHora')).toBe('05/01/2026 14:07');
  });
});

describe('competencia', () => {
  it('formata mes/ano', () => {
    const pipe = new CompetenciaPipe();
    expect(pipe.transform({ mes: 9, ano: 2026 })).toBe('Setembro/2026');
    expect(pipe.transform('2026-03')).toBe('Março/2026');
    expect(formatarCompetencia({ mes: 9, ano: 2026 }, 'curta')).toBe('set/2026');
    expect(formatarCompetencia({ mes: 9, ano: 2026 }, 'numerica')).toBe('09/2026');
  });
  it('fallback para inválido', () => {
    expect(formatarCompetencia(null)).toBe('—');
    expect(formatarCompetencia({ mes: 13, ano: 2026 })).toBe('—');
    expect(formatarCompetencia('x')).toBe('—');
  });
});
