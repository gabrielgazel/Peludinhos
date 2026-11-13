# S04 — CRUD de voluntários (ficha + polimento) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o CRUD de membros com ficha somente leitura, busca e estados na lista, ligação ficha ↔ edição e QA fim a fim — sem exclusão e sem tocar na API.

**Architecture:** Uma nova página admin-only (`/painel/membros/:id`) lê o membro via `memberService.getById` e reaproveita `PageHead`, `Panel`, `Alert` e `EmptyState`. A lista ganha busca client-side sobre os itens já carregados, contagem e links para a ficha. O formulário de edição aponta para a ficha. Nenhum contrato de serviço ou backend muda.

**Tech Stack:** React 19, TypeScript, Vite, React Router 7, Tailwind v4, Vitest + Testing Library, Playwright CLI.

**Spec:** `docs/superpowers/specs/2026-11-13-s04-crud-voluntarios-design.md`

## Global Constraints

- Exclusão de membro está **fora de escopo**; não criar `delete` em `memberService` nem chamar `DELETE`.
- Não alterar backend/API, `src/features/staff/services/memberService.ts` ou outros serviços.
- Reutilizar a moldura existente: `PageHead`, `Panel`, `Alert`, `EmptyState`, `Table`, tokens `staff-*`. Não introduzir classes legadas (`page-head`, `panel`, `btn`, `badge`, `data-table`, `table-scroll`, `filter-bar`, `empty-state`).
- A lista continua chamando `memberService.list({ role, limit: 100 })`; sem paginação e sem busca no servidor.
- Rota da ficha dentro do bloco `ADMIN_ROLES` existente em `src/app/router.tsx`.
- Textos em português, mantendo "Membros da equipe"/"Membros" como guarda-chuva dos papéis.
- A tabela mantém a região rolável (`role="region"`, `tabIndex={0}`, `aria-label` atual).
- Links e botões novos com `min-h-11` e foco visível (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent`).
- Verificação de testes neste ambiente: `node node_modules/vitest/vitest.mjs run --reporter=dot` (esperado exit 0). **Não** usar `bun run test` como critério — ele termina com exit 1 nesta máquina mesmo com a suíte verde.
- Commits no padrão do repositório: `feat(staff): ...` / `test(staff): ...`, em português.

## Review Focus

- **ID inexistente ou não numérico na URL** (`/painel/membros/999`, `/painel/membros/abc`): precisa mostrar "Não encontramos este membro.", manter o Voltar e não quebrar. Coberto na Task 2.
- **Busca com caixa, acento e espaço em branco** (`ANA@...`, `JOSE avila`, `"   "`): deve casar nome/e-mail sem diferenciar caixa/acento e não filtrar quando o termo é só espaço. Coberto na Task 3.
- **Campos opcionais nulos e `feedingDays` vazio**: a ficha deve mostrar `—` em todos, sem `null`/vazio. Coberto na Task 1.
- **Membro sem `id`** (projeção pública): na lista não pode virar link, nem ganhar **Ver**/**Editar**. Coberto na Task 3.
- **Falha de rede ao abrir a ficha**: deve mostrar `role="alert"` com a mensagem e manter a navegação de volta, sem renderizar dados parciais. Coberto na Task 1.

---

## File Structure

- Create: `src/features/staff/pages/MemberDetailPage.tsx` — ficha read-only, com carregando/erro/404.
- Create: `src/features/staff/pages/MemberDetailPage.test.tsx` — testes da ficha.
- Modify: `src/app/router.tsx:58-60` — importa a página e registra `membros/:id`.
- Modify: `src/features/staff/pages/MembersAdminPage.tsx` — busca, contagem, estados vazios, link do nome e ação **Ver**.
- Modify: `src/features/staff/pages/MembersAdminPage.test.tsx` — atualiza estados e cobre busca/links.
- Modify: `src/features/staff/pages/MemberFormPage.tsx:309-323` — link **Ver ficha** no modo edição.
- Modify: `src/features/staff/pages/MemberFormPage.test.tsx` — cobre presença/ausência do link.

---

### Task 1: Ficha do membro (carregando, sucesso e erro)

**Files:**
- Create: `src/features/staff/pages/MemberDetailPage.tsx`
- Create: `src/features/staff/pages/MemberDetailPage.test.tsx`
- Modify: `src/app/router.tsx:58-60`

**Interfaces:**
- Consumes: `memberService.getById(id: number): Promise<Member>`, `ROLE_LABEL`, `formatDate`, `formatCpf`, `useAsyncData`, `PageHead`, `Panel`, `Alert`, `EmptyState`.
- Produces: `export function MemberDetailPage()` sem props; rota `/painel/membros/:id`; componente local `DetailItem({ label, value }: { label: string; value: string })`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/features/staff/pages/MemberDetailPage.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '../services/memberService';
import { memberService } from '../services/memberService';
import { MemberDetailPage } from './MemberDetailPage';

vi.mock('../services/memberService', () => ({
  memberService: { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

function makeMember(partial: Partial<Member> & { name: string }): Member {
  return {
    id: 5,
    role: 'bolsista',
    email: 'ana@peludinhos.example',
    birthDate: '1998-04-12T00:00:00',
    cpf: '52998224725',
    ufopaRegistration: '2021001234',
    projectEntryDate: '2024-03-15T00:00:00',
    feedingDays: ['segunda', 'quarta'],
    ...partial,
  };
}

function renderAt(memberId = '5') {
  return render(
    <MemoryRouter initialEntries={[`/painel/membros/${memberId}`]}>
      <Routes>
        <Route path="/painel/membros/:id" element={<MemberDetailPage />} />
        <Route path="/painel/membros" element={<div>Lista de membros</div>} />
        <Route path="/painel/membros/:id/editar" element={<div>Formulário de edição</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MemberDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memberService.getById).mockResolvedValue(makeMember({ name: 'Ana Souza' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra Carregando membro... enquanto a ficha carrega', () => {
    vi.mocked(memberService.getById).mockReturnValue(new Promise(() => {}));
    renderAt();

    expect(screen.getByText('Carregando membro...')).toBeInTheDocument();
  });

  it('mostra dados pessoais, vínculo e ações da ficha', async () => {
    renderAt();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ana Souza' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Bolsista')).toHaveLength(2);

    const personal = screen.getByRole('region', { name: 'Dados pessoais' });
    expect(within(personal).getByText('ana@peludinhos.example')).toBeInTheDocument();
    expect(within(personal).getByText('529.982.247-25')).toBeInTheDocument();
    expect(within(personal).getByText('12/04/1998')).toBeInTheDocument();

    const affiliation = screen.getByRole('region', { name: 'Vínculo' });
    expect(within(affiliation).getByText('Bolsista')).toBeInTheDocument();
    expect(within(affiliation).getByText('2021001234')).toBeInTheDocument();
    expect(within(affiliation).getByText('15/03/2024')).toBeInTheDocument();
    expect(within(affiliation).getByText('segunda, quarta')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/painel/membros/5/editar',
    );
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
  });

  it('usa — nos campos opcionais vazios', async () => {
    vi.mocked(memberService.getById).mockResolvedValue(
      makeMember({
        name: 'Bruno Lima',
        email: null,
        birthDate: null,
        cpf: null,
        ufopaRegistration: null,
        projectEntryDate: null,
        feedingDays: [],
      }),
    );
    renderAt();

    await screen.findByRole('heading', { level: 1, name: 'Bruno Lima' });
    expect(screen.getAllByText('—').length).toBe(6);
  });

  it('mostra role=alert com a mensagem quando a ficha falha', async () => {
    vi.mocked(memberService.getById).mockRejectedValue(new Error('rede indisponível'));
    renderAt();

    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MemberDetailPage.test.tsx --reporter=dot`

Expected: FAIL — `Cannot find module './MemberDetailPage'` (o arquivo ainda não existe).

- [ ] **Step 3: Implementar `MemberDetailPage`**

Criar `src/features/staff/pages/MemberDetailPage.tsx` com esta estrutura:

- `const { id } = useParams(); const memberId = Number(id);`
- `const { data: member, loading, error } = useAsyncData(() => memberService.getById(memberId), [memberId]);`
- Sempre renderizar um link **Voltar** para `/painel/membros`, com o mesmo visual do topo de `MemberFormPage` (`ArrowLeft`, `min-h-11`, borda `staff-line`).
- `loading`: `EmptyState` com o texto exato `Carregando membro...`.
- `error`: `Alert variant="danger"` com `{error}`.
- `member === null`: `Panel` + `EmptyState` com `Não encontramos este membro.` (guarda de tipo; a Task 2 passa a alcançar esse estado de verdade).
- Sucesso:
  - `PageHead` com `title={member.name}` e `actions` contendo: um selo neutro do papel (`ROLE_LABEL[member.role]`, mesmas classes do selo da lista: `rounded-full border border-staff-line bg-staff-bg px-2.5 py-0.5 text-xs font-semibold text-staff-muted`) e o link **Editar** para `/painel/membros/${member.id}/editar` (mesmo estilo primário de "Novo membro").
  - Um `Panel` com grid `gap-6 md:grid-cols-2`.
  - Duas `section` com `aria-labelledby`: `Dados pessoais` e `Vínculo`; `h2` com os mesmos textos.
  - `dl` com `DetailItem` para: **Dados pessoais** = `E-mail` (`member.email ?? '—'`), `CPF` (`formatCpf(member.cpf)` ou `—`), `Data de nascimento` (`formatDate(member.birthDate)`). **Vínculo** = `Papel` (`ROLE_LABEL[member.role]`), `Matrícula Ufopa`, `Entrada no projeto` (`formatDate`), `Dias de alimentação` (`member.feedingDays.join(', ')` ou `—`).
  - `DetailItem` local: `<div><dt className="text-sm text-staff-muted">{label}</dt><dd className="mt-0.5 font-semibold text-staff-ink">{value}</dd></div>`.

- [ ] **Step 4: Registrar a rota**

Em `src/app/router.tsx`, importar `MemberDetailPage` e adicionar, dentro do bloco `ADMIN_ROLES`:

```tsx
<Route path="membros/:id" element={<MemberDetailPage />} />
```

Manter `membros/novo` e `membros/:id/editar` como estão.

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MemberDetailPage.test.tsx --reporter=dot`

Expected: PASS (4 testes).

- [ ] **Step 6: Commit**

```bash
git add src/features/staff/pages/MemberDetailPage.tsx src/features/staff/pages/MemberDetailPage.test.tsx src/app/router.tsx
git commit -m "feat(staff): adiciona ficha do membro"
```

---

### Task 2: Estados de não encontrado e ID inválido na ficha

**Files:**
- Modify: `src/features/staff/pages/MemberDetailPage.tsx`
- Test: `src/features/staff/pages/MemberDetailPage.test.tsx`

**Interfaces:**
- Consumes: `HttpError` de `src/shared/api/httpsClient.ts`.
- Produces: loader do `useAsyncData` que resolve `null` para 404/ID inválido; estado visual `Não encontramos este membro.` dentro de `Panel` + `EmptyState`.

- [ ] **Step 1: Adicionar os testes que falham**

Adicionar ao `describe` de `MemberDetailPage.test.tsx` (importar `HttpError` de `../../../shared/api/httpsClient`):

```tsx
it('mostra o estado de não encontrado quando a API responde 404', async () => {
  vi.mocked(memberService.getById).mockRejectedValue(
    new HttpError(404, 'Membro não encontrado', null),
  );
  renderAt('999');

  expect(await screen.findByText('Não encontramos este membro.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
    'href',
    '/painel/membros',
  );
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
});

it('trata ID não numérico como não encontrado sem chamar a API', async () => {
  renderAt('abc');

  expect(await screen.findByText('Não encontramos este membro.')).toBeInTheDocument();
  expect(vi.mocked(memberService.getById)).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MemberDetailPage.test.tsx --reporter=dot`

Expected: FAIL — o 404 cai no `Alert` com "Membro não encontrado" e `abc` chama a API.

- [ ] **Step 3: Implementar o mapeamento 404 e ID inválido**

Trocar o loader por (importando `type Member` no topo do componente):

```tsx
const { data: member, loading, error } = useAsyncData<Member | null>(
  () => {
    if (!Number.isInteger(memberId) || memberId <= 0) return Promise.resolve(null);
    return memberService.getById(memberId).catch((err: unknown) => {
      if (err instanceof HttpError && err.status === 404) return null;
      throw err;
    });
  },
  [memberId],
);
```

A guarda visual para `member === null` já existe desde a Task 1; só o loader muda. O link **Voltar** deve continuar visível nos três estados (carregando, erro e não encontrado).

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MemberDetailPage.test.tsx --reporter=dot`

Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/staff/pages/MemberDetailPage.tsx src/features/staff/pages/MemberDetailPage.test.tsx
git commit -m "feat(staff): trata membro inexistente na ficha"
```

---

### Task 3: Busca, contagem, estados vazios e links na lista

**Files:**
- Modify: `src/features/staff/pages/MembersAdminPage.tsx`
- Test: `src/features/staff/pages/MembersAdminPage.test.tsx`

**Interfaces:**
- Consumes: `TextField` de `src/shared/components/TextField.tsx` (`id`, `label`, `value`, `onChange`, `type`, `placeholder`), `memberService.list({ role, limit: 100 })`.
- Produces: estado `search`; função local `normalizeText(value: string): string`; `visibleMembers: Member[]`; `countLabel: string`; `clearFilters(): void`.

- [ ] **Step 1: Atualizar o teste do estado vazio e adicionar os testes que falham**

Em `MembersAdminPage.test.tsx`:

1. Substituir o teste "mostra o estado vazio com o texto exato quando não há membros" por:

```tsx
it('mostra lista vazia com CTA de cadastro quando não há membros', async () => {
  vi.mocked(memberService.list).mockResolvedValue(page([]));
  renderPage();

  expect(await screen.findByText('Nenhum membro cadastrado ainda.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Cadastrar membro' })).toHaveAttribute(
    'href',
    '/painel/membros/novo',
  );
  expect(screen.getByText('0 membros')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
```

2. Adicionar os testes novos:

```tsx
it('busca por nome e e-mail sem diferenciar caixa, ignorando espaços em branco', async () => {
  renderPage();
  await screen.findByText('Ana Souza');

  const search = screen.getByLabelText(/Buscar/i);
  fireEvent.change(search, { target: { value: 'ANA@PELUDINHOS' } });

  expect(screen.getByText('Ana Souza')).toBeInTheDocument();
  expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument();
  expect(screen.queryByText('Carla Mendes')).not.toBeInTheDocument();
  expect(screen.getByText('1 de 3 membros')).toBeInTheDocument();
  expect(vi.mocked(memberService.list)).toHaveBeenCalledTimes(1);

  fireEvent.change(search, { target: { value: '   ' } });
  expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
  expect(screen.getByText('Carla Mendes')).toBeInTheDocument();
  expect(screen.getByText('3 membros')).toBeInTheDocument();
});

it('busca por nome ignorando acentos', async () => {
  setupList([
    makeMember({ id: 9, name: 'José Ávila', email: 'jose@peludinhos.example' }),
    makeMember({ id: 10, name: 'Ana Souza' }),
  ]);
  renderPage();
  await screen.findByText('Ana Souza');

  fireEvent.change(screen.getByLabelText(/Buscar/i), { target: { value: 'JOSE avila' } });

  expect(screen.getByText('José Ávila')).toBeInTheDocument();
  expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
  expect(screen.getByText('1 de 2 membros')).toBeInTheDocument();
});

it('sem resultados mostra o estado de busca e Limpar filtros restaura a lista', async () => {
  renderPage();
  await screen.findByText('Ana Souza');

  fireEvent.change(screen.getByLabelText(/Papel/i), { target: { value: 'bolsista' } });
  await waitFor(() => {
    expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
      role: 'bolsista',
      limit: 100,
    });
  });

  fireEvent.change(screen.getByLabelText(/Buscar/i), { target: { value: 'zzz' } });
  expect(screen.getByText('Nenhum membro encontrado para esta busca.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

  expect(screen.getByLabelText(/Buscar/i)).toHaveValue('');
  expect(screen.getByLabelText(/Papel/i)).toHaveValue('todos');
  await waitFor(() => {
    expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
      role: undefined,
      limit: 100,
    });
  });
  expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
});

it('mostra a contagem no singular', async () => {
  renderPage();
  await screen.findByText('Ana Souza');
  expect(screen.getByText('3 membros')).toBeInTheDocument();

  setupList([makeMember({ id: 1, name: 'Ana Souza' })]);
  fireEvent.change(screen.getByLabelText(/Papel/i), { target: { value: 'voluntario' } });

  expect(await screen.findByText('1 membro')).toBeInTheDocument();
});

it('liga nome e ação Ver à ficha apenas quando há id', async () => {
  renderPage();
  await screen.findByText('Ana Souza');

  expect(screen.getByRole('link', { name: 'Ana Souza' })).toHaveAttribute(
    'href',
    '/painel/membros/1',
  );

  const anaRow = (await screen.findByText('Ana Souza')).closest('tr') as HTMLElement;
  expect(within(anaRow).getByRole('link', { name: 'Ver' })).toHaveAttribute(
    'href',
    '/painel/membros/1',
  );
  expect(within(anaRow).getByRole('link', { name: 'Editar' })).toHaveAttribute(
    'href',
    '/painel/membros/1/editar',
  );

  const carlaRow = (await screen.findByText('Carla Mendes')).closest('tr') as HTMLElement;
  expect(within(carlaRow).queryByRole('link', { name: 'Ver' })).not.toBeInTheDocument();
  expect(within(carlaRow).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
  expect(within(carlaRow).queryByRole('link', { name: 'Carla Mendes' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MembersAdminPage.test.tsx --reporter=dot`

Expected: FAIL — não existe campo Buscar, contagem, links nem os novos textos.

- [ ] **Step 3: Implementar busca, contagem, estados e links**

Em `MembersAdminPage.tsx` (adicionar o import de `TextField` de `../../../shared/components/TextField`):

1. Adicionar estado `const [search, setSearch] = useState('');`.
2. Adicionar a função local:

```ts
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
```

3. Calcular:

```ts
const term = normalizeText(search);
const visibleMembers = term
  ? members.filter((member) =>
      [member.name, member.email ?? ''].some((value) =>
        normalizeText(value).includes(term),
      ),
    )
  : members;
const hasFilters = role !== 'todos' || term !== '';
const countLabel = term
  ? `${visibleMembers.length} de ${members.length} ${members.length === 1 ? 'membro' : 'membros'}`
  : `${members.length} ${members.length === 1 ? 'membro' : 'membros'}`;
const clearFilters = () => {
  setSearch('');
  setRole('todos');
};
```

4. Trocar o grid de filtros por dois campos lado a lado:

```tsx
<div className="mb-4 grid gap-4 sm:max-w-2xl sm:grid-cols-2">
  <TextField
    id="members-search"
    label="Buscar"
    type="search"
    placeholder="Nome ou e-mail"
    value={search}
    onChange={setSearch}
  />
  <SelectField
    id="members-role"
    label="Papel"
    value={role}
    onChange={(value) => setRole(value as RoleFilter)}
    options={FILTER_OPTIONS}
  />
</div>
<p aria-live="polite" className="mb-4 text-sm text-staff-muted">
  {countLabel}
</p>
```

5. Estados, nesta ordem:
   - `loading` → `EmptyState` atual;
   - `members.length === 0 && !hasFilters` → `EmptyState` com `<p>Nenhum membro cadastrado ainda.</p>` e link **Cadastrar membro** para `/painel/membros/novo` com o estilo secundário (`border border-staff-line bg-staff-surface`, `min-h-11`);
   - `visibleMembers.length === 0` → `EmptyState` com o texto `Nenhum membro encontrado para esta busca.` quando `term !== ''`, ou `Nenhum membro encontrado com este papel.` quando só o papel filtra; botão **Limpar filtros** (`type="button"`, `onClick={clearFilters}`, estilo secundário);
   - senão, a tabela com `visibleMembers`.

6. Na célula do nome: se `member.id !== null`, renderizar `<Link to={`/painel/membros/${member.id}`} className="font-semibold text-staff-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent">{member.name}</Link>`; senão, manter `<span className="font-semibold text-staff-ink">`.

7. Na coluna de ações, antes de **Editar**, adicionar **Ver** com destino `/painel/membros/${member.id}` e o mesmo estilo secundário de Editar, somente quando `member.id !== null`.

Manter a `Table` e sua região rolável exatamente como estão.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MembersAdminPage.test.tsx --reporter=dot`

Expected: PASS (14 testes).

- [ ] **Step 5: Commit**

```bash
git add src/features/staff/pages/MembersAdminPage.tsx src/features/staff/pages/MembersAdminPage.test.tsx
git commit -m "feat(staff): adiciona busca e ficha na lista de membros"
```

---

### Task 4: Link "Ver ficha" no formulário de edição

**Files:**
- Modify: `src/features/staff/pages/MemberFormPage.tsx:309-323`
- Test: `src/features/staff/pages/MemberFormPage.test.tsx`

**Interfaces:**
- Consumes: `isEdit`, `memberId` já existentes no formulário.
- Produces: link **Ver ficha** para `/painel/membros/${memberId}` apenas quando `isEdit`.

- [ ] **Step 1: Adicionar os testes que falham**

No teste "renderiza todos os campos e o cabeçalho no modo novo, com e-mail presente", adicionar:

```tsx
expect(screen.queryByRole('link', { name: 'Ver ficha' })).not.toBeInTheDocument();
```

No teste "renderiza o cabeçalho e a senha nova no modo edição, sem e-mail", adicionar após `await screen.findByLabelText(/Nome completo/i);`:

```tsx
expect(screen.getByRole('link', { name: 'Ver ficha' })).toHaveAttribute(
  'href',
  '/painel/membros/5',
);
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MemberFormPage.test.tsx --reporter=dot`

Expected: FAIL — o link ainda não existe.

- [ ] **Step 3: Implementar o link**

No bloco de ações do formulário (`flex flex-wrap gap-3 border-t border-staff-line pt-4`), entre **Salvar** e **Cancelar**, adicionar:

```tsx
{isEdit && (
  <Link
    to={`/painel/membros/${memberId}`}
    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
  >
    Ver ficha
  </Link>
)}
```

Não alterar o destino do **Cancelar** nem o `navigate('/painel/membros')` após salvar.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `node node_modules/vitest/vitest.mjs run src/features/staff/pages/MemberFormPage.test.tsx --reporter=dot`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/staff/pages/MemberFormPage.tsx src/features/staff/pages/MemberFormPage.test.tsx
git commit -m "feat(staff): liga formulário de membro à ficha"
```

---

### Task 5: Verificação completa e QA com Playwright

**Files:**
- Nenhum arquivo previsto; corrigir apenas se o QA revelar defeito (com teste primeiro e commit `fix(staff): ...`).

**Interfaces:**
- Consumes: API local em `C:\Users\gabri\OneDrive\Área de Trabalho\Code\TempDB`, credenciais de seed do `.env` (`admin@peludinhos.com.br` / `Admin#Peludinhos2026`), frontend em `http://localhost:5173`.
- Produces: evidência de lista, busca, ficha, edição e criação em 1280/768/360; suíte, lint e build verdes.

- [ ] **Step 1: Rodar a suíte completa, lint e build**

```powershell
node node_modules/vitest/vitest.mjs run --reporter=dot
bun run lint
bun run build
```

Expected: suíte com exit 0 e todos os testes passando; lint sem erros; build concluído. Se `bun run test` for usado por engano, ignorar o exit 1 espúrio e confirmar pelo comando com `node`.

- [ ] **Step 2: Subir a API local**

No diretório `C:\Users\gabri\OneDrive\Área de Trabalho\Code\TempDB`, em background:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verificar:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing
```

Expected: resposta 200.

- [ ] **Step 3: Subir o frontend**

Na raiz do projeto, em background: `bun run dev -- --port 5173`. Verificar `http://localhost:5173`.

- [ ] **Step 4: Abrir o Playwright e autenticar**

Usar o `.cmd` por causa da Execution Policy do PowerShell:

```powershell
& "$env:APPDATA\npm\playwright-cli.cmd" open http://localhost:5173/painel/membros
& "$env:APPDATA\npm\playwright-cli.cmd" snapshot
```

Preencher e-mail e senha pelos refs do snapshot, enviar o login e confirmar que a lista de membros abriu. Se o login não voltar para `/painel/membros`, navegar de novo para essa rota.

- [ ] **Step 5: QA em 1280**

1. `resize 1280 900`; snapshot da lista.
2. Buscar por `ana`: conferir que a tabela filtra e a contagem mostra `N de M membros`.
3. Buscar por e-mail parcial e por um termo sem resultado; conferir o estado vazio e **Limpar filtros**.
4. Clicar no nome de um membro: conferir ficha (dados pessoais, vínculo, `—` quando vazio), **Editar** e **Voltar**.
5. Abrir **Editar**, conferir **Ver ficha**, salvar sem alterações e confirmar o retorno à lista.
6. Abrir `/painel/membros/999` e `/painel/membros/abc`: conferir "Não encontramos este membro." e o Voltar.
7. Criar um membro de teste em `/painel/membros/novo` (`QA S04`, e-mail único `qa.s04.<timestamp>@peludinhos.com.br`, papel `Voluntário`, senha com 8+ caracteres). Confirmar que ele aparece na lista e que a ficha abre.
8. Conferir `document.documentElement.scrollWidth <= document.documentElement.clientWidth` e que a região da tabela continua rolável.

- [ ] **Step 6: QA em 768 e 360**

`resize 768 900` e `resize 360 800`, repetindo lista, busca, ficha e formulário. Em 360, conferir que busca e papel empilham, que a ficha fica em uma coluna e que a página não ganha overflow horizontal (a tabela pode rolar dentro da própria região). Salvar screenshots de lista, ficha e formulário.

- [ ] **Step 7: Conferir console e fechar**

```powershell
& "$env:APPDATA\npm\playwright-cli.cmd" console
& "$env:APPDATA\npm\playwright-cli.cmd" close
```

Expected: nenhum erro de console. Encerrar API e frontend ao final.

- [ ] **Step 8: Registrar o resultado**

Se tudo passou, não há commit novo. Se algo falhou, escrever o teste que reproduz, corrigir e commitar com `fix(staff): ...`. Relatar no chat: comandos executados, resoluções testadas, telas verificadas e qualquer dado de QA criado.
