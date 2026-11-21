# D5.6 — Tag, PDF de entrega e backlog priorizado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o D5 com README coerente, tag anotada `v0.5-demo` publicada e um PDF único com manual e roteiro, backlog conferido e datas registradas.

**Architecture:** Documentação e empacotamento, sem mudança de produto. Um verificador estrutural fora do repo valida README, roadmap, backlog, PDF e tag; um conversor Markdown→HTML temporário alimenta o `playwright-cli pdf`. A tag é criada só depois do commit final, para não precisar movê-la.

**Tech Stack:** Markdown, Node.js, `playwright-cli pdf`, Git/PowerShell, roadmap externo fora de git.

**Spec:** `docs/superpowers/specs/2026-11-20-d5-6-pacote-entrega-design.md`

## Global Constraints

- PDF único: `docs/pacote-entrega.pdf`, com manual e roteiro, capa e seções numeradas.
- Tag anotada `v0.5-demo` no commit final do dia, publicada em `origin`; nunca mover depois — correção vira `v0.5.1`.
- README: o que a demo faz, o que é simulado e como subir API + frontend + seed.
- Backlog B1–B7 estimado e ordenado (S07–S09, ~6 dias úteis).
- Datas no fim do roadmap: D0 16/11, D1 16/11, D2 17/11, D3 18/11, D4 18/11, D5 20/11.
- Roadmap externo `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md` não é repo git.
- Worktree: `C:/Users/gabri/.local/share/opencode/worktree/6a3308/s04-crud-voluntarios`, branch `feat/s05-operacao`; checkout principal em `main`.
- Sem biblioteca de PDF/conversor Markdown instalados: HTML temporário + `playwright-cli pdf`.
- Conversor e HTML ficam fora do repo; entra no repo apenas o PDF final.
- Documentação em português; commit convencional.

## Review Focus

1. README prometer e-mail real de recuperação (D4.3 pendente) — verificar que o texto diz que o envio depende de servidor de e-mail e não é simulado; teste: checagem de README no verificador.
2. PDF sem acentos ou sem os dois documentos — verificar `<meta charset="utf-8">` e os títulos “Manual do usuário” e “Roteiro da demo” no HTML, e PDF com cabeçalho `%PDF` e >80.000 bytes; teste: checagem de HTML e PDF no verificador.
3. Tag leve, em commit errado ou movida — verificar `git cat-file -t v0.5-demo` = `tag` e `git ls-remote origin refs/tags/v0.5-demo` igual ao HEAD final; teste: checagem de tag no verificador + `ls-remote`.
4. Backlog desordenado ou sem estimativa — verificar B1..B7 com `~` e sprint S07/S08/S09 na ordem; teste: checagem de backlog no verificador.
5. Datas divergentes da tabela de acompanhamento — verificar as seis datas exatas no bloco do fim do roadmap; teste: checagem de datas no verificador.

---

### Task 1: Verificador estrutural do pacote (RED)

**Files:**
- Create (fora do repo): `C:/Users/gabri/AppData/Local/Temp/opencode/check-pacote.js`

**Interfaces:**
- Consumes: nada.
- Produces: comando `node check-pacote.js <worktree> <roadmap> [html-temp]` com exit 0 quando tudo passa e exit 1 listando as pendências. Checagens: (a) README com “O que a demo faz”, “O que é simulado”, “Como rodar a demo”, `seed_demo.py`, `Demo@12345`, `/painel/operacao/`; (b) roadmap com `## Datas de conclusão` e as seis datas exatas; (c) backlog B1..B7 com estimativa `~` e sprint; (d) `docs/pacote-entrega.pdf` com cabeçalho `%PDF` e >80.000 bytes; (e) tag anotada `v0.5-demo` via `git cat-file -t`; (f) HTML temporário com charset UTF-8 e os dois títulos, quando informado.

- [ ] **Step 1: Escrever o verificador**

Implementar com `fs`, `child_process.execFileSync('git', ...)`, regex e acumulador de erros; imprimir `pacote OK — ...` no sucesso e `pacote INVÁLIDO: ...` na falha.

- [ ] **Step 2: Rodar contra o estado inicial**

Run: `node C:/Users/gabri/AppData/Local/Temp/opencode/check-pacote.js C:/Users/gabri/.local/share/opencode/worktree/6a3308/s04-crud-voluntarios "C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md"`
Expected: FAIL (exit 1) com pendências de README, datas, PDF e tag.

> Sem commit: verificador fica fora do repo.

### Task 2: README coerente com a demo

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: rotas reais de `src/app/router.tsx` e scripts de `package.json`.
- Produces: README com as seções exigidas pela checagem (a) do verificador.

- [ ] **Step 1: Confirmar o vermelho do README**

Run: o comando da Task 1.
Expected: FAIL incluindo as pendências de README.

- [ ] **Step 2: Atualizar o README**

Manter Stack e tabela de Scripts. Corrigir “Como rodar” para `.env.example`, `bun install`, `bun run dev`, `bun run build`, `bun run lint`, `bun run preview`, com os equivalentes `node .\node_modules\vitest\vitest.mjs run`, `node .\node_modules\typescript\bin\tsc -b`, `node .\node_modules\vite\bin\vite.js build`, `node .\node_modules\eslint\bin\eslint.js .`. Documentar API em `http://127.0.0.1:8000` (`/health`), seed `.venv\Scripts\python.exe scripts\seed_demo.py` no TempDB e preview em `http://127.0.0.1:4173` (`/adocao`). Acrescentar “O que a demo faz” (8 blocos/10 min, links para manual e roteiro), “O que é simulado” (insumos, termo, relatórios 4–6, recuperação por e-mail pendente), “Contas de demonstração” (`*.demo@peludinhos.example`, senha pública `Demo@12345`). Atualizar Rotas com `/painel/operacao/{pontos,turnos,ocorrencias,racao}`, `/painel/insumos`, `/painel/relatorios`, `/recuperar-senha`, `/redefinir-senha`, `/nao-autorizado`.

- [ ] **Step 3: Verificar o README**

Run: o comando da Task 1.
Expected: pendências de README ausentes; seguem PDF, datas e tag.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): documenta demo, simulacoes e como rodar (D5.6)"
```

### Task 3: PDF único de entrega

**Files:**
- Create (fora do repo): `C:/Users/gabri/AppData/Local/Temp/opencode/md2html.js`, `C:/Users/gabri/AppData/Local/Temp/opencode/pacote-entrega.html`
- Create: `docs/pacote-entrega.pdf`

**Interfaces:**
- Consumes: `docs/manual-do-usuario.md` e `docs/roteiro-demo.md`.
- Produces: PDF com capa, manual, quebra de página e roteiro; checagem (d) e (f) do verificador.

- [ ] **Step 1: Escrever o conversor Markdown→HTML**

`md2html.js <manual.md> <roteiro.md> <saida.html>`: `<meta charset="utf-8">`, CSS `@page { size: A4; margin: 18mm; }`, capa com título/versão/data e `page-break-before: always` entre os documentos. Suportar cabeçalhos `#`/`##`/`###`, parágrafos, listas ordenadas e não ordenadas, tabelas GitHub, blocos ```` ``` ````, citações `>`, `**negrito**` e `` `codigo` ``.

- [ ] **Step 2: Gerar e conferir o HTML**

Run: `node C:/Users/gabri/AppData/Local/Temp/opencode/md2html.js <manual.md> <roteiro.md> C:/Users/gabri/AppData/Local/Temp/opencode/pacote-entrega.html`
Expected: arquivo com charset UTF-8, os dois títulos e seções numeradas.

- [ ] **Step 3: Salvar o PDF**

Run: `playwright-cli.cmd open file:///C:/Users/gabri/AppData/Local/Temp/opencode/pacote-entrega.html` e `playwright-cli.cmd pdf --filename <worktree>/docs/pacote-entrega.pdf`
Expected: PDF criado, começa com `%PDF` e tem >80.000 bytes.

- [ ] **Step 4: Verificar e commitar**

Run: verificador com o HTML como terceiro argumento.
Expected: pendências de HTML e PDF ausentes; seguem datas e tag.
Commit: `git add docs/pacote-entrega.pdf && git commit -m "docs(entrega): adiciona PDF unico com manual e roteiro (D5.6)"`

### Task 4: Backlog, datas, tag e fechamento

**Files:**
- Modify: `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md`
- Commit (já criados): `docs/superpowers/specs/2026-11-20-d5-6-pacote-entrega-design.md`, `docs/superpowers/plans/2026-11-20-d5-6-pacote-entrega.md`

**Interfaces:**
- Consumes: verificador da Task 1 e commits das Tasks 2–3.
- Produces: tag `v0.5-demo` publicada, roadmap com datas e D5.6 marcado, ledger atualizado.

- [ ] **Step 1: Backlog, datas e marcação no roadmap**

Conferir B1..B7 (estimativas e ordem S07/S08/S09). Anexar ao fim do arquivo `## Datas de conclusão` com D0 16/11, D1 16/11, D2 17/11, D3 18/11, D4 18/11, D5 20/11. Marcar `D5.6` como `[x] 2026-11-20` na tabela de acompanhamento.

- [ ] **Step 2: Verificação final**

Run: verificador com o HTML; `git -C <worktree> diff --check`.
Expected: `pacote OK`; `diff --check` sem erro.

- [ ] **Step 3: Commit do plano, spec e fechamento**

```bash
git add docs/superpowers/specs/2026-11-20-d5-6-pacote-entrega-design.md docs/superpowers/plans/2026-11-20-d5-6-pacote-entrega.md
git commit -m "docs(entrega): registra design, plano e fecha pacote D5.6"
```

- [ ] **Step 4: Criar e publicar a tag anotada**

Run: `git -C <worktree> tag -a v0.5-demo -m "v0.5-demo — pacote de entrega da demo Peludinhos (20/11/2026)"`, `git -C <worktree> push origin feat/s05-operacao`, `git -C <worktree> push origin v0.5-demo`.
Expected: tag anotada no HEAD final; pushes com exit 0.

- [ ] **Step 5: Conferir o aceite**

Run: `git tag -n`, `git ls-remote origin refs/tags/v0.5-demo`, leitura do README, abertura do PDF e `git status --short`.
Expected: tag `v0.5-demo` anotada e remota igual ao HEAD; README e PDF íntegros; worktree limpo. Atualizar `C:/Users/gabri/AppData/Local/Temp/opencode/d5-ledger.md` com o commit da tag.
