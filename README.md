# Peludinhos (frontend)

Interface web do projeto Peludinhos: vitrine pública de animais para adoção e
área interna para a equipe gerenciar animais, intenções de adoção, pontos de
alimentação, turnos, ocorrências, ração e relatórios.

## Stack

- React 19 + TypeScript + Vite
- React Router
- CSS próprio com tokens globais (sem framework de UI)

## O que a demo faz

A apresentação de 10 minutos percorre oito blocos: home pública; catálogo,
detalhe e intenção de adoção com autocadastro; login da equipe e painel;
animais (busca, ficha, foto e óbito); pontos de alimentação e vínculo com
animais; turno (iniciar, encerrar, histórico); ocorrência e ração (20 kg
comprados, 5 kg consumidos, saldo de 15 kg); e os três relatórios reais com
exportação CSV. O roteiro completo, com plano B e tempos medidos, está em
`docs/roteiro-demo.md`; o passo a passo para quem usa o sistema está em
`docs/manual-do-usuario.md`.

## O que é demonstração ou está pendente

| Item | Como apresentar |
| --- | --- |
| Insumos (medicamentos e produtos) | Cadastro de medicamentos e produtos; persistência dependente da API (ver `docs/backlog/tarefas-api-tempdb.md`). |
| Termo de adoção | Prévia com marca d’água; o registro definitivo está no backlog B3. |
| Relatórios 4–6 | Marcados como **Planejado**; são o backlog B4, não relatório pronto. |
| Recuperação de senha | A tela é real, mas o envio de e-mail depende de servidor de e-mail e **não é simulado**. O teste com e-mail real (D4.3) segue pendente. |
| Contas de demonstração | `*.demo@peludinhos.example`, senha pública `Demo@12345`, válidas somente neste ambiente. |

Nada marcado como demonstração (termo e relatórios 4–6) deve ser usado como
registro definitivo.

## Como rodar

1. Instale as dependências:

   ```bash
   bun install
   ```

2. Configure a URL da API. Copie `.env.example` para `.env` e ajuste se
   necessário:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```

3. Suba o servidor de desenvolvimento:

   ```bash
   bun run dev
   ```

   A API provisória precisa estar rodando em `http://127.0.0.1:8000` (recursos
   sob `/api`).

## Como rodar a demo

1. Suba a API no repositório do backend (TempDB) em `127.0.0.1:8000`:

   ```bash
   .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

   Confira `http://127.0.0.1:8000/health` → `{"status":"ok"}`.

2. Reaplique o seed idempotente antes de cada ensaio (ainda no TempDB):

   ```bash
   .venv\Scripts\python.exe scripts\seed_demo.py
   ```

   O seed nunca apaga dados. Antes de repetir um ensaio, remova apenas os
   registros com sufixo `Ensaio 1`/`Ensaio 2`, visitantes `adotante.ensaio%` e
   turnos de ensaio, conforme o `docs/roteiro-demo.md`.

3. Suba o build de produção do frontend em `127.0.0.1:4173`:

   ```bash
   bun run build
   bun run preview -- --host 127.0.0.1 --port 4173
   ```

   Confira `http://127.0.0.1:4173/adocao` → HTTP 200 e abra
   `http://127.0.0.1:4173/` para seguir o roteiro.

4. Comandos de verificação sem `bun` (os usados na validação do build):

   ```bash
   node .\node_modules\vitest\vitest.mjs run
   node .\node_modules\typescript\bin\tsc -b
   node .\node_modules\vite\bin\vite.js build
   node .\node_modules\eslint\bin\eslint.js .
   ```

## Scripts

| Script            | Descrição                              |
| ----------------- | -------------------------------------- |
| `bun run dev`     | Servidor de desenvolvimento (Vite)     |
| `bun run build`   | Checagem de tipos + build de produção  |
| `bun run lint`    | ESLint em todo o projeto               |
| `bun run preview` | Pré-visualiza o build de produção      |
| `bun run test`    | Vitest (testes unitários e de página)  |

## Rotas

Públicas (layout `PublicLayout`):

- `/` — início (apresenta o projeto: hero, pilares, adoção e contato)
- `/adocao` — listagem de animais disponíveis
- `/adocao/:id` — detalhe do animal
- `/adocao/:id/intencao` — manifestação de interesse
- `/sobre` — redireciona para `/#projeto` (rota antiga, sem página própria)
- `/nao-autorizado` — acesso negado

Autenticação:

- `/login` — acesso (redireciona: visitante → `/`, equipe → `/painel`)
- `/recuperar-senha` — solicitação de nova senha (sem e-mail simulado)
- `/redefinir-senha` — redefinição a partir do link enviado pelo servidor de e-mail

Área da equipe (`/painel`, exige `membro`; sub-rotas admin exigem
`administrador`):

- `/painel` — painel geral e cartão “Meu turno”
- `/painel/animais` — gestão de animais
- `/painel/animais/novo`, `/painel/animais/:id/editar` — cadastro/edição (admin)
- `/painel/animais/:id` — ficha interna do animal com abas **Dados** e **Saúde**
  (histórico, vacinação e receitas); persistência dependente da API pendente
  (`docs/backlog/tarefas-api-tempdb.md`); abra pelo botão **Ver ficha** na
  listagem
- `/painel/operacao/pontos` — pontos de alimentação e vínculo com animais
- `/painel/operacao/turnos` — turnos
- `/painel/operacao/ocorrencias` — ocorrências
- `/painel/operacao/racao` — compra, consumo e saldo de ração
- `/painel/insumos` — medicamentos e produtos: listar, criar e editar (criar e
  editar só para administração); persistência dependente da API pendente
  (`docs/backlog/tarefas-api-tempdb.md`)
- `/painel/intencoes` — avaliação das intenções de adoção
- `/painel/relatorios` — relatórios 1–3 reais; 4–6 como **Planejado**
- `/painel/membros`, `/painel/membros/:id` — gestão de membros (admin)

## Integração com a API

- Cliente HTTP em `src/shared/api/httpsClient.ts`: injeta o token de acesso,
  trata erros `{ detail }` do FastAPI, responde a 204 e renova o token
  automaticamente em respostas `401` com `refresh token`.
- Tokens (`access`/`refresh`) são persistidos em `localStorage` e renovados no
  `AuthContext`.
- Fluxo de intenção de adoção: visitante não autenticado registra conta
  (visitante + endereço) e envia a intenção em uma única tela; visitante já
  autenticado envia apenas a motivação.
- Fotografias dos animais: o upload é feito no cadastro/edição (somente
  administração) via `POST /animals/{id}/photo` (multipart) e a remoção via
  `DELETE`; a URL pública chega em `Animal.photoUrl` e é exibida no catálogo, no
  detalhe e na listagem do painel.
- Mapeamento entre os contratos da API (snake_case) e os tipos do app está nos
  `services` de cada feature.

## Estrutura

```
src/
  app/            # roteador e composição
  features/       # auth, animals, adoption, staff, public
  shared/         # api, components, hooks, layouts, routes, types, utils
```
