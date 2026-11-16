# Linha de base — Roadmap 5 dias

## D0.1 — Branch, linha de base e ambiente
- **Data:** 2026-11-16
- **Repositório:** `C:\Users\gabri\OneDrive\Área de Trabalho\Code\Peludinhos`
- **Branch de trabalho:** `feat/s05-operacao` (criada a partir de `main`)
- **Commit base:** `eb6f42f` (`main`, árvore limpa, alinhada a `origin/main`)

### Frontend (Peludinhos)
- **Vitest:** `node .\node_modules\vitest\vitest.mjs run` → **24 arquivos de teste**, **165 testes**, todos **passaram** (0 falhas). Duração ~42s.
- **Type-check:** `node .\node_modules\typescript\bin\tsc -b` → **exit code 0** (sem erros).

### API temporária (TempDB)
- **Caminho:** `C:\Users\gabri\OneDrive\Área de Trabalho\Code\TempDB`
- **Servidor:** uvicorn em `http://127.0.0.1:8000` (`.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000` / `iniciar_api.bat`).
- **Smoke test (inicial, bloqueado):** `.venv\Scripts\python.exe scripts\smoke_test.py` → **1 PASS / 1 FAIL** (abortado). `GET /health` PASS; `POST /api/auth/login` (admin) **FAIL** com `500 Internal Server Error` ("sem token admin não há como continuar").
- **Causa raiz / resolução (diagnóstico, sem expor segredos):** projeto Supabase de dev (`testedb`, ref `rifohcttblmbnlmieblg`) estava **pausado (INACTIVE)**, causando falha de resolução/conexão no login (`httpx.ConnectError`/erro não mapeado → 500 genérico; `/health` não toca Supabase). Projeto restaurado até **ACTIVE_HEALTHY**; `GET /auth/v1/health` e `sign_in_with_password` voltaram a responder OK. Não houve alteração de código, schema/migrations nem seed de admin (admin e migrations 0001–0003 já presentes).
- **Smoke test (final, verificado):** `.venv\Scripts\python.exe scripts\smoke_test.py` → **61 PASS / 0 FAIL** (exit code 0). Blocos: Infra, Login admin (F4.1), Membros, Animais, Visitante e intenção de adoção (F1.13/F1.25/F2.9), Morte de animal (F1.14), Sessão (refresh/logout/recuperação).
- **`.env` (chaves presentes, valores não registrados):** `SUPABASE_URL`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` presentes. (Roadmap cita `SERVICE_ROLE_KEY`; no ambiente a chave está nomeada como `SUPABASE_SERVICE_ROLE_KEY`.)
- **Status do aceite:** **concluído** — branch criada, 165 testes verdes, `tsc -b` sem erros, smoke test com 0 falhas, linha de base registrada e API temporária versionada/backup via git.

> **Risco/pêndencia operacional:** projetos Supabase no free tier podem pausar por inatividade e reproduzir o 500 no login; restaurar o projeto antes de rodar o smoke test se necessário. `DATABASE_URL` segue vazio (opcional; migrations já aplicadas). O smoke test cria dados de teste a cada execução (comportamento esperado). Hardening opcional (não aplicado): mapear erros de transporte/retry (`httpx.TransportError`/`AuthRetryableError`) para 502/503 em vez de 500 genérico.

### Versionamento/backup da API temporária
- `git init` realizado em `TempDB` (não havia `.git`).
- Criado `.gitignore` excluindo `.env`, `.venv/`, `__pycache__/` etc. (`.env.example` mantido).
- Commit inicial: `9156933` — `chore: snapshot inicial da API temporaria (baseline D0.1)` (35 arquivos; `.env` não versionado).

## D1.2 — Aplicar migration e validar RLS/grants
- **Data:** 2026-11-16
- **Migration:** `migrations/0004_operacao.sql` (núcleo operacional) aplicada via Supabase MCP `apply_migration` no projeto de dev `testedb` (ref `rifohcttblmbnlmieblg`).

### Validações
- **Tabelas criadas (7):** `animal_feeding_points`, `events`, `feeding_points`, `food_movements`, `foods`, `shift_feeding_points`, `shifts` (confirmadas em `information_schema.tables`, schema `public`).
- **Enum criado (1):** `public.food_movement_kind` com valores `compra`, `consumo`, `fim`.
- **RLS/grants:** RLS habilitada e políticas/grants conforme `0004_operacao.sql`. Teste anônimo via PostgREST (`GET /rest/v1/feeding_points?select=*` com chave publishable/anon): **HTTP 200** com corpo `[]` (sem exposição de dados).
- **Idempotência:** migration reaplicada com sucesso (segunda aplicação sem erro), SQL idempotente (`create table if not exists`, blocos `exception when duplicate_object`, `create index if not exists`, `notify pgrst`).

### Advisors (Supabase)
- **Security:** sem achados críticos introduzidos pela migration (sem `security definer` sem `search_path`, sem RLS desligada, sem grant amplo indevido). Permanece aviso preexistente de configuração de Auth: `auth_leaked_password_protection` (WARN) — não relacionado à migration.
- **Performance:** corrigidos 2 achados de FK sem índice cobrindo na migration — adicionados `idx_food_movements_member_id` (`food_movements.member_id`) e `idx_shift_feeding_points_feeding_point_id` (`shift_feeding_points.feeding_point_id`). Demais achados de performance são `unused_index` (INFO), esperado para índices recém-criados sem carga.

### Notas
- `DATABASE_URL` no `.env` do TempDB segue vazio; aplicação feita via Supabase MCP (equivalente ao objetivo de aplicar/validar no dev). Nenhuma tabela existente alterada destrutivamente.
