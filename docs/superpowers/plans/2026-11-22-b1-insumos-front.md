# B1 Insumos (frente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as fixtures da tela de insumos por services reais e cadastro de medicamentos/produtos, anotando no `TempDB` tudo o que depender de API.

**Architecture:** A fatia de front é autocontida na feature `staff`: dois services independentes (`medicationService`, `productService`) fazem a conversão `snake_case` → `camelCase`, e `SuppliesPage` consome ambos com `useAsyncData`, exibindo criação/edição apenas para administração. Nenhuma alteração de backend é executada; o contrato e as tarefas de API ficam registrados em `docs/backlog/tarefas-api-tempdb.md`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4, Vitest + Testing Library, `httpClient` compartilhado.

**Spec:** `docs/superpowers/specs/2026-11-22-b1-insumos-front-design.md`

## Global Constraints

- Toda alteração no projeto `TempDB` vai **apenas** para `docs/backlog/tarefas-api-tempdb.md`; nada é executado nesta fatia.
- Nenhuma alteração em migrations `0001`–`0004`, seed, backend, caminhos de rota, tags ou outras páginas.
- Arquitetura feature based: tipos, service, página e testes em `src/features/staff/`; sem dependência cruzada com a feature de pontos.
- `snake_case` da API convertido para `camelCase` somente dentro das funções `map*` de cada service.
- Listagens usam `Page<T>` de `src/shared/api/types.ts` e `limit: 200`.
- Leitura disponível para membros; criação/edição apenas quando `isAdmin(user?.role)`.
- Sem DELETE na API e sem botão de exclusão na tela.
- A rota `/painel/insumos` e o componente `DemoBanner` (usado pela adoção) não mudam.
- Interface e documentação em português; TDD antes do código; commits convencionais.
- Windows/PowerShell. Comandos: `node .\node_modules\vitest\vitest.mjs run`, `node .\node_modules\typescript\bin\tsc -b`, `node .\node_modules\eslint\bin\eslint.js .`, `node .\node_modules\vite\bin\vite.js build`.

## Review Focus

- **API ainda não existe e a requisição falha:** a página deve mostrar erro em `Alert`, não uma tabela vazia silenciosa → teste "mostra alerta de erro quando a listagem falha" na Task 4.
- **Usuário membro (não admin):** nenhum botão de criação/edição pode aparecer → teste "não oferece criação/edição para membro" na Task 4.
- **`validity` nulo na resposta:** deve renderizar "Sem validade", nunca uma data inválida → teste correspondente na Task 4.
- **Campos opcionais ausentes (`notes`, `created_at`, `updated_at`):** devem virar `null` sem quebrar o mapeador → testes de `mapMedication`/`mapProduct` nas Tasks 2 e 3.
- **Edição parcial:** o PATCH deve enviar somente os campos alterados, sem reenviar nome/quantidade → testes de `update` nas Tasks 2 e 3.

---

### Task 1: Registrar as pendências de API do B1

**Files:**
- Create: `docs/backlog/tarefas-api-tempdb.md`

**Interfaces:**
- Consumes: contrato acordado em `docs/superpowers/specs/2026-11-22-b1-insumos-front-design.md`.
- Produces: caminho estável referenciado pela Task 5 e pelo usuário para execução futura no `TempDB`.

- [ ] **Step 1: Criar o arquivo de pendências**

Escreva `docs/backlog/tarefas-api-tempdb.md` com, nesta ordem:

1. Regra geral: toda tarefa que exigir alteração no `TempDB` é anotada aqui, com contexto, passos, aceite e restrições; a execução fica para o final das tarefas deste repo. Nenhuma migration `0001`–`0004` é alterada.
2. Índice com `B1 — Medicamentos e produtos com API real` como único item aberto e espaço para `tarefas futuras` (B2 em diante) sem conteúdo ainda.
3. Seção `B1` com o contrato completo:
   - Colunas: `medication_id`/`product_id` (inteiro, PK), `name` (1–120), `type` (1–60), `quantity` (número ≥ 0), `unit` (1–20), `validity` (data opcional), `point` (texto livre 1–120), `notes` (opcional), `created_at`/`updated_at` (opcionais).
   - Migration `0005`: seguir o padrão de `migrations/0004_operacao.sql` — tabelas com `if not exists`, `public.touch_updated_at()`, índices, `enable row level security`, policies `to authenticated` (`select` com `private.is_project_member()`; `insert`/`update`/`delete` com `private.is_project_admin()`), grants equivalentes, nada para `anon`, `service_role` com CRUD e `notify pgrst, 'reload schema';` no fim.
   - Schemas Pydantic em `app/schemas.py`: `MedicationCreate`/`Update`/`Out`, `ProductCreate`/`Update`/`Out`, com `Page[T]`; campos opcionais com `None` onde a resposta do front espera `null`.
   - Routers `app/routers/medications.py` e `products.py` com `prefix="/api/medications"` / `"/api/products"`, `GET ""`, `POST ""`, `PATCH "/{id}"`, RBAC via `require_member` na leitura e `require_admin` na escrita, `get_service_client()`, mensagens de erro em português e 404 em `_find_*`.
   - Registro dos dois routers em `app/main.py`.
   - Smoke test em `scripts/smoke_test.py`: anon 401, bolsista 403, admin 201/200 na escrita, leitura de membro 200, criação + patch refletidos após nova listagem.
   - Documentação: atualizar `TempDB/DOCUMENTACAO.md` com as duas tabelas e a migration aplicada; seed opcional de insumos para o ensaio.
   - Desvios registrados: `point` é texto livre (não FK para `feeding_points`); `unit` é campo adicional; `notes` representa a "observação" do roadmap; sem DELETE.
   - Aceite: criar, editar e listar persistem após reload; banner de demonstração removido.
4. Checklist "Antes de executar" (confirmar branch do `TempDB`, aplicar 0005 via MCP ou `apply_migration.py` com `DATABASE_URL`, rodar smoke e `test_seed_demo.py`, confirmar `notify pgrst`).

- [ ] **Step 2: Conferir o arquivo**

Run: `Select-String -Path docs/backlog/tarefas-api-tempdb.md -Pattern 'B1','0005','medications','products','Desvios','Antes de executar'`
Expected: todas as seis expressões aparecem.

- [ ] **Step 3: Commit**

```bash
git add docs/backlog/tarefas-api-tempdb.md
git commit -m "docs: registra pendencias de API do B1 no TempDB"
```

---

### Task 2: Service de medicamentos

**Files:**
- Create: `src/features/staff/services/medicationService.ts`
- Test: `src/features/staff/services/medicationService.test.ts`

**Interfaces:**
- Consumes: `httpClient` (`get`/`post`/`patch`) e `Page<T>`.
- Produces: `Medication`, `ApiMedication`, `SupplyPayload`, `mapMedication(row: ApiMedication): Medication`, `medicationService.list/create/update` (usados pela Task 4).

- [ ] **Step 1: Escrever os testes que falham**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { mapMedication, medicationService, type ApiMedication } from './medicationService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiMedication = {
  medication_id: 3,
  name: 'Amoxicilina 500 mg',
  type: 'Antibiótico',
  quantity: 24,
  unit: 'cápsulas',
  validity: '2027-03-15',
  point: 'Farmácia — caixa A',
  notes: null,
  created_at: null,
  updated_at: null,
};

describe('medicationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia medication_id para id e normaliza campos opcionais', () => {
    const mapped = {
      id: 3,
      name: 'Amoxicilina 500 mg',
      type: 'Antibiótico',
      quantity: 24,
      unit: 'cápsulas',
      validity: '2027-03-15',
      point: 'Farmácia — caixa A',
      notes: null,
      createdAt: null,
      updatedAt: null,
    };
    expect(mapMedication(row)).toEqual(mapped);
    const { notes: _n, created_at: _c, updated_at: _u, ...semOpcionais } = row;
    expect(mapMedication(semOpcionais)).toEqual(mapped);
  });

  it('list envia filtros em snake_case e mapeia a página', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await medicationService.list({ q: 'amox', limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith('/medications?q=amox&limit=200');
    expect(page.items[0].id).toBe(3);
  });

  it('create envia o payload em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await medicationService.create({
      name: 'Amoxicilina 500 mg', type: 'Antibiótico', quantity: 24,
      unit: 'cápsulas', validity: '2027-03-15', point: 'Farmácia — caixa A',
      notes: 'Uso controlado',
    });
    expect(httpClient.post).toHaveBeenCalledWith('/medications', {
      name: 'Amoxicilina 500 mg', type: 'Antibiótico', quantity: 24,
      unit: 'cápsulas', validity: '2027-03-15', point: 'Farmácia — caixa A',
      notes: 'Uso controlado',
    });
  });

  it('update envia somente os campos informados', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await medicationService.update(3, { quantity: 30 });
    expect(httpClient.patch).toHaveBeenCalledWith('/medications/3', { quantity: 30 });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/services/medicationService.test.ts`
Expected: FAIL — módulo `./medicationService` não existe.

- [ ] **Step 3: Implementar o service**

Em `medicationService.ts`, declarar `ApiMedication` (campos `snake_case` conforme o teste, com `notes`, `created_at` e `updated_at` opcionais), `Medication` (campos `camelCase`), `SupplyPayload` (`name`, `type`, `quantity`, `unit`, `point` obrigatórios; `validity`, `notes` opcionais), `mapMedication` e `medicationService` com `list`/`create`/`update`. `validity`/`notes`/`created_at`/`updated_at` ausentes viram `null` no mapeador. `list` monta `URLSearchParams` com `q`, `limit`, `offset` e usa `withQuery` como em `foodService.ts`; `create` e `update` enviam apenas as chaves presentes no payload.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/services/medicationService.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/staff/services/medicationService.ts src/features/staff/services/medicationService.test.ts
git commit -m "feat: adiciona service de medicamentos"
```

---

### Task 3: Service de produtos

**Files:**
- Create: `src/features/staff/services/productService.ts`
- Test: `src/features/staff/services/productService.test.ts`

**Interfaces:**
- Consumes: os mesmos `httpClient`/`Page<T>` da Task 2.
- Produces: `Product`, `ApiProduct`, `mapProduct`, `productService.list/create/update` (usados pela Task 4). Mesma forma de `Medication`, trocando `medication_id` por `product_id` e `/medications` por `/products`.

- [ ] **Step 1: Escrever os testes que falham**

Copie os quatro testes da Task 2 trocando `medication` por `product`, `medication_id` por `product_id`, `/medications` por `/products` e os dados por `{ product_id: 7, name: 'Shampoo neutro', type: 'Higiene', quantity: 20, unit: 'frascos', validity: null, point: 'Depósito — prateleira 2', notes: null, created_at: null, updated_at: null }`. O teste de listagem deve esperar `'/products?limit=200'`; o de criação, `httpClient.post('/products', ...)`; o de atualização, `httpClient.patch('/products/7', { quantity: 24 })`.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/services/productService.test.ts`
Expected: FAIL — módulo `./productService` não existe.

- [ ] **Step 3: Implementar o service**

Espelhe `medicationService.ts` com os nomes da Task 3. Não importe nada de `medicationService`: as duas features de insumo são independentes.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/services/productService.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/staff/services/productService.ts src/features/staff/services/productService.test.ts
git commit -m "feat: adiciona service de produtos"
```

---

### Task 4: Página de insumos com listagem e cadastro

**Files:**
- Create: `src/features/staff/pages/SuppliesPage.tsx`
- Test: `src/features/staff/pages/SuppliesPage.test.tsx`
- Modify: `src/app/router.tsx:21`, `src/app/router.tsx:69-70`
- Delete: `src/features/staff/pages/SuppliesDemoPage.tsx`, `src/features/staff/pages/SuppliesDemoPage.test.tsx`, `src/features/staff/data/demo.ts`

**Interfaces:**
- Consumes: `medicationService` e `productService` das Tasks 2/3, `useAuth`, `isAdmin`, `useAsyncData`, `PageHead`, `Panel`, `Table*`, `Alert`, `EmptyState`, `TextField`, `formatDate`.
- Produces: `SuppliesPage` exportada e renderizada em `/painel/insumos`.

- [ ] **Step 1: Escrever os testes que falham**

Crie `SuppliesPage.test.tsx` com `vi.mock` de `useAuth`, `medicationService` e `productService`, dois usuários (`administrador` e `bolsista`) e fixtures tipadas `Medication`/`Product` no formato da Task 2/3. Inclua estes testes (todos com `render(<SuppliesPage />)`, sem `MemoryRouter`):

1. `não mostra o banner de demonstração` — `queryByText('Dados de demonstração - esta área ainda não persiste no banco')` é `null`.
2. `lista medicamentos e produtos com as colunas atuais` — com os dois services resolvendo `Page` de um item cada, existem as regiões `Medicamentos` e `Produtos`, cada uma com `table`, os nomes das fixtures e os cabeçalhos `Nome`, `Tipo`, `Quantidade`, `Validade`, `Ponto/uso`.
3. `chama as duas listagens com limit 200` — `expect(medicationService.list).toHaveBeenCalledWith({ limit: 200 })` e o equivalente de produtos.
4. `mostra "Sem validade" para validade nula` — item de produto com `validity: null` produz `Sem validade`.
5. `mostra alerta de erro quando a listagem falha` — `medicationService.list` rejeita com `new Error('Não foi possível carregar medicamentos.')`; `await screen.findByRole('alert')` contém essa mensagem.
6. `não oferece criação/edição para membro` — com usuário `bolsista`, `queryByRole('button', { name: /Novo medicamento|Novo produto|Editar/i })` é `null`.
7. `oferece criação e edição para administrador` — com usuário `administrador`, existem `Novo medicamento`, `Novo produto` e pelo menos um botão `Editar`.
8. `cria medicamento e recarrega a lista` — clicar em `Novo medicamento`, preencher os campos rotulados `Nome`, `Tipo`, `Quantidade`, `Unidade`, `Validade`, `Ponto`, `Observação`, clicar em `Salvar medicamento`; esperar `medicationService.create` com o payload em `camelCase` e a listagem chamada duas vezes.
9. `edita produto existente com os dados preenchidos` — clicar em `Editar` dentro da região `Produtos`; o campo `Nome` traz o nome da fixture; alterar `Quantidade` para `24`; clicar em `Salvar produto`; esperar `productService.update(id, { quantity: 24 })`.

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/SuppliesPage.test.tsx`
Expected: FAIL — módulo `./SuppliesPage` não existe.

- [ ] **Step 3: Implementar a página**

Em `SuppliesPage.tsx`:
- `useAuth()` + `isAdmin(user?.role)`; dois `useAsyncData(() => medicationService.list({ limit: 200 }), [])` e `productService`.
- Estado `form: { kind: 'medication' | 'product'; id?: number } | null`; **no máximo um formulário no DOM por vez**, com rótulos exatamente `Nome`, `Tipo`, `Quantidade`, `Unidade`, `Validade`, `Ponto`, `Observação` via `TextField` (usar `type="number"` para Quantidade, `type="date"` para Validade, `multiline` para Observação, `optional` para Validade e Observação).
- `SupplySection({ id, title, items, loading, error, admin, onNew, onEdit })` mantém `<section aria-labelledby={id}>`, as cinco colunas atuais mais `Ações`, `EmptyState` quando vazio, `Alert variant="danger"` quando `error`, e o padrão responsivo `RESPONSIVE_ROW`/`RESPONSIVE_CELL` de `FoodAdminPage.tsx:94-103`.
- `formatDate(item.validity)` ou `Sem validade` quando nulo.
- Submissão valida `name`, `type`, `quantity >= 0`, `unit`, `point`; chama `create`/`update` do service correspondente; em sucesso fecha o formulário e chama `reload()` da lista; em erro mostra `Alert variant="danger"` com a mensagem.
- `PageHead` com título `Insumos` e subtítulo sem menção a demonstração.

Em `src/app/router.tsx`, trocar o import da linha 21 para `SuppliesPage` e o elemento da linha 70, atualizando o comentário da linha 69 para descrever leitura via API. Excluir os três arquivos antigos com `git rm`.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/staff/pages/SuppliesPage.test.tsx`
Expected: PASS (9 testes).

- [ ] **Step 5: Rodar a suíte completa**

Run: `node .\node_modules\vitest\vitest.mjs run`
Expected: PASS — 42 arquivos, sem regressões.

- [ ] **Step 6: Commit**

```bash
git add -A src/app/router.tsx src/features/staff/pages src/features/staff/data
git commit -m "feat: migra tela de insumos para cadastro com API"
```

---

### Task 5: Documentação e roadmap

**Files:**
- Modify: `README.md`, `docs/manual-do-usuario.md`, `docs/roteiro-demo.md`
- Modify (fora do git): `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md`

**Interfaces:**
- Consumes: `docs/backlog/tarefas-api-tempdb.md` da Task 1.
- Produces: textos sem "modo demonstração/banner" e `B1` marcado como pendente de API.

- [ ] **Step 1: Localizar os trechos**

Run: `Select-String -Path README.md, docs/manual-do-usuario.md, docs/roteiro-demo.md -Pattern 'demonstra|demo|não persiste|banner' -CaseSensitive:$false`
Expected: trechos da tabela de rotas, da seção 6 do manual e da fala do roteiro.

- [ ] **Step 2: Atualizar os textos**

- `README.md`: a linha da tabela de insumos passa a descrever "Cadastro de medicamentos e produtos; persistência dependente da API (ver `docs/backlog/tarefas-api-tempdb.md`)" e a descrição da rota deixa de dizer "modo demonstração".
- `docs/manual-do-usuario.md` seção 6.1: substituir as instruções de banner/dados fictícios pela nova tela (listar, criar e editar, com criação/edição restrita à administração), mantendo o aviso de que a persistência efetiva depende da execução da API pendente.
- `docs/roteiro-demo.md`: trocar a fala "Medicamentos e produtos são dados fictícios: a tela não persiste no banco" pela descrição do cadastro real com a mesma ressalva.

- [ ] **Step 3: Atualizar o roadmap externo**

No arquivo externo, manter `| B1 | Medicamentos e produtos com API real | S07 | [ ] | |` e acrescentar, logo após a tabela de acompanhamento, a nota: `> B1 (frente) concluído em 2026-11-22; API pendente em docs/backlog/tarefas-api-tempdb.md.` Não marcar `B1` como `[x]`.

- [ ] **Step 4: Conferir**

Run: `Select-String -Path README.md, docs/manual-do-usuario.md, docs/roteiro-demo.md -Pattern 'não persiste no banco|Dados de demonstração' -CaseSensitive:$false`
Expected: nenhum resultado.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/manual-do-usuario.md docs/roteiro-demo.md
git commit -m "docs: atualiza textos de insumos e registra pendencia da API"
```

---

### Task 6: Verificação final e QA responsivo

**Files:** nenhum. Gate de saída.

**Interfaces:**
- Consumes: resultado mesclado de todas as tarefas acima.
- Produces: evidência de verificação e eventuais defeitos para correção antes de publicar.

- [ ] **Step 1: Rodar as quatro verificações**

Run, em ordem, a partir da raiz do worktree:

```powershell
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\typescript\bin\tsc -b
node .\node_modules\eslint\bin\eslint.js .
node .\node_modules\vite\bin\vite.js build
```

Expected: respectivamente 44 arquivos/322 testes PASS, nenhum erro, nenhum erro e build concluído.

- [ ] **Step 2: QA no navegador**

Carregar o skill `playwright-cli`, subir o Vite dev e, antes de navegar, preparar a sessão:
- `localStorage['@peludinhos:access-token'] = 'qa-token'` e `localStorage['@peludinhos:refresh-token'] = 'qa-refresh'`.
- Interceptar `**/api/auth/me` devolvendo `{ "user": { "id": "qa-admin", "email": "admin@peludinhos.example", "name": "Admin QA", "actor_type": "membro", "role": "administrador", "member_id": 42, "visitor_id": null } }`.
- Interceptar `**/api/medications` e `**/api/products` devolvendo páginas com dois itens cada, no formato `ApiMedication`/`ApiProduct` da Task 2/3.

Navegar até `/painel/insumos` e inspecionar em 360, 768 e 1280 px: ausência de overflow horizontal, duas tabelas legíveis, colunas e botões visíveis, formulário de cadastro com rótulos legíveis e alvos de toque ≥44px, texto "Sem validade" quando aplicável.

- [ ] **Step 3: Registrar o resultado**

Se houver defeito real, descreva página, largura e observação; não corrija código nesta tarefa. Se não houver, registre "QA limpo". Não faça push; a publicação fica para o controller após a revisão final da branch.
