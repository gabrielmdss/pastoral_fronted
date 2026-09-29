# Diretrizes de interface

A interface usa tokens globais, contraste, foco visível, labels e estados loading/error/empty. O layout é responsivo; tabelas viram cards no mobile.

Documentos ficam mascarados. Status e prioridade usam texto além da cor. Dialogs possuem `role=dialog`, título e ações claras. Formulários preservam dados após erro, bloqueiam submit duplicado e exibem loading local.

## Blocos compartilhados

Referência visual: `../image-double-studio/src/components/ui-kit.tsx`. Estilos globais em `src/styles/`
(`_tokens`, `_controls`, `_components`, `_ui-kit`, `_shell`, `_motion`). Prefira estes blocos a CSS de página
(budget de 6 kB por componente). Use apenas tokens (`var(--color-*)`, `--space-*`, `--radius-*`).

### Datas, números e competência (`src/app/shared/pipes`)
- `LOCALE_ID` = `pt-BR` e `DEFAULT_CURRENCY_CODE` = `BRL` já estão providos: `{{ n | number }}` → `1.234,5`,
  `{{ v | currency }}` → `R$ 1.234,50`, `{{ p | percent }}`.
- `DataBrPipe` (`dataBr`) — nunca exiba ISO cru nem use `.slice(0, 10)`.
  `YYYY-MM-DD` é lido como data local (sem deslocamento de fuso). Nulo ou inválido vira `—` (ou o fallback informado).
  ```html
  {{ d.data | dataBr }}                  <!-- 01/09/2026 -->
  {{ r.criadoEm | dataBr: 'dataHora' }}  <!-- 01/09/2026 14:05 -->
  {{ d.data | dataBr: 'longa' }}         <!-- terça, 1 de setembro de 2026 -->
  {{ r.criadoEm | dataBr: 'relativa' }}  <!-- hoje | ontem | há 3 dias | em 5 dias -->
  {{ x | dataBr: 'hora' }}  {{ x | dataBr: 'mesAno' }}  {{ x | dataBr: 'data' : 'Sem data' }}
  ```
  Em TS: `formatarDataBr(valor, formato?, fallback?)`, `parseDataBr(valor)`.
- `CompetenciaPipe` (`competencia`) aceita `{ mes, ano }` ou `'YYYY-MM'`:
  `{{ c | competencia }}` → `Setembro/2026`, `'curta'` → `set/2026`, `'numerica'` → `09/2026`.
  Em TS: `formatarCompetencia(...)`.

### Ícones — `IconComponent` (`<app-icon>`)
`<app-icon name="users" />`, com `[size]="20"` (padrão 16) e `label="Atenção"` quando o ícone tem significado
(sem label ele é `aria-hidden`). A cor vem de `currentColor`. Os nomes ficam em `src/app/shared/ui/icons.ts`
(`IconName`): layout-dashboard, users, clipboard-list, gauge, calendar-range, package-open, hand-coins,
file-warning, package-plus, boxes, heart-handshake, layers, clipboard-check, wrench, send, bar-chart-3,
scroll-text, search, plus, pencil, trash, chevron-right/left/down/up, chevrons-up-down, x, menu, check,
alert-triangle, info, check-circle, x-circle, inbox, calendar, clock, user, log-out, key, sun, moon, filter,
refresh, eye, eye-off, download, arrow-right, arrow-left, more-horizontal, home, shield, package,
trending-up, trending-down. Para um ícone novo, acrescente os paths em `icons.ts`.

### Cabeçalho de página — `PageHeaderComponent` (`<app-page-header>`)
```html
<app-page-header title="Beneficiários" description="Famílias atendidas" eyebrow="Assistência"
                 backLink="/distribuicoes" backLabel="Distribuições">
  <span meta><app-status-badge status="ABERTA" /></span>
  <button actions type="button"><app-icon name="plus" /> Novo</button>
</app-page-header>
```
Todos os inputs são opcionais, exceto `title`. Classes equivalentes: `.page-header`, `.eyebrow`, `.back-link`.
Vários elementos `[actions]` são aceitos (cada um vira uma ação). Blocos `@if`/`@for` com um único elemento raiz
com `actions` também são projetados; se o bloco tiver mais de um nó, envolva-o em
`<ng-container ngProjectAs="[actions]">…</ng-container>` (ou agrupe em `<div actions class="ui-actions">`).

### Card de seção
- Componente `<app-section-card title="…" description="…" [flush]="true">` com os slots `[actions]` e `[footer]`
  (o footer usa `class="ui-card__footer"`).
- Classes: `.ui-card` > `.ui-card__header` (h2 + p + `.ui-card__actions`) / `.ui-card__body`
  (`.ui-card__body--flush` sem padding) / `.ui-card__footer`. `.ui-card--interactive` eleva no hover.
  `.ui-panel` é um card simples com padding.
- Uma tabela dentro de `.ui-card` perde a borda e a sombra próprias.
- Nota em card `flush`: slot `[note]` (`<p note class="ui-message ui-message--info ui-card__note">…</p>`) ou,
  dentro do corpo (ex.: em `@if` aninhado), só a classe `.ui-card__note`, que devolve o respiro lateral do card.

### KPI — `MetricCardComponent` (`<app-metric-card>`)
```html
<div class="ui-grid ui-grid--kpi">
  <app-metric-card label="Beneficiários ativos" icon="users" tone="success" hint="+12 no mês" [delayMs]="0">
    {{ total | number }}
  </app-metric-card>
</div>
```
`tone`: `neutral | primary | success | warning | danger | info`. `variant` (`default | attention | critical`)
colore o valor e, sem `tone`, define o tom do ícone. O ícone tonal avulso usa `.ui-tone .ui-tone--{tom}`.

### Status — `StatusBadgeComponent` (`<app-status-badge>`)
`<app-status-badge [status]="x.status" />` mostra uma pílula com ponto; o tom vem do mapa `data-status`.
Para forçar um tom: `tone="warning"`. Para trocar o texto: `label="Em atraso"`. Sem ponto: `[dot]="false"`.
O mapa (tons do StatusChip do protótipo + rótulos pt-BR em `status-badge.component.ts`) já cobre, entre outros:
sucesso — ATIVO, ATIVA, APROVADA, CONFIRMADA, ENTREGUE, CONCLUIDA/O, ATENDIDO, REGULAR, SAUDAVEL, ABERTA, ADMITIDO,
VALIDA; atenção — PENDENTE, AGUARDANDO, CONVOCADO, ATENCAO, CRITICO, AJUSTADO; perigo — BLOQUEADO, REJEITADA,
ESTORNADA, SEM_SALDO, DESLIGADO, NAO_LOCALIZADO; info — ABERTO, PREPARADA, PLANEJADA, SIMULACAO, AUTORIZADA,
EM_ANALISE; neutro — SUBSTITUIDA, INATIVO, ENCERRADA, ESGOTADO, DESMONTADO, CANCELADA/O, DESISTIU, PESSOA,
INSTITUICAO. Não repita `tone`/`label` quando o mapa já resolve; use-os só para texto contextual
(ex.: `label="Composição ajustada"`). Em TS, `rotuloStatus(status)` devolve o mesmo rótulo.
Badge manual: `<span class="ui-badge ui-badge--success ui-badge--dot">Ok</span>`
(tons: success, warning, danger, info, neutral).

### Estados
- Vazio: `<app-empty-state title="…" message="…" icon="users"><button>Ação</button></app-empty-state>`.
- Erro: `<app-error-state [message]="erro()" (retry)="carregar()" title="…" retryLabel="…" [retryable]="true" />`.
- Carregando: `<app-loading-state />` (linhas), `variant="table" [rows]="6" [columns]="5"`,
  `variant="cards" [rows]="4"` e `variant="detail"`. Avulsos: `.skeleton` com `.skeleton--text`, `--title`,
  `--block` ou `--circle`.
- Alertas inline: `.ui-message` (`--info`, `--success`, `--error`, `--warning`). Sem modificador equivale a info,
  mas prefira `--info` explícito.
- Toasts: `inject(ToastService).success('Salvo.')`, e também `.error()`, `.warning()`, `.info()` e
  `.show(tone, msg, { title, durationMs })`. O host `<app-toast-host>` já está no layout autenticado.

### Lista de definição (Field do protótipo)
```html
<dl class="ui-dl">            <!-- também: ui-dl--2, ui-dl--3, ui-dl--inline -->
  <div><dt>CPF</dt><dd>***.123.456-**</dd></div>
</dl>
```

### Abas
```html
<div class="ui-tabs" role="tablist">   <!-- ou "ui-tabs ui-tabs--pill" -->
  <button class="ui-tab" role="tab" [attr.aria-selected]="aba() === 'itens'" (click)="aba.set('itens')">Itens</button>
</div>
```
Também aceita `<a class="ui-tab" routerLinkActive="is-active">`.

### Botões
O `<button>` padrão é o primário. Variantes: `.secondary` (ou `.btn--secondary`), `.btn--ghost`, `.danger`
(ou `.btn--danger`), `.button-link` e `.btn--primary` (para `<a class="btn btn--primary">`). Tamanhos:
`.btn--sm`, `.btn--lg`, `.btn--block`. Só ícone: `.btn--icon` (sempre com `aria-label`). Carregando:
`[class.is-loading]="salvando()" [disabled]="salvando()"`. Para agrupar ações: `.ui-actions` (`.ui-actions--end`).

### Campos
```html
<label class="ui-field">
  <span class="ui-field__label">Nome</span>
  <input formControlName="nome" />
  <span class="ui-field__hint">Como consta no documento</span>
  <span class="ui-field__error">Obrigatório</span>
</label>
<label class="ui-check"><input type="checkbox" /> Somente ativos</label>
<div class="ui-input-icon"><app-icon name="search" /><input type="search" /></div>
```
Inputs, selects e textareas ganham anel de foco, hover, seta no select e estado inválido/desabilitado
automaticamente. Formulários: `.form-grid`, `.form-row`, `.form-section`.

### Toolbar e filtros
```html
<div class="ui-toolbar">           <!-- .ui-toolbar--plain sem card -->
  <app-search-field class="ui-toolbar__grow" />
  <label class="ui-field"><span class="ui-field__label">Status</span><select>…</select></label>
  <div class="ui-toolbar__end ui-actions"><button class="secondary btn--sm">Limpar</button></div>
</div>
<button class="ui-chip" [attr.aria-pressed]="ativo">Ativos</button>  <!-- filtro rápido -->
```

### Tabelas
```html
<div class="ui-table-wrap" style="--table-max-height: 32rem">  <!-- cabeçalho fixo ao rolar -->
  <table class="ui-table ui-table--striped ui-table--cards">   <!-- --compact para densas -->
    <thead><tr><th>Nome</th><th class="number">Qtd.</th><th class="ui-table__actions"><span class="sr-only">Ações</span></th></tr></thead>
    <tbody><tr><td data-label="Nome">…</td><td class="number" data-label="Qtd.">{{ q | number }}</td><td class="ui-table__actions">…</td></tr></tbody>
  </table>
</div>
```
`.ui-table--cards` vira cartões abaixo de 700px (use `data-label` em cada `td`). `.table-scroll` continua valendo
(rolagem horizontal). Estados de linha: `tr.is-clickable`, `tr.is-selected` e `tr.row--attention`.

### Dialogs
`<app-confirm-dialog>` serve para confirmações. Para modais livres:
```html
<div class="ui-dialog-backdrop">
  <div class="ui-dialog ui-dialog--lg" role="dialog" aria-modal="true" aria-labelledby="t1">
    <header class="ui-dialog__header"><div><h2 id="t1">Título</h2><p>Descrição</p></div>
      <button class="btn--ghost btn--icon btn--sm" aria-label="Fechar"><app-icon name="x" /></button></header>
    <div class="ui-dialog__body">…</div>
    <footer class="ui-dialog__footer"><button class="secondary">Cancelar</button><button>Salvar</button></footer>
  </div>
</div>
```

### Layout utilitário
Página: `host: { class: 'ui-page' }` no `@Component` da página dá ritmo vertical uniforme (`gap` de `--space-5`)
entre os filhos diretos (page-header, mensagens, grids, cards) e zera margens deles — não use
`:host > x { margin-block }`, `.ui-grid { margin-block }` nem `margin-top` locais. Diálogos não ocupam espaço.
Dentro de cards/diálogos use `.ui-stack`.
`.ui-stack` (`--sm`), `.ui-grid` (`--kpi`, `--2`, `--3`, `--sidebar`, que colapsam abaixo de 900px), `.text-muted`,
`.text-sm`, `.text-xs`, `.tabular`, `.mono`, `.number` e `.sr-only`. Animações: `.fade-in-stagger` com
`[style.--delay.ms]`. Todas respeitam `prefers-reduced-motion`.

### Medidor — `MeterComponent` (`<app-meter>`)
```html
<app-meter [value]="feitos" [max]="total" label="Retiradas concluídas" />            <!-- max padrão 100 -->
<app-meter [value]="p" tone="warning" size="lg" label="Cobertura" [showLabel]="true" [valueText]="'3 de 8'" />
```
`role="progressbar"` com `aria-valuenow/max/text` e `label` como nome acessível. `tone`:
`primary | success | warning | danger | info`; `size`: `sm | md | lg`. Classes: `.ui-meter` + `.ui-meter__fill`
(`--{tom}`, `--sm`, `--lg`). Não crie barras locais (`level-bar`, `nivel`, `balanco-bar`…).

### Etapas (stepper)
```html
<ol class="ui-steps" aria-label="Etapas da preparação">
  <li class="ui-steps__item is-done"><span class="ui-tone ui-tone--success"><app-icon name="check" /></span> 1. Planejamento</li>
  <li class="ui-steps__item is-current" aria-current="step"><span class="ui-tone ui-tone--primary"><app-icon name="boxes" /></span> 2. Montagem</li>
</ol>
<ol class="ui-steps ui-steps--cards">  <!-- cartões com título + descrição -->
  <li class="ui-steps__item"><span class="ui-tone ui-tone--info">…</span>
    <span class="ui-steps__text"><strong>2. Fila</strong><small>Principal e conferência</small></span></li>
</ol>
```

### Avatar
`<span class="ui-avatar" aria-hidden="true">M</span>` (iniciais), `.ui-avatar--sm`, `.ui-avatar--lg`; com foto,
`<button class="ui-avatar ui-avatar--lg ui-avatar--clickable"><img [src]="url" alt="…" /></button>`.
Avatar + nome: `<div class="ui-person">`. Foto de pessoa com ampliação: `<app-beneficiario-avatar>`.

### Linha do tempo
```html
<ol class="ui-timeline" aria-label="Histórico">
  <li class="ui-timeline__item"><span class="ui-tone ui-tone--info"><app-icon name="clock" /></span>
    <div class="ui-timeline__body">
      <div class="ui-timeline__head"><strong>Evento</strong><time class="ui-timeline__meta">01/09/2026 14:05</time></div>
      <p class="ui-timeline__details">…</p>
    </div></li>
</ol>
```
`.ui-timeline--plain`: sem ícone, só a linha à esquerda (ex.: histórico de versões).

### Código / JSON
`<pre class="ui-code">{{ valor | json }}</pre>` — monoespaçado, rolagem até 20rem, quebra de linha.

### Formulários com itens repetidos
- `<fieldset class="ui-fieldset--plain ui-stack" [disabled]="saving()">` — fieldset sem moldura.
- Linha de FormArray: `<div class="ui-panel ui-form-row" [formGroupName]="i">` (campo principal + 2 campos +
  botão remover) ou `ui-form-row ui-form-row--3` (principal + 1 campo + remover). Empilha abaixo de 700px.

### Confirmações
Não use `window.confirm`. Na página:
```ts
readonly confirmacao = new Confirmacao();   // de shared/ui/confirm-dialog.component
if (!(await this.confirmacao.pedir({ title: 'Registrar perda', message: '…', confirmLabel: 'Registrar', danger: true }))) return;
```
```html
@if (confirmacao.atual(); as c) {   <!-- no fim do template, fora de outros @if -->
  <app-confirm-dialog [title]="c.title" [message]="c.message ?? ''" [confirmLabel]="c.confirmLabel ?? 'Confirmar'"
    [danger]="!!c.danger" (confirm)="confirmacao.responder(true)" (dismiss)="confirmacao.responder(false)" />
}
```
Cancelar/Esc resolve `false` (nenhuma chamada à API); novos pedidos enquanto um está aberto resolvem `false`
(duplo clique). `message` aceita quebras de linha (`\n`). Em specs: `const p = page.acao(); await responderConfirmacao(fixture, true|false); await p;`

#### Coleta de dados (substitui `window.prompt`)
```ts
const dados = await this.confirmacao.pedirDados({
  title: 'Estornar retirada', confirmLabel: 'Estornar', danger: true,
  campos: [{ id: 'motivo', label: 'Motivo do estorno', tipo: 'textarea', obrigatorio: true }],
});
if (!dados) return; // cancelado
const motivo = dados['motivo']; // já sem espaços nas pontas
```
Tipos de campo: `texto` (padrão; Enter confirma), `textarea` e `select` (`opcoes: [{ valor, label }]`, use para
enums em vez de texto livre). Campos `obrigatorio` desabilitam Confirmar enquanto vazios; o primeiro campo recebe foco.
No template, acrescente ao `<app-confirm-dialog>`:
`[campos]="c.campos ?? []" [valores]="confirmacao.valores()" (campoAlterado)="confirmacao.alterarCampo($event)"`.
Em specs: `const p = page.acao(); await preencherDialogo(fixture, { motivo: 'x' }); await p;`
(de `shared/ui/confirm-dialog.testing`). Não use `window.prompt`/`window.confirm` no projeto.
(`shared/ui/confirm-dialog.testing.ts`).

### Shell (menu e cabeçalho)
- A estrutura do menu fica em `src/app/presentation/layout/navigation.ts` (`NAVIGATION`: grupos → itens →
  subitens, cada um com a sua verificação de permissão). Para incluir uma tela, acrescente uma entrada ali;
  os breadcrumbs são derivados da mesma estrutura (`buildBreadcrumbs`). Segmentos extras: `:id` vira
  "Detalhe", e `novo`, `atendimento` e `liberacoes` têm rótulos próprios (`SEGMENT_LABELS`).
- Texto forte sobre fundo da sidebar (ex.: painel de identidade do login): `var(--color-sidebar-text-strong)`.
- O estado de expansão fica salvo em `localStorage['pastoral-nav-expanded']`. O grupo da rota ativa abre
  sozinho.
