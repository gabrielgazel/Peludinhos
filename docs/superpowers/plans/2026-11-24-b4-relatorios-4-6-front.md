# B4 — Relatórios 4–6 (frente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os cartões “Próximos relatórios” por três painéis reais (ocorrências mensais, medicamentos, produtos) alimentados por `GET /api/reports/...`, com filtro de período compartilhado e CSV por painel, deixando a API pendente apenas documentada.

**Architecture:** Um service novo (`reportService`) concentra as duas chamadas e a conversão `snake_case` → `camelCase`. Um util puro (`reportRows`) monta linhas e CSV a partir dos dados já mapeados, mantendo `ReportsPage` enxuta. A página reusa o `ReportSection`, o `useAsyncData` e o filtro existentes; um `reportPeriod` com o último intervalo válido impede buscas com período inválido sem alterar os relatórios 1–3. Nenhum número é inventado: sem API, o painel mostra erro ou vazio.

**Tech Stack:** React 19 + TypeScript, Vitest + Testing Library, Tailwind, `httpClient`, `withQuery`, `useAsyncData`, `csv.ts`.

**Spec:** `docs/superpowers/specs/2026-11-24-b4-relatorios-4-6-front-design.md`

## Global Constraints

- Toda alteração no projeto `TempDB` vai **apenas** para `docs/backlog/tarefas-api-tempdb.md`; nada é executado nesta fatia.
- Nenhuma alteração em migrations `0001`–`0007`, seed, backend, rotas, tags ou páginas existentes, exceto `ReportsPage`.
- Relatórios 1–3 (status, pontos, consumo de ração) permanecem com dados, rótulos, CSV e testes atuais.
- Domínio em camelCase no front; conversão para `snake_case` somente dentro de `reportService` (`map*` e query).
- Um único filtro de período; presets `7`/`30`/`90`, padrão `30`, e datas `custom` em `AAAA-MM-DD`.
- Sem biblioteca de gráficos; barras em CSS puro. Sem DELETE e sem botão de exclusão.
- Números em pt-BR com até 2 casas; CSV com BOM, `;` e CRLF via `toCsvFile`/`csvFilename`.
- Rótulos, mensagens, documentação e CSV em português, sem mojibake (`Ã`/`Â`/`â€`).
- Alvos de toque `min-h-11`, foco visível, erros em `Alert`.
- `B4` permanece `[ ]` no roadmap externo; aceite de persistência suspenso.
- TDD antes do código; commits convencionais; nenhum push; `package-lock.json` nunca no commit.

## Review Focus

- API do B4 não executada (404/erro de rede) → nenhum número e nenhum fallback para fixture; erro em `Alert` do painel. Prova: teste “isolamento de erro por painel” na Task 4.
- Intervalo invertido ou `custom` incompleto → os três painéis novos não disparam novas buscas e mantêm o último dado válido. Prova: teste “não recarrega os novos painéis com intervalo invertido” na Task 4.
- Um painel falha sozinho → os outros cinco continuam renderizando. Prova: mesmo teste de isolamento da Task 4 (status, pontos e consumo também são verificados).
- Unidades diferentes entre medicamentos → nunca somar `totalQuantity` como se fossem iguais; total em destaque é contagem de itens. Prova: teste `buildSupplyRows` na Task 3 e o teste de totais na Task 4.
- CSV com acentos, decimal `7,5` e nome com data → BOM, `;`, CRLF e slug correto. Prova: testes de CSV nas Tasks 3 e 4.
- Período trocado → todos os três painéis refazem a busca com o mesmo `from`/`to`. Prova: teste “aplica o período padrão e recarrega os três ao trocar” na Task 4.

---

### Task 1: Pendências de API do B4 no backlog

**Files:**
- Modify: `docs/backlog/tarefas-api-tempdb.md` (índice em `16-26` + nova seção no fim)
- Modify (fora do git): `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md` (após a nota do B3, perto da linha 1423)

**Interfaces:**
- Consumes: seções `B1`/`B2`/`B3` do backlog como modelo de contexto/passo/aceite/restrições; spec do B4.
- Produces: contrato documentado que as Tasks 2–4 consomem (`/reports/occurrences-by-month`, `/reports/supply-consumption`, campos e regras).

- [ ] **Step 1: Atualizar o índice e criar a seção `## B4 — Relatórios 4–6`**

Troque o placeholder “Tarefas futuras (B4 em diante)” pelo item `- [ ] **B4 — Relatórios 4–6** — detalhes na seção B4 abaixo.` e acrescente a seção no fim do arquivo, em português, com: contexto (front consome relatórios dedicados; B1 não tem histórico de consumo), migration aditiva `0008_supply_movement.sql` (`supply_type` em `medication|product`, `supply_id`, `movement_kind` em `consumo|entrada`, `quantity`, `movement_date`, `point`, `created_by_member_id`, `created_at`/`updated_at`, índices, RLS para membro, nada para `anon`, `service_role` com CRUD, `notify pgrst, 'reload schema';`), schemas Pydantic de resposta, `GET /api/reports/occurrences-by-month?from=&to=` agrupando `events` por mês com `animal_name`/`member_name` aninhados, `GET /api/reports/supply-consumption?kind=medication|product&from=&to=` somando só movimentos `consumo` e trazendo `stock_quantity` da tabela atual, registro do router `app/routers/reports.py` em `app/main.py`, smoke test `[15] Relatórios (B4)` — ou o próximo número livre, renumerando o bloco de sessão — (anon 401, membro 200, `kind` inválido 422, `from > to` 422, contagens iguais ao seed e nenhuma rota DELETE), extensão determinística do seed e atualização do `DOCUMENTACAO.md`. Inclua o checklist “Antes de executar (B4)” com: confirmar branch do `TempDB`; aplicar `0008` via Supabase MCP ou `.venv\Scripts\python.exe scripts\apply_migration.py 0008_supply_movement.sql`; subir API com `.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000`; rodar `.venv\Scripts\python.exe scripts\smoke_test.py`. Termine com “Aceite suspenso”: `B4` fica `[ ]` até conferir os números com o seed estendido.

- [ ] **Step 2: Atualizar o roadmap externo**

Acrescente a linha exata abaixo da nota do B3, preservando UTF-8 com a ferramenta de edição (nunca `Set-Content -Encoding UTF8`):

`> B4 (frente) concluído em 2026-11-24; API pendente em docs/backlog/tarefas-api-tempdb.md.`

A linha `| \`B4\` | Relatórios 4–6 | S09 | [ ] | |` permanece `[ ]`, assim como `B1`/`B2`/`B3`.

- [ ] **Step 3: Verificar e commitar**

Verificação: `Select-String` no backlog por `B4`, `0008`, `/api/reports/` e `Aceite suspenso`; leitura direta da tabela do roadmap confirmando as quatro linhas `[ ]` e a nova nota sem mojibake.

```bash
git add docs/backlog/tarefas-api-tempdb.md
git commit -m "docs: registra pendencias de API do B4 no TempDB"
```

---

### Task 2: Service de relatórios

**Files:**
- Create: `src/features/staff/services/reportService.ts`
- Test: `src/features/staff/services/reportService.test.ts`

**Interfaces:**
- Consumes: `httpClient.get<T>` de `../../../shared/api/httpsClient`, `withQuery` de `../../../shared/api/query`.
- Produces: `ReportPeriod` (`{ from: string; to: string }`), `SupplyKind` (`'medication' | 'product'`), `OccurrencesByMonth` (`{ total: number; months: Array<{ month: string; total: number; items: OccurrenceItem[] }> }`), `OccurrenceItem` (`{ id; animalId: number | null; animalName: string | null; description; eventDate; memberName: string | null }`), `SupplyConsumption` (`{ kind; from; to; totalQuantity; items: SupplyItem[] }`), `SupplyItem` (`{ supplyId; name; type; quantity; unit; point; stockQuantity }`), `mapOccurrences`, `mapSupplyConsumption`, `reportService.getOccurrencesByMonth(period)`, `reportService.getSupplyConsumption(period & { kind })`.

- [ ] **Step 1: Escrever os testes que falham**

Em `reportService.test.ts`, com `vi.mock('../../../shared/api/httpsClient', () => ({ httpClient: { get: vi.fn() } }))`:

1. `mapeia ocorrências para camelCase` — `mapOccurrences({ total: 2, months: [{ month: '2026-11', total: 2, items: [{ event_id: 11, animal_id: 1, animal_name: 'Mel', description: 'Vacina aplicada', event_date: '2026-11-05', member_name: 'Maria Silva' }, { event_id: 12, animal_id: null, animal_name: null, description: 'Visita', event_date: '2026-11-06' }] }] })`; esperar `animalName: null`, `memberName: null` no segundo item e os demais campos convertidos.
2. `busca ocorrências com from e to` — `get` resolvendo a linha acima; esperar `get('/reports/occurrences-by-month?from=2026-11-01&to=2026-11-30')` e resultado mapeado.
3. `mapeia consumo de insumos` — linha `{ kind: 'medication', from: '2026-11-01', to: '2026-11-30', total_quantity: 8, items: [{ supply_id: 1, name: 'Dipirona', type: 'analgésico', quantity: 8, unit: 'comprimidos', point: 'Canil', stock_quantity: 24 }] }`; esperar `totalQuantity: 8`, `supplyId: 1`, `stockQuantity: 24`.
4. `busca consumo por tipo com query ordenada` — `kind: 'product'`; esperar `get('/reports/supply-consumption?kind=product&from=2026-11-01&to=2026-11-30')` e resultado mapeado.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/services/reportService.test.ts`
Expected: FAIL — módulo `./reportService` não encontrado.

- [ ] **Step 3: Implementar tipos, mapeadores e service**

Use `URLSearchParams` na ordem dos testes e `withQuery`. Em `mapOccurrences`/`mapSupplyConsumption`, aplique `?? null` nos campos opcionais (`animal_id`, `animal_name`, `member_name`) e copie os demais sem recalcular. Não reordenar `months` nem `items`; a API já entrega a ordem. Nenhuma fixture, nenhum fallback e nenhuma conversão para `kg`.

- [ ] **Step 4: Rodar testes, tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/services/reportService.test.ts` → 4 testes PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/staff/services/reportService.ts src/features/staff/services/reportService.test.ts
git commit -m "feat: adiciona service de relatorios via API"
```

---

### Task 3: Montagem de linhas e CSV dos novos painéis

**Files:**
- Create: `src/features/staff/types/report.types.ts`
- Create: `src/features/staff/utils/reportRows.ts`
- Test: `src/features/staff/utils/reportRows.test.ts`

**Interfaces:**
- Consumes: `OccurrencesByMonth`, `SupplyConsumption` de `../services/reportService`; `formatDate` de `../../../shared/utils/format`; `CsvField` de `./csv`.
- Produces: `ReportRow` (`{ key: string; label: string; value: string; detail?: string; badge?: ReactNode; ratio: number; tone: BadgeTone }`); `monthLabel(month: string): string`; `decimal(value: number): string`; `buildOccurrenceRows(report: OccurrencesByMonth): ReportRow[]`; `buildOccurrenceCsv(report: OccurrencesByMonth): CsvField[][]`; `buildSupplyRows(report: SupplyConsumption): ReportRow[]`; `buildSupplyCsv(report: SupplyConsumption): CsvField[][]`.

- [ ] **Step 1: Escrever os testes que falham**

Em `reportRows.test.ts`:

1. `formata mês e decimal em pt-BR` — `monthLabel('2026-11') === 'novembro de 2026'`, `monthLabel('') === 'Sem data'`, `decimal(7.5) === '7,5'`, `decimal(1234.567) === '1.234,57'`.
2. `monta linhas de ocorrências com detalhe curto` — mês `2026-11`, `total: 4`, itens com `eventDate: '2026-11-05'`, descrições `A`, `B`, `C`, `D`, `animalName: 'Mel'` no primeiro e `null` nos demais; esperar 1 linha com `label: 'novembro de 2026'`, `value: '4 ocorrências'`, `ratio: 1`, `tone: 'green'`, `detail` contendo `05/11 — A (Mel)` e terminando em `+1`, sem `(null)`.
3. `monta CSV de ocorrências com total` — mesmo caso; esperar primeira linha `['Mês', 'Data', 'Animal', 'Descrição', 'Autor']`, uma linha por item com mês por extenso e `formatDate`, animal vazio quando `null`, e última linha `['Total', '', '', 4, '']`.
4. `monta linhas de medicamentos sem somar unidades` — itens `Dipirona` (`quantity: 8`, `unit: 'comprimidos'`, `type: 'analgésico'`, `point: 'Canil'`, `stockQuantity: 24`) e `Soro` (`quantity: 4`, `unit: 'ml'`); esperar `value` `8 comprimidos` e `4 ml`, `detail` do primeiro `Tipo: analgésico · Ponto: Canil · Estoque atual: 24 comprimidos`, `ratio` `1` e `0.5`, `tone: 'amber'`.
5. `monta CSV de insumos sem linha de total` — mesmos itens; esperar cabeçalho `['Item', 'Tipo', 'Consumo', 'Unidade', 'Ponto', 'Estoque atual']`, 2 linhas de dados com `8`/`4` e `24`/`0` em formato pt-BR, e nenhuma linha `Total`.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/utils/reportRows.test.ts`
Expected: FAIL — módulos `./reportRows` e `../types/report.types` ausentes.

- [ ] **Step 3: Implementar o util**

`monthLabel` usa `Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })` com `new Date(year, monthNumber - 1, 1)` e devolve `'Sem data'` quando não há `AAAA-MM`. `decimal` usa `toLocaleString('pt-BR', { maximumFractionDigits: 2 })`. `buildOccurrenceRows` mantém a ordem da API, usa `plural(count, 'ocorrência', 'ocorrências')`, detalhe com até 3 entradas `DD/MM — descrição (animal)` separadas por ` · ` e `+N` quando houver mais; razão = `total / maior total do mês`. `buildSupplyRows` mantém a ordem da API, valor `decimal(quantity) + ' ' + unit`, razão = `quantity / maior quantity`, e nunca usa `totalQuantity`. CSVs conforme os testes. `ReportRow` fica em `report.types.ts` com `import type { ReactNode } from 'react'` e `import type { BadgeTone } from '../utils/badges'`.

- [ ] **Step 4: Rodar testes, tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/utils/reportRows.test.ts` → 5 testes PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/staff/types/report.types.ts src/features/staff/utils/reportRows.ts src/features/staff/utils/reportRows.test.ts
git commit -m "feat: adiciona montagem das linhas dos relatorios 4-6"
```

---

### Task 4: Três painéis em ReportsPage

**Files:**
- Modify: `src/features/staff/pages/ReportsPage.tsx` (`UPCOMING_REPORTS` em `48-72`, `monthLabel`/`csvKg` em `91-107`, `ReportRow` em `145-154`, filtro em `225-246`, grade em `456-583`, seção antiga em `585-622`)
- Modify: `src/features/staff/pages/ReportsPage.test.tsx` (mocks em `18-32`, fixtures em `129-203`, testes finais em `434-483`)

**Interfaces:**
- Consumes: `reportService.getOccurrencesByMonth`, `reportService.getSupplyConsumption` (Task 2), `ReportRow`, `monthLabel`, `decimal`, `buildOccurrenceRows`, `buildOccurrenceCsv`, `buildSupplyRows`, `buildSupplyCsv` (Task 3), `useAsyncData`, `ReportSection`, `ReportRowList`, `Alert`, `EmptyState`.
- Produces: regiões nomeadas `Ocorrências mensais`, `Medicamentos` e `Produtos`, cada uma com total, linhas, CSV e estados próprios; nenhuma região `Próximos relatórios`.

- [ ] **Step 1: Escrever os testes que falham**

No topo de `ReportsPage.test.tsx`, acrescente `vi.mock('../services/reportService', () => ({ reportService: { getOccurrencesByMonth: vi.fn(), getSupplyConsumption: vi.fn() } }))` e importe `reportService`. Fixtures: `ocorrencias` com `total: 3` e dois meses (mês atual com 2 itens `Vacina aplicada`/`Visita de rotina`, mês de 35 dias atrás com 1 item), `medicamentos` com `kind: 'medication'`, 1 item `Dipirona` (`quantity: 8`, `unit: 'comprimidos'`, `stockQuantity: 24`) e `produtos` com `kind: 'product'`, 1 item `Papel higiênico` (`quantity: 5`, `unit: 'unidades'`). Em `setup()`, implemente os mocks filtrando por `from`/`to` como `foodService.listAllMovements` já faz, para que trocar o período mude os números.

Remova os testes `mostra os três próximos relatórios...`, `deixa os próximos relatórios como texto...` e `não implementa nem busca dados dos relatórios 4-6`; acrescente:

1. `mostra os três relatórios novos com totais da API` — regiões `Ocorrências mensais`, `Medicamentos`, `Produtos`; totais `3 ocorrências`, `1 item`, `1 item`; linhas `2 ocorrências`, `8 comprimidos`, `5 unidades`; `queryByRole('region', { name: /Próximos relatórios/i })` nulo.
2. `aplica o período padrão e recarrega os três ao trocar` — primeiras chamadas com `isoDaysAgo(29)`/`isoDaysAgo(0)`; troque para `7`; esperar `2 ocorrências` e novas chamadas com `isoDaysAgo(6)`/`isoDaysAgo(0)` nos três services.
3. `propaga intervalo personalizado aos três` — `custom` com `isoDaysAgo(6)`/`isoDaysAgo(0)`; esperar as mesmas datas nas três últimas chamadas.
4. `não recarrega os novos painéis com intervalo invertido` — depois do carregamento inicial, datas invertidas; o `Alert` aparece e as contagens de chamada dos três services continuam iguais.
5. `isolamento de erro por painel` — `getOccurrencesByMonth` rejeita `new Error('Falha ao carregar ocorrências.')`; `Alert` com esse texto só na região de ocorrências; as regiões de medicamentos/produtos e as três antigas continuam com seus totais.
6. `estados vazios específicos dos novos painéis` — mocks resolvendo vazio; textos exatos `Nenhuma ocorrência no período.`, `Nenhum medicamento consumido no período.`, `Nenhum produto consumido no período.`
7. `exporta CSV dos três painéis novos` — clique nos três botões; `downloadCsv` chamado 3 vezes; nomes `relatorio-ocorrencias-mensais-...csv`, `relatorio-medicamentos-...csv`, `relatorio-produtos-...csv`; conteúdos com `Mês;Data;Animal;Descrição;Autor`, `Item;Tipo;Consumo;Unidade;Ponto;Estoque atual` e BOM.
8. `não oferece exclusão nos novos painéis` — nenhum `button`/`link` com nome `/excluir/i` nas três regiões.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/ReportsPage.test.tsx`
Expected: FAIL — services não chamados e regiões ausentes.

- [ ] **Step 3: Implementar os três painéis**

Em `ReportsPage`: remova `UPCOMING_REPORTS` e a seção “Próximos relatórios”; importe `ReportRow` de `../types/report.types`, `monthLabel`/`decimal`/builders de `../utils/reportRows` e `reportService`; remova as definições locais duplicadas de `monthLabel` e `csvKg` (use `decimal` no CSV de consumo). Acrescente `reportPeriod` com `useState<{from: string; to: string}>({ from: activeFrom, to: activeTo })` e um `useEffect` que só atualiza quando `activeFrom && activeTo` e algum valor mudou. Use `useAsyncData` com `deps: [reportPeriod.from, reportPeriod.to]` e loaders chamando os dois métodos do service (o de insumos duas vezes, `kind` fixo), sempre com `periodLabel` nos subtítulos. Renderize os painéis em `<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">` após a grade atual: `ReportSection` com `total` oculto durante carregamento/erro, `exportButton` só quando há dado, e corpo com `ReportRowList`; estados de erro com `err instanceof Error ? err.message : '<fallback em português>'` em `Alert variant="danger"`. Totais: `plural(total, 'ocorrência', 'ocorrências')` e `plural(items.length, 'item', 'itens')`, ambos com `totalLabel="no período"`. Slugs de CSV: `ocorrencias-mensais`, `medicamentos`, `produtos`. Não altere os três painéis antigos, o `PageHead`, o filtro nem o rodapé.

- [ ] **Step 4: Rodar testes focados, suíte completa e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/ReportsPage.test.tsx` → todos PASS.
Run: `node .\node_modules\vitest\vitest.mjs run` → sem regressão (baseline 366 testes + novos).
Run: `node .\node_modules\typescript\bin\tsc -b` e `node .\node_modules\eslint\bin\eslint.js .` → sem saída.

```bash
git add src/features/staff/pages/ReportsPage.tsx src/features/staff/pages/ReportsPage.test.tsx
git commit -m "feat: exibe relatorios 4-6 com dados da API"
```

---

### Task 5: Documentação de uso e apresentação

**Files:**
- Modify: `README.md` (linhas `30`, `34`)
- Modify: `docs/manual-do-usuario.md` (linhas `289-293`, `375-383`, `422-430`, `441-444`)
- Modify: `docs/roteiro-demo.md` (linhas `101-105`, `117`, `124`)

**Interfaces:**
- Consumes: textos da Task 4 e contrato da Task 1.
- Produces: documentação que descreve os painéis sem prometer persistência antes da API.

- [ ] **Step 1: Atualizar README e manual**

Em `README.md`, a linha 30 passa a dizê-los como painéis prontos no front, dependentes da API documentada no backlog B4; a linha 34 deixa de chamar “Planejado” e explica que os números só aparecem com a API, sem fallback nem dado estimado. No manual, o resultado esperado de 4.7 passa a citar os seis painéis e que o filtro altera pontos, consumo e os três novos; o intro de §6 deixa de dizer “relatórios planejados” e registra a dependência da API B4; 6.3 troca “Próximos relatórios/Planejado” por instruções para ler **Ocorrências mensais**, **Medicamentos** e **Produtos**, com a ressalva de que sem a API os painéis mostram erro/vazio; o resultado esperado de 6.4 cita os seis relatórios reais de front e mantém `B4` desmarcado até o aceite.

- [ ] **Step 2: Atualizar roteiro de demonstração e verificar**

Em `docs/roteiro-demo.md`, item 8: conferir os seis painéis e o CSV de cada um; frase de demo: “Os seis painéis leem a API; os três novos dependem do contrato documentado no backlog, então não mostram número inventado.”; plano B: se um painel novo falhar, mostrar o `Alert` e explicar a pendência — nunca apresentar estimativa como dado. A tabela “O que é demo” e a lista “Fora do build” trocam “Planejado” por essa mesma ressalva. **Não alterar** `docs/roadmap/linha-de-base.md` (registro histórico de QA).

Verificação: `Select-String` por `Ocorrências mensais`, `Medicamentos`, `Produtos` e `pendente` nos três arquivos; nenhuma ocorrência de “Próximos relatórios” ou “Planejado” aplicada aos relatórios 4–6 nesses arquivos.

- [ ] **Step 3: Commitar**

```bash
git add README.md docs/manual-do-usuario.md docs/roteiro-demo.md
git commit -m "docs: descreve relatorios 4-6 e pendencia da API"
```

---

### Task 6: Verificação final e revisão da branch

**Files:** nenhum (gate)

**Interfaces:**
- Consumes: branch `feat/b4-relatorios-4-6-front` com as Tasks 1–5.

- [ ] **Step 1: Verificação automatizada fresca**

Run (no worktree da branch): `node .\node_modules\vitest\vitest.mjs run`, `node .\node_modules\typescript\bin\tsc -b`, `node .\node_modules\eslint\bin\eslint.js .`, `node .\node_modules\vite\bin\vite.js build`. Registre contagem de testes, saídas e avisos (o aviso de chunk >500 kB é pré-existente).

- [ ] **Step 2: QA visual**

Abra `/painel/relatorios` em 360/768/1280 px e confira a grade de três, o filtro compartilhado, os CSVs e os estados de erro/vazio. Se o navegador da aplicação não estiver disponível, registre a limitação explicitamente — não invente capturas nem medições.

- [ ] **Step 3: Revisão final da branch**

Base do B4: HEAD do `main` antes da criação da branch; confirme com `git merge-base main HEAD` e use esse valor como `BASE..HEAD`. Gere o pacote de diff com `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)` e despache um revisor fresco com spec, plano, constraints, evidências de verificação e a exigência de classificar Critical/Important/Minor. Registre o veredito no ledger `.superpowers/sdd/2026-11-24-b4-relatorios-4-6-front/progress.md`.

- [ ] **Step 4: Handoff**

Não mesclar nem fazer push sem confirmação do parceiro. Apresente resumo com evidências, pendências da API e limitações de QA.
