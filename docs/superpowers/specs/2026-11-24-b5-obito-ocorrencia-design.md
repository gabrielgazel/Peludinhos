# B5 — Editar óbito e listar mortes (frente) — desenho

Data: 2026-11-24 · Origem: bloco `B5` do roadmap externo (linhas 1315–1331), `D3.3` (linhas 698–722) e `- [ ] B5` na tabela de acompanhamento (linha 1417).

## Intenção e por quê

O registro de óbito hoje é um `POST /animals/{id}/deceased` disparado pela lista de animais (`AnimalsAdminPage.tsx`): ele marca `is_deceased`, mas não permite corrigir data nem causa, e a ficha interna (`AnimalHealthPage.tsx`) não mostra nem edita o óbito. A lista exibe o selo “Falecido”, porém não tem filtro de falecidos nem coluna de data — não existe uma forma de conferir as mortes sem abrir animal por animal.

A edição de **ocorrência** (`PATCH /events/{id}`) já foi entregue em `D1.6` e implementada em `eventService.ts` + `EventsAdminPage.tsx`; B5 não a reimplementa. O parceiro escolheu a opção 1: tratar B5 como fatia de front com um `PATCH` dedicado para óbito, exatamente como o roadmap descreve, deixando a API documentada no `TempDB` — o mesmo arranjo de B1–B4.

## Objetivos

- Adicionar ao domínio `deathDate` e `deathCause` (API: `death_date`, `death_cause`) e um método `animalService.updateDeceased(id, payload)` que faça `PATCH /api/animals/{id}/deceased`.
- Expor na ficha do animal, na aba **Dados**, um painel **Óbito** somente para animais falecidos, com data, causa e ação **Editar óbito**.
- Acrescentar na lista de animais a opção de filtro **Falecidos** e a coluna **Data do óbito**.
- Manter `markDeceased`, a edição de ocorrência, os relatórios e as demais páginas exatamente como estão.
- Documentar no backlog o contrato completo da API (migration aditiva, schemas, router, registro, smoke test, checklist), sem executá-lo no `TempDB`.
- Deixar o aceite de persistência suspenso e `B5` como `[ ]` no roadmap até a API rodar e a correção refletir na listagem.

## Não-objetivos

- Qualquer escrita no repositório `TempDB`; migration, seed, backend, routers ou tags executados.
- Nova tela de “mortes”, rota pública, endpoint de listagem de mortes ou paginação (isso é B6).
- Alterar `EventsAdminPage`, `eventService`, `markDeceased`, ou	a lógica de ocultação de falecidos no catálogo público.
- DELETE, botão de exclusão ou “desfazer óbito”.
- Marcar `B5` como concluído no roadmap ou dar push sem confirmação.
- Mudar o `PageHead`, a navegação (`StaffLayout`) ou as regras de RBAC de outros fluxos.

## Anti-objetivos (o que seria falha mesmo funcionando)

- Data/causa inventadas, fallback para fixture ou “hoje” chutado pelo front quando a API ainda não responde.
- Ficha ou lista mostrando dado de óbito enquanto a requisição falhou.
- Correção que apaga o selo “Falecido” ou faz o animal voltar ao catálogo público.
- Erro técnico em inglês (`Failed to fetch`) vazando para o usuário.
- Um animal vivo com data preenchida na coluna ou com painel de edição na ficha.

## Restrições

- Nada executado no `TempDB`; toda pendência vai para `docs/backlog/tarefas-api-tempdb.md`.
- Domínio em `camelCase` no front; `snake_case` somente no service (`map*` e payload).
- Rótulos, mensagens de erro e documentação em português, sem mojibake.
- Padrão visual e de acessibilidade do painel: botões `min-h-11`, foco visível, erros em `Alert`.
- Correção é sempre `PATCH` auditável; sem DELETE em nenhuma das duas pontas.
- TDD por tarefa, commits convencionais, `package-lock.json` nunca entra no commit.

## Abordagens

1. **PATCH dedicado para óbito (escolhida pelo parceiro).** `PATCH /api/animals/{id}/deceased` com `death_date` e `death_cause`; service, ficha, lista e backlog seguem o passo 1 do roadmap. Trade-off: a API não existe ainda, então até o `TempDB` rodar a edição mostra erro — mas o contrato é o descrito no roadmap e nenhum número/data é chutado.
2. **Reaproveitar `PATCH /api/animals/{id}` (descartada).** Data/causa como campos genéricos do animal, sem rota nova. Menos uma rota, mas muda a semântica do update cadastral e contradiz o passo 1 do B5; ainda exigiria alteração no `TempDB`.
3. **API primeiro no `TempDB` (descartada).** Entregar B5 ponta a ponta antes do front. Inverte o padrão de B1–B4 e trabalha fora deste repositório; o parceiro optou por manter a frente pronta e a pendência documentada.

## Decisões de interface (minhas)

- **Ficha:** o painel **Óbito** fica na aba **Dados**, abaixo das informações atuais, e só aparece quando `animal.isDeceased`. Mostra `Data do óbito` (`formatDate`) e `Causa` (`—` quando vazia), mais o botão **Editar óbito**. O formulário usa `TextField` (data, tipo `date`) e um campo de texto para causa, com botões **Salvar óbito** e **Cancelar**; não há `window.confirm` — o próprio envio do formulário é a ação explícita.
- **Permissão:** a mesma do registro pela lista — qualquer membro da área da equipe pode editar; não há novo gates de `isAdmin`. A ficha pública (`AnimalDetailPage`) continua sem nada de óbito.
- **Validação:** data é obrigatória, em `AAAA-MM-DD` e não pode ser futura; causa é opcional, aparada e limitada a 200 caracteres (vazia vira `null`). Erros de preenchimento aparecem em `Alert` dentro do formulário, sem chamada à API.
- **Após salvar:** `useAnimal` ganha um `reload()` (novo campo, compatível com os três consumidores atuais) e a ficha recarrega o animal; o formulário fecha. A lista não mantém cache entre navegações e traz o dado atualizado na próxima visita. Erros de rede/HTTP são traduzidos para português, preservando `detail` da API quando presente.
- **Lista:** a coluna **Data do óbito** entra depois de **Status**, sempre presente; animal vivo mostra `—`. O filtro **Falecidos** entra na mesma seleção de **Status**; quando ele está ativo, o parâmetro `status` não é enviado à API (o filtro é local, como os atuais) e a busca por nome continua valendo. Nenhuma ordenação ou paginação nova.
- **Documentação:** o manual do usuário (seção 4.2) ganha o filtro, a coluna e a edição na ficha. O roadmap externo recebe apenas a nota `> B5 (frente) concluído em 2026-11-24; API pendente em docs/backlog/tarefas-api-tempdb.md.`, mantendo `B5` como `[ ]`. Decisão minha, no padrão de B1–B4.

## Contrato a consumir (fixado para o plano)

- `Animal` / `ApiAnimal` ganham `deathDate: string | null` / `death_date?: string | null` e `deathCause: string | null` / `death_cause?: string | null`. Campos opcionais na resposta da API para não exigir mudança prévia no backend: ausência vira `null` no `mapAnimal`.
- `animalService.updateDeceased(id, { deathDate, deathCause })` → `PATCH /animals/{id}/deceased`, corpo `{ death_date, death_cause }`, resposta `ApiAnimal` mapeada para `Animal`. `markDeceased` permanece em `POST /animals/{id}/deceased` e não ganha corpo novo.
- `GET /api/animals?include_deceased=true` continua sendo a fonte da lista; `death_date` e `death_cause` vêm junto com o animal, sem endpoint adicional de mortes.
- `PATCH /api/events/{id}` continua sendo a correção de ocorrência; o smoke test do backlog também o verifica, mas nenhum código dele muda nesta fatia.
- Erros: `detail` da API é preservado; mensagens genéricas de rede/HTTP viram “Não foi possível carregar os dados do óbito.” ou “Não foi possível salvar o óbito.”, exibidas em `Alert`.

## Pendência registrada no backlog

`docs/backlog/tarefas-api-tempdb.md` ganha a seção **B5 — Editar óbito e listar mortes** e uma linha em “Em aberto”, com: migration aditiva e idempotente `0009_deceased_correction.sql` (colunas `death_date` e `death_cause` em `animals`, grants/RLS e `notify pgrst`), schemas Pydantic para o corpo/resposta, `PATCH /api/animals/{id}/deceased` no router de animais (409 se o animal não estiver falecido, 422 para data futura/causa > 200, 404 para id inexistente), ajuste do `POST /deceased` para preencher `death_date` com a data do registro, exposição dos campos em `GET /api/animals`, registro em `app/main.py` se necessário, smoke test (anon 401; membro 200; correção refletida em `GET /api/animals?include_deceased=true`; 404/409/422; `PATCH /events/{id}` ainda corrige ocorrência; nenhuma rota DELETE), atualização do `DOCUMENTACAO.md` e checklist com comandos. Aceite suspenso até execução pelo usuário.

## O que fica para o builder

O plano `docs/superpowers/plans/2026-11-24-b5-obito-ocorrencia.md` ainda não existe: será escrito na etapa de planejamento a partir deste desenho, com textos exatos, testes e redação do backlog. Toda decisão não listada acima (nomes internos, ordem de props, detalhes de CSS) é livre, desde que não altere o comportamento visível nem o contrato. Cobertura prevista: `animalService.test.ts` (novo), `AnimalsAdminPage.test.tsx`, `AnimalHealthPage.test.tsx`; os testes atuais de ocorrência e dos demais fluxos continuam valendo.
