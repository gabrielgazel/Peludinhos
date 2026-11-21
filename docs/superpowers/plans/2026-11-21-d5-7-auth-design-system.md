# D5.7 — Migrar telas de autenticação para o design system — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer Login, Recuperar senha e Redefinir senha usarem o mesmo design system da home e do painel, sem alterar nenhum comportamento ou mensagem.

**Architecture:** Reescrita direta das três páginas com `Card`/`Button` de `src/shared/ui`, campos `.tf*` de `form-controls.css` e utilitários Tailwind dos tokens `paper`/`ink`/`marker`/`card`/`line`. Nenhum `AuthShell` novo; a lógica de `handleSubmit`, token, navegação e mensagens permanece a mesma. `Login.css` sai quando a última importação for removida.

**Tech Stack:** React + TypeScript, Tailwind CSS v4, componentes shadcn/ui (`Button`, `Card`), Vitest + Testing Library, Playwright CLI para QA visual.

**Spec:** `docs/superpowers/specs/2026-11-21-d5-7-auth-design-system-design.md`

## Global Constraints

- Worktree: `C:/Users/gabri/.local/share/opencode/worktree/6a3308/s04-crud-voluntarios`, branch `feat/s05-operacao`. Não mexer no checkout principal em `main`.
- “Não mudar rotas, contrato de API, serviços de autenticação nem mensagens.”
- “Não criar novo componente abstrato (`AuthShell`) — decisão 1 abaixo.”
- “Não mexer em migrations, seed ou no backend TempDB.”
- “Não mover as tags `v0.5-demo` / `v0.5.1`.”
- “Não alterar outras páginas além das três de autenticação.”
- “`Login.css` é importado pelas três páginas; sai junto com a migração.” Não criar CSS novo de página.
- “Documentação e mensagens em português; commit convencional; TDD antes do código.”
- Verificação obrigatória no worktree: `vitest run`, `tsc -b`, `eslint`, `build` e inspeção visual em 360/768/1280.
- A tarefa é “opcional e descartável”: qualquer atraso deve levar ao rollback, nunca a uma mudança funcional.

## Review Focus

- **Token de recuperação ausente/inválido:** o formulário não pode aparecer; devem restar o alerta exato e o link “Solicitar novo link”. Pinado em Task 3 (teste existente + asserção de `data-slot`).
- **Erro HTTP na recuperação:** a mensagem da API deve aparecer e a resposta neutra não pode aparecer junto. Pinado em Task 2 (teste existente `mostra a mensagem da API em caso de erro`).
- **Estados de carregamento:** “Entrando...”, “Enviando...” e “Salvando...” com botão desabilitado; o clique não pode duplicar a requisição. Pinado em Tasks 1, 2 e 3.
- **Alternância de visibilidade da senha:** os botões “Mostrar/Ocultar”, “Mostrar senha/Ocultar senha” e “Mostrar confirmação/Ocultar confirmação” devem alternar `type` sem perder o rótulo acessível. Pinado em Tasks 1 e 3.
- **360/768/1280 px:** sem overflow horizontal, alvos de toque ≥ 44 px e contraste legível no cabeçalho `bg-marker`. Pinado em Task 4.

---

### Task 1: LoginPage — proteger comportamento e migrar

**Files:**
- Modify: `src/features/auth/pages/LoginPage.test.tsx`
- Modify: `src/features/auth/pages/LoginPage.tsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ user, login }`; `login({ email, password })`; `HttpError`; `PawIcon`; `Button`; `Card`, `CardHeader`, `CardTitle`, `CardContent`.
- Produces: `LoginPage()` com a mesma assinatura, mesma navegação por `location.state.from` / `user.role`, mesmo `state.passwordReset` e mesmas mensagens.

- [ ] **Step 1: Escrever os testes de comportamento e de design system em `LoginPage.test.tsx`**

Substitua os imports e o helper por:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import type { AuthUser } from '../types/auth.types';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from './LoginPage';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

const user: AuthUser = {
  id: 'user-1',
  email: 'ana@peludinhos.org',
  name: 'Ana Souza',
  actorType: 'membro',
  role: 'voluntario',
  memberId: 5,
  visitorId: null,
};

function renderAt(
  entry: string | { pathname: string; state?: unknown },
  login = vi.fn().mockResolvedValue(user),
) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    login,
  } as unknown as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home pública</div>} />
        <Route path="/painel" element={<div>Painel da equipe</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitCredentials() {
  fireEvent.change(screen.getByLabelText('E-mail ou usuário'), {
    target: { value: 'ana@peludinhos.org' },
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'segredo123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}
```

Mantenha os dois testes existentes e acrescente:

```tsx
it('envia credenciais e vai para o painel por padrão', async () => {
  const login = vi.fn().mockResolvedValue(user);
  renderAt('/login', login);

  await submitCredentials();

  expect(login).toHaveBeenCalledWith({
    email: 'ana@peludinhos.org',
    password: 'segredo123',
  });
  expect(await screen.findByText('Painel da equipe')).toBeInTheDocument();
});

it.each([401, 422])('mostra erro de credenciais para HTTP %i', async (status) => {
  renderAt('/login', vi.fn().mockRejectedValue(new HttpError(status, 'x', null)));

  await submitCredentials();

  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
});

it('mostra erro de e-mail não confirmado para HTTP 403', async () => {
  renderAt('/login', vi.fn().mockRejectedValue(new HttpError(403, 'x', null)));

  await submitCredentials();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'E-mail ainda não confirmado. Fale com a equipe.',
  );
});

it('mostra erro genérico para outras falhas', async () => {
  renderAt('/login', vi.fn().mockRejectedValue(new Error('boom')));

  await submitCredentials();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível entrar agora. Tenta de novo em instantes.',
  );
});

it('desabilita o botão e avisa que está entrando', async () => {
  let finish!: (value: AuthUser) => void;
  const login = vi.fn().mockReturnValue(
    new Promise<AuthUser>((resolve) => {
      finish = resolve;
    }),
  );
  renderAt('/login', login);

  await submitCredentials();

  const button = screen.getByRole('button', { name: /Entrando/i });
  expect(button).toBeDisabled();
  expect(login).toHaveBeenCalledTimes(1);

  finish(user);
  expect(await screen.findByText('Painel da equipe')).toBeInTheDocument();
});

it('alterna a visibilidade da senha', () => {
  renderAt('/login');
  const password = screen.getByLabelText('Senha');

  expect(password).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
  expect(password).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
  expect(password).toHaveAttribute('type', 'password');
});

it('usa o design system no cartão, campos e botões', () => {
  renderAt('/login');

  const heading = screen.getByRole('heading', { name: /Acesso\s+da equipe/i });
  expect(heading.closest('[data-slot="card"]')).toBeInTheDocument();
  expect(heading.closest('[data-slot="card-header"]')).toHaveClass('bg-marker');
  expect(screen.getByLabelText('E-mail ou usuário')).toHaveClass('tf__input');
  expect(screen.getByLabelText('Senha')).toHaveClass('tf__input');
  expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute(
    'data-variant',
    'link',
  );
  expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute(
    'data-slot',
    'button',
  );
  expect(screen.getByRole('link', { name: /Esqueci minha senha/i })).toHaveAttribute(
    'data-slot',
    'button',
  );
});
```

- [ ] **Step 2: Rodar o arquivo e confirme que só as asserções de design falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/auth/pages/LoginPage.test.tsx`

Expected: FAIL em `usa o design system no cartão, campos e botões` (não há `data-slot="card"`, `bg-marker`, `tf__input` nem `data-variant="link"` na marcação antiga). Os testes de comportamento devem PASSAR.

- [ ] **Step 3: Reescrever a marcação de `LoginPage.tsx` sem tocar na lógica**

Remova `import './Login.css'` e importe `Button` de `../../../shared/ui/button` e `Card`, `CardHeader`, `CardTitle`, `CardContent` de `../../../shared/ui/card`. Mantenha `handleSubmit`, estados, `LocationState` e todos os textos exatamente como estão. Substitua só o `return`, aplicando decisões fixas:

- Invólucro: `<main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">`.
- Cartão: `<Card className="w-full max-w-md gap-0 overflow-hidden py-0">`.
- Cabeçalho: `<CardHeader className="flex flex-col items-center gap-4 bg-marker px-6 py-8 text-center text-ink">` com `<PawIcon size={28} />` + `<span>Peludinhos</span>` em `font-display text-sm font-bold uppercase tracking-[0.08em]`, e `<CardTitle className="text-3xl leading-tight font-normal text-ink">` com `Acesso<br />da equipe`.
- Corpo: `<CardContent className="flex flex-col gap-5 px-6 py-8">` com `<form className="flex flex-col gap-5" onSubmit={handleSubmit}>`.
- Status de redefinição: `<p role="status" className="rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink">` com o texto exato existente.
- Campos: cada um em `<div className="tf">` com `<label className="tf__label">` e `<input className="tf__input">`; a senha usa `tf__input pr-24` dentro de `<div className="relative">`.
- Toggle: `<Button type="button" variant="link" size="sm" className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 px-2 text-xs text-ink hover:text-ink">` com `Mostrar`/`Ocultar`.
- Link “Esqueci minha senha”: `<Button asChild variant="link" className="self-center text-ink"><Link to="/recuperar-senha">…</Link></Button>`.
- Erro: `<p role="alert" className="rounded-xl bg-[#F6E1DA] px-4 py-3 text-sm font-bold text-[#7A2E20]">{error}</p>`.
- Envio: `<Button type="submit" className="w-full" disabled={loading}>` com `Entrar` ou, quando carregando, `<span className="flex items-center gap-2">` + `<span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />` + `Entrando...`.
- Nota final: `<p className="text-center text-xs leading-relaxed text-muted">` com as duas linhas atuais separadas por `<br />`.

- [ ] **Step 4: Rodar o arquivo e confirme que passou**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/auth/pages/LoginPage.test.tsx`

Expected: PASS — 10 testes.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/pages/LoginPage.test.tsx src/features/auth/pages/LoginPage.tsx
git commit -m "refactor: migra login para o design system"
```

---

### Task 2: ForgotPasswordPage — proteger comportamento e migrar

**Files:**
- Modify: `src/features/auth/pages/ForgotPasswordPage.test.tsx`
- Modify: `src/features/auth/pages/ForgotPasswordPage.tsx`

**Interfaces:**
- Consumes: `authService.recover(email)`; `HttpError`; `PawIcon`; `Button`; `Card`, `CardHeader`, `CardTitle`, `CardContent`.
- Produces: `ForgotPasswordPage()` com os mesmos estados `email`/`loading`/`error`/`sent` e as mesmas mensagens.

- [ ] **Step 1: Acrescentar asserções de design system e de retorno ao login em `ForgotPasswordPage.test.tsx`**

Adicione ao final do `describe`:

```tsx
it('usa o design system no cartão, campo e botões', () => {
  renderPage();

  const heading = screen.getByRole('heading', { name: /recuperar senha/i });
  expect(heading.closest('[data-slot="card"]')).toBeInTheDocument();
  expect(heading.closest('[data-slot="card-header"]')).toHaveClass('bg-marker');
  expect(screen.getByLabelText('E-mail')).toHaveClass('tf__input');
  expect(screen.getByRole('button', { name: /Enviar instruções/i })).toHaveAttribute(
    'data-slot',
    'button',
  );
  expect(screen.getByRole('link', { name: /Voltar para o login/i })).toHaveAttribute(
    'data-slot',
    'button',
  );
});

it('mantém o retorno ao login como botão após o envio', async () => {
  renderPage();
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'ana@peludinhos.org' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));

  const link = await screen.findByRole('link', { name: /Voltar para o login/i });
  expect(link).toHaveAttribute('data-slot', 'button');
  expect(link).toHaveAttribute('href', '/login');
});
```

- [ ] **Step 2: Rodar o arquivo e confirme que as duas asserções novas falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/auth/pages/ForgotPasswordPage.test.tsx`

Expected: FAIL em `usa o design system...` e `mantém o retorno ao login como botão...`; os quatro testes existentes PASSAM.

- [ ] **Step 3: Reescrever a marcação de `ForgotPasswordPage.tsx` sem tocar na lógica**

Remova `import './Login.css'` e importe `Button` e os quatro componentes de `Card`. Mantenha `SUCCESS_MESSAGE`, `FALLBACK_ERROR`, `errorMessage()` e `handleSubmit` intactos. Use exatamente o invólucro, o cartão, o cabeçalho e o `CardContent` da Task 1, trocando só o título para `<CardTitle>Recuperar senha</CardTitle>`. Dentro do `CardContent`:

- Ramo `sent`: `<div className="flex flex-col gap-5">` com o status no mesmo padrão de `role="status"` da Task 1 (`{SUCCESS_MESSAGE}`), a dica em `<p className="text-sm leading-relaxed text-muted">` com o texto atual, e `<Button asChild className="w-full"><Link to="/login">Voltar para o login</Link></Button>`.
- Ramo do formulário: `<form className="flex flex-col gap-5" onSubmit={handleSubmit}>` com a intro em `<p className="text-sm leading-relaxed text-muted">`, o campo `recovery-email` em `<div className="tf">` com `label.tf__label` + `input.tf__input` (`type="email"`, `autoComplete="email"`, placeholder atual, `required`), o erro no mesmo padrão de `role="alert"` da Task 1, `<Button type="submit" className="w-full" disabled={loading}>` com `Enviar instruções`/spinner+`Enviando...` (mesmo spinner da Task 1), e `<Button asChild variant="link" className="self-center text-ink"><Link to="/login">Voltar para o login</Link></Button>`.

- [ ] **Step 4: Rodar o arquivo e confirme que passou**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/auth/pages/ForgotPasswordPage.test.tsx`

Expected: PASS — 6 testes.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/pages/ForgotPasswordPage.test.tsx src/features/auth/pages/ForgotPasswordPage.tsx
git commit -m "refactor: migra recuperacao de senha para o design system"
```

---

### Task 3: ResetPasswordPage — proteger comportamento, migrar e remover Login.css

**Files:**
- Modify: `src/features/auth/pages/ResetPasswordPage.test.tsx`
- Modify: `src/features/auth/pages/ResetPasswordPage.tsx`
- Delete: `src/features/auth/pages/Login.css`

**Interfaces:**
- Consumes: `extractRecoveryToken(location.search, location.hash)`; `authService.resetPassword(token, password)`; `navigate('/login', { replace: true, state: { passwordReset: true } })`; `HttpError`; `PawIcon`; `Button`; `Card`, `CardHeader`, `CardTitle`, `CardContent`.
- Produces: `ResetPasswordPage()` com as mesmas validações (`8`/`128` caracteres), mesmos toggles e mesmas mensagens.

- [ ] **Step 1: Acrescentar asserções de design system, toggle e link inválido em `ResetPasswordPage.test.tsx`**

No teste `bloqueia o formulário quando não há token de recuperação`, acrescente depois da asserção de `href`:

```tsx
expect(screen.getByRole('link', { name: /Solicitar novo link/i })).toHaveAttribute(
  'data-slot',
  'button',
);
```

Adicione ao final do `describe`:

```tsx
it('alterna a visibilidade das duas senhas', () => {
  renderAt(`/redefinir-senha#access_token=${TOKEN}`);
  const password = screen.getByLabelText('Nova senha');
  const confirmation = screen.getByLabelText('Confirmar nova senha');

  expect(password).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
  expect(password).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
  expect(password).toHaveAttribute('type', 'password');

  expect(confirmation).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmação' }));
  expect(confirmation).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar confirmação' }));
  expect(confirmation).toHaveAttribute('type', 'password');
});

it('usa o design system no cartão, campos e botões', () => {
  renderAt(`/redefinir-senha#access_token=${TOKEN}`);

  const heading = screen.getByRole('heading', { name: 'Nova senha' });
  expect(heading.closest('[data-slot="card"]')).toBeInTheDocument();
  expect(heading.closest('[data-slot="card-header"]')).toHaveClass('bg-marker');
  expect(screen.getByLabelText('Nova senha')).toHaveClass('tf__input');
  expect(screen.getByLabelText('Confirmar nova senha')).toHaveClass('tf__input');
  expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute(
    'data-variant',
    'link',
  );
  expect(screen.getByRole('button', { name: /Redefinir senha/i })).toHaveAttribute(
    'data-slot',
    'button',
  );
  expect(screen.getByRole('link', { name: /Voltar para o login/i })).toHaveAttribute(
    'data-slot',
    'button',
  );
});
```

- [ ] **Step 2: Rodar o arquivo e confirme que as asserções novas falham**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/auth/pages/ResetPasswordPage.test.tsx`

Expected: FAIL em `bloqueia o formulário...` (link sem `data-slot`), `alterna a visibilidade...` e `usa o design system...`; os sete testes originais PASSAM.

- [ ] **Step 3: Reescrever a marcação de `ResetPasswordPage.tsx` e apagar `Login.css`**

Remova `import './Login.css'` e importe `Button` e os quatro componentes de `Card`. Mantenha `MIN_PASSWORD_LENGTH`, `MAX_PASSWORD_LENGTH`, `FALLBACK_ERROR`, `errorMessage()`, `token` e `handleSubmit` intactos. Use exatamente o invólucro, o cartão, o cabeçalho e o `CardContent` da Task 1, com `<CardTitle>Nova senha</CardTitle>`. Dentro do `CardContent`:

- Sem token: `<div className="flex flex-col gap-5">` com o alerta no padrão de erro da Task 1 (texto atual) e `<Button asChild className="w-full"><Link to="/recuperar-senha">Solicitar novo link</Link></Button>`.
- Com token: `<form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>` com a intro em `<p className="text-sm leading-relaxed text-muted">`.
- Dois campos em `<div className="tf">`, cada um com `label.tf__label` e um `<div className="relative">` contendo `input.tf__input` + `<Button type="button" variant="link" size="sm" className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 px-2 text-xs text-ink hover:text-ink">`. Use `pr-28` em `new-password` e `pr-32` em `confirm-password`; preserve `minLength`, `maxLength`, `required`, `autoComplete`, placeholders e os três pares de rótulos `Mostrar senha`/`Ocultar senha` e `Mostrar confirmação`/`Ocultar confirmação`.
- Dica: `<p className="text-sm text-muted">Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</p>`.
- Erro: mesmo padrão de `role="alert"` da Task 1.
- Envio: `<Button type="submit" className="w-full" disabled={loading}>` com `Redefinir senha`/spinner+`Salvando...` (mesmo spinner da Task 1).
- Retorno: `<Button asChild variant="link" className="self-center text-ink"><Link to="/login">Voltar para o login</Link></Button>`.

Confirme que nenhum arquivo restante importa `./Login.css` antes de excluí-lo.

- [ ] **Step 4: Rodar o arquivo e confirme que passou**

Run: `node .\node_modules\vitest\vitest.mjs run src/features/auth/pages/ResetPasswordPage.test.tsx`

Expected: PASS — 9 testes.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/pages/ResetPasswordPage.test.tsx src/features/auth/pages/ResetPasswordPage.tsx src/features/auth/pages/Login.css
git commit -m "refactor: migra redefinicao de senha e remove Login.css"
```

---

### Task 4: Verificação final e QA responsivo

**Files:** nenhum. Se a inspeção exigir ajuste, aplique-o na página correspondente e faça um commit `fix: ...` separado.

**Interfaces:**
- Consumes: saída das Tasks 1–3.
- Produces: suíte frontend verde e registro dos três viewports.

- [ ] **Step 1: Rodar a verificação completa no worktree**

Run (todos na raiz do worktree):

```bash
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\typescript\bin\tsc -b
node .\node_modules\eslint\bin\eslint.js .
node .\node_modules\vite\bin\vite.js build
```

Expected: `vitest` com 297+ testes PASS, `tsc -b` sem erros, `eslint` sem erros, `build` concluído.

- [ ] **Step 2: Inspecionar as três telas em 360/768/1280**

Use o skill `playwright-cli` com o servidor de dev do Vite. Visite `/login`, `/recuperar-senha` e `/redefinir-senha#access_token=qa-token`. Em cada largura verifique: cartão centralizado sem overflow horizontal, cabeçalho laranja com texto escuro legível, campos com borda visível, links e toggles com alvo ≥ 44 px, mensagens de erro/sucesso legíveis.

Expected: nenhum problema de contraste, overflow ou alvo pequeno; registre as larguras conferidas na resposta final.

- [ ] **Step 3: Publicar a branch**

```bash
git push origin feat/s05-operacao
```

Expected: branch remota atualizada com os três commits de migração (e eventuais `fix:`).
