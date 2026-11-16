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
- **Servidor:** iniciado via `iniciar_api.bat` (uvicorn em `http://127.0.0.1:8000`).
- **Smoke test:** `.venv\Scripts\python.exe scripts\smoke_test.py` → **1 PASS / 1 FAIL** (abortado).
  - `[1] Infra` GET `/health`: PASS
  - `[2] Login admin (F4.1)` `login admin 200`: **FAIL** → `500 Internal Server Error` ("sem token admin não há como continuar")
  - **Asserções totais concluídas antes do aborto:** 2 verificações (1 passou, 1 falhou). Não atingiu o total esperado de 61 asserções/0 falhas.
- **`.env` (chaves presentes, valores não registrados):** `SUPABASE_URL`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` presentes no `.env` da API. (Roadmap cita `SERVICE_ROLE_KEY`; no ambiente a chave está nomeada como `SUPABASE_SERVICE_ROLE_KEY`.)
- **Status do aceite:** **parcial/bloqueado** — suíte frontend e `tsc -b` verdes e branch criada, porém smoke test da API não ficou com 0 falhas (500 no login admin). Requer investigação de ambiente/credenciais/seed do admin no banco de dev antes de considerar D0.1 concluída.

### Versionamento/backup da API temporária
- (registrar ação realizada abaixo)
