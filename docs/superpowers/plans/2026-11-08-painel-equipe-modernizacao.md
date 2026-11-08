# Renovação Visual do Painel da Equipe — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renovar o visual do painel da equipe (`/painel`), mantendo rotas, lógica, API, papéis e textos, aplicando o mesmo padrão técnico da home modernizada (Tailwind v4, `src/shared/ui`, tokens `@theme`, AA, motion respeitoso).

**Architecture:** Casca primeiro (`StaffLayout` + topbar + sidebar), depois cada página adota a moldura e os primitivos `src/shared/ui`; `staff.css` é retirado ao fim da migração. Tokens novos em `@theme` (`--color-staff-*`). Tabelas permanecem para Animais/Membros; intenções permanecem em cards.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind v4, shadcn/ui, Vitest + Testing Library, Playwright CLI (QA visual).

**Spec:** `docs/superpowers/specs/2026-11-08-painel-equipe-modernizacao-design.md`

## Global Constraints

- Paleta exata (rebrand do painel, "cinza quente da casa"): fundo `#FAF7F4`, superfície `#FFFFFF`, linha `#E4D8D0`, tinta `#2B2927`, tinta suave `#6B5B52`, tinta leve `#A8978B`, acento `#C97638`, acento-soft `#F6DCC8`, sucesso discreto `#7BAE7F`, perigo `#B3261E`. Sem gradientes; sombras no máximo sutis.
- Tipografia: **Source Sans 3** (400/600/700) em todo o painel. Averia Libre só na marca. Não introduzir outra família.
- **Só visual**: nenhuma mudança em contratos de API, hooks, regras por papel, textos ou fluxos (`window.confirm` no falecimento, etc.). Nenhum redesenho de `/login`, home ou páginas públicas.
- Tokens do painel expostos a Tailwind/shadcn via `@theme`. Classes `staff-*` desaparecem ao fim da Task 10 (zero referências no build).
- Respeitar `prefers-reduced-motion: reduce` em todo movimento; nunca animar `transform` de forma a anular rotações de utilidades Tailwind.
- Copy em português do Brasil, sentence case, voz ativa.
- Gerenciador: `bun` (npm bloqueado). Comandos: `bun install`, `bun run build`, `bun run lint`, `bun run test`.
- 21st.dev: zero recuperação de código gerado; usar apenas como referência de design.
- Dados mockados só para QA manual; nenhum fixture é commitado. A API local está offline; usar `VITE_API_URL=/api` + fixture em `public/api/` apenas para screenshots, removidos antes do commit final.
- Não instalar biblioteca de animação (framer-motion/GSAP).
- Dependência de base: este plano assume a home modernizada já integrada. Criar branch `feat/painel-modernizacao` a partir de `feat/home-modernizacao` (HEAD atual `c90f235`, incluindo o spec). Se a home já estiver mesclada em `main`, criar o branch a partir de `main`.

## Review Focus

1. **Membros só para admin:** sidebar e rotas; um bolsista/coordenador não pode ver nem acessar `/painel/membros*`. Testes nas Tasks 3, 7 e 9.
2. **Falecimento irreversível:** `window.confirm` e `actionError` permanecem; o reskin não pode degradar a confirmação nem esconder o estado de progresso. Testes nas Tasks 5 e 9.
3. **Complexidade visual:** tabela com 200 linhas (`limit: 200`) não pode criar overflow nem dispensar scroll-x acessível. Testes nas Tasks 5 e 6; QA em Task 10.
4. **Teclado e movimento reduzido:** sidebar navegável e com foco visível; off-canvas no mobile com estado/aria corretos; marquee/animações respeitam reduce. Verificação na Task 10.
5. **Identidade coerente, não cópia:** indistinguível da home no “tom”, mas com acento `#C97638` medido (quase nenhum uso pleno de laranja de texto); nenhum `#E08A4E` como texto sobre superfícies claras.
6. **Classes legadas zeradas:** nenhuma chamada `staff-*` / `page-head` / `btn` / `panel` / `data-table` / `intent-card` permanece; erro de leftover é sinal de migração incompleta. Verificação na Task 10.

---

## Setup (executar antes da Task 1, sem checkbox de tarefa)

- [ ] **Confirmar worktree limpo e criar branch**

Run:
```bash
git status --short
git switch -c feat/painel-modernizacao
```
Expected: working tree limpo (ou só `.superpowers/`), branch criado a partir de HEAD.

- [ ] **Registrar o BASE**

Run: `git rev-parse --short HEAD`
Expected: hash anotado (será o `MERGE_BASE` da revisão final).

---

### Task 1: Fundação de tokens do painel em `@theme`

**Files:**
- Modify: `src/index.css` (bloco `@theme` e, se existir, `@layer base` de tokens)
- Create: `src/index.css` — seção comentada nova `staff tokens`

**Interfaces:**
- Produces: classes Tailwind `bg-staff-bg`, `bg-staff-surface`, `text-staff-ink`, `text-staff-muted`, `text-staff-faint`, `border-staff-line`, `bg-staff-accent`, `text-staff-accent`, `bg-staff-accent-soft`, `text-staff-success`, `text-staff-danger`. Fonte: `font-body` já existente (Source Sans 3) — não duplicar.

- [ ] **Step 1: Adicionar tokens**

Em `src/index.css`, no `@theme`, adicionar (sem remover notices existentes):

```css
--color-staff-bg: #FAF7F4;
--color-staff-surface: #FFFFFF;
--color-staff-line: #E4D8D0;
--color-staff-ink: #2B2927;
--color-staff-muted: #6B5B52;
--color-staff-faint: #A8978B;
--color-staff-accent: #C97638;
--color-staff-accent-soft: #F6DCC8;
--color-staff-success: #7BAE7F;
--color-staff-danger: #B3261E;
```

- [ ] **Step 2: Smoke test de tokens**

Adicionar um teste que renderiza um `<div className="bg-staff-bg text-staff-ink border-staff-line">` e verifica apenas que o elemento monta sem erro (a assertiva real é CSS compilado, verificada no QA/Build). Rodar conjunto completo, deve passar.

- [ ] **Step 3: Commitar** `feat(staff): adiciona tokens do painel`

---

### Task 2: Tabela primitiva (`shared/ui/table.tsx`)

**Files:**
- Create: `src/shared/ui/table.tsx`, `src/shared/ui/table.test.tsx`
- Modify: `components.json` (verificar aliases; não são necessários)

**Interfaces:**
- Produces: `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`, `<TableCaption>` — com `className` mesclado via `cn`; `<TableHead>` usa `scope="col"`; sobre linhas hover com `var(--color-staff-bg)`.

- [ ] Step 1: escrever `table.test.tsx` (renderiza 2 colunas, verifica `role="table"`, `columnheader` com nome, `rowgroup` visível, foco via tabindex" se o cabeçalho for clicável — não é o caso; scope col verificado).
- [ ] Step 2: implementar a primitiva copiando o shadcn `table` e ajustando para `text-staff-*`.
- [ ] Step 3: `bun run test` deve passar.
- [ ] Step 4: commit `feat(ui): adiciona primitiva Table`

---

### Task 3: Casca nova (`StaffLayout`) — topbar + sidebar acessível

**Files:**
- Modify: `src/features/staff/components/StaffLayout.tsx` (reescrever; mesmo caminho)
- Create: `src/features/staff/components/StaffLayout.test.tsx`
- Modify: `src/features/staff/staff.css` (remover só o bloco `.staff-*`; manter por ora os helpers `btn`/`panel` para as páginas ainda não migradas — marcados com comentário `--LEGADO, remover na Task 10`)
- Modify: `src/index.css` ou novo `src/features/staff/staff.css` substituído por classes Tailwind inline

**Interfaces:**
- Produces: shell com `staff-topbar` branco (`bg-staff-surface border-b border-staff-line`, sticky), marca + tag "Painel"; direita: primeiro nome do membro, pill de papel, botão **Sair**.
- Produces: sidebar fixa (~220px, `bg-staff-surface`, borda direita) com dois grupos (`Geral` → Visão geral, Animais, Intenções; `Equipe` → Membros, só se `isAdmin(user?.role)`); item ativo `bg-staff-accent-soft text-staff-accent`; ícones da `lucide-react`; `aria-current="page"`.
- Produces: mobile (`< lg`): topbar ganha botão hambúrguer `aria-expanded`, sidebar vira off-canvas (translate-x + overlay) ou colapsa dentro do topbar; estado local `menuOpen`.
- Consumes: `useAuth()`, `isAdmin`, `roleLabel`; `NavLink`.

- [ ] **Step 1: Teste no fluxo** renderiza `<StaffLayout/>` com `AuthContext` mockado (admin e bolsista): verifica marca, "Painel", nome do usuário, role label, nav com itens e — só para admin — “Membros”; `aria-current="page"` no item corrente; botão Sair dispara `logout`.
- [ ] **Step 2: Implementar** a casca com classes Tailwind; reduzir `staff.css` apenas ao legado comentado.
- [ ] **Step 3: Rodar o conjunto completo**; deve passar (nenhuma página foi migrada ainda).
- [ ] **Step 4: Commit** `feat(staff): reconstrói a casca do painel`

---

### Task 4: Componentes compartilhados do painel (`PageHead`, `StatCard`, `Panel`, `EmptyState`, `Alert`)

**Files:**
- Create: `src/features/staff/components/PageHead.tsx`, `StatCard.tsx`, `Panel.tsx`, `EmptyState.tsx`, `Alert.tsx` + respectivos testes
- Modify: nenhum (não usados ainda pelas páginas)

**Interfaces:**
- `PageHead: { title: string; subtitle?: string; actions?: ReactNode }`
- `StatCard: { to: string; label: string; value: ReactNode; icon?: ReactNode }` → link de card inteiro, `rounded-xl border border-staff-line bg-staff-surface hover:border-staff-faint`, valor em peso 700, label `text-staff-muted`.
- `Panel: { children, className? }` — caixa `bg-staff-surface border border-staff-line rounded-home p-5`.
- `EmptyState: { children }` — `role="status"`, texto muted.
- `Alert: { variant?: 'info'|'danger'; role='alert'; children }` — borda esquerda sólida e caixa; `danger` só para destrutivos/erros.
- Todos com `cn` e Tailwind; nada de helpers legados.

- [ ] Step 1: escrever testes de markup (pt-BR heading hierarchy, links contêm `to`).
- [ ] Step 2: implementar os cinco componentes.
- [ ] Step 3: `bun run test` verde.
- [ ] Step 4: commit `feat(staff): adiciona componentes compartilhados`

---

### Task 5: Página Visão geral (`DashboardPage`) migrada

**Files:**
- Modify: `src/features/staff/pages/DashboardPage.tsx`
- Modify: `src/features/staff/pages/DashboardPage.test.tsx` (criar se não existir; hoje não há)
- Modify: `src/features/staff/staff.css` (remover o bloco correspondente)

**Interfaces:**
- Produces: `PageHead` com saudação e CTAs; três `StatCard` (Animais, Intenções pendentes, Membros admin-only); painel de ações rápidas; `Alert` no erro com mensagem idêntica à atual; skeleton/`…` igual ao atual.
- Lógica (`useAsyncData`, contadores) permanece byte a byte.

- [ ] Step 1: escrever teste (mock do hook de auth + `useAsyncData` ou componente com dados falsos) cobrindo: saudação; três cards com valores; membros só para admin; botão Novo animal só admin; erro mostra alerta com texto atual.
- [ ] Step 2: implementar a migração.
- [ ] Step 3: `bun run test` e o teste da Task 3 verde.
- [ ] Step 4: commit `feat(staff): migra a visão geral`

---

### Task 6: Página Animais (lista) migrada — tabela com scroll acessível

**Files:**
- Modify: `src/features/staff/pages/AnimalsAdminPage.tsx`
- Modify: `src/features/staff/pages/AnimalsAdminPage.test.tsx` (criar se não existir)
- Test: `src/features/staff/components/…test.tsx` se surgirem componentes extraídos

**Interfaces:**
- Produces: `filter-bar` substituído por grid Tailwind (`grid gap-4 sm:grid-cols-[1fr_auto]`); `Table` da Task 2; badge de status mapeado pelos tons de `utils/badges.ts` (animaliais: `disponivel` verde, `em_processo` laranja, `adotado` cinza/cinza-100, `indisponivel` vermelho); ação "Registrar falecimento" mantém `window.confirm` e `actionError`; `data-table__scroll` wrapper com `overflow-x:auto` e `tabindex="0"` + `aria-label`.

- [ ] Step 1: teste — busca filtra por nome; filtro de status; contador; vazio mostra estado vazio; "Registrar falecimento" chama `window.confirm` (mockado) e só depois o serviço; `role="table"`, nomes das colunas visíveis.
- [ ] Step 2: implementar a migração; remover classes `staff-*` do markup migrado.
- [ ] Step 3: `bun run test` verde.
- [ ] Step 4: commit `feat(staff): migra a listagem de animais`

---

### Task 7: Página Membros (lista) migrada

Mesma técnica da Task 6: `Table`, colunas Nome/E-mail/Papel/Matrícula/Entrada/Dias de alimentação/ações; papel como selo neutro; ação Editar só quando `member.id !== null`; admin-only rota respeitada (a página é protegida por rota, mas o conteúdo não pode vazair — manter). Testes equivalentes + limite de presença só para admin.

- [ ] Step 1-4: mesmo padrão (teste → migração → suite verde → commit `feat(staff): migra a listagem de membros`).

---

### Task 8: Página Intenções migrada — cards e ações de avaliação

Mesma técnica com `IntentCard` reskinado em `staff.css` ou componentes locais: borda sutil, mte-card-head (nome + badge de status), meta, motivação, botões **Aprovar**/**Rejeitar** (primary-disabled com `busyId`) apenas para status `pendente`; `Alert` para `actionError`; filtro por status no select reskinado. Testes: lista, pendente mostra duas ações, após aprovar/rejeitar chama serviço, erro mostra alerta.

- [ ] Step 1-4: teste → migração → suite verde → commit `feat(staff): migra a avaliação de intenções`

---

### Task 9: Formulário de animal migrado

Mesma técnica sobre `AnimalFormPage` (285 linhas): manter `AnimalPhotoInput` e escopos; campos com Tailwind (grid 2 colunas onde já havia seção), botões primários com `Button`; errors permanecem inline sob `TextField`; foco no primeiro erro após submit 404/500? (não existe hoje; manter). Testes: render de todos os campos, submit chama serviço com payload, nome obrigatório (verificação de estado), modo edição popula campos. Toasts ou mensagens inline preservados.

- [ ] Step 1-4: teste → migração → suite verde → commit `feat(staff): migra o formulário de animal`

---

### Task 10: Formulário de membro migrado

Mesma técnica sobre `MemberFormPage` (293 linhas); form com campos `name/email/password/role/cpf/…`, formatação de CPF existente mantida; botões e layout usando a casca migrada. Testes: campos renderizados, validação de CPF bloqueia submit, payload correto, modo edição `:id` pré-preenche.

- [ ] Step 1-4: teste → migração → suite verde → commit `feat(staff): migra o formulário de membro`

---

### Task 11: Retirada total do CSS legado e QA final

**Files:**
- Delete: `src/features/staff/staff.css`
- Modify: arquivos que ainda referenciem `staff.css`/classes legadas (`git grep -n "staff-*\|page-head\|stat-card\|data-table\|btn" src`) — zero saídas.

- [ ] **Step 1: Garantia zero de referências** — rodar `git grep`; todas devem sumir (formulários migrados, casca migrada, dashboard migrado).
- [ ] **Step 2: Remover o arquivo** `staff.css` e os imports remanescentes.
- [ ] **Step 3: `bun run lint`, `bun run test`, `bun run build`** — saída limpa.
- [ ] **Step 4: QA no navegador** com fixture temporário em `public/api/` (removidos ao fim), 1280/768/360: casca, sidebar, off-canvas, foco visível sobre fundo claro, CTA "Novo animal", tabela sem overflow; reduced motion; screenshots em `.superpowers/sdd/` — não commitar.
- [ ] **Step 5: Commit final** `fix(staff): retira CSS legado e fecha QA`

---

### Task 12: Revisão final do branch

- Gerar review package e despachar revisor de todo o branch (`e897e38..HEAD` via merge-base com `main`), com `.progress.md` contendo minors diferidos.
- Uma onda de correção + revisão focada; adjudicar resíduos como no fluxo de home.
- `finishing-a-development-branch` ao final.
