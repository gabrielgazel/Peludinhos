# B3 — Registro de adoção com termo (frente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar a adoção a partir de uma intenção aprovada em `/painel/intencoes`, exibir o termo gerado automaticamente e somente leitura, e imprimir esse termo — com a API pendente apenas documentada.

**Architecture:** O registro permanece inline no cartão da intenção aprovada. Um service novo (`adoptionRecordService`) faz o `POST /adoptions`; a resposta da API passa a trazer `adoption` aninhado na intenção, o que dispensa endpoint extra para reabrir o termo após recarregar. Um componente presentacional (`AdoptionTermPanel`) recebe os dados já montados e cuida apenas da exibição e da área de impressão.

**Tech Stack:** React 19 + TypeScript, Vitest + Testing Library, Tailwind, `httpClient`, `useAsyncData`, `useAuth`.

**Spec:** `docs/superpowers/specs/2026-11-23-b3-registro-adocao-front-design.md`

## Global Constraints

- Toda alteração no projeto `TempDB` vai **apenas** para `docs/backlog/tarefas-api-tempdb.md`; nada é executado nesta fatia.
- Nenhuma alteração em migrations `0001`–`0006`, seed, backend, rotas, tags ou páginas existentes, exceto `IntentsAdminPage`.
- Uma adoção por animal; reabrir/cancelar adoção e editar termo ficam fora deste item.
- Tipos de domínio em camelCase; conversão para `snake_case` somente dentro dos services (`map*` e payload de saída). A página chama services com payloads em camelCase.
- Listagens continuam com `Page<T>`, `withQuery`/`limit: 200` onde já existem; não reordenar no front.
- Rótulos, mensagens, documentação e termo em português, sem mojibake (`Ã`/`Â`/`â€`).
- Sem DELETE na API e sem botão de exclusão; alvos de toque `min-h-11`, foco visível, erros em `Alert`.
- Sem `memberId` → aviso + botão desabilitado + nenhum POST.
- `B1`/`B2`/`B3` permanecem `[ ]` no roadmap externo; aceites de persistência suspensos.
- TDD antes do código; commits convencionais; nenhum push; `package-lock.json` nunca no commit.

## Review Focus

- Intenção aprovada com sessão sem `memberId` → aviso, botão desabilitado e zero POST. Prova: teste “não registra sem membro vinculado” na Task 4.
- Intenção já possui `adoption` → mostrar “Ver termo”, nunca “Registrar adoção”, e não repetir POST. Prova: teste “reabre o termo gravado sem registrar de novo” na Task 4.
- API antiga sem campo `adoption` na intenção → mapeador devolve `null` sem quebrar a lista. Prova: teste “trata adoption ausente como null” na Task 2.
- Falha no `POST` (`HttpError`) → mensagem em `Alert`, sem estado de sucesso e sem fechar o termo. Prova: teste “mostra erro do service sem registrar” na Task 4.
- Impressão não vazar a interface e responsável nulo virar `—` → CSS `@media print` isolando `.adoption-term-print` e botões fora da área imprimível. Prova: testes de impressão e de responsável nulo na Task 3 + inspeção do CSS.

---

### Task 1: Pendências de API do B3 no TempDB

**Files:**
- Modify: `docs/backlog/tarefas-api-tempdb.md` (índice em `16-25` + nova seção no fim)
- Modify (fora do git): `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md` (logo após a nota do B2, linha 1422)

**Interfaces:**
- Consumes: seções `B1`/`B2` do backlog como modelo de contexto/passo/aceite/restrições.
- Produces: contrato documentado que as Tasks 2–4 consomem.

- [ ] **Step 1: Adicionar ao índice e criar a seção `## B3 — Registro de adoção com termo`**

Inclua, em português: contexto (prévia D4.5 não registra), migration `0007_adocao.sql` com `adoption` (`adoption_id`, `fk_adoption_intent_id`, `fk_animal_id` e `fk_visitor_id`, `fk_responsible_member_id`, `adoption_date`, `term_text`, `created_at`, `updated_at`), schemas Pydantic, `POST /api/adoptions` com `{ adoption_intent_id, fk_responsible_member_id, adoption_date, term_text }`, validação de intenção `aprovada` e de animal sem adoção, atualização do animal para `adotado` na **mesma transação**, campo `adoption: ApiAdoption | null` em `GET /adoption-intents` e `/mine`, smoke test e **aceite suspenso** até execução no `TempDB`. Registre também a restrição “uma adoção por animal; reabrir fora do escopo” e “sem DELETE”.

- [ ] **Step 2: Atualizar o roadmap externo**

Acrescente logo após a nota do B2 a linha exata:
`> B3 (frente) concluído em 2026-11-23; API pendente em docs/backlog/tarefas-api-tempdb.md.`
A linha `| \`B3\` | Registro de adoção com termos | S08 | [ ] | |` permanece `[ ]`, assim como B1 e B2. Preserve UTF-8 usando a ferramenta de edição (nunca `Set-Content -Encoding UTF8`).

- [ ] **Step 3: Verificar e commitar**

Verificação: `Select-String` no backlog por `B3`, `0007`, `POST /api/adoptions` e `Aceite suspenso`; leitura direta das linhas 1413–1423 do roadmap confirmando as três linhas `[ ]` e a nova nota sem mojibake.

```bash
git add docs/backlog/tarefas-api-tempdb.md
git commit -m "docs: registra pendencias de API do B3 no TempDB"
```

---

### Task 2: Tipos e service de registro de adoção

**Files:**
- Modify: `src/features/adoption/types/adoption.types.ts`
- Create: `src/features/adoption/services/adoptionRecordService.ts`
- Test: `src/features/adoption/services/adoptionRecordService.test.ts`
- Modify: `src/features/adoption/services/adoptionService.ts`
- Test: `src/features/adoption/services/adoptionService.test.ts`

**Interfaces:**
- Consumes: `httpClient` (`src/shared/api/httpsClient`), `Page<T>` (`src/shared/api/types`), `AdoptionIntent`/`ApiAdoptionIntent` de `adoption.types.ts`.
- Produces: `Adoption`, `ApiAdoption`, `AdoptionRecordPayload`, `mapAdoption`, `adoptionRecordService.create(payload)`; `AdoptionIntent.adoption: Adoption | null` e `ApiAdoptionIntent.adoption?: ApiAdoption | null`; `mapIntent` preenche o campo aninhado.

- [ ] **Step 1: Escrever os testes que falham**

Em `adoptionRecordService.test.ts`, com `vi.mock('../../../shared/api/httpsClient')`:
1. `mapeia linha da API para camelCase` — `row` com `adoption_id: 21`, `fk_adoption_intent_id: 3`, `fk_animal_id: 6`, `fk_visitor_id: 11`, `fk_responsible_member_id: 7`, `adoption_date: '2026-11-20'`, `term_text: 'Termo registrado.'`, `created_at: null`, `updated_at: null`; esperar `mapAdoption(row)` igual a `{ id: 21, adoptionIntentId: 3, animalId: 6, visitorId: 11, responsibleMemberId: 7, adoptionDate: '2026-11-20', termText: 'Termo registrado.', createdAt: null, updatedAt: null }`.
2. `aceita campos opcionais ausentes` — mesmo `row` sem `created_at`/`updated_at`; esperar `null` nos dois.
3. `cria adoção convertendo o payload` — `create({ adoptionIntentId: 3, responsibleMemberId: 7, adoptionDate: '2026-11-23', termText: 'Termo registrado.' })`; esperar `httpClient.post('/adoptions', { adoption_intent_id: 3, fk_responsible_member_id: 7, adoption_date: '2026-11-23', term_text: 'Termo registrado.' })` e o resultado mapeado.

Em `adoptionService.test.ts`, teste `mapeia adoption aninhada e aceita ausência`: chamar `mapIntent` com uma linha mínima (`adoption_intent_id: 3`, `motivation`, `status: 'aprovada'`, `fk_visitor_id`, `fk_animal_id`, `created_at`, `updated_at`, `visitor: null`, `animal: null`) e `adoption` igual ao `row` acima; esperar `adoption` mapeado. Repetir sem o campo `adoption` e esperar `null`.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/adoption/services`
Expected: FAIL — módulos `./adoptionRecordService` ausente e `adoption` não mapeado em `mapIntent`.

- [ ] **Step 3: Implementar tipos e service**

Em `adoption.types.ts`, acrescente `Adoption`/`ApiAdoption` com os campos acima e as chaves `adoption: Adoption | null` / `adoption?: ApiAdoption | null` aos tipos de intenção. Em `adoptionRecordService.ts`, exporte `mapAdoption` (com `?? null` nos opcionais) e `adoptionRecordService.create` (POST `/adoptions`, mapeando a resposta). Em `adoptionService.ts`, importe `mapAdoption` e passe `row.adoption ? mapAdoption(row.adoption) : null` no `mapIntent`. Não importar nada de `veterinaryHistoryService`/`vaccinationService`/`prescriptionService`.

- [ ] **Step 4: Rodar testes, tsc e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/adoption/services` → 4 testes PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/adoption/types/adoption.types.ts src/features/adoption/services/adoptionRecordService.ts src/features/adoption/services/adoptionRecordService.test.ts src/features/adoption/services/adoptionService.ts src/features/adoption/services/adoptionService.test.ts
git commit -m "feat: adiciona service de registro de adocao"
```

---

### Task 3: Termo somente leitura e impressão

**Files:**
- Create: `src/features/staff/utils/adoptionTerm.ts`
- Test: `src/features/staff/utils/adoptionTerm.test.ts`
- Create: `src/features/staff/components/AdoptionTermPanel.tsx`
- Test: `src/features/staff/components/AdoptionTermPanel.test.tsx`
- Create: `src/features/staff/components/adoption-term.css`

**Interfaces:**
- Consumes: `AdoptionIntent` e `Adoption` de `../../adoption/types/adoption.types`; `SEX_LABEL`, `BEHAVIOR_LABEL` de `../../animals/constants/animal.labels`; `formatDate`, `formatDateTime` de `../../../shared/utils/format`.
- Produces: `buildAdoptionTerm(intent: AdoptionIntent, responsibleMemberId: number | null, adoptionDate: string): string` e `AdoptionTermPanel({ intent, adoptionDate, responsibleMemberId, termText, onPrint }: Props)`.

- [ ] **Step 1: Escrever os testes que falham**

Em `adoptionTerm.test.ts`, `gera texto determinístico` — com `intent` de id `3`, visitante `Bruno Visitante`/`bruno@example.com`, animal `Thor`, `responsibleMemberId: 7`, `adoptionDate: '2026-11-23'`, esperar exatamente:
`Adoção definitiva — Pedido #3 — Animal Thor — Adotante Bruno Visitante — Data 23/11/2026 — Responsável Membro #7.\nDeclaro que recebo o animal acima em adoção definitiva e me comprometo a proporcionar-lhe cuidados, alimentação, abrigo e acompanhamento veterinário adequados, conforme as informações fornecidas no pedido de adoção.`
`usa travessão para responsável nulo` — mesmo caso com `null`, esperando `Responsável —.` na primeira linha e o restante idêntico.

Em `AdoptionTermPanel.test.tsx` (3 testes):
1. `mostra o termo preenchido e somente leitura` — region nomeada `Termo de adoção` com `Bruno Visitante`, `bruno@example.com`, `Thor`, `Macho`, `23/11/2026`, `Membro #7`, a motivação e o `termText`; `queryAllByRole('textbox')` vazio e nenhum botão além de `Imprimir termo`.
2. `marca a área imprimível e mantém o botão fora dela` — `termText` dentro de elemento com classe `adoption-term-print`; botão `Imprimir termo` fora dessa área e `onPrint` chamado ao clicar.
3. `formata datas nulas como travessão` — `createdAt: null` no `intent` e `adoptionDate: ''` ⇒ `—` em `Data da adoção` e `Data do pedido`.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/utils/adoptionTerm.test.ts src/features/staff/components/AdoptionTermPanel.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar util, painel e CSS**

`buildAdoptionTerm` usa `formatDate(adoptionDate)` e `Membro #${id}` / `—`, com exatamente as duas linhas do teste (quebra `\n` entre elas). `AdoptionTermPanel` é funcional e presentacional: `<section aria-labelledby>` com `role` implícito de region, `<dl>` com os campos do termo, `<p className="whitespace-pre-line adoption-term-print">{termText}</p>`, e botão `Imprimir termo` (`min-h-11`, fora da área imprimível) chamando `onPrint`. Importe `./adoption-term.css` no componente; no CSS, `@media print` esconde tudo (`body * { visibility: hidden }`), mostra apenas `.adoption-term-print` e descendentes e os posiciona no topo, e esconde `[data-no-print]`. Sem `window.print()` dentro do painel — quem decide imprimir é a página.

- [ ] **Step 4: Rodar testes e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/utils/adoptionTerm.test.ts src/features/staff/components/AdoptionTermPanel.test.tsx` → 5 testes PASS.
Run: `node .\node_modules\typescript\bin\tsc -b` → sem saída.

```bash
git add src/features/staff/utils/adoptionTerm.ts src/features/staff/utils/adoptionTerm.test.ts src/features/staff/components/AdoptionTermPanel.tsx src/features/staff/components/AdoptionTermPanel.test.tsx src/features/staff/components/adoption-term.css
git commit -m "feat: adiciona termo de adocao imprimivel"
```

---

### Task 4: Fluxo de registro em IntentsAdminPage

**Files:**
- Modify: `src/features/staff/pages/IntentsAdminPage.tsx`
- Modify: `src/features/staff/pages/IntentsAdminPage.test.tsx`
- Delete: `src/features/staff/components/AdoptionTermDemoPanel.tsx`
- Delete: `src/features/staff/components/AdoptionTermDemoPanel.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (`../../auth/hooks/useAuth`), `adoptionRecordService.create`, `buildAdoptionTerm`, `AdoptionTermPanel`, `HttpError`, `useAsyncData`.
- Produces: cartão de intenção aprovada com “Registrar adoção”/“Ver termo”, confirmação inline e termo imprimível.

- [ ] **Step 1: Escrever os testes que falham**

No topo de `IntentsAdminPage.test.tsx`, estenda o mock: `vi.mock('../../adoption/services/adoptionRecordService', () => ({ adoptionRecordService: { create: vi.fn() } }))` e `vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }))`. Importe `adoptionRecordService`, `useAuth` e `buildAdoptionTerm`. Fixture: `const registered = { ...aprovada, adoption: { id: 21, adoptionIntentId: 3, animalId: 6, visitorId: 11, responsibleMemberId: 7, adoptionDate: '2026-11-20', termText: 'Termo registrado.', createdAt: null, updatedAt: null } }`; inclua-a no `list` mock e remova `aprovada` da lista quando o teste pedir. Substitua os dois testes da prévia demo por:
1. `oferece Registrar adoção só para aprovadas sem adoção e Ver termo para registradas` — sem membro ausente; `aprovada` tem “Registrar adoção”, `registered` tem “Ver termo”, `pendenteCompleta`/`rejeitada`/`cancelada` não têm nenhum dos dois; nenhuma marcação `DEMONSTRAÇÃO` ou `DemoBanner`.
2. `reabre o termo gravado sem registrar de novo` — clique em “Ver termo” de `registered`; region `Termo de adoção` com `Termo registrado.`, `20/11/2026` e `Membro #7`; `create` não chamado e `list` segue com 1 chamada.

Acrescente:
3. `pede confirmação e registra com payload camelCase` — `useAuth` com `memberId: 7`; clique em “Registrar adoção”, confirmar que `create` ainda não foi chamado; clique em “Confirmar adoção”; esperar `create(3, { adoptionIntentId: 3, responsibleMemberId: 7, adoptionDate: <hoje AAAA-MM-DD>, termText: buildAdoptionTerm(aprovada, 7, <hoje>) })` e `reload` implícito (2ª chamada a `list`). Use `vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))` em `beforeEach` e `vi.useRealTime()` em `afterEach` para fixar a data.
4. `não registra sem membro vinculado` — `memberId: null`; aviso “É necessário vínculo com membro para registrar a adoção.” no cartão, botão desabilitado, nenhum `create` mesmo após tentativa de clique.
5. `mostra erro do service sem registrar` — `create` rejeita com `new HttpError('Animal já adotado.', 409)`; `Alert` com o texto, nenhuma troca para “Ver termo”, `list` com 1 chamada.
6. `imprime o termo chamando window.print` — com `registered`, clique em “Ver termo” e depois em “Imprimir termo”; `window.print` chamado (use `vi.spyOn(window, 'print').mockImplementation(() => {})`).

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/IntentsAdminPage.test.tsx`
Expected: FAIL — botões “Registrar adoção”/“Ver termo” ausentes e módulos novos não encontrados.

- [ ] **Step 3: Implementar o fluxo**

Em `IntentsAdminPage`: `const { user } = useAuth(); const responsibleMemberId = user?.memberId ?? null;` mantenha `openTermId`, acrescente `confirmingId: number | null` e use o `actionError` existente. Para cada intenção `aprovada`:
- com `intent.adoption` → botão `Ver termo` (`aria-expanded`, `aria-controls={`termo-${id}`}`), abrindo `AdoptionTermPanel` com `adoptionDate`, `responsibleMemberId` e `termText` vindos do registro;
- sem adoção → botão `Registrar adoção`, desabilitado quando `responsibleMemberId === null`, que abre confirmação inline com `Confirmar adoção` e `Cancelar`; confirmar chama `adoptionRecordService.create({ adoptionIntentId: intent.id, responsibleMemberId, adoptionDate: new Date().toISOString().slice(0, 10), termText: buildAdoptionTerm(intent, responsibleMemberId, adoptionDate) })`, calculando `adoptionDate` uma única vez, depois `setConfirmingId(null)`, `setOpenTermId(null)` e `reload()`;
- sem `memberId`, mostrar `<Alert>` informativo no cartão com o texto exato do teste.
Trate erro com `err instanceof HttpError ? err.message : 'Não foi possível registrar a adoção.'`. Passe `onPrint={() => window.print()}` ao painel. Remova imports, estado e JSX do `AdoptionTermDemoPanel` e delete seus dois arquivos (`git rm`). Não alterar Aprovar/Rejeitar, filtro, `PageHead` nem outras páginas.

- [ ] **Step 4: Rodar testes focados, suíte completa e commitar**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/IntentsAdminPage.test.tsx` → todos PASS.
Run: `node .\node_modules\vitest\vitest.mjs run` → sem regressão (baseline 356 testes + novos).
Run: `node .\node_modules\typescript\bin\tsc -b` e `node .\node_modules\eslint\bin\eslint.js .` → sem saída.

```bash
git add src/features/staff/pages/IntentsAdminPage.tsx src/features/staff/pages/IntentsAdminPage.test.tsx
git rm src/features/staff/components/AdoptionTermDemoPanel.tsx src/features/staff/components/AdoptionTermDemoPanel.test.tsx
git commit -m "feat: registra adocao a partir de intencao aprovada"
```

---

### Task 5: Documentação de uso

**Files:**
- Modify: `README.md` (linha 148)
- Modify: `docs/manual-do-usuario.md` (4.8 em `295-304`, 6.2 em `398-410`, 6.4 em `422-430`)
- Modify: `docs/roteiro-demo.md` (item 4)

**Interfaces:**
- Consumes: textos da Task 4 e contrato da Task 1.
- Produces: documentação descrevendo o registro sem prometer persistência antes da API.

- [ ] **Step 1: Atualizar README e manual**

Em `README.md`, estenda a linha de `/painel/intencoes` com: “intenções aprovadas permitem registrar a adoção e imprimir o termo (persistência dependente da API pendente em `docs/backlog/tarefas-api-tempdb.md`)”. No manual, 4.8 ganha passo 4 (“Filtre as aprovadas, clique em **Registrar adoção**, confirme e use **Imprimir termo**.”) e o resultado esperado passa a citar **Ver termo** para adoções já registradas; 6.2 deixa de ser “prévia” e descreve o termo real, os botões **Registrar adoção** / **Ver termo** / **Imprimir termo** e o aviso de que a persistência depende da API pendente; 6.4 troca a referência à faixa de demonstração pela explicação de que a prévia foi substituída e que a pendência agora é documentada.

- [ ] **Step 2: Atualizar roteiro de demonstração e verificar**

No item 4 do roteiro, troque a menção à prévia demo por: “em uma intenção aprovada, registre a adoção, abra **Ver termo** e demonstre a impressão — lembrando que a persistência depende da API documentada em `docs/backlog/tarefas-api-tempdb.md`.”

Verificação: `Select-String` por `Registrar adoção`, `Ver termo`, `Imprimir termo` e `pendente` nos três arquivos; nenhuma ocorrência de `demo` aplicada ao termo nesses arquivos.

- [ ] **Step 3: Commitar**

```bash
git add README.md docs/manual-do-usuario.md docs/roteiro-demo.md
git commit -m "docs: descreve registro de adocao e termo imprimivel"
```

---

### Task 6: Verificação final, QA visual e revisão da branch

**Files:** nenhum (gate)

**Interfaces:**
- Consumes: branch `feat/b3-registro-adocao-front` com as Tasks 1–5.

- [ ] **Step 1: Verificação automatizada fresca**

Run (no worktree da branch): `node .\node_modules\vitest\vitest.mjs run`, `node .\node_modules\typescript\bin\tsc -b`, `node .\node_modules\eslint\bin\eslint.js .`, `node .\node_modules\vite\bin\vite.js build`. Registre contagem de testes, saídas e avisos.

- [ ] **Step 2: QA visual com navegador**

Carregue a skill `playwright-cli` e confira o fluxo em 360/768/1280 px: cartão de intenção aprovada, confirmação, aviso sem membro, termo aberto e impressão (sem vazamento de layout). Se o navegador não estiver disponível, registre a limitação explicitamente — não invente capturas.

- [ ] **Step 3: Revisão final da branch**

Base do B3: `96087a3` (HEAD do `main` antes da criação da branch); confirme com `git merge-base main HEAD` e use esse valor como `BASE..HEAD`. Gere o pacote de diff e despache um revisor fresco com spec, plano, constraints, evidências de verificação e a exigência de classificar Critical/Important/Minor. Registre o veredito no ledger `.superpowers/sdd/2026-11-23-b3-registro-adocao-front/progress.md`.

- [ ] **Step 4: Handoff**

Não mesclar nem fazer push sem confirmação do parceiro. Apresente resumo com evidências, pendências da API e limitações de QA.
