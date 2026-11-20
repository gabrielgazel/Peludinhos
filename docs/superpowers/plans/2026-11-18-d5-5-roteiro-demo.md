# D5.5 — Roteiro da demo e ensaio cronometrado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `docs/roteiro-demo.md` com 8 blocos somando 10:00, plano B por passo dependente de API e dois ensaios cronometrados reais abaixo de 10 min sem travar.

**Architecture:** Documento único no frontend, sem mudança de código. O ensaio usa a API real (uvicorn) + build de produção (`vite preview`) conduzidos por `playwright-cli`; o seed idempotente do TempDB é re-aplicado antes de cada execução. Um verificador estrutural fora do repo valida o roteiro antes e depois dos ensaios.

**Tech Stack:** Markdown, PowerShell (`Stopwatch`), `playwright-cli`, `seed_demo.py`, Vitest/tsc/build apenas se o worktree mudar.

**Spec:** `C:/Users/gabri/AppData/Local/Temp/opencode/d55-design.md` e bloco `D5.5` de `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/Peludinhos - Roadmap 5 Dias - Tarefas e Prompts.md:1138-1169`.

## Global Constraints

- Tempo total alvo: **10:00 exatos** nos 8 blocos do roadmap; cada execução cronometrada deve fechar **abaixo de 10 min, sem travar**.
- Cada passo traz: **clique exato**, **o que deve aparecer**, **tempo alvo**, **frase de demo** (uma frase) e **plano B** em texto.
- Regra "falhou duas vezes sai": se um passo falhar 2× em qualquer ensaio, sai do caminho principal, vira plano B e entra na tabela de passos removidos.
- Não incluir no roteiro nada que não esteja no **build de produção**. Manual (PDF) e backlog são artefatos/planejamento, não telas; recuperação de senha é rota real, mas nenhum e-mail é fingido.
- Contas demo e senha `Demo@12345` são públicas e marcadas como **somente demo**.
- Worktree ativo: `C:/Users/gabri/.local/share/opencode/worktree/6a3308/s04-crud-voluntarios`, branch `feat/s05-operacao`. Checkout principal permanece em `main`.
- TempDB (`C:/Users/gabri/OneDrive/Área de Trabalho/Code/TempDB`) não tem remote; seed é idempotente e nunca apaga dados.
- Interface e documentação em português; commit convencional; roadmap marcado `[x] 2026-11-18`; ledger `C:/Users/gabri/AppData/Local/Temp/opencode/d5-ledger.md`.

## Review Focus

- **CPF/motivação do autocadastro:** o formulário valida CPF e motivação ≥20 caracteres; um CPF inválido trava o bloco 1:00–3:00. O ensaio usa CPF gerado pelo mesmo algoritmo do frontend e motivação longa.
- **Chave natural de ração/animal/p ponto:** nomes repetidos entre ensaios podem colidir; cada ensaio usa sufixo próprio (`Ensaio 1`, `Ensaio 2`) para compra de 20 kg, animal e ponto.
- **Óbito destrutivo:** nunca registrar óbito em animal do seed; criar um animal descartável no próprio bloco 4:00–5:00.
- **Dados residuais do smoke test:** pontos/rações `Demo xxxxxx` extras existem; o roteiro escolhe registros pelo nome sufixado, nunca por índice de linha.
- **API fora do ar:** cada passo dependente de API tem frase de salvamento e print descrito; se falhar 2×, sai do roteiro.

---

### Task 1: Verificador estrutural do roteiro (RED)

**Files:**
- Create (fora do repo): `C:/Users/gabri/AppData/Local/Temp/opencode/check-roteiro.js`

**Interfaces:**
- Consumes: nada.
- Produces: comando `node check-roteiro.js <arquivo>` que sai com código 1 quando o roteiro não existe ou não tem 8 blocos, tempos somando 10:00, ou algum bloco sem clique/resultado/tempo/frase de demo/plano B. Usado pelas Tasks 2–4.

- [ ] **Step 1: Escrever o verificador**

```js
// Uso: node check-roteiro.js <arquivo.md>
// Exige: 8 cabeçalhos de bloco "### N. ...", tempos "M:SS" somando 600s,
// e as 5 etiquetas por bloco: Clique, Aparece, Tempo alvo, Frase de demo, Plano B.
```

Implementar com `fs.readFileSync`, regex para `^### (\d)\.` e `/^[-*] (Clique|Aparece|Tempo alvo|Frase de demo|Plano B):/` por bloco, soma dos valores `M:SS`, e `process.exit(issues ? 1 : 0)`.

- [ ] **Step 2: Rodar contra o arquivo ainda inexistente**

Run: `node C:\Users\gabri\AppData\Local\Temp\opencode\check-roteiro.js C:\Users\gabri\.local\share\opencode\worktree\6a3308\s04-crud-voluntarios\docs\roteiro-demo.md`
Expected: FAIL com "arquivo não encontrado" e exit 1.

### Task 2: Escrever `docs/roteiro-demo.md`

**Files:**
- Create: `docs/roteiro-demo.md`

**Interfaces:**
- Consumes: verificador da Task 1; blocos `D5.5` do roadmap; mapeamento de telas do manual D5.4.
- Produces: roteiro com a tabela-mestre dos 8 blocos (0:00–1:00 Home; 1:00–3:00 Visitante catálogo›detalhe›intenção com autocadastro; 3:00–4:00 Login/painel; 4:00–5:00 Animais busca/ficha/foto/óbito; 5:00–6:00 Pontos criar/vincular; 6:00–7:00 Turno iniciar/encerrar/histórico; 7:00–8:00 Ocorrência e ração 20 kg›5 kg›saldo; 8:00–10:00 Relatórios 1–3, membros, recuperação, manual, backlog), seções "O que é demo e como dizer", "Fora do build", "Regra falhou 2× sai" (tabela de passos removidos) e "Registro dos ensaios" (tabelas vazias para Ensaio 1 e 2).

- [ ] **Step 1: Escrever o documento completo**

Incluir, para cada um dos 8 blocos, as 5 etiquetas exigidas pelo verificador, com rótulos e mensagens exibidas pela interface (ex.: "Interesse enviado!", "Em andamento", "Encerrar o turno agora?", "Salvar consumo", "Animais por status", "Planejado"). Usar `admin.demo@peludinhos.example` para 3:00–8:00 e `visitante1.demo` apenas se necessário; o autocadastro de 1:00–3:00 cria conta nova com e-mail sufixado por ensaio e CPF válido de teste. No bloco 4:00–5:00, criar um animal descartável sufixado por ensaio e aplicar **Registrar óbito somente nele**; em todos os blocos, selecionar registros pelo nome sufixado, nunca pelo índice da linha (há dados extras de smoke test no banco demo).

- [ ] **Step 2: Rodar o verificador**

Run: `node C:\Users\gabri\AppData\Local\Temp\opencode\check-roteiro.js <docs/roteiro-demo.md>`
Expected: PASS — 8 blocos, soma 600s, 40 etiquetas presentes.

- [ ] **Step 3: Commit do roteiro-base**

```bash
git add docs/roteiro-demo.md
git commit -m "docs(demo): adiciona roteiro de 10 minutos com plano B (D5.5)"
```

### Task 3: Ensaio 1 (cronometrado, seed re-aplicado)

**Files:**
- Modify: `docs/roteiro-demo.md` (preencher coluna "Ensaio 1" do registro)
- Modify (fora do repo): logs em `AppData/Local/Temp/opencode/d55-ensaio1-*.txt`

**Interfaces:**
- Consumes: roteiro da Task 2; `scripts/seed_demo.py`; build de produção com D5.3 aplicado.
- Produces: tempos reais por bloco do Ensaio 1 e lista de ajustes.

- [ ] **Step 1: Subir API e preview e re-aplicar o seed**

Run (PowerShell): iniciar `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` no TempDB e `node .\node_modules\vite\bin\vite.js preview --host 127.0.0.1 --port 4173` no worktree; confirmar `/health` e `/adocao` com HTTP 200; rodar `.venv\Scripts\python.exe scripts\seed_demo.py`.
Expected: health `{"status":"ok"}`; seed termina sem criar duplicatas (0 criados/0 atualizados ou equivalente idempotente).

- [ ] **Step 2: Executar os 8 blocos cronometrados no Chromium**

Abrir `playwright-cli.cmd open http://127.0.0.1:4173/`; medir cada bloco com `[System.Diagnostics.Stopwatch]` no PowerShell, seguindo apenas o roteiro (cliques e texto esperado). Salvar logs por bloco.
Expected: nenhum travamento; cada falha imediata anotada; se um passo falhar 2×, aplicar a regra e registrar.

- [ ] **Step 3: Registrar tempos e encerrar serviços**

Preencher a tabela "Ensaio 1" com tempo alvo vs. real por bloco e total; fechar navegador e matar os PIDs da API/preview.
Expected: total anotado; se ≥10 min ou houver travamento, escrever ajustes antes do Ensaio 2.

- [ ] **Step 4: Commit do registro do Ensaio 1**

```bash
git add docs/roteiro-demo.md
git commit -m "docs(demo): registra tempos do primeiro ensaio (D5.5)"
```

### Task 4: Ajustes + Ensaio 2 + fechamento do aceite

**Files:**
- Modify: `docs/roteiro-demo.md` (ajustes, tabela "Ensaio 2", conclusão do aceite)
- Modify: roadmap externo e `d5-ledger.md`

**Interfaces:**
- Consumes: ajustes da Task 3; verificador da Task 1.
- Produces: aceite com duas execuções <10 min, roteiro final commitado e pushed, roadmap e ledger atualizados.

- [ ] **Step 1: Aplicar ajustes e re-aplicar o seed**

Ajustar tempos alvo/passos que estouraram no Ensaio 1; subir API + preview novamente; rodar o seed.
Expected: serviços no ar e baseline idempotente.

- [ ] **Step 2: Executar o Ensaio 2 cronometrado**

Repetir a medição dos 8 blocos com nomes sufixados `Ensaio 2`.
Expected: total <10:00, sem travar; qualquer passo que falhar 2× é removido e registrado.

- [ ] **Step 3: Verificação final do roteiro**

Run: `node ...\check-roteiro.js <docs/roteiro-demo.md>` e `git diff --check`
Expected: verificador PASS; `git diff --check` sem saída; ambas as tabelas de ensaio preenchidas com total <10:00.

- [ ] **Step 4: Commit, push e marcação**

```bash
git add docs/roteiro-demo.md
git commit -m "docs(demo): fecha ensaios cronometrados do roteiro (D5.5)"
git push origin feat/s05-operacao
```

Marcar `D5.5` com `[x] 2026-11-18` no roadmap externo e acrescentar a seção D5.5 ao ledger com commits, tempos e limitações (tempo instrumentado é limite inferior para apresentação humana; recuperação real D4.3 segue pendente).
