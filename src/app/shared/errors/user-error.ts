import { HttpErrorResponse } from '@angular/common/http';
const messages: Record<string, string> = {
  MODELO_VERSAO_NAO_ENCONTRADO: 'A versão do modelo não foi encontrada. Atualize as opções.',
  PLANEJAMENTO_NAO_ENCONTRADO: 'Planejamento não encontrado.',
  PLANEJAMENTO_SEM_VERSAO_PENDENTE: 'Este planejamento não possui versão pendente de aprovação. A consulta será atualizada.',
  MODELO_VERSAO_INCOMPATIVEL: 'Selecione uma versão pertencente ao modelo deste planejamento.',
  MODELO_CESTA_JA_EXISTE: 'Não foi possível criar o modelo. Verifique se já existe um modelo com esse nome.',
  ITEM_DUPLICADO: 'Uma apresentação foi informada mais de uma vez.',
  META_ITENS_INCONSISTENTE: 'A meta de itens deve corresponder às quantidades da composição.',
  INSUMO_JA_EXISTE: 'Já existe um insumo com esse nome.',
  CATEGORIA_NAO_ENCONTRADA: 'Categoria não encontrada. Atualize a consulta.',
  DOADOR_NAO_ENCONTRADO: 'Doador não encontrado. Atualize a consulta.',
  ENTRADA_ESTOQUE_INVALIDA: 'Não foi possível registrar a entrada. Verifique os itens e os dados informados.',
  PERDA_ESTOQUE_INVALIDA: 'Não foi possível registrar a perda. Verifique o motivo e os dados informados.',
  SALDO_INSUFICIENTE: 'O saldo disponível é insuficiente para esta operação. Os dados devem ser atualizados.',
  MONTAGEM_INVALIDA: 'Não foi possível montar o lote. Confira a versão aprovada do planejamento, a quantidade e as reservas disponíveis.',
  LOTE_NAO_ENCONTRADO: 'Lote não encontrado. Atualize a consulta.',
  QUANTIDADE_CESTAS_INSUFICIENTE: 'A quantidade de cestas solicitada não está disponível neste lote.',
  LOTE_AJUSTADO_DESMONTAGEM_PARCIAL: 'Este lote possui ajustes e só pode ser desmontado integralmente.',
  LOTE_AJUSTE_CESTAS_INDISPONIVEIS: 'O ajuste exige que todas as cestas do lote estejam disponíveis no estoque.',
  LOTE_DESMONTADO: 'Este lote já foi desmontado. Atualize a consulta.',
  COMPOSICAO_LOTE_INVALIDA: 'A composição deste lote precisa de conferência. Procure a coordenação.',
  AJUSTE_INVALIDO: 'O ajuste não é compatível com a composição registrada do lote.',
  COMPETENCIA_NAO_ENCONTRADA: 'Competência não encontrada.',
  DISTRIBUICAO_NAO_REMARCAVEL: 'Esta distribuição não pode ser remarcada no status atual. Atualize a consulta.',
  VALIDACAO_INVALIDA: 'Verifique os dados informados.',
  REGISTRO_DUPLICADO: 'Já existe um registro com os dados informados.',
  REFERENCIA_INVALIDA: 'Um registro relacionado não está disponível. Atualize a consulta.',
  REGRA_DE_INTEGRIDADE: 'Os dados não atendem às regras permitidas pelo servidor.',
  CONCORRENCIA_REPETIR: 'Os dados foram alterados por outra operação. Tente novamente.',
  RECURSO_OCUPADO: 'O registro está ocupado. Tente novamente em instantes.',
  CREDENCIAIS_INVALIDAS: 'Login ou senha inválidos.',
  AUTH_INVALIDA: 'Login ou senha inválidos.',
  PERMISSAO_NEGADA: 'Você não possui permissão para realizar esta ação.',
  USUARIO_INATIVO: 'Este usuário está inativo.',
  SEM_VAGA: 'Não há vaga disponível no momento.',
  CAPACIDADE_EXCEDIDA: 'A capacidade disponível foi excedida.',
  PESSOA_JA_BENEFICIARIA: 'Esta pessoa já é beneficiária.',
  BENEFICIARIO_JA_ATIVO: 'Esta pessoa já é beneficiária ativa.',
  BENEFICIARIO_JA_CADASTRADO: 'Esta pessoa já possui cadastro de beneficiário.',
  BENEFICIARIO_DESLIGADO: 'Este beneficiário está desligado.',
  BENEFICIARIO_INATIVO: 'Este beneficiário está desligado.',
  BENEFICIARIO_NAO_ENCONTRADO: 'Beneficiário não encontrado.',
  CANDIDATURA_INVALIDA: 'Esta candidatura não pode ser alterada.',
  CANDIDATURA_INATIVA: 'Esta candidatura não está ativa.',
  CANDIDATURA_NAO_ADMISSIVEL: 'Esta candidatura não pode ser admitida.',
  CANDIDATURA_NAO_ENCONTRADA: 'Candidatura não encontrada.',
  CANDIDATURA_ATIVA_EXISTENTE: 'Já existe uma candidatura ativa para esta pessoa.',
  DOCUMENTO_DUPLICADO: 'Já existe uma pessoa com este documento.',
  TIPO_DOCUMENTO_INVALIDO: 'Selecione um tipo de documento válido.',
  PESSOA_NAO_ENCONTRADA: 'Pessoa não encontrada.',
  GRUPO_NAO_ENCONTRADO: 'Grupo não encontrado.',
  MOTIVO_NAO_ENCONTRADO: 'Motivo de desligamento não encontrado.',
  JUSTIFICATIVA_OBRIGATORIA: 'Informe uma justificativa válida.',
  REGULARES_AGUARDANDO: 'Aguarde o atendimento dos beneficiários regulares.',
  DIREITO_NAO_DISPONIVEL: 'O direito está previsto para outra distribuição.',
  SEM_CESTA_DISPONIVEL: 'Não há cesta disponível para esta retirada.',
  REPRESENTANTE_INVALIDO: 'Informe o representante e confirme a autorização.',
  RETIRADA_JA_ESTORNADA: 'Esta retirada já foi estornada.',
  ESTORNO_NAO_AUTORIZADO: 'Você não possui permissão para estornar esta retirada.',
  MOTIVO_OBRIGATORIO: 'Informe o motivo do estorno.',
  ESTORNO_INVALIDO: 'Não foi possível estornar esta retirada.',
  DISTRIBUICAO_NAO_ENCONTRADA: 'Distribuição não encontrada.',
  INVENTARIO_DESATUALIZADO: 'O estoque foi alterado após a abertura e o saldo capturado está desatualizado. A conclusão foi recusada. Abra um novo inventário e refaça a conferência; não há operação de sincronização ou reaproveitamento.',
  INVENTARIO_ITEM_NAO_ENCONTRADO: 'O item não foi encontrado em um inventário aberto. Atualize a consulta para verificar se o inventário já foi concluído.',
  INVENTARIO_INVALIDO: 'Não foi possível concluir o inventário. Verifique se ele existe e permanece aberto.',
  MODELO_CESTA_NAO_ENCONTRADO: 'Modelo de cesta não encontrado. Atualize as opções disponíveis.',
  MODELO_CESTA_INATIVO: 'Este modelo de cesta está inativo.',
  CESTA_ADICIONAL_NAO_ENCONTRADA: 'Cesta adicional não encontrada. Atualize a consulta.',
  CESTA_ADICIONAL_NAO_AUTORIZADA: 'Esta cesta adicional não está autorizada para entrega. Ela pode já ter sido entregue ou cancelada.',
  ENTREGA_CESTA_ADICIONAL_INVALIDA: 'Não foi possível entregar a cesta adicional. Confira a autorização, o modelo e a disponibilidade na distribuição.',
  LIBERACAO_INVALIDA: 'Não foi possível liberar as cestas. Confira o lote, a quantidade disponível e o estado da distribuição.',
  DISTRIBUICAO_ENCERRADA: 'Esta distribuição já foi encerrada.',
  DISTRIBUICAO_NAO_ABERTA: 'A distribuição precisa estar aberta para esta operação.',
  ENCERRAMENTO_INVALIDO: 'Não foi possível encerrar: verifique as pendências operacionais.',
  AUSENCIA_NAO_ENCONTRADA: 'A ausência não foi encontrada.',
  JUSTIFICATIVA_PENDENTE_EXISTENTE: 'Já existe uma justificativa pendente para esta ausência.',
  DESCRICAO_OBRIGATORIA: 'Informe a descrição da justificativa.',
  JUSTIFICATIVA_NAO_ENCONTRADA: 'A justificativa não foi encontrada.',
  JUSTIFICATIVA_JA_AVALIADA: 'Esta justificativa já foi avaliada.',
  TIPO_ARQUIVO_INVALIDO: 'Formato de imagem não suportado. Envie um arquivo JPEG, PNG ou WEBP.',
  ARQUIVO_INVALIDO: 'A imagem é muito grande. O tamanho máximo permitido é 5MB.',
  FOTO_NAO_ENCONTRADA: 'Este beneficiário ainda não possui foto cadastrada.',
};
export function userErrorMessage(
  error: unknown,
  fallback = 'Não foi possível concluir. Tente novamente.',
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body: unknown = error.error;
  const code =
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'object' &&
    body.error !== null &&
    'code' in body.error
      ? String(body.error.code)
      : '';
  if (messages[code]) return messages[code];
  if (error.status === 401) return 'Login ou senha inválidos.';
  if (error.status === 403) return messages['PERMISSAO_NEGADA']!;
  if (error.status === 400 || error.status === 422) return 'Verifique os dados informados.';
  if (error.status === 409) return 'A operação não pôde ser concluída devido ao estado atual.';
  return fallback;
}
