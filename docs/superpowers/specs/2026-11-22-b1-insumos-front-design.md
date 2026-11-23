# B1 (frente) — Insumos com contrato real, API pendente

Data: 2026-11-22 · Origem: roadmap `B1` (§10, linhas 1239–1257)

## Intenção

A tela de insumos (`/painel/insumos`) hoje só lê fixtures de `src/features/staff/data/demo.ts` e exibe o `DemoBanner`. O B1 pede persistência real, mas o usuário decidiu que **nenhuma alteração no projeto `TempDB` será executada agora**: cada tarefa de API será apenas anotada em `docs/backlog/tarefas-api-tempdb.md` e executada ao final das tarefas deste repo.

Este desenho cobre apenas a fatia de front: contrato de tipos/services, página com listagem e cadastro, testes e alinhamento da documentação. O aceite "persistir após reload" fica explicitamente suspenso até que a API seja executada.

## Objetivos

- Substituir fixtures por chamadas a `/api/medications` e `/api/products` via `httpClient`.
- Manter as duas seções (Medicamentos, Produtos), as colunas atuais e o fluxo de leitura, acrescentando criação e edição para administradores.
- Registrar no arquivo de pendências do `TempDB` tudo o que a API precisará implementar, incluindo o contrato acordado aqui.
- Preservar behavior, mensagens e rotas; interface e documentação em português; TDD.

## Não objetivo

- Criar tabelas, schemas, routers ou smoke test no `TempDB` nesta etapa.
- Aplicar migration remota ou mexer no banco.
- Excluir itens (sem DELETE na API e sem botão de exclusão na tela) — coerente com o aceite, que pede só criar/editar/listar.
- Mudar a rota `/painel/insumos`, o `DemoBanner` (ainda usado pela prévia de adoção) ou outras páginas.
- Modificar os placeholders de relatórios 4–6, que pertencem ao B4.

## Antiobjetivo

Deixar a tela parecendo funcional sem API e sem aviso: se a requisição falhar, a página deve mostrar erro claro em `Alert`, não tabela vazia silenciosa.

## Restrições

- Arquitetura feature based: tipos, service, página e testes ficam em `src/features/staff/`; nada de dependência cruzada com a feature de pontos.
- `snake_case` da API convertido para `camelCase` somente dentro das funções `map*` de cada service, como em `foodService.ts`.
- Listagens usam `Page<T>` e `limit: 200`, seguindo `FoodAdminPage`.
- Acesso: leitura para membros; criação/edição só quando `isAdmin(user?.role)`.
- Nenhuma alteração em migrations `0001`–`0004`, seed, backend ou tags.

## Abordagens consideradas

| Abordagem | Prós | Contras |
| --- | --- | --- |
| `ponto` como FK para `feeding_points` | Integridade referencial; nomenclatura padronizada. | Acopla Insumos a Pontos; exige `<select>`, segundo service e mocks extras nos testes; mais cenários de erro (404/409). |
| **`ponto` como texto livre (escolhida)** | Feature autocontida; contrato simples; página mantém as mesmas colunas; testes mudam pouco. | Sem integridade referencial nem padronização do nome do ponto; mitigado por limite de tamanho no schema. |

Também foi decidido manter `unidade` como campo adicional (as fixtures mostram "24 cápsulas") e incluir `observação`, exigida pelo roadmap e ausente nas fixtures. Ambos entram no registro de desvio do `TempDB`.

## Contrato acordado (espelhado no arquivo de pendências)

- `medication_id` / `product_id`: inteiro, chave primária.
- `name`: texto 1–120; `type`: texto 1–60; `unit`: texto 1–20; `point`: texto livre 1–120; `notes`: texto opcional; `validity`: data opcional; `created_at` / `updated_at`: datas opcionais.
- `quantity`: número ≥ 0.
- `GET /api/medications` e `GET /api/products`: `Page<T>` com filtros `q`, `limit`, `offset`.
- `POST` e `PATCH /{id}` nos dois recursos, somente administração; leitura para membros.
- Nomes em camelCase no front: `id`, `name`, `type`, `quantity`, `unit`, `validity`, `point`, `notes`, `createdAt`, `updatedAt`.

## Decisões de implementação

- Novos services `medicationService.ts` e `productService.ts` (cada um com tipos, `map*`, conversores de payload e testes), espelhando `foodService.ts`.
- Renomear `SuppliesDemoPage.tsx`/`.test.tsx` para `SuppliesPage.tsx`/`.test.tsx` e atualizar o import em `src/app/router.tsx`; a rota continua a mesma.
- Excluir `src/features/staff/data/demo.ts`: depois da migração, só a página de insumos a usa. `DemoBanner.tsx` e seu teste permanecem.
- Formulário de cadastro/edição reaproveita `TextField`, `Panel`, `Table`, `Alert`, `EmptyState` e o padrão de `FoodAdminPage`; mensagens de erro e sucesso em português.
- Testes da página mocked os services e cobrem: banner ausente, duas tabelas, colunas, chamada de listagem, botões só para admin, formulário de criação/edição, erro de API e item sem validade.
- Documentação: README, manual e roteiro deixam de dizer "dados fictícios/banner" e passam a dizer "cadastro de insumos"; a frase sobre persistência efetiva fica condicionada à execução da API e será removida no arquivo de pendências.
- Roadmap externo: `B1` permanece `[ ]`; uma nota em §11 registra a fatia de front concluída em 2026-11-22 e aponta para `docs/backlog/tarefas-api-tempdb.md`.

## Verificação

- `node .\node_modules\vitest\vitest.mjs run`, `tsc -b`, `eslint .`, `vite build`.
- QA visual em 360/768/1280 na rota de insumos (sem overflow, tabela legível, alvos de toque ≥44px).
- Persistência real após reload **não é verificável agora**; fica como passo final do arquivo de pendências do `TempDB`.

## Pendente para o usuário (fora desta fatia)

Executar, ao final, as instruções de API do `B1` em `docs/backlog/tarefas-api-tempdb.md` (migration 0005, schemas, routers, registro no `main.py`, smoke com RBAC negativo, documentação e seed opcional), remover o aviso de integração pendente dos docs e fechar `B1` no roadmap.
