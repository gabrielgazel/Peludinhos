# B2 Saúde do animal (frente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar, só no front, a ficha interna do animal com histórico veterinário, vacinação e receitas, anotando no `TempDB` tudo o que depender de API.

**Architecture:** Três services independentes em `src/features/animals/services/` fazem a conversão `snake_case` → `camelCase` e expõem `list/create/update`. Dois componentes compartilhados em `src/features/animals/components/` renderizam a seção de tabela e o formulário. `AnimalHealthPage` compõe tudo em `/painel/animais/:id`, com abas **Dados** e **Saúde**, e aplica a regra de escrita: qualquer membro cria; editar só o autor ou a administração. Nenhuma alteração de API é executada; o contrato fica em `docs/backlog/tarefas-api-tempdb.md`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Vitest + Testing Library, `httpClient` compartilhado.

**Spec:** `docs/superpowers/specs/2026-11-23-b2-saude-animal-front-design.md`

## Global Constraints

- Toda alteração no projeto `TempDB` vai **apenas** para `docs/backlog/tarefas-api-tempdb.md`; nada é executado nesta fatia.
- Nenhuma alteração em migrations `0001`–`0004`, seed, backend, tags ou páginas existentes, exceto **um link “Ver ficha”** em `AnimalsAdminPage`.
- A ficha pública `/adocao/:id` permanece sem dado clínico; a rota nova fica dentro do `ProtectedRoute` de `MEMBER_ROLES`.
- Tipos de domínio em camelCase; conversão de `snake_case` somente dentro das funções `map*` dos services.
- Listagens usam `Page<T>` de `src/shared/api/types.ts`, `withQuery` de `src/shared/api/query.ts` e `limit: 200`.
- Ordenação vem da API (data do domínio decrescente, desempate por id); o front não reordena.
- Autor exibido como `Membro #<id>` ou `—`; sem consulta a `memberService`.
- Leitura e criação para membros da equipe; edição somente quando `isAdmin(user?.role)` ou `createdByMemberId === user?.memberId` (com `memberId !== null`).
- Sessão sem `memberId`: aviso “É necessário vínculo com membro para registrar dados clínicos.”, botões de criação desabilitados e nenhum POST.
- Sem DELETE na API e sem botão de exclusão na interface; rótulos, mensagens e documentação em português.
- `ReportsPage` não é alterada: os cartões “Planejado” dos relatórios 5–6 continuam como estão e pertencem ao B4.
- Datas com `formatDate` (nulo → `—`); alvos de toque ≥44 px; sem overflow horizontal em 360/768/1280 px.
- TDD antes do código; commits convencionais; nenhum push.
- Windows/PowerShell. Comandos: `node .\node_modules\vitest\vitest.mjs run`, `node .\node_modules\typescript\bin\tsc -b`, `node .\node_modules\eslint\bin\eslint.js .`, `node .\node_modules\vite\bin\vite.js build`.

## Review Focus

- **API ainda não existe e a listagem falha:** mostrar erro em `Alert`, não lista vazia silenciosa → teste `mostra erro em alerta quando uma listagem falha` na Task 6.
- **Sessão sem vínculo de membro:** não pode haver POST nem criação efetiva → teste `mostra aviso e desabilita criação para sessão sem vínculo de membro` na Task 6.
- **Membro editando registro de outro autor:** o botão **Editar** não pode aparecer → teste `bolsista edita apenas registro próprio` na Task 6.
- **Campos opcionais ausentes na resposta:** viram `null` sem quebrar o mapeador → primeiro teste de cada service nas Tasks 2–4.
- **Data nula/inválida:** exibir `—`, nunca `Invalid Date` → teste `formata datas nulas como travessão` na Task 6.

---

### Task 1: Registrar as pendências de API do B2

**Files:**
- Modify: `docs/backlog/tarefas-api-tempdb.md:18-24` (índice) e acrescentar seção `## B2` ao fim do arquivo.

**Interfaces:**
- Consumes: contrato acordado em `docs/superpowers/specs/2026-11-23-b2-saude-animal-front-design.md`.
- Produces: caminho estável referenciado pela Task 7 e pelo usuário para execução futura no `TempDB`.

- [ ] **Step 1: Atualizar o índice**

Em `## Índice`, substituir a lista “Tarefas futuras (B2 em diante)” por:

```markdown
### Tarefas futuras (B3 em diante)

_(sem conteúdo ainda — espaço reservado para as próximas pendências de API.)_
```

E, em “Em aberto”, trocar “único item aberto” por “itens abertos: B1 e B2”, acrescentando o item `- [ ] **B2 — Receitas, histórico e vacinação** — detalhes na seção B2 abaixo.`

- [ ] **Step 2: Acrescentar a seção `B2`**

Escrever ao fim do arquivo, nesta ordem:

1. **Contexto e regra geral:** data 2026-11-23; origem no desenho do B2; nada executado no `TempDB`; mesmas restrições do B1 (nada em `0001`–`0004`, sem alteração em seed/backend/rotas/tags, português, sem DELETE).
2. **Tabela de colunas das três tabelas:**
   - `veterinary_history`: `history_id` (PK), `animal_id` (FK para `animals`), `record_date` (date), `title` (1–120), `description` (texto), `created_by_member_id` (FK para `members`), `created_at`/`updated_at` (opcionais).
   - `vaccination_history`: `vaccination_id` (PK), `animal_id`, `vaccine` (1–120), `application_date` (date), `dose` (opcional, 1–40), `notes` (opcional), `created_by_member_id`, `created_at`/`updated_at`.
   - `veterinary_prescription`: `prescription_id` (PK), `animal_id`, `medication` (texto livre 1–120), `dosage` (1–240), `prescription_date` (date), `notes` (opcional), `created_by_member_id`, `created_at`/`updated_at`.
   - Observação explícita: `medication` é texto livre, **não FK** para `medications`, porque a API do B1 ainda não existe.
3. **Migration `0006_saude_animal.sql`:** padrão da `0005` (`if not exists`, `public.touch_updated_at()`, índices em `animal_id` e datas, `enable row level security`, policies `to authenticated`: `select` com `private.is_project_member()`, `insert` com `private.is_project_member()`, `update` com checagem de autor ou `private.is_project_admin()`; grants equivalentes, nada para `anon`, `service_role` com CRUD e `notify pgrst, 'reload schema';`). RLS é defesa adicional: o router é a autoridade porque os routers usam `get_service_client()`.
4. **Schemas Pydantic em `app/schemas.py`:** `VeterinaryHistoryCreate/Update/Out`, `VaccinationCreate/Update/Out`, `PrescriptionCreate/Update/Out`, reutilizando `Page[T]`; todos os campos opcionais com `None`; `Update` com todos os campos opcionais para `model_dump(exclude_unset=True)`.
5. **Routers:** `GET/POST /api/animals/{id}/veterinary-history`, `/vaccinations`, `/prescriptions` (leitura e criação com `require_member`; `limit`/`offset`/`q` na leitura; POST exige `created_by_member_id` igual ao `member_id` da sessão, `403` com “Perfil de membro não encontrado” quando ausente); `PATCH /api/veterinary-history/{id}`, `/api/vaccinations/{id}`, `/api/prescriptions/{id}` com `require_member` **mais** checagem no router: autor ou `private.is_project_admin()`, `403` com “Você não tem permissão para editar este registro.”; `404` com “Registro não encontrado.”/`"Vacina não encontrada."`/`"Receita não encontrada."`; ordenação por data do domínio desc, desempate por id desc; sem rota DELETE.
6. **Registro dos três routers em `app/main.py`** e atualização de `TempDB/DOCUMENTACAO.md` (migrations, endpoints, matriz RBAC, modelos de dados, `0006` aplicada).
7. **Smoke test em `scripts/smoke_test.py`:** bloco `[12] Saúde do animal (B2)` com anon 401, bolsista 403 em PATCH de registro de outro autor, autor 200 no próprio registro, admin 200 em qualquer registro, membro 200 na leitura, criação + PATCH refletidos em nova listagem, 404 em id inexistente e nenhuma rota DELETE exposta.
8. **Comandos prontos (espelhando o checklist do B1):** `.venv\Scripts\python.exe scripts\apply_migration.py 0006_saude_animal.sql` (com `DATABASE_URL` válido) ou Supabase MCP `apply_migration`; `.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000`; `.venv\Scripts\python.exe scripts\smoke_test.py`; `.venv\Scripts\python.exe scripts\test_seed_demo.py`. Acrescentar um checklist “Antes de executar (B2)” com esses comandos, a conferência do `notify pgrst` e a verificação final de persistência após reload marcada como pendente.
9. **Aceite suspenso:** registrar e recarregar vendo na ficha só pode ser verificado após a execução da API; não marcar `B2` como concluído no roadmap nesta fatia.

- [ ] **Step 3: Conferir o arquivo**

Run: `Select-String -Path docs/backlog/tarefas-api-tempdb.md -Pattern 'B2','0006','veterinary_history','vaccination_history','veterinary_prescription','Aceite suspenso'`
Expected: todas as seis expressões aparecem.

- [ ] **Step 4: Commit**

```bash
git add docs/backlog/tarefas-api-tempdb.md
git commit -m "docs: registra pendencias de API do B2 no TempDB"
```

---

### Task 2: Service de histórico veterinário

**Files:**
- Create: `src/features/animals/services/veterinaryHistoryService.ts`
- Test: `src/features/animals/services/veterinaryHistoryService.test.ts`

**Interfaces:**
- Consumes: `httpClient` (`get`/`post`/`patch`), `Page<T>`, `withQuery`.
- Produces: `VeterinaryHistory`, `ApiVeterinaryHistory`, `VeterinaryHistoryPayload`, `mapVeterinaryHistory(row: ApiVeterinaryHistory): VeterinaryHistory`, `veterinaryHistoryService.list(animalId: number, params?: { q?: string; limit?: number; offset?: number }): Promise<Page<VeterinaryHistory>>`, `create(animalId: number, payload: VeterinaryHistoryPayload): Promise<VeterinaryHistory>`, `update(id: number, payload: Partial<VeterinaryHistoryPayload>): Promise<VeterinaryHistory>`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import {
  mapVeterinaryHistory,
  veterinaryHistoryService,
  type ApiVeterinaryHistory,
} from './veterinaryHistoryService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiVeterinaryHistory = {
  history_id: 3,
  animal_id: 5,
  record_date: '2026-10-02',
  title: 'Consulta de rotina',
  description: 'Animal saudável.',
  created_by_member_id: 7,
  created_at: '2026-10-02T10:00:00',
  updated_at: null,
};

describe('veterinaryHistoryService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia history_id e normaliza campos opcionais ausentes', () => {
    const mapped = {
      id: 3,
      animalId: 5,
      recordDate: '2026-10-02',
      title: 'Consulta de rotina',
      description: 'Animal saudável.',
      createdByMemberId: 7,
      createdAt: '2026-10-02T10:00:00',
      updatedAt: null,
    };
    expect(mapVeterinaryHistory(row)).toEqual(mapped);
    const semOpcionais: Omit<ApiVeterinaryHistory, 'created_at' | 'updated_at'> = {
      history_id: 3,
      animal_id: 5,
      record_date: '2026-10-02',
      title: 'Consulta de rotina',
      description: 'Animal saudável.',
      created_by_member_id: 7,
    };
    expect(mapVeterinaryHistory(semOpcionais)).toEqual({ ...mapped, createdAt: null });
  });

  it('list usa a rota aninhada e envia filtros em snake_case', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await veterinaryHistoryService.list(5, { q: 'consulta', limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith(
      '/animals/5/veterinary-history?q=consulta&limit=200',
    );
    expect(page.items[0].id).toBe(3);
  });

  it('create envia o autor da sessão em created_by_member_id', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await veterinaryHistoryService.create(5, {
      title: 'Consulta de rotina',
      recordDate: '2026-10-02',
      description: 'Animal saudável.',
      createdByMemberId: 7,
    });
    expect(httpClient.post).toHaveBeenCalledWith('/animals/5/veterinary-history', {
      title: 'Consulta de rotina',
      record_date: '2026-10-02',
      description: 'Animal saudável.',
      created_by_member_id: 7,
    });
  });

  it('update envia somente os campos informados na rota do recurso', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await veterinaryHistoryService.update(3, { description: 'Reavaliado.' });
    expect(httpClient.patch).toHaveBeenCalledWith('/veterinary-history/3', {
      description: 'Reavaliado.',
    });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/veterinaryHistoryService.test.ts`
Expected: FAIL — módulo `./veterinaryHistoryService` não existe.

- [ ] **Step 3: Implementar o service**

Declarar `ApiVeterinaryHistory` com `created_at`/`updated_at` opcionais, `VeterinaryHistory` em camelCase e `VeterinaryHistoryPayload` (`title`, `recordDate`, `description`, `createdByMemberId: number`). `list` monta `URLSearchParams` com `q`, `limit`, `offset` e usa `withQuery`; `create` converte `recordDate` → `record_date` e `createdByMemberId` → `created_by_member_id`; `update` converte apenas as chaves presentes e usa `/veterinary-history/{id}`.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/veterinaryHistoryService.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/animals/services/veterinaryHistoryService.ts src/features/animals/services/veterinaryHistoryService.test.ts
git commit -m "feat: adiciona service de historico veterinario"
```

---

### Task 3: Service de vacinação

**Files:**
- Create: `src/features/animals/services/vaccinationService.ts`
- Test: `src/features/animals/services/vaccinationService.test.ts`

**Interfaces:**
- Consumes: os mesmos `httpClient`/`Page<T>`/`withQuery` da Task 2.
- Produces: `Vaccination`, `ApiVaccination`, `VaccinationPayload`, `mapVaccination`, `vaccinationService.list(animalId, params?)/create(animalId, payload)/update(id, payload)`. Mesma forma da Task 2, trocando `history_id` por `vaccination_id`, `record_date` por `application_date`, `/veterinary-history` por `/vaccinations` e o caminho de edição por `/vaccinations/{id}`.

- [ ] **Step 1: Escrever os testes que falham**

Copie os quatro testes da Task 2 com estas trocas e dados:

```ts
const row: ApiVaccination = {
  vaccination_id: 8,
  animal_id: 5,
  vaccine: 'V10',
  application_date: '2026-09-12',
  dose: '1ª dose',
  notes: null,
  created_by_member_id: 7,
  created_at: null,
  updated_at: null,
};
```

Mapeamento esperado: `id: 8`, `animalId: 5`, `vaccine: 'V10'`, `applicationDate: '2026-09-12'`, `dose: '1ª dose'`, `notes: null`, `createdByMemberId: 7`, `createdAt: null`, `updatedAt: null`. O teste sem opcionais remove `dose`, `notes`, `created_at` e `updated_at` e espera `null` nesses quatro campos. A listagem espera `'/animals/5/vaccinations?limit=200'`; a criação envia `{ vaccine, application_date, dose, notes, created_by_member_id }` para `'/animals/5/vaccinations'`; a edição envia `httpClient.patch('/vaccinations/8', { notes: 'Reforço agendado.' })`.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/vaccinationService.test.ts`
Expected: FAIL — módulo `./vaccinationService` não existe.

- [ ] **Step 3: Implementar o service**

Espelhe `veterinaryHistoryService.ts` com os nomes da Task 3. `dose`, `notes`, `created_at` e `updated_at` ausentes viram `null`. Não importe nada de `veterinaryHistoryService`.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/vaccinationService.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/animals/services/vaccinationService.ts src/features/animals/services/vaccinationService.test.ts
git commit -m "feat: adiciona service de vacinacao"
```

---

### Task 4: Service de receitas veterinárias

**Files:**
- Create: `src/features/animals/services/prescriptionService.ts`
- Test: `src/features/animals/services/prescriptionService.test.ts`

**Interfaces:**
- Consumes: os mesmos `httpClient`/`Page<T>`/`withQuery` da Task 2.
- Produces: `Prescription`, `ApiPrescription`, `PrescriptionPayload`, `mapPrescription`, `prescriptionService.list(animalId, params?)/create(animalId, payload)/update(id, payload)`. Mesma forma da Task 2, trocando `history_id` por `prescription_id`, `record_date` por `prescription_date`, `/veterinary-history` por `/prescriptions` e o caminho de edição por `/prescriptions/{id}`.

- [ ] **Step 1: Escrever os testes que falham**

Copie os quatro testes da Task 2 com estas trocas e dados:

```ts
const row: ApiPrescription = {
  prescription_id: 12,
  animal_id: 5,
  medication: 'Amoxicilina 500 mg',
  dosage: '1 comprimido a cada 12h por 7 dias',
  prescription_date: '2026-10-05',
  notes: null,
  created_by_member_id: 7,
  created_at: null,
  updated_at: null,
};
```

Mapeamento esperado: `id: 12`, `animalId: 5`, `medication: 'Amoxicilina 500 mg'`, `dosage: '1 comprimido a cada 12h por 7 dias'`, `prescriptionDate: '2026-10-05'`, `notes: null`, `createdByMemberId: 7`, `createdAt: null`, `updatedAt: null`. O teste sem opcionais remove `notes`, `created_at` e `updated_at` e espera `null`. A listagem espera `'/animals/5/prescriptions?limit=200'`; a criação envia `{ medication, dosage, prescription_date, notes, created_by_member_id }` para `'/animals/5/prescriptions'`; a edição envia `httpClient.patch('/prescriptions/12', { dosage: '2 comprimidos ao dia' })`.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/prescriptionService.test.ts`
Expected: FAIL — módulo `./prescriptionService` não existe.

- [ ] **Step 3: Implementar o service**

Espelhe `veterinaryHistoryService.ts` com os nomes da Task 4. `medication` é texto livre (sem FK e sem `<select>`). `notes`, `created_at` e `updated_at` ausentes viram `null`.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/services/prescriptionService.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/animals/services/prescriptionService.ts src/features/animals/services/prescriptionService.test.ts
git commit -m "feat: adiciona service de receitas veterinarias"
```

---

### Task 5: Componentes compartilhados de seção e formulário

**Files:**
- Create: `src/features/animals/components/ClinicalRecordsSection.tsx`
- Create: `src/features/animals/components/ClinicalRecordForm.tsx`
- Test: `src/features/animals/components/ClinicalRecordsSection.test.tsx`
- Test: `src/features/animals/components/ClinicalRecordForm.test.tsx`

**Interfaces:**
- Consumes: `Table*`, `Panel`, `Alert`, `EmptyState`, `TextField`, `cn` (padrão de `SuppliesPage.tsx`).
- Produces:
  - `interface ClinicalRecord { id: number; createdByMemberId: number | null }`
  - `interface ClinicalColumn<T> { header: string; render: (item: T) => ReactNode }`
  - `ClinicalRecordsSection<T extends ClinicalRecord>(props: { id: string; title: string; columns: ClinicalColumn<T>[]; items: T[]; loading: boolean; error: string | null; canCreate: boolean; createLabel: string; emptyMessage: string; onNew: () => void; canEdit: (item: T) => boolean; onEdit: (item: T) => void })`
  - `interface FormField { name: string; label: string; kind?: 'text' | 'date' | 'textarea'; required?: boolean; optional?: boolean; maxLength?: number }`
  - `ClinicalRecordForm(props: { title: string; fields: FormField[]; initialValues: Record<string, string>; submitLabel: string; error: string | null; onCancel: () => void; onSubmit: (values: Record<string, string>) => void })`

- [ ] **Step 1: Escrever os testes que falham**

Em `ClinicalRecordsSection.test.tsx`, com `render(<ClinicalRecordsSection ... />)` e um item `{ id: 1, createdByMemberId: 7, title: 'Consulta' }`, declarar testes com estes nomes e asserções:

1. `renderiza colunas, autor e ação de editar` — `getByRole('region', { name: 'Histórico veterinário' })`, cabeçalho `Título`, texto `Consulta`, `Membro #7` e um botão `Editar`; chamar `onEdit` com o item ao clicar.
2. `mostra travessão quando o autor é desconhecido` — item com `createdByMemberId: null` produz `—` na coluna Autor.
3. `mostra estado vazio e erro em alerta` — com `items: []`, `getByText('Nenhum registro ainda.')`; com `error: 'Não foi possível carregar.'`, `getByRole('alert')` contém a mensagem e a tabela não aparece.
4. `desabilita criação e esconde edição sem permissão` — `canCreate: false` deixa `Novo registro` desabilitado; `canEdit: () => false` remove `Editar`.
5. `não oferece exclusão` — `queryByRole('button', { name: /Excluir|Remover/i })` é `null`.

Em `ClinicalRecordForm.test.tsx`, declarar testes com estes nomes e asserções:

1. `renderiza campos de texto, data e texto longo com os rótulos recebidos` — `getByLabelText('Título')`, `getByLabelText('Data do registro')` com `type="date"` e `getByLabelText('Descrição')` com `<textarea>`; valores iniciais preenchidos.
2. `envia os valores atuais e permite cancelar` — alterar `Título`, clicar `Salvar registro` e esperar `onSubmit` com o objeto de valores; clicar `Cancelar` e esperar `onCancel`.
3. `mostra erro recebido em alerta` — `error: 'Não foi possível salvar.'` produz `getByRole('alert')` com essa mensagem.

Use `TextField` com `multiline`/`rows` para `kind: 'textarea'`, `type="date"` para `kind: 'date'`, rótulos exatos vindos de `fields` e `aria-label`/`id` derivados de `name` (por exemplo, `history-title`). Botões com `min-h-11`.

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/components`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar os componentes**

`ClinicalRecordsSection` usa `<section aria-labelledby={id}>`, `<Panel>` com cabeçalho e botão `createLabel`, `<Table>` com as colunas recebidas seguidas de **Autor** e **Ações**, `formatDate` não é responsabilidade aqui (a coluna `render` já formata), `Membro #${createdByMemberId}` quando há autor e `—` quando não há. `canCreate` controla apenas o `disabled` do botão; `canEdit(item)` controla o botão `Editar`. `ClinicalRecordForm` é controlado internamente a partir de `initialValues`, sem validação própria (a validação fica na Task 6), e chama `onSubmit(values)` no submit do formulário.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/animals/components`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/animals/components
git commit -m "feat: adiciona componentes de secao e formulario clinico"
```

---

### Task 6: Página `/painel/animais/:id`, rota e link na lista

**Files:**
- Create: `src/features/staff/pages/AnimalHealthPage.tsx`
- Test: `src/features/staff/pages/AnimalHealthPage.test.tsx`
- Modify: `src/features/staff/pages/AnimalsAdminPage.tsx:173-183`
- Test: `src/features/staff/pages/AnimalsAdminPage.test.tsx` (um teste novo)
- Modify: `src/app/router.tsx:12-13,64`

**Interfaces:**
- Consumes: `useParams`, `useAnimal(id)`, `useAuth`, `isAdmin`, `useAsyncData`, `PageHead`, `Panel`, `Alert`, `formatDate`, os três services das Tasks 2–4 e os dois componentes da Task 5.
- Produces: `AnimalHealthPage` renderizada em `/painel/animais/:id`; link `Ver ficha` na lista de animais.

- [ ] **Step 1: Escrever os testes que falham**

Crie `AnimalHealthPage.test.tsx` com `vi.mock` de `useAuth`, `useAnimal`, `animalService` (não usado diretamente, mas mockado para isolar o hook) e dos três services. Use `user: bolsista` com `memberId: 7`, `user: admin` com `role: 'administrador', memberId: 42` e `user: semMember` com `memberId: null`. Renderize sempre com `MemoryRouter` em `<Routes><Route path="/painel/animais/:id" element={<AnimalHealthPage />} /></Routes>` inicial em `/painel/animais/5`. Fixtures mínimas: histórico `{ id: 1, animalId: 5, recordDate: '2026-10-02', title: 'Consulta', description: 'Animal saudável.', createdByMemberId: 7, createdAt: null, updatedAt: null }` e outro com `id: 2, createdByMemberId: 9, recordDate: null`; vacina `{ id: 8, vaccine: 'V10', applicationDate: '2026-09-12', dose: null, notes: null, createdByMemberId: 9, ... }`; receita `{ id: 12, medication: 'Amoxicilina', dosage: '1 comprimido', prescriptionDate: '2026-10-05', notes: null, createdByMemberId: 7, ... }`.

Declarar estes testes, nesta ordem:

1. `carrega o animal e as três listagens com limit 200` — esperar `useAnimal` ter sido chamado com `5`, cada `list` com `(5, { limit: 200 })` e o nome do animal no cabeçalho.
2. `mostra as abas Dados e Saúde com as três seções` — clicar em `Saúde` e encontrar as regiões `Histórico veterinário`, `Vacinação` e `Receitas`, os títulos das fixtures e as colunas `Data`, `Autor`, `Ações`.
3. `formata datas nulas como travessão` — na região `Histórico veterinário`, a linha do registro com `recordDate: null` exibe `—`.
4. `mostra erro em alerta quando uma listagem falha` — `prescriptionService.list` rejeita com `new Error('Não foi possível carregar receitas.')`; após clicar em `Saúde`, `findByRole('alert')` contém essa mensagem.
5. `mostra estado vazio quando não há registros` — as três listas vazias produzem `Nenhum registro clínico ainda.`, `Nenhuma vacina registrada.` e `Nenhuma receita registrada.`.
6. `mostra aviso e desabilita criação para sessão sem vínculo de membro` — com `semMember`, `getByText('É necessário vínculo com membro para registrar dados clínicos.')` e os três botões `Novo registro`, `Nova vacina`, `Nova receita` desabilitados; nenhum `create` chamado.
7. `bolsista edita apenas registro próprio` — com `bolsista`, dentro de `Histórico veterinário` existe exatamente um botão `Editar` e dentro de `Vacinação` nenhum.
8. `administração edita registros de qualquer autor` — com `admin`, cada uma das três regiões tem pelo menos um botão `Editar`.
9. `cria registro de histórico e recarrega a lista` — abrir `Novo registro`, preencher `Título`, `Data do registro` e `Descrição`, clicar `Salvar registro`; esperar `veterinaryHistoryService.create(5, { title: 'Consulta', record_date: '2026-10-02', description: 'Animal saudável.', created_by_member_id: 7 })` e `list` chamado duas vezes.
10. `cria vacina com campos opcionais vazios enviando null` — abrir `Nova vacina`, preencher `Vacina` e `Data de aplicação`, deixar `Dose` e `Observação` vazios, clicar `Salvar vacina`; esperar `create` com `{ vaccine: 'V10', application_date: '2026-09-12', dose: null, notes: null, created_by_member_id: 7 }`.
11. `edita receita existente com payload parcial` — dentro de `Receitas`, clicar em `Editar` da receita do autor 7, alterar apenas `Posologia` para `2 comprimidos ao dia`, clicar `Salvar receita`; esperar `prescriptionService.update(12, { dosage: '2 comprimidos ao dia' })`.
12. `não envia POST quando campo obrigatório está vazio` — abrir `Novo registro`, clicar `Salvar registro` sem preencher; esperar alerta `Preencha os campos obrigatórios.` e `create` não chamado.

Em `AnimalsAdminPage.test.tsx`, acrescentar:

```ts
it('oferece link para a ficha de saúde do animal', async () => {
  renderPage(bolsistaUser);
  expect(await screen.findByText('Mel')).toBeInTheDocument();
  const links = screen.getAllByRole('link', { name: 'Ver ficha' });
  expect(links).toHaveLength(3);
  expect(links[0]).toHaveAttribute('href', '/painel/animais/1');
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/AnimalHealthPage.test.tsx src/features/staff/pages/AnimalsAdminPage.test.tsx`
Expected: FAIL — módulo `./AnimalHealthPage` não existe e link ausente.

- [ ] **Step 3: Implementar a página**

`AnimalHealthPage`: `const { id } = useParams(); const animalId = Number(id); const { animal, loading, failed } = useAnimal(animalId);` e três `useAsyncData` com `deps [animalId]`. `PageHead` com título `Ficha de {animal?.name ?? 'animal'}` e botão “Voltar para animais” via `Link`. Duas abas como botões `Dados` e `Saúde` (`aria-pressed`), começando em `Dados`. A aba `Dados` mostra `Panel` somente leitura com nome, sexo, status, idade e comportamento do animal (sem dado clínico). A aba `Saúde` mostra um `Alert` informativo quando `user?.memberId === null` e as três `ClinicalRecordsSection`:

| Seção | `id`/título | Colunas | `createLabel` | `emptyMessage` |
| --- | --- | --- | --- | --- |
| Histórico | `health-history` / `Histórico veterinário` | `Data` = `formatDate(recordDate)`, `Título`, `Descrição` | `Novo registro` | `Nenhum registro clínico ainda.` |
| Vacinas | `health-vaccines` / `Vacinação` | `Data` = `formatDate(applicationDate)`, `Vacina`, `Dose` = `dose ?? '—'` | `Nova vacina` | `Nenhuma vacina registrada.` |
| Receitas | `health-prescriptions` / `Receitas` | `Data` = `formatDate(prescriptionDate)`, `Medicamento`, `Posologia` | `Nova receita` | `Nenhuma receita registrada.` |

`canCreate = user?.memberId !== null && user?.memberId !== undefined`; `canEdit(item) = isAdmin(user?.role) || (user?.memberId !== null && item.createdByMemberId === user?.memberId)`.

Estado do formulário: `{ kind: 'history' | 'vaccination' | 'prescription'; id?: number; values: Record<string, string>; original: Record<string, string> } | null`; abrir `Novo` com valores vazios e `Editar` com os valores do item — `values` e `original` usam as mesmas chaves de `fields`, com datas em `AAAA-MM-DD` e opcionais nulos virando `''`. No máximo um formulário aberto por vez, renderizado acima da seção correspondente.

Definições de campos (rótulos exatos): histórico — `title` (`Título`, text, obrigatório, 120), `recordDate` (`Data do registro`, date, obrigatório), `description` (`Descrição`, textarea, obrigatório); vacina — `vaccine` (`Vacina`, text, obrigatório, 120), `applicationDate` (`Data de aplicação`, date, obrigatório), `dose` (`Dose`, text, opcional, 40), `notes` (`Observação`, textarea, opcional); receita — `medication` (`Medicamento`, text, obrigatório, 120), `dosage` (`Posologia`, textarea, obrigatório, 240), `prescriptionDate` (`Data da receita`, date, obrigatório), `notes` (`Observação`, textarea, opcional).

Submissão: validar campos obrigatórios com `Preencha os campos obrigatórios.`; para criação, converter para `snake_case`, transformar opcionais vazios em `null` e incluir `created_by_member_id: user.memberId`; para edição, comparar `values` com `original` e enviar somente as chaves alteradas, sem `created_by_member_id`; a mensagem de validação e a mensagem de erro do service são passadas como `error` do `ClinicalRecordForm` (que as exibe em `Alert`); em sucesso, fechar o formulário e chamar o `reload()` da lista correspondente.

Em `AnimalsAdminPage.tsx`, acrescentar antes do `Editar`, em todas as linhas (incluindo falecidos), um `Link` com `to={`/painel/animais/${animal.id}`}`, texto `Ver ficha` e as mesmas classes `min-h-11` dos links existentes. Em `src/app/router.tsx`, importar `AnimalHealthPage` e registrar `<Route path="animais/:id" element={<AnimalHealthPage />} />` dentro de `/painel`, ao lado de `animais`, antes do bloco `somente administração` (a rota `animais/:id/editar` continua mais específica e não é afetada).

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/AnimalHealthPage.test.tsx src/features/staff/pages/AnimalsAdminPage.test.tsx`
Expected: PASS (12 testes novos + suíte existente de `AnimalsAdminPage`).

- [ ] **Step 5: Rodar a suíte completa**

Run: `node .\node_modules\vitest\vitest.mjs run`
Expected: PASS — sem regressões (referência: 323 testes antes do B2).

- [ ] **Step 6: Commit**

```bash
git add src/features/staff/pages/AnimalHealthPage.tsx src/features/staff/pages/AnimalHealthPage.test.tsx src/features/staff/pages/AnimalsAdminPage.tsx src/features/staff/pages/AnimalsAdminPage.test.tsx src/app/router.tsx
git commit -m "feat: adiciona ficha interna de saude do animal"
```

---

### Task 7: Documentação e roadmap

**Files:**
- Modify: `README.md:136`
- Modify: `docs/manual-do-usuario.md:201-212,367`
- Modify: `docs/roteiro-demo.md:66-72`
- Modify (fora do git): `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md:1421`

**Interfaces:**
- Consumes: `docs/backlog/tarefas-api-tempdb.md` da Task 1 e a rota da Task 6.
- Produces: documentação descrevendo a aba Saúde sem prometer persistência e `B2` mantido como `[ ]` no roadmap.

- [ ] **Step 1: Atualizar o README**

Acrescentar à lista de rotas da equipe, logo após a linha de `/painel/animais/novo`:

```markdown
- `/painel/animais/:id` — ficha interna do animal com abas **Dados** e **Saúde**
  (histórico, vacinação e receitas); persistência dependente da API pendente
  (`docs/backlog/tarefas-api-tempdb.md`)
```

- [ ] **Step 2: Atualizar o manual**

Em `### 4.2`, acrescentar o passo 4: “Clique em **Ver ficha** para abrir a ficha interna do animal e, na aba **Saúde**, consultar histórico, vacinas e receitas.” No parágrafo de resultado esperado, acrescentar que **Editar** aparece só para o autor do registro ou a administração, que não há exclusão e que a persistência depende da API pendente.

Em `## 6. Demonstração e pendências de API`, acrescentar ao fim a seção `### 6.5 Saúde do animal (histórico, vacinas e receitas)` com: caminho `Animais → Ver ficha → Saúde`; leitura para qualquer membro; criação exige vínculo com membro; edição só do autor ou da administração; autor mostrado como `Membro #id` ou `—`; sem botão de exclusão; aviso de que criar/editar e recarregar só persiste depois que a API do `TempDB` for executada.

- [ ] **Step 3: Atualizar o roteiro de demonstração**

No item `### 4. Animais: busca, ficha, foto, óbito`, acrescentar uma frase de demo: “A ficha interna reúne histórico, vacinas e receitas; a gravação depende da API do `TempDB`, ainda pendente (ver `docs/backlog/tarefas-api-tempdb.md`).” Não alterar os outros itens nem os planos B existentes.

- [ ] **Step 4: Atualizar o roadmap externo**

Manter `| B2 | Receitas, histórico e vacinação | S07 | [ ] | |` e acrescentar, logo após a nota do B1:

```markdown
> B2 (frente) concluído em 2026-11-23; API pendente em docs/backlog/tarefas-api-tempdb.md.
```

Não marcar `B2` como `[x]`.

- [ ] **Step 5: Conferir**

Run: `Select-String -Path README.md, docs/manual-do-usuario.md, docs/roteiro-demo.md -Pattern 'Ver ficha','Saúde','pendente' -CaseSensitive:$false`
Expected: os três termos aparecem nos três arquivos.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/manual-do-usuario.md docs/roteiro-demo.md
git commit -m "docs: descreve ficha de saude e pendencia da API do B2"
```

---

### Task 8: Verificação final e QA responsivo

**Files:** nenhum. Gate de saída.

**Interfaces:**
- Consumes: resultado de todas as tarefas acima.
- Produces: evidência de verificação e eventuais defeitos para correção antes de publicar.

- [ ] **Step 1: Rodar as quatro verificações**

Run, em ordem, a partir da raiz do worktree:

```powershell
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\typescript\bin\tsc -b
node .\node_modules\eslint\bin\eslint.js .
node .\node_modules\vite\bin\vite.js build
```

Expected: respectivamente testes PASS sem regressões, nenhum erro, nenhum erro e build concluído.

- [ ] **Step 2: QA no navegador**

Carregar o skill `playwright-cli`, subir o Vite dev e, antes de navegar, preparar a sessão:
- `localStorage['@peludinhos:access-token'] = 'qa-token'` e `localStorage['@peludinhos:refresh-token'] = 'qa-refresh'`.
- Interceptar `**/api/auth/me` devolvendo `{ "user": { "id": "qa-bolsista", "email": "bolsista@peludinhos.example", "name": "Bolsista QA", "actor_type": "membro", "role": "bolsista", "member_id": 7, "visitor_id": null } }`.
- Interceptar `**/api/animals/5` devolvendo um `ApiAnimal` com `animal_id: 5`, `name: 'Mel'` e os demais campos no formato de `animal.types.ts`.
- Interceptar `**/api/animals/5/veterinary-history`, `**/api/animals/5/vaccinations` e `**/api/animals/5/prescriptions` devolvendo páginas com dois itens cada, no formato das Tasks 2–4 (um item com autor 7 e outro com autor 9, um com data nula).
- Repetir a navegação com `role: 'administrador'` e `member_id: 42` para conferir que todos os registros mostram **Editar**.

Navegar até `/painel/animais/5`, abrir a aba **Saúde** e inspecionar em 360, 768 e 1280 px: ausência de overflow horizontal, três seções legíveis, colunas e botões visíveis, formulário com rótulos legíveis e alvos de toque ≥44 px, `—` em data nula, ausência de botão de exclusão e aviso de persistência pendente. Salvar capturas em `.superpowers/sdd/2026-11-23-b2-saude-animal-front/qa-360.png`, `qa-768.png` e `qa-1280.png`.

- [ ] **Step 3: Registrar o resultado**

Se houver defeito real, descreva página, largura e observação; não corrija código nesta tarefa. Se não houver, registre “QA limpo”. Não faça push; a publicação fica para o controller após a revisão final da branch.
