# Arquitetura

O frontend segue `presentation → application → port ← infrastructure`, com composição em `main`. Domain não depende de Angular; DTOs HTTP permanecem em infrastructure. Application e adapters usam Observable; páginas convertem operações pontuais na fronteira imperativa.

O bootstrap carrega `/config.json`, registra HTTP/interceptors, restaura a sessão por `/auth/me` e libera a navegação. Angular standalone, Signals e TypeScript strict são usados sem store global adicional.

Assistência materializa domain de beneficiários/candidaturas, application ports/use cases, adapters HTTP separados e páginas lazy-loaded. Buscas usam debounce, `distinctUntilChanged`, cancelamento por `switchMap` e filtros server-side. Mutações refazem a query da feature, sem reload da aplicação.
