# B2 (frente) — Saúde do animal: histórico, vacinação e receitas

Data: 2026-11-23 · Origem: roadmap `B2` (§10, linhas 1259–1276)

## Intenção

O B2 pede histórico veterinário, vacinação e receitas na ficha do animal, com dado clínico editável apenas por autor ou administração. Como no B1, o usuário decidiu que **nenhuma alteração no projeto `TempDB` será executada agora**: tabela, schema, router, migration e smoke test ficam apenas anotados em `docs/backlog/tarefas-api-tempdb.md`, para execução futura.

Este desenho cobre só a fatia de front: contrato de tipos/services, página protegida com as três listagens e formulários, testes, documentação e QA responsivo. O aceite “registrar vacina e receita, recarregar e ver na ficha” fica suspenso até a API ser executada.

## Objetivos

- Criar services para `veterinary_history`, `vaccination_history` e `veterinary_prescription`, no padrão de `animalService.ts`/`medicationService.ts`.
- Entregar uma página da equipe em `/painel/animais/:id` com os dados do animal e uma aba **Saúde** contendo histórico clínico, vacinas e receitas.
- Permitir criar e editar registros: leitura para qualquer membro da equipe; escrita de novo registro para qualquer membro; edição de registro existente apenas para o autor (`createdByMemberId`) ou administração (`isAdmin`).
- Tornar a página alcançável a partir da lista de animais do painel, sem alterar o caminho `/painel/animais`.
- Registrar em `docs/backlog/tarefas-api-tempdb.md` tudo o que a API precisará implementar, incluindo o contrato acordado aqui.
- Preservar rotas existentes e a ficha pública; interface e documentação em português; TDD.

## Não objetivo

- Criar tabelas, schemas, routers, migrations ou smoke test no `TempDB` nesta etapa.
- Alterar a ficha pública `/adocao/:id` ou exibir dado clínico para visitantes.
- Implementar os cartões “Planejado” dos relatórios 5–6 — pertencem ao B4, como os cartões 4–6 ficaram no B1.
- Excluir registros clínicos: sem DELETE na API e sem botão de exclusão na tela.
- Alterar seed, backend, tags, migrations `0001`–`0004` ou outras páginas além da lista de animais do painel (somente para acrescentar o link).
- Prometer persistência: sem dados de demonstração que pareçam reais sem aviso.

## Antiobjetivo

Mostrar a página como se o dado clínico já persistisse. Se uma requisição falhar, a página deve exibir erro claro em `Alert`, não uma lista vazia silenciosa. Registro clínico sem autor conhecido deve ser exibido como “—”, nunca atribuído a um membro arbitrário.

## Decisões do parceiro

- A aba Saúde fica em **página protegida do painel**, não na ficha pública. O parceiro escolheu essa opção para manter dado clínico fora do site público e permitir a regra de autor/administração na escrita.

## Decisões assumidas pelo autor do desenho

- **Relatórios 5–6:** ficam como “Planejado” nesta fatia; o B4 cuida deles. Motivo: coerência com o B1 e evitar tela prometendo número que a API ainda não fornece.
- **Medicamento da receita:** texto livre (nome) + posologia, sem FK para `medications`. Motivo: a API de medicamentos do B1 ainda não existe; uma FK criaria dependência entre fatias e exigiria `<select>` com segunda service. O contrato poderá migrar para FK quando as duas APIs existirem.
- **Sem DELETE:** o aceite pede registrar e visualizar; nenhuma remoção foi solicitada.
- **Autor do registro:** o front envia o `memberId` da sessão como `created_by_member_id` no POST e usa o `createdByMemberId` devolvido pela API para decidir se mostra **Editar**. A API é a autoridade final; o front apenas esconde a ação quando não há permissão.
- **Exibição do autor:** a coluna **Autor** mostra `Membro #<id>` quando há `createdByMemberId` e `—` quando não há. Não haverá consulta a `memberService` nesta fatia: o nome exigiria uma lista de membros, estados de carregamento e mocks extras sem ganho para o contrato clínico.
- **Ordenação:** as três listagens vêm ordenadas pela data do domínio (`record_date`, `application_date`, `prescription_date`) em ordem decrescente, com desempate por id decrescente. O front não reordena.
- **Sessão sem vínculo de membro:** quando `AuthUser.memberId` for `null`, os botões de criação ficam desabilitados com a mensagem “É necessário vínculo com membro para registrar dados clínicos.” e nenhum POST é enviado.
- **RBAC na API pendente:** o router é a autoridade — `PATCH` compara `created_by_member_id` com o `member_id` do usuário atual ou exige `private.is_project_admin()`, respondendo `403` com mensagem em português quando não houver permissão. A policy RLS correspondente é documentada como defesa adicional, mas o padrão do `TempDB` usa cliente `service_role`, que a contorna; o smoke test cobre o caso negativo de membro editando registro de outro autor.

## Abordagens consideradas

| Abordagem | Prós | Contras |
| --- | --- | --- |
| Aba Saúde na ficha pública `/adocao/:id` | Nenhuma rota nova; reaproveita a página existente. | Expõe dado clínico a visitantes; a regra autor/admin não tem onde ser aplicada com segurança. |
| **Nova página protegida `/painel/animais/:id` (escolhida)** | Mantém dado clínico restrito à equipe; espaço natural para a regra de autoria; link simples na lista de animais. | Uma rota nova e um teste de página adicionais. |
| Leitura pública + escrita no painel | Visibilidade máxima. | Mais escopo, mais testes e risco de vazar dado sensível; rejeitada. |

| Decisão | Alternativa descartada | Motivo |
| --- | --- | --- |
| Medicamento em texto livre | FK para `medications` | API do B1 ainda não existe; evita acoplamento entre fatias. |
| Relatórios para o B4 | Atualizar cartões agora | Evita prometer dado que a API não fornece; B1 estabeleceu o padrão. |

## Contrato acordado (espelhado no arquivo de pendências)

Tipos no front em camelCase; `snake_case` convertido apenas nas funções `map*` de cada service.

- `veterinary_history`: `history_id`, `animal_id`, `record_date` (data), `title` (1–120), `description` (texto), `created_by_member_id`, `created_at`, `updated_at`.
- `vaccination_history`: `vaccination_id`, `animal_id`, `vaccine` (1–120), `application_date` (data), `dose` (opcional, 1–40), `notes` (opcional), `created_by_member_id`, `created_at`, `updated_at`.
- `veterinary_prescription`: `prescription_id`, `animal_id`, `medication` (texto livre 1–120), `dosage` (posologia, 1–240), `prescription_date` (data), `notes` (opcional), `created_by_member_id`, `created_at`, `updated_at`.
- `GET /api/animals/{id}/veterinary-history`, `/vaccinations`, `/prescriptions`: `Page<T>` com `limit`/`offset`; filtro `q` opcional nos títulos/nomes; ordenação pela data do domínio decrescente, desempate por id decrescente.
- `POST` nas três rotas: qualquer membro da equipe; corpo inclui `created_by_member_id`.
- `PATCH /api/veterinary-history/{id}`, `/api/vaccinations/{id}` e `/api/prescriptions/{id}`: apenas autor ou administração; corpo parcial. A criação e a listagem usam o caminho aninhado em `/api/animals/{id}/...`; a edição usa o recurso pelo id diretamente.
- Sem DELETE. Mensagens de erro em português.
- Nomes no front: `id`, `animalId`, `recordDate`/`applicationDate`/`prescriptionDate`, `title`, `description`, `vaccine`, `dose`, `medication`, `dosage`, `notes`, `createdByMemberId`, `createdAt`, `updatedAt`.

## Decisões de implementação

- Novos services em `src/features/animals/services/`: `veterinaryHistoryService.ts`, `vaccinationService.ts`, `prescriptionService.ts`, cada um com tipos `Api*`/domínio, `map*`, payloads e testes. Reutilizar `withQuery` de `src/shared/api/query.ts`. `Page<T>` e `limit: 200` como nas demais listagens.
- Nova página `src/features/staff/pages/AnimalHealthPage.tsx` + teste: usa `useParams` para o `id`, `useAnimal` para o cabeçalho e `useAsyncData` para as três listagens. Abas “Dados” (resumo somente leitura do animal) e “Saúde”; a aba Saúde traz três seções com tabela, `EmptyState`, `Alert` em erro e formulário de criação/edição.
- Componente compartilhado de seção/formulário em `src/features/animals/components/` (ou local à página) para evitar três blocos quase idênticos; a forma exata fica a critério do implementador, desde que haja no máximo um formulário aberto por vez e rótulos em português.
- Nova rota `/painel/animais/:id` em `src/app/router.tsx`, dentro do `ProtectedRoute` de `MEMBER_ROLES`, sem alterar rotas existentes.
- `AnimalsAdminPage.tsx`: acrescentar um link “Ver ficha” na coluna de ações, apontando para a nova rota. É a única alteração em página já existente.
- Documentação: README, manual do usuário e roteiro de demonstração descrevem a nova página e a ressalva de que a persistência depende da API pendente; roadmap externo recebe nota logo após a nota do B1, mantendo `B2` como `[ ]`.
- Arquivo de pendências ganha uma seção `B2` com migration `0006`, schemas, routers, policies/grants, registro na aplicação, smoke test com RBAC negativo e checklist de aceite suspenso.

## Restrições

- Nenhuma alteração no `TempDB`; nada é executado em migration/seed/smoke.
- Listagens usam `Page<T>` e `limit: 200`; conversão `snake_case` → `camelCase` só nos `map*`.
- Leitura para membros; criação para membros; edição somente para autor ou administração; sem botão de exclusão.
- Datas formatadas com `formatDate` e valores nulos exibidos como `—` (ou “Sem data” onde fizer sentido), nunca datas inválidas.
- Alvos de toque ≥44 px, sem overflow horizontal em 360/768/1280 px.
- TDD: teste que falha antes de cada service/página; suíte completa, `tsc -b`, `eslint .` e `vite build` verdes; commits convencionais; nenhum push.

## Verificação

- Comandos: `node .\node_modules\vitest\vitest.mjs run`, `node .\node_modules\typescript\bin\tsc -b`, `node .\node_modules\eslint\bin\eslint.js .`, `node .\node_modules\vite\bin\vite.js build`.
- QA com `playwright-cli`, rotas de API mockadas e tokens de sessão de membro e administração; capturas `qa-360.png`, `qa-768.png`, `qa-1280.png` no workspace do plano.
