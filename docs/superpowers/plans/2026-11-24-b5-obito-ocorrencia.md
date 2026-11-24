# B5 — Editar óbito e listar mortes (frente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir corrigir data/causa do óbito na ficha do animal e filtrar/listar falecidos na lista de animais, com o contrato da API documentado no `TempDB` e nada executado lá.

**Architecture:** `animalService` ganha os campos de óbito e um `PATCH /animals/{id}/deceased`; `useAnimal` ganha `reload()` para a ficha refletir a correção. `AnimalHealthPage` recebe um painel com formulário pequeno na aba Dados e `AnimalsAdminPage` recebe o filtro e a coluna de data, ambos reaproveitando componentes existentes. A edição de ocorrência (`PATCH /events/{id}`) permanece intacta; sem API, erros aparecem em `Alert` e nenhuma data é inventada.

**Tech Stack:** React 19 + TypeScript, Vitest + Testing Library, Tailwind, `httpClient`, `useAsyncData`/`useAnimal`, `TextField`, `SelectField`, `Alert`.

**Spec:** `docs/superpowers/specs/2026-11-24-b5-obito-ocorrencia-design.md`

## Global Constraints

- Toda alteração no projeto `TempDB` vai **apenas** para `docs/backlog/tarefas-api-tempdb.md`; nada é executado nesta fatia.
- Migration `0009` é aditiva e idempotente; migrations `0001`–`0008` não são alteradas.
- Nenhuma alteração em `EventsAdminPage`, `eventService`, `markDeceased`, rotas, tags, seed, relatórios ou catálogo público.
- Domínio em camelCase no front; `snake_case` somente em `animalService` (`mapAnimal`, payload e query).
- Sem DELETE e sem botão de exclusão; correção é sempre `PATCH` auditável.
- Data obrigatória em `AAAA-MM-DD`, não futura; causa opcional, aparada, até 200 caracteres (vazia vira `null`).
- Rótulos, mensagens, documentação e erros em português, sem mojibake (`Ã`/`Â`/`â€`).
- Alvos de toque `min-h-11`, foco visível, erros em `Alert`.
- `B5` permanece `[ ]` no roadmap externo; aceite de persistência suspenso.
- TDD antes do código; commits convencionais; nenhum push; `package-lock.json` nunca no commit.

## Review Focus

- API do B5 não executada (404/erro de rede) → o formulário mostra erro em `Alert`, permanece aberto e não grava data chutada. Prova: teste “mostra erro da API em Alert” na Task 4.
- Resposta antiga da API sem `death_date`/`death_cause` → `null` no domínio, sem quebrar lista nem ficha. Prova: teste de mapeamento na Task 2 e teste da coluna na Task 5.
- Animal vivo jamais recebe painel de edição nem data na coluna. Prova: teste “não mostra painel para animal vivo” na Task 4 e teste da coluna na Task 5.
- Data futura ou vazia não chega à API; causa vazia vira `null`, nunca string `'undefined'`. Prova: testes de validação e de causa vazia na Task 4.
- Filtro **Falecidos** não envia `status` inválido à API e continua combinando com a busca por nome. Prova: testes “filtra apenas falecidos” e “não envia status” na Task 5.
- Erro traduzido preserva `detail` da API e troca mensagens genéricas em inglês. Prova: testes `preserva detail` e `traduz erro genérico` na Task 2.
- Corrigir óbito não pode reverter `isDeceased` nem esconder o painel; qualquer membro da equipe (não só administração) vê a edição. Prova: testes 2 e 3 da Task 4 com usuário bolsista e checagem do painel após `reload`.

---

### Task 1: Pendências de API do B5 no backlog

**Files:**
- Modify: `docs/backlog/tarefas-api-tempdb.md` (índice perto das linhas 18–24 + nova seção no fim)
- Modify (fora do git): `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md` (após a nota do B4, perto da linha 1424)

**Interfaces:**
- Consumes: seções `B1`–`B4` do backlog como modelo de contexto/passo/aceite/restrições; spec do B5.
- Produces: contrato documentado que as Tasks 2–5 consomem (`PATCH /animals/{id}/deceased`, `death_date`, `death_cause`, exposição em `GET /animals`).

- [ ] **Step 1: Atualizar o índice e criar a seção `## B5 — Editar óbito e listar mortes`**

Acrescente ao “Em aberto”, depois da linha do B4, exatamente:

`- [ ] **B5 — Editar óbito e listar mortes** — detalhes na seção B5 abaixo.`

Acrescente a seção no fim do arquivo, em português, com: contexto (front pronto, API pendente; edição de ocorrência já existe), migration aditiva e idempotente `0009_deceased_correction.sql` (colunas `death_date date` e `death_cause text` em `animals`, `IF NOT EXISTS`, grants/RLS iguais aos das tabelas existentes, `notify pgrst, 'reload schema';`), schemas Pydantic de corpo e resposta, `PATCH /api/animals/{id}/deceased` no router de animais (body `{ death_date: date, death_cause: str | null }`, 200 com `AnimalOut`, 404 para id inexistente, 409 se o animal não estiver falecido, 422 para data futura ou causa > 200), ajuste do `POST /animals/{id}/deceased` para preencher `death_date` com a data do registro e manter o contrato atual, exposição de `death_date`/`death_cause` em `GET /api/animals` (inclusive com `include_deceased=true`), registro dos Routers em `app/main.py` se necessário, smoke test com o próximo número livre (renumerando o bloco de sessão se preciso) verificando anon 401, membro 200, correção refletida na listagem, 404/409/422, `PATCH /api/events/{id}` ainda corrigindo ocorrência e nenhuma rota DELETE, atualização do `DOCUMENTACAO.md` e checklist “Antes de executar (B5)” com os comandos de branch, `.venv\Scripts\python.exe scripts\apply_migration.py 0009_deceased_correction.sql`, uvicorn e smoke test. Termine com “Aceite suspenso”: `B5` fica `[ ]` até conferir a correção na listagem.

- [ ] **Step 2: Atualizar o roadmap externo**

Acrescente a linha exata abaixo da nota do B4, preservando UTF-8 com a ferramenta de edição (nunca `Set-Content -Encoding UTF8`):

`> B5 (frente) concluído em 2026-11-24; API pendente em docs/backlog/tarefas-api-tempdb.md.`

A linha `| \`B5\` | Editar óbito/ocorrência; listar mortes | S09 | [ ] | |` permanece `[ ]`, assim como B1–B4.

- [ ] **Step 3: Verificar e commitar**

Verificação: `Select-String` no backlog por `B5`, `0009`, `/api/animals/{id}/deceased` e `Aceite suspenso`; leitura direta da tabela do roadmap confirmando as cinco linhas `[ ]` e a nova nota sem mojibake.

```bash
git add docs/superpowers/specs/2026-11-24-b5-obito-ocorrencia-design.md docs/superpowers/plans/2026-11-24-b5-obito-ocorrencia.md docs/backlog/tarefas-api-tempdb.md
git commit -m "docs: registra desenho, plano e pendencias de API do B5"
```

---

### Task 2: Tipos e service de correção de óbito

**Files:**
- Modify: `src/features/animals/types/animal.types.ts`
- Modify: `src/features/animals/services/animalService.ts`
- Test: `src/features/animals/services/animalService.test.ts` (novo)

**Interfaces:**
- Consumes: `httpClient.get/post/patch` de `../../../shared/api/httpsClient`; `Page<ApiAnimal>` de `../../../shared/api/types`.
- Produces: `Animal.deathDate: string | null`, `Animal.deathCause: string | null`; `ApiAnimal.death_date?: string | null`, `ApiAnimal.death_cause?: string | null`; `DeceasedPayload` (`{ deathDate: string; deathCause: string | null }`); `animalService.updateDeceased(id: number, payload: DeceasedPayload): Promise<Animal>`.

- [ ] **Step 1: Escrever os testes que falham**

Em `animalService.test.ts`, com `vi.mock('../../../shared/api/httpsClient', () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))` e uma linha base `ApiAnimal` com todos os campos obrigatórios (`animal_id: 5`, `name: 'Mel'`, `sex: 'F'`, `is_deceased: true` etc.):

1. `mapeia data e causa do óbito e normaliza campos ausentes` — `mapAnimal({ ...row, death_date: '2026-11-20', death_cause: 'Atropelamento' })` devolve `deathDate: '2026-11-20'`, `deathCause: 'Atropelamento'`; `mapAnimal(row)` sem as duas chaves devolve `null` em ambos.
2. `updateDeceased usa PATCH e envia snake_case` — `patch` resolvendo a linha com óbito; esperar `patch('/animals/5/deceased', { death_date: '2026-11-20', death_cause: 'Atropelamento' })` e resultado com os campos mapeados.
3. `updateDeceased preserva detail da API` — `patch` rejeita `Object.assign(new Error('Erro 422'), { body: { detail: 'Data do óbito não pode ser futura.' } })`; esperar `rejects.toThrow('Data do óbito não pode ser futura.')`.
4. `updateDeceased traduz erro genérico` — `patch` rejeita `new Error('Failed to fetch')`; esperar `rejects.toThrow('Não foi possível salvar o óbito.')`.
5. `markDeceased continua em POST sem corpo` — `post` resolvendo a linha; esperar `post('/animals/5/deceased')` (um argumento) e resultado mapeado.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/animalService.test.ts`
Expected: FAIL — `deathDate`/`updateDeceased`/módulo de teste ausentes.

- [ ] **Step 3: Implementar campos, mapeador, método e tradução de erro**

Em `animal.types.ts`, acrescente `deathDate` e `deathCause` ao `Animal` (obrigatórios, anuláveis) e `death_date`/`death_cause` opcionais ao `ApiAnimal`. Em `animalService.ts`, use `?? null` no `mapAnimal`, exporte `DeceasedPayload` e implemente `updateDeceased` com `httpClient.patch<ApiAnimal>('/animals/${id}/deceased', { death_date: payload.deathDate, death_cause: payload.deathCause })` seguido de `mapAnimal`. Envolva só esse método com um auxiliar local que preserva `body.detail` (string ou lista de `msg`), mantém mensagens específicas e troca mensagens genéricas (`failed to fetch`, `erro 422` etc.) pelo fallback exato “Não foi possível salvar o óbito.”. Não altere `markDeceased`, `list`, `getById`, `create`, `update` nem os testes existentes.

- [ ] **Step 4: Rodar testes e tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/animalService.test.ts` → 5 testes PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/animals/types/animal.types.ts src/features/animals/services/animalService.ts src/features/animals/services/animalService.test.ts
git commit -m "feat: adiciona correcao de obito no service de animais"
```

---

### Task 3: Recarga do animal no hook

**Files:**
- Modify: `src/features/animals/hooks/useAnimals.ts`
- Test: `src/features/animals/hooks/useAnimals.test.ts` (novo)

**Interfaces:**
- Consumes: `animalService.getById(id): Promise<Animal>` da Task 2.
- Produces: `useAnimal(id)` passa a devolver também `reload: () => void`; os três consumidores atuais continuam válidos sem alteração.

- [ ] **Step 1: Escrever o teste que falha**

Em `useAnimals.test.ts`, com `vi.mock('../services/animalService', () => ({ animalService: { getById: vi.fn(), list: vi.fn() } }))` e `renderHook`/`act`/`waitFor` do Testing Library:

`reload refaz a busca do animal` — `getById` resolvendo `mel` e depois uma cópia com `deathDate: '2026-11-20'`; esperar um chamado inicial, chamar `await act(async () => { result.current.reload(); })`, então esperar `getById` ter sido chamado 2 vezes e `result.current.animal?.deathDate === '2026-11-20'`.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/hooks/useAnimals.test.ts`
Expected: FAIL — `reload` não existe no retorno de `useAnimal`.

- [ ] **Step 3: Implementar `reload` sem alterar `useAvailableAnimals`**

Adicione um contador de versão em `useState`, inclua-o nas dependências do `useEffect` de `useAnimal` e devolva `reload: () => setVersion((v) => v + 1)` com `useCallback`. Mantenha o `cancelled`, a validação de `id` e o `result.id === id`; `reload` não deve disparar busca para id inválido.

- [ ] **Step 4: Rodar testes, tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/hooks/useAnimals.test.ts` → 1 teste PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/animals/hooks/useAnimals.ts src/features/animals/hooks/useAnimals.test.ts
git commit -m "feat: adiciona reload ao hook useAnimal"
```

---

### Task 4: Edição de óbito na ficha

**Files:**
- Modify: `src/features/staff/pages/AnimalHealthPage.tsx`
- Modify: `src/features/staff/pages/AnimalHealthPage.test.tsx`

**Interfaces:**
- Consumes: `animal.deathDate`, `animal.deathCause`, `animalService.updateDeceased(animalId, payload)` (Task 2), `reload()` do `useAnimal` (Task 3), `TextField`, `Alert`, `formatDate`.
- Produces: painel **Óbito** na aba **Dados** com botão **Editar óbito** e formulário com `Data do óbito`, `Causa do óbito` (opcional), `Salvar óbito`, `Cancelar`.

- [ ] **Step 1: Escrever os testes que falham**

Ajuste os mocks do arquivo de teste: `animalService` passa a incluir `updateDeceased: vi.fn()`; `useAnimal` passa a devolver `reload: vi.fn()` no helper `renderPage` (use um `reloadMock` acessível nos testes). Acrescente:

1. `não mostra painel de óbito para animal vivo` — com `mel` (`isDeceased: false`), `queryByText('Óbito')` e `queryByRole('button', { name: 'Editar óbito' })` são nulos.
2. `mostra data e causa do óbito na ficha do falecido para bolsista` — renderize com `bolsistaUser` e `useAnimal` devolvendo `mel` com `isDeceased: true`, `deathDate: '2026-11-20'`, `deathCause: 'Atropelamento'`; esperar `20/11/2026`, `Atropelamento` e o botão **Editar óbito**.
3. `salva a correção e recarrega a ficha sem reverter o óbito` — abrir o formulário, preencher `Data do óbito` com `2026-11-21` e `Causa do óbito (opcional)` com `Queda`, clicar em **Salvar óbito**; esperar `updateDeceased(5, { deathDate: '2026-11-21', deathCause: 'Queda' })`, `reload` chamado, `Salvar óbito` fora do documento. Faça `reloadMock` trocar o animal devolvido por um clone com `isDeceased: true` e `deathDate: '2026-11-21'`; esperar `21/11/2026` e o painel **Óbito** ainda presente.
4. `causa vazia é enviada como null` — mesmo fluxo sem preencher a causa; esperar `deathCause: null`.
5. `não chama a API com data vazia ou futura` — calcule `const futura = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)`; abrir o formulário e salvar vazio → `role="alert"` com `Preencha a data do óbito.`; preencher `futura` e salvar → alerta `A data do óbito não pode ser futura.`; em ambos, `updateDeceased` não é chamado.
6. `mostra erro da API em Alert e mantém o formulário aberto` — `updateDeceased` rejeita `new Error('Não foi possível salvar o óbito.')`; esperar `role="alert"` com esse texto e `Salvar óbito` ainda presente.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/AnimalHealthPage.test.tsx`
Expected: FAIL — botão/painel/formulário de óbito ausentes.

- [ ] **Step 3: Implementar o painel e o formulário**

Na aba **Dados**, depois do `Panel` atual e ainda dentro do ramo `loading ? ... : (...)`, renderize um `Panel` com título `Óbito` somente quando `animal?.isDeceased`. Exiba `DetailItem` para `Data do óbito` (`formatDate(animal.deathDate)`) e `Causa do óbito` (`animal.deathCause ?? '—'`) e um botão **Editar óbito** com `min-h-11` e foco visível. O formulário usa `TextField id="deceased-date" label="Data do óbito" type="date" required` e `TextField id="deceased-cause" label="Causa do óbito" optional maxLength={200}`, com botões **Salvar óbito** e **Cancelar** (`min-h-11`). Valide no cliente antes de chamar a API: data vazia → `Preencha a data do óbito.`; data maior que hoje → `A data do óbito não pode ser futura.`; mostre erros em `Alert`. No submit, chame `updateDeceased`, depois `reload()` e feche o formulário; em caso de erro, mantenha o formulário e mostre a mensagem em `Alert`. Não use `window.confirm` e não toque nas abas/serviços clínicos.

- [ ] **Step 4: Rodar testes e tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/AnimalHealthPage.test.tsx` → testes antigos + 6 novos PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/staff/pages/AnimalHealthPage.tsx src/features/staff/pages/AnimalHealthPage.test.tsx
git commit -m "feat: expoe edicao de obito na ficha do animal"
```

---

### Task 5: Filtro de falecidos e coluna de data na lista

**Files:**
- Modify: `src/features/staff/pages/AnimalsAdminPage.tsx`
- Modify: `src/features/staff/pages/AnimalsAdminPage.test.tsx`

**Interfaces:**
- Consumes: `Animal.deathDate` (Task 2), `formatDate` de `../../../shared/utils/format`, `SelectField`.
- Produces: opção `falecidos` no filtro **Status** e coluna **Data do óbito**; nenhuma chamada de API nova.

- [ ] **Step 1: Escrever os testes que falham**

Acrescente `deathDate: '2026-11-20'` ao fixture `luna` e `deathDate: null` aos demais; mantenha `isDeceased: true` apenas em `luna`. Acrescente:

1. `expõe a coluna Data do óbito com a data formatada` — `columnheader` `Data do óbito`; na linha de Luna, `20/11/2026`; nas linhas de Mel e Thor, `—`.
2. `filtra apenas falecidos e combina com a busca por nome` — selecione `falecidos` no `Status`; esperar Luna e não Mel/Thor, com `rowCount() === 2`; depois buscar `Mel` e esperar `Nenhum animal encontrado com esses filtros.`.
3. `não envia status quando Falecidos está ativo` — após selecionar `falecidos`, esperar a última chamada de `animalService.list` com `/animals?include_deceased=true&limit=200` (sem `status`).

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/AnimalsAdminPage.test.tsx`
Expected: FAIL — coluna e opção `Falecidos` ausentes.

- [ ] **Step 3: Implementar filtro e coluna**

Amplie `StatusFilter` para `'todos' | AnimalStatus | 'falecidos'` e `STATUS_FILTER_OPTIONS` com `{ value: 'falecidos', label: 'Falecidos' }` ao final. No `filtered`, quando `status === 'falecidos'`, use somente `animal.isDeceased` (ignorando o status do animal) e continue aplicando a busca por nome; nos demais casos mantenha a regra atual. Acrescente `<TableHead>Data do óbito</TableHead>` logo após **Status** e a célula `formatDate(animal.deathDate)` na mesma posição de cada linha. Não altere `limit`, `includeDeceased`, ações de linha nem a ordenação.

- [ ] **Step 4: Rodar testes e tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/AnimalsAdminPage.test.tsx` → testes antigos + 3 novos PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/staff/pages/AnimalsAdminPage.tsx src/features/staff/pages/AnimalsAdminPage.test.tsx
git commit -m "feat: filtra falecidos e mostra data do obito na lista"
```

---

### Task 6: Manual e verificação final

**Files:**
- Modify: `docs/manual-do-usuario.md` (seção 4.2, perto das linhas 201–214)

**Interfaces:**
- Consumes: comportamento entregue nas Tasks 4 e 5.
- Produces: documentação de uso alinhada à interface; nenhuma interface nova.

- [ ] **Step 1: Atualizar o manual**

Na seção `### 4.2 Consultar animais e registrar um óbito`, acrescente ao passo 2 o filtro **Status → Falecidos** e a coluna **Data do óbito**; acrescente passo para abrir **Ver ficha**, aba **Dados**, conferir data/causa e usar **Editar óbito** para corrigir. Ajuste o bloco de “Resultado esperado”: animais vivos mostram `—` na coluna; a correção só aparece depois que a API do `TempDB` estiver executada, sem data inventada. Mantenha o texto sobre `Registrar óbito` e a persistência pendente.

- [ ] **Step 2: Verificar tudo e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run` → todos os arquivos/testes PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.
Run: `node .\node_modules\eslint\bin\eslint.js .` → sem saída.
Run: `node .\node_modules\vite\bin\vite.js build` → sucesso (o aviso pré-existente de chunk > 500 kB é aceitável).
Verificação manual do texto: leia a seção 4.2 com a ferramenta de leitura (UTF-8) e confirme `Editar óbito`, `Falecidos`, `Data do óbito` e ausência de `Ã`/`Â`/`â€`.

```bash
git add docs/manual-do-usuario.md
git commit -m "docs: descreve edicao de obito e filtro de falecidos"
```

---

## Notas de execução

- Nenhuma tarefa dá push; ao final, informe quantos commits ficaram pendentes em `origin/main..main`.
- O arquivo `package-lock.json` nunca é stageado.
- Se uma tarefa precisar de decisão nova, pare e volte ao parceiro em vez de inventar contrato ou texto.
