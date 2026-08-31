# AGENTS.md — Frontend da Pastoral de Distribuição de Cestas

## 1. Objetivo

Construir o frontend web do sistema da pastoral de distribuição de cestas consumindo exclusivamente a API REST existente.

O frontend deve ser responsivo, simples para voluntários, rápido durante atendimento, consistente visualmente e orientado às permissões retornadas pela API.

O backend é a autoridade das regras de negócio. O frontend não deve duplicar regras críticas como direito mensal, classificação REGULAR/PENDENTE, capacidade, prioridade da fila, saldo, reservas, cobertura ou encerramento.

## 2. Fonte de verdade

Antes de implementar:

1. leia este `AGENTS.md`;
2. leia o OpenAPI atual;
3. leia a documentação da API;
4. valide endpoints reais;
5. não invente contratos;
6. não copie estruturas do banco para o frontend sem necessidade.

## 3. Arquitetura

Utilizar camadas no topo:

```text
src/app/
├── domain/
├── application/
├── infrastructure/
├── presentation/
├── main/
└── shared/
```

Os módulos ficam dentro das camadas:

```text
domain/beneficiarios
application/beneficiarios
infrastructure/api/beneficiarios
presentation/beneficiarios
```

Evitar organizar como `modules/beneficiarios/domain/...`.

## 4. Regra de dependência

```text
               DOMAIN
                 ▲
                 │
            APPLICATION
             ▲       ▲
             │       │
 INFRASTRUCTURE     PRESENTATION
             ▲       ▲
                 MAIN
```

- `domain`: não conhece Angular, HttpClient, Router ou storage.
- `application`: conhece domain e ports; não usa HttpClient diretamente.
- `infrastructure`: implementa ports, conhece API, storage e config.
- `presentation`: conhece Angular e application.
- `main`: registra providers, rotas, interceptors e composição.

## 5. Stack

Usar a versão Angular instalada no projeto, preferindo:

```text
Angular standalone
TypeScript strict
Angular Router
HttpClient
Reactive Forms
Signals
RxJS quando necessário
SCSS
```

Não introduzir NgRx sem necessidade demonstrada.

## 6. Estrutura esperada

```text
src/app/
├── domain/
│   ├── auth/
│   ├── pessoas/
│   ├── beneficiarios/
│   ├── candidaturas/
│   ├── distribuicoes/
│   ├── atendimento/
│   ├── estoque/
│   ├── cestas/
│   └── planejamento/
├── application/
│   ├── auth/
│   ├── beneficiarios/
│   ├── candidaturas/
│   ├── distribuicoes/
│   ├── atendimento/
│   ├── estoque/
│   ├── planejamento/
│   ├── dashboard/
│   └── relatorios/
├── infrastructure/
│   ├── api/
│   │   ├── auth/
│   │   ├── beneficiarios/
│   │   ├── candidaturas/
│   │   ├── distribuicoes/
│   │   ├── atendimento/
│   │   ├── estoque/
│   │   ├── planejamento/
│   │   ├── dashboard/
│   │   └── relatorios/
│   ├── auth/
│   ├── storage/
│   └── config/
├── presentation/
│   ├── layout/
│   ├── auth/
│   ├── dashboard/
│   ├── beneficiarios/
│   ├── candidaturas/
│   ├── distribuicoes/
│   ├── atendimento/
│   ├── estoque/
│   ├── planejamento/
│   ├── relatorios/
│   └── shared/
├── main/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── providers.ts
└── shared/
    ├── errors/
    ├── types/
    ├── utils/
    ├── constants/
    └── ui/
```

## 7. Configuração da API

Não hardcode URLs em services.

Preferir configuração runtime, por exemplo:

```text
public/config.json
```

```json
{
  "apiBaseUrl": "http://localhost:3000/api/v1"
}
```

Criar uma abstração central como:

```ts
export interface AppConfig {
  apiBaseUrl: string;
}
```

## 8. Bootstrap

Fluxo:

```text
carregar config
↓
registrar HttpClient
↓
registrar interceptors
↓
restaurar sessão
↓
configurar Router
↓
renderizar aplicação
```

## 9. Auth

Fluxo:

```text
Login
↓
POST /auth/login
↓
accessToken
↓
storage
↓
GET /auth/me
↓
perfis/permissões
↓
navegação
```

Não usar payload do JWT como fonte principal de permissões.

## 10. Session storage

Criar port:

```ts
export interface SessionStoragePort {
  getAccessToken(): string | null;
  setAccessToken(token: string): void;
  clear(): void;
}
```

Implementação inicial pode usar `sessionStorage`.

Não acessar storage diretamente em componentes.

## 11. Interceptor JWT

Adicionar `Authorization: Bearer <token>` automaticamente para chamadas da API.

Não enviar token para assets, `config.json` ou URLs externas.

## 12. Interceptor de erros

Centralizar:

```text
401 → limpar sessão/login quando apropriado
403 → acesso negado
404 → recurso não encontrado
409 → regra de negócio
400/422 → validação
500 → mensagem genérica
```

Nunca mostrar SQL, stack trace ou constraint.

## 13. RBAC

Criar API de sessão:

```ts
hasPermission(code: string): boolean
```

Usar para guards, menu, botões e ações.

Não codificar autorização por nome de perfil.

## 14. Guards

Criar:

```text
authGuard
permissionGuard
```

O guard melhora UX; o backend continua sendo a segurança real.

## 15. Domain

Manter leve.

Exemplo:

```ts
export interface Beneficiario {
  id: string;
  pessoaId: string;
  nomeCompleto: string;
  status: 'ATIVO' | 'DESLIGADO';
  grupo: {
    id: string;
    codigo: string;
    nome: string;
  } | null;
}
```

IDs continuam como `string`.

## 16. Application

Representar intenções de usuário.

Exemplos:

```text
LoginUseCase
BuscarBeneficiariosUseCase
ObterBeneficiarioUseCase
AdmitirBeneficiarioUseCase
AbrirDistribuicaoUseCase
RegistrarCheckInUseCase
RegistrarRetiradaUseCase
RegistrarEntradaEstoqueUseCase
```

Não criar wrappers sem propósito.

## 17. Ports de API

Exemplo:

```ts
export interface BeneficiariosApiPort {
  listar(filtro: BeneficiarioFiltro): Promise<Paginated<BeneficiarioResumo>>;
  obter(id: string): Promise<BeneficiarioDetalhe>;
}
```

Infrastructure implementa com HttpClient.

## 18. Infrastructure API

Exemplo:

```text
infrastructure/api/beneficiarios/
├── beneficiarios-api.service.ts
├── beneficiarios-api.contracts.ts
└── beneficiarios-api.mapper.ts
```

DTO HTTP não deve vazar indiscriminadamente para presentation.

## 19. Exemplo completo — Beneficiários

```text
domain/beneficiarios/
├── beneficiario.model.ts
└── grupo.model.ts

application/beneficiarios/
├── ports/
│   └── beneficiarios-api.port.ts
├── use-cases/
│   ├── buscar-beneficiarios.use-case.ts
│   └── obter-beneficiario.use-case.ts
└── models/
    └── beneficiario-filtro.ts

infrastructure/api/beneficiarios/
├── beneficiarios-api.service.ts
├── beneficiarios-api.contracts.ts
└── beneficiarios-api.mapper.ts

presentation/beneficiarios/
├── pages/
│   ├── beneficiarios-list.page.ts
│   └── beneficiario-detail.page.ts
├── components/
│   ├── beneficiario-card.component.ts
│   ├── beneficiario-search.component.ts
│   └── beneficiario-status-badge.component.ts
└── beneficiarios.routes.ts
```

Fluxo:

```text
BeneficiariosListPage
↓
BuscarBeneficiariosUseCase
↓
BeneficiariosApiPort
↓
BeneficiariosApiService
↓
HttpClient
↓
GET /api/v1/beneficiarios
```

## 20. Presentation

Separar `pages`, `components`, `dialogs` e `forms`.

Page:
- orquestra feature;
- lê params;
- chama application;
- controla estado.

Component:
- recebe dados;
- emite eventos;
- não acessa API diretamente.

## 21. Estado de tela

Toda página remota deve prever:

```text
loading
success
empty
error
```

Preferir Signals para estado local.

## 22. Formulários

Usar Reactive Forms.

Todo formulário deve:
- possuir label;
- validar;
- exibir mensagens;
- impedir submit duplicado;
- indicar processamento;
- manter dados após erro de negócio.

## 23. Selects

Listas pequenas podem ser carregadas integralmente:

```text
grupo
tipo de documento
categoria de insumo
motivo
```

Dados grandes devem usar autocomplete server-side.

## 24. Busca operacional

Atendimento deve priorizar campo único por:

```text
nome
documento
```

Resultado deve mostrar:
- foto;
- nome;
- documento mascarado;
- grupo;
- status.

Usar debounce e `switchMap`.

## 25. Atendimento

UX prioritária:

```text
buscar pessoa
↓
selecionar
↓
check-in
↓
API retorna REGULAR/PENDENTE
↓
ação disponível
```

Frontend nunca decide REGULAR/PENDENTE.

## 26. Triagem

REGULAR:
- destaque positivo;
- texto explícito;
- fila principal.

PENDENTE:
- destaque de atenção;
- texto explícito;
- motivos;
- fila secundária.

Não depender somente de cor.

## 27. Retirada

Operador deve ver ação simples:

```text
ENTREGAR CESTA
```

Não deve escolher lote, versão, reserva ou movimentação.

## 28. Confirmações

Usar confirmação para:
- desligar;
- estornar;
- encerrar distribuição;
- alterar capacidade.

Não usar modal para ações triviais.

## 29. Dashboard

Consumir somente:

```text
GET /api/v1/dashboard
```

Não remontar indicadores por múltiplos endpoints.

## 30. Relatórios

Paginação e filtros server-side.

Não baixar tudo para filtrar no browser.

## 31. Tabelas

Padrão:

```text
header
filtros
loading
empty
linhas
paginação
ações
```

No mobile, adaptar para cards ou esconder colunas secundárias.

## 32. Layout

Menu sugerido:

```text
Dashboard

Assistência
├── Beneficiários
├── Lista de espera
└── Capacidade

Atendimento
├── Distribuições
├── Triagem
└── Histórico

Estoque
├── Insumos
├── Entradas
├── Inventário
├── Modelos
├── Planejamento
└── Montagem

Gestão
├── Relatórios
├── Auditoria
└── Usuários
```

Mostrar itens conforme permissões efetivas.

## 33. Responsividade

Prioridade:

```text
desktop operacional
tablet
mobile
```

Evitar scroll horizontal sempre que possível.

## 34. Design

Objetivo:

```text
limpo
institucional
acolhedor
alto contraste
baixo ruído visual
```

Evitar gradientes decorativos, excesso de cards e animações inúteis.

## 35. Design tokens

Centralizar:
- cores;
- spacing;
- radius;
- shadows;
- typography;
- z-index.

Não espalhar valores arbitrários.

## 36. Shared UI

Criar somente o necessário:

```text
PageHeader
LoadingState
EmptyState
ErrorState
StatusBadge
ConfirmDialog
Pagination
SearchField
PermissionOnly
```

Não construir design system gigante antes da necessidade.

## 37. Acessibilidade

Obrigatório:
- labels;
- foco visível;
- teclado;
- contraste;
- aria quando necessário;
- `button` para ações;
- texto em ações críticas.

## 38. Datas

Datas civis (`YYYY-MM-DD`) não devem sofrer conversão de timezone.

Timestamps podem ser apresentados no timezone local.

## 39. Erros de domínio

Criar mensagens amigáveis.

Exemplos:

```text
SEM_VAGA
→ Não há vaga disponível no momento.

BENEFICIARIO_PENDENTE
→ Este beneficiário possui uma pendência anterior.

SEM_CESTA_DISPONIVEL
→ Não há cesta liberada disponível para esta distribuição.

REGULARES_AGUARDANDO
→ Beneficiários regulares presentes devem ser atendidos primeiro.
```

## 40. Toasts

Usar para conclusão e erro de ação.

Não usar toast para toda leitura.

## 41. Loading

Loading local por botão/feature.

Evitar bloquear tela inteira por request secundário.

## 42. OpenAPI

Usar OpenAPI como contrato de referência.

Se gerar client/tipos:
- encapsular em infrastructure;
- presentation não deve depender diretamente do client gerado.

## 43. Testes

Cobrir principalmente:
- use cases;
- facades;
- guards;
- interceptors;
- mappers;
- componentes críticos.

## 44. E2E

Fluxos prioritários:
- login;
- dashboard;
- beneficiários;
- atendimento;
- estoque.

## 45. Segurança

Não:
- armazenar senha;
- logar JWT;
- mostrar observação restrita sem permissão;
- exibir documento completo sem necessidade;
- confiar em botão oculto como segurança.

## 46. Rotas sugeridas

```text
/login
/dashboard

/beneficiarios
/beneficiarios/:id

/candidaturas

/distribuicoes
/distribuicoes/:id
/distribuicoes/:id/atendimento

/estoque/insumos
/estoque/entradas
/estoque/inventarios
/estoque/modelos
/estoque/planejamentos
/estoque/montagem

/relatorios
/auditoria
```

Usar lazy loading por feature.

## 47. Main

```text
main/
├── app.config.ts
├── app.routes.ts
└── providers.ts
```

Registrar HttpClient, Router, interceptors, config, ports e implementações.

## 48. Injection tokens

Usar quando fizer sentido:

```ts
export const BENEFICIARIOS_API =
  new InjectionToken<BeneficiariosApiPort>('BENEFICIARIOS_API');
```

Não instanciar adapter em componente.

## 49. Primeiro vertical slice

Concluir primeiro:

```text
Login
↓
sessão
↓
AuthGuard
↓
layout
↓
Dashboard
```

## 50. Segundo vertical slice

```text
Beneficiários
├── listagem
├── busca
├── detalhe
├── admissão
├── alteração de grupo
├── desligamento
└── reativação
```

## 51. Terceiro vertical slice

```text
Atendimento
├── distribuições
├── abertura
├── busca
├── check-in
├── fila principal
├── fila secundária
├── justificativa
├── retirada
└── encerramento
```

## 52. Quarto vertical slice

```text
Estoque
├── insumos
├── entradas
├── perdas
├── inventário
├── modelos
├── planejamento
├── montagem
└── liberação
```

## 53. Gate técnico inicial

Antes de módulos completos:

```text
[ ] projeto Angular sobe
[ ] TypeScript strict
[ ] lint
[ ] build
[ ] config API
[ ] HttpClient
[ ] auth interceptor
[ ] error interceptor
[ ] session facade
[ ] auth guard
[ ] permission guard
[ ] layout
[ ] routing
[ ] login
[ ] dashboard
```

## 54. Qualidade

Não permitir:
- HttpClient em componente;
- subscribe aninhado;
- `any` indiscriminado;
- URL hardcoded;
- permissão hardcoded por perfil;
- regra de negócio duplicada;
- estado global para tudo;
- componentes gigantes;
- formulário sem validação;
- tabela sem empty/loading/error.

## 55. Documentação

Gerar:

```text
docs/
├── architecture.md
├── api-integration.md
├── ui-guidelines.md
├── routing.md
└── testing.md
```

README deve explicar instalação, configuração da API, execução, build, testes e estrutura.

## 56. Diretriz final

Priorize:

```text
simplicidade operacional
velocidade no atendimento
legibilidade
responsividade
feedback claro
baixo acoplamento
consistência
```

O frontend deve capturar intenção, validar formato, mostrar estado e consumir a API. As invariantes centrais permanecem no backend.
