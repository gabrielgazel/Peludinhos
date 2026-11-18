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

## D1.8 — Smoke test estendido e documentação da API
- **Data:** 2026-11-16
- **Alterações:** `TempDB/scripts/smoke_test.py` estendido com seções operacionais `[7]` pontos/vínculos, `[8]` turnos, `[9]` ocorrências e `[10]` rações/movimentações/saldo (inclui login de bolsista para RBAC) e renumeração da sessão para `[11]`; `TempDB/DOCUMENTACAO.md` atualizada (12/19 tabelas, endpoints e matriz RBAC operacional). Incluída tolerância a rate limit (429 com retry/fallback) no passo de recuperação para robustez do smoke.
- **Verificação (smoke):** execução completa contra API local + Supabase dev retornou **85 PASS / 1 FAIL**. O único `FAIL` foi `POST /auth/recover -> 202 :: 429 {"detail":"Muitas tentativas"}` por rate limiting do Supabase Auth após execuções repetidas do smoke; verificação isolada posterior do endpoint `POST /api/auth/recover` retornou **HTTP 202** com mensagem de sucesso. Todas as novas asserções operacionais de D1.8 passaram (pontos 401/403/201/409 e vínculos; turnos 201/409/200/204; ocorrências 201/200; rações/movimentações 201, saldo 20→15→0, bloqueio 422, 3 movimentações em `/api/food-movements`).
- **Commit TempDB:** `test(api): estende smoke test operacional e atualiza documentacao`.

## D2.7 — Testes de página e QA responsivo da S04-B/S05-A
- **Data:** 2026-11-17
- **Cobertura revisada:** D2.2 `FeedingPointsAdminPage` (sucesso: lista com prédio/status/animais e criação; erro: 409 ao criar), D2.3 `AnimalFormPage` (sucesso: vínculo ao criar/editar; erro: falha em `setForAnimal` e fallback de create), D2.5 `ShiftPage` (sucesso: iniciar, encerrar e histórico; erro: 409 ao iniciar), D2.6 `DashboardPage` (sucesso: turno aberto e sem turno; erro: falha isolada do turno e erro do resumo). Todas as páginas já tinham ao menos um cenário de sucesso e um de erro; nenhum teste novo foi necessário.
- **Suíte:** 28 arquivos / 198 testes passando (0 falhas); `tsc -b` exit 0.
- **QA visual:** Playwright CLI 0.1.22 + Vite local, com a API mockada exclusivamente no navegador (`page.route` para `http://127.0.0.1:8000/api/**`); nenhuma alteração de backend ou de contrato. Telas: `/painel`, `/painel/operacao/pontos` (lista e formulário aberto) e `/painel/operacao/turnos` (turno aberto e sem turno), em 360×800, 768×900 e 1280×900.
- **Critérios verificados:** overflow horizontal (`scrollWidth` vs `clientWidth`), alvos ≥44px (checkbox medido pelo `<label>` que o envolve), foco visível via Tab (com espera da transição de 0.15s), contraste AA (4.5:1; 3:1 para texto grande), texto cortado/truncado e `prefers-reduced-motion: reduce`.
- **Achado corrigido:** o link da marca no cabeçalho (`StaffLayout`) tinha 28px de altura; recebeu `min-h-11` (44px). Correção apenas de layout, sem mudança de contrato de API.
- **Falsos positivos descartados:** inputs `checkbox` de 16–22px são envolvidos por `<label>` com `min-height: 44px` (alvo efetivo correto); o anel de foco dos campos usa `box-shadow` + borda, visível após a transição.
- **Resultado final:** 0 overflow horizontal, 0 alvos <44px, 0 textos cortados, 0 falhas de contraste AA, 0 focos invisíveis e transições/animações em 0.01ms sob motion-reduce nas 18 combinações tela×largura (9 principais + 6 sem turno + 3 com formulário aberto). Capturas mantidas fora do repositório (QA efêmero).

## D3.7 — Testes de saldo e QA responsivo da S05-B/S06
- **Data:** 2026-11-18
- **Cobertura revisada:** D3.5/D3.6 `FoodAdminPage` — saldo após compra (peso inicial e saldo do servidor, 20,5 kg nas duas colunas), saldo após consumo (18 → 15 kg com recarga da lista), bloqueio 422 com mensagem da API sem reformatar, encerramento (`fim`) zerando o saldo e histórico com tipo/quantidade/data/ponto/autor/observação. Os cenários de consumo, 422, fim e histórico vieram da D3.6; a D3.7 acrescentou o de saldo após compra (11 testes na página).
- **Suíte:** 32 arquivos / 241 testes passando (0 falhas); `tsc -b` exit 0.
- **QA visual:** Playwright CLI + Vite local, API mockada apenas no navegador (`page.route` para `http://127.0.0.1:8000/api/**`); nenhuma alteração de backend ou de contrato. Telas: `/painel/operacao/ocorrencias` (lista e formulário aberto) e `/painel/operacao/racao` (lista, painel de consumo, histórico e encerramento), em 360×800, 768×900 e 1280×900 (18 combinações).
- **Tabelas no mobile:** as tabelas de rações e de histórico viram pilha de cards abaixo de 768px (`max-md`): `thead` oculto, `tr` em bloco e cada célula com o rótulo da coluna via `data-label` + `::before`, sem duplicar o DOM. Verificado no navegador: em 360px `table`/`tr` computam `display: block`, `thead` computa `display: none` e os seis rótulos (`Nome`, `Peso inicial`, `Saldo atual`, `Entrada`, `Situação`, `Ações`) são renderizados pelo pseudo-elemento; em 768px e 1280px a tabela volta ao modo nativo.
- **Critérios verificados:** overflow horizontal, alvos ≥44px (checkbox medido pelo `<label>`), foco visível via Tab, contraste AA (4.5:1; 3:1 para texto grande), texto cortado/truncado e `prefers-reduced-motion: reduce`.
- **Achado corrigido:** ao navegar por teclado no `input[type="date"]`, o foco entra nos sub-campos nativos (dia/mês/ano e botão do calendário) dentro do shadow DOM; o host deixa de casar `:focus` e o anel desaparecia. `form-controls.css` passou a aplicar o anel também em `:focus-within` (e a suspender o hover nesse estado). Correção de CSS compartilhado, sem mudança de contrato.
- **Falsos positivos descartados:** a parada de Tab no seletor nativo do calendário é a mesma origem do achado acima — após a correção, todas as paradas exibem anel; a medição imediatamente após `focus()` programático pegava a transição de 0.15s em curso.
- **Resultado final:** 0 overflow horizontal, 0 alvos <44px, 0 textos cortados, 0 falhas de contraste AA, 0 focos invisíveis e transições/animações em 0.01ms sob motion-reduce nas 18 combinações. Capturas mantidas fora do repositório (QA efêmero).

## D4.7 — QA das telas do dia
- **Data:** 2026-11-18
- **Suíte e type-check (passo 1, executados fresh):** `node .\node_modules\vitest\vitest.mjs run` → **41 arquivos / 295 testes**, 0 falhas (~56s); `node .\node_modules\typescript\bin\tsc -b` → **exit code 0**. Nada a corrigir.
- **Varredura (passo 2):** Playwright CLI + Vite local, API mockada apenas no navegador (`page.route` em `http://127.0.0.1:8000/api/**`); nenhuma alteração de backend, contrato, migration, TempDB ou `.env`. **15 combinações** tela × largura (360×800, 768×900, 1280×900): relatórios (`/painel/relatorios`, reais + "Próximos relatórios"), recuperação e redefinição de senha (`/recuperar-senha`, `/redefinir-senha#access_token=...`), insumos (`/painel/insumos`) e termo de adoção demo (painel aberto em `/painel/intencoes`). Os quatro scripts de QA do dia (`d43qa`, `d44qa`, `d45qa`, `d46qa`) foram reexecutados e um script consolidado (`d47qa`) repetiu as cinco telas com medição de cor ampliada.
- **Contraste (passo 3):** o auditor anterior só interpretava `rgb()`/`.rgba()` e ignorava as cores `oklch()` do Tailwind v4; para esta varredura a conversão passou a usar um canvas 1×1 (`fillStyle` + `getImageData`), que resolve `oklch` corretamente (controle: `oklch(0.637 0.237 25.331)` → `rgb(251,44,54)`). **DemoBanner:** texto `oklch(0.414 0.112 45.904)` sobre `oklch(0.987 0.022 95.277)` mede **8,73:1** (AA pede 4,5:1) em insumos e no termo demo, com 1 ícone e sempre dentro do primeiro viewport nas três larguras. **Barras dos gráficos:** 10 barras em relatórios, todas com `aria-hidden="true"`; 10/10 linhas trazem rótulo e valor em texto (ex.: "Disponível / 3 animais", "Bloco A / 2 animais"). As cores (verde `rgb(123,174,127)`, âmbar `rgb(201,118,56)`, cinza `rgb(107,91,82)`) são reforço visual — a informação não depende só de cor.
- **Resultado final:** 0 overflow horizontal, 0 textos cortados, 0 falhas de contraste nas telas staff, 0 focos invisíveis, transições/animações em 0,01ms sob `prefers-reduced-motion` e 0 erros de console/página nas 15 combinações. Nenhum ajuste de estilo foi necessário. Capturas: `d47-{relatorios,insumos,termo-demo,recuperar,redefinir}-{360,768,1280}.png` em `AppData/Local/Temp/opencode`.
- **Achados pré-existentes (fora do escopo, não corrigidos nesta tarefa):**
  - `/recuperar-senha` e `/redefinir-senha`: marca "Peludinhos", `h1` e botões usam o `--accent` laranja do `/login` original e medem **2,65:1** sobre fundo claro (AA: 4,5:1 para texto normal, 3:1 para título grande). Já registrado em D4.3; os links "Esqueci minha senha" e "Voltar para o login" são escuros/sublinhados e passam AA.
  - Termo demo: o link do animal (`a[Thor]`) no card da intenção mede **29×20px**, abaixo de 44px. Já presente antes de D4.5 e registrado naquela tarefa; não foi alterado para manter o escopo.
- **Limitação honesta:** este modelo não aceita input de imagem; as capturas foram geradas, e a inspeção visual foi feita por auditoria DOM automatizada (geometria, contraste convertido para sRGB, foco, texto e requisições). As chamadas duplicadas em `loadCalls` dos scripts vêm do StrictMode do Vite em dev, não das telas.

## D5.3 — Build de produção e lint
- **Data:** 2026-11-18
- **Comandos (saídas capturadas em `AppData/Local/Temp/opencode/d53-*`):**
  - `node .\node_modules\vite\bin\vite.js build` → **exit 0**; `✓ 2024 modules transformed`; `dist/index.html 0,69 kB (gzip 0,43)`, `dist/assets/index-DXHhk2cy.css 60,72 kB (gzip 12,40)`, `dist/assets/index-DNN26oDI.js 489,38 kB (gzip 142,89)`; `✓ built in 1.49s`.
  - `node .\node_modules\eslint\bin\eslint.js .` → **exit 0** (0 erros, 0 avisos). Antes das correções: **6 erros** (exit 1).
  - `node .\node_modules\typescript\bin\tsc -b` → **exit 0** (sem erros).
  - `node .\node_modules\vitest\vitest.mjs run` → **42 arquivos / 297 testes**, 0 falhas (69,60s), exit 0.
- **Causa dos 6 erros de lint:** código escrito nesta semana (D1–D4) nunca tinha passado por `eslint .` — D0.1/D2.7/D3.7/D4.7 rodaram só Vitest e `tsc`. O config do ESLint e as versões das dependências não mudaram (`git log -- eslint.config.js package.json`). Dois padrões concretos:
  1. **`react-hooks/set-state-in-effect` (5 erros):** `AnimalFormPage` (2), `FeedingPointsAdminPage` (1) e `ShiftPage` (1) duplicaram `loading`/`error` em `useState` e os resetavam com `setState` síncrono dentro de `useEffect`, causando renders em cascata. A causa raiz é estado derivado sendo materializado; o projeto já tem `useAsyncData`, que deriva `loading`/`error` de uma chave (`deps` + `nonce`) e faz o `setState` apenas no callback assíncrono. As três páginas passaram a usar esse hook; a seleção pré-vinda de `location.state` em `AnimalFormPage` virou inicializador de `useState` (o efeito agora só evita buscar vínculos quando essa seleção já existe), e o turno aberto/fechado local em `ShiftPage` virou um override chaveado por `currentRetry`, preservando o comportamento sem refetch extra.
  2. **`react-refresh/only-export-components` (1 erro):** `formatDuration` era exportado de `ShiftPage.tsx`; foi extraído para `src/features/staff/utils/formatShift.ts` com teste próprio (`formatShift.test.ts`, TDD: RED por módulo ausente → GREEN).
  - Ajuste colateral: `csv.test.ts` usava um parâmetro `_blob` nunca lido (erro `@typescript-eslint/no-unused-vars`); o parâmetro foi mantido para a inferência do mock e referenciado com `void blob`, já que o valor é inspecionado via `mock.calls[0][0]`.
- **Nenhuma regra de lint foi desabilitada** e nenhum `eslint-disable` foi adicionado. Nenhuma frente de refatoração foi aberta: mudanças restritas a 4 páginas/testes + 2 arquivos novos de util, comportamento preservado pelos testes existentes (14 de `AnimalFormPage`, 9 de `ShiftPage`/`formatDuration` e os de `FeedingPointsAdminPage`).
- **Aceite:** build concluído, lint sem erro, `tsc` limpo, suíte verde.

