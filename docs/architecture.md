# Arquitetura

O frontend segue a regra `presentation → application → port ← infrastructure`, com composição em `main`. Domain não depende de Angular. DTOs HTTP permanecem em infrastructure. A application e os adapters usam Observable de forma consistente; a facade converte o término das operações em Promise apenas na fronteira imperativa das páginas e do bootstrap.

O bootstrap carrega `/config.json`, registra providers/interceptors, restaura a sessão por `/auth/me` e então libera a navegação. Angular standalone, Signals e TypeScript strict são usados sem estado global adicional.
