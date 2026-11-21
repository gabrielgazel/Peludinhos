# D5.7 — Migrar as telas de autenticação para o design system — Design (curto)

## Intenção

A home e o painel já usam tokens `paper`/`ink`/`marker` e os componentes
compartilhados (`Button`, `Card`, `Badge`). Login, Recuperar senha e Redefinir
senha ainda usam `Login.css` próprio — a primeira impressão da banca fica
visualmente fora do resto do produto. Migrar as três telas elimina essa
inconsistência sem mudar o que o sistema faz.

## Objetivos

1. Reescrever `LoginPage`, `ForgotPasswordPage` e `ResetPasswordPage` com
   `Card`/`Button` de `src/shared/ui`, campos `.tf*` de `form-controls.css` e
   utilitários Tailwind dos tokens atuais.
2. Preservar comportamento, estados de carregamento e todas as mensagens de erro
   e sucesso (inclusive a resposta neutra de recuperação).
3. Manter os testes existentes; ajustar seletores só quando a marcação mudar.
4. QA em 360/768/1280, com foco em alvos de toque e contraste.

## Não-objetivos e anti-objetivos

- Não mudar rotas, contrato de API, serviços de autenticação nem mensagens.
- Não criar novo componente abstrato (`AuthShell`) — decisão 1 abaixo.
- Não mexer em migrations, seed ou no backend TempDB.
- Não mover as tags `v0.5-demo` / `v0.5.1`.
- Não alterar outras páginas além das três de autenticação.

## Restrições

- Tarefa D5.7 é **opcional e descartável**: se atrasar, volta-se atrás sem
  prejuízo funcional.
- Worktree: `C:/Users/gabri/.local/share/opencode/worktree/6a3308/s04-crud-voluntarios`,
  branch `feat/s05-operacao` (já mesclada em `main` local, que segue à frente do
  remote). Não mexer no checkout principal em `main`.
- `Login.css` é importado pelas três páginas; sai junto com a migração.
- Documentação e mensagens em português; commit convencional; TDD antes do código.
- Verificação do roadmap: `vitest run`, `tsc -b` e inspeção visual.

## Abordagens

| Abordagem | Trade-off | Decisão |
| --- | --- | --- |
| Reescrita direta das três páginas com componentes e utilitários atuais | Simples, ~45 min, sem abstração nova; exige cuidado com os estados das três telas | **Escolhida pelo usuário** |
| `AuthShell` compartilhado (marca/cabeçalho/cartão extraídos) | Menos duplicação e consistência por construção; cria componente e testes novos, custo maior para tarefa opcional | Rejeitada |

## Decisões já tomadas

- Usar `Card` como container, com cabeçalho em `bg-marker` e marca com `PawIcon`.
- Usar `Button` para “Entrar”, “Enviar instruções”, “Redefinir senha” e links
  de retorno (`asChild` quando o destino é um `Link`).
- Campos mantêm `.tf`/`.tf__label`/`.tf__input` (estilo de formulário já
  compartilhado); o toggle de senha vira `Button` com `variant="link"`.
- `Login.css` é removido; nenhum CSS novo de página é adicionado.
- Os testes atuais (`LoginPage.test.tsx`) são preservados; a cobertura nova
  protege o envio e as mensagens antes da reescrita.

## A critério do implementador

- Classes utilitárias exatas e o ajuste de seletores dos testes.
- Como verificar no jsdom que as três páginas usam os componentes/tokens.
- Execução da inspeção em 360/768/1280 com `playwright-cli`.
