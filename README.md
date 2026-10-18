# Peludinhos (frontend)

Interface web do projeto Peludinhos: vitrine pública de animais para adoção e
área interna para a equipe gerenciar animais, intenções de adoção e membros.

## Stack

- React 19 + TypeScript + Vite
- React Router
- CSS próprio com tokens globais (sem framework de UI)

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

## Scripts

| Script           | Descrição                              |
| ---------------- | -------------------------------------- |
| `bun run dev`    | Servidor de desenvolvimento (Vite)     |
| `bun run build`  | Checagem de tipos + build de produção  |
| `bun run lint`   | ESLint em todo o projeto               |
| `bun run preview`| Pré-visualiza o build de produção      |

## Rotas

Públicas (layout `PublicLayout`):

- `/` — início
- `/sobre` — sobre o projeto
- `/adocao` — listagem de animais disponíveis
- `/adocao/:id` — detalhe do animal
- `/adocao/:id/intencao` — manifestação de interesse

Autenticação:

- `/login` — acesso (redireciona: visitante → `/`, equipe → `/painel`)

Área da equipe (`/painel`, exige `membro`; sub-rotas admin exigem
`administrador`):

- `/painel` — painel geral
- `/painel/animais` — gestão de animais
- `/painel/animais/novo`, `/painel/animais/:id/editar` — cadastro/edição
- `/painel/intencoes` — avaliação das intenções de adoção
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
- Mapeamento entre os contratos da API (snake_case) e os tipos do app está nos
  `services` de cada feature.

## Estrutura

```
src/
  app/            # roteador e composição
  features/       # auth, animals, adoption, staff, public
  shared/         # api, components, hooks, layouts, routes, types, utils
```
