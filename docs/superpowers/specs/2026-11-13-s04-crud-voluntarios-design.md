# S04 — CRUD de voluntários (ficha + polimento) Design

**Data:** 2026-11-13
**Autor:** brainstorming colaborativo (Gabriel + OpenCode)
**Cronograma:** S04, Tarefa A — "CRUD de voluntários"
**Plano de execução:** `docs/superpowers/plans/2026-11-13-s04-crud-voluntarios.md`

## Intenção

O CRUD de membros já tem cadastro (`/painel/membros/novo`), listagem com filtro
por papel (`/painel/membros`) e edição (`/painel/membros/:id/editar`). Falta a
**leitura dedicada** — hoje o único jeito de ver os dados completos de um membro
é abrir o formulário de edição — e falta polimento na busca e nos estados da
lista.

A S04 fecha o ciclo cadastro → listagem → ficha → edição com a mesma linguagem
visual do painel, sem tocar na API e sem exclusão.

**Exclusão está fora de escopo.** O DVP prevê apenas F1.1 (registrar),
F1.16 (editar) e F2.2 (listar); a API provisória não expõe `DELETE /members`.
Apagar um membro também teria efeitos colaterais no Supabase Auth e nas
referências de animais.

## Objetivos

- Criar a ficha somente leitura do membro em `/painel/membros/:id`, acessível
  pelo nome na lista e por uma ação **Ver**.
- Melhorar a lista com busca por nome/e-mail, contagem de resultados e estados
  vazios específicos (sem resultados vs. lista vazia).
- Ligar ficha ↔ edição: **Editar** na ficha e **Ver ficha** no formulário de
  edição.
- Cobrir os novos fluxos com testes de página.
- Fazer QA fim a fim com Playwright em 1280/768/360 (lista, busca, ficha,
  edição e criação) antes de encerrar a tarefa.

## Não-objetivos

- Exclusão de membro (frontend ou API).
- Alterar contratos da API, `memberService` ou backend.
- Paginação (a lista continua com `limit: 100`; a API aceita até 200).
- Lista em cartões no mobile — a tabela mantém rolagem horizontal acessível;
  a revisão ampla de responsividade é da S09.
- Renomear "Membros da equipe"/"Membros" para "Voluntários": o rótulo é o
  guarda-chuva dos quatro papéis.
- Dark mode, i18n ou redesign do formulário.

## Abordagens consideradas

### A — Ficha + polimento do fluxo (escolhida)

Nova página de detalhe _read-only_ reutilizando `PageHead`, `Panel`, `Alert` e
`EmptyState`; busca e contagem na lista; link entre ficha e formulário; testes
e QA. Trades: entrega a leitura que falta sem duplicar a tabela nem antecipar a
S09; custo moderado de rota, testes e estados novos.

### B — A + cartões no mobile

Tudo de A e, abaixo de 640px, a tabela vira cartões. Preterida: mais markup e
testes para um problema que a S09 já vai revisar; a tabela com scroll atende
agora.

### C — Sem ficha

Só busca, contagem, estados, testes e QA. Preterida: não entrega a "ficha do
voluntário" e deixa a leitura dependente do formulário de edição.

## Decisões de design

### Rota e permissão

- Nova rota `membros/:id` dentro do bloco `ADMIN_ROLES` existente em
  `src/app/router.tsx`, ao lado de `membros` e `membros/novo`.
- Arquivo novo: `src/features/staff/pages/MemberDetailPage.tsx`.
- Mesma proteção de papel da lista (`administrador`, `coordenador`).

### Ficha (`MemberDetailPage`)

- `PageHead` com o nome do membro como título e o papel como selo ao lado;
  ações **Editar** (para `/painel/membros/:id/editar`) e **Voltar**.
- Um `Panel` com duas seções em lista de definição (`dl`/`dt`/`dd`):
  - **Dados pessoais:** e-mail, CPF (via `formatCpf`), data de nascimento
    (via `formatDate`).
  - **Vínculo:** papel (via `ROLE_LABEL`), matrícula Ufopa, entrada no projeto,
    dias de alimentação.
- Campos vazios aparecem como `—`, padrão das outras listas.
- Carregamento: `EmptyState` "Carregando membro...".
- Erro genérico: `Alert` danger com a mensagem e link **Voltar para membros**.
- 404: estado dedicado "Não encontramos este membro." com o mesmo caminho de
  volta. Implementação: o loader do `useAsyncData` converte `HttpError` 404 em
  `null`; `null` após carregar significa não encontrado, sem confundir com
  falha de rede.
- Sem botão de excluir. Sem edição inline.

### Lista (`MembersAdminPage`)

- Busca client-side por **nome ou e-mail**, insensível a caixa e a acentos,
  aplicada sobre os itens já carregados. Campo `TextField` com `type="search"`
  e rótulo "Buscar" ao lado do filtro de papel, em um grid responsivo.
- Contagem discreta acima da tabela: "N membros" quando não há filtro/busca;
  "N de M membros" quando há. Texto no singular/plural correto.
- Nome do membro vira link para `/painel/membros/:id`; a coluna de ações ganha
  **Ver** antes de **Editar** (mesmo estilo de botão secundário).
- Estados vazios:
  - sem membros (lista vazia): "Nenhum membro cadastrado ainda." + CTA para
    cadastrar;
  - filtro/busca sem resultado: "Nenhum membro encontrado para esta busca."
    com ação **Limpar filtros**.
- A rolagem horizontal da tabela continua com `role="region"`, `tabIndex={0}` e
  `aria-label` atuais.

### Formulário (`MemberFormPage`)

- No modo edição, adicionar **Ver ficha** (link `/painel/membros/:id`) junto de
  **Cancelar**, ou no cabeçalho, sem alterar o fluxo de salvar.
- Salvar continua navegando para `/painel/membros` (consistente com
  `AnimalFormPage`).

### Acessibilidade e responsividade

- Foco visível em todos os links/botões novos, 44px de altura mínima.
- `dl` semântica na ficha; selo de papel com texto legível.
- Busca com rótulo associado; contagem em `aria-live="polite"` para leitores de
  tela.
- Em 360px, filtro e busca empilham; a ficha vira uma coluna; a tabela rola
  horizontalmente sem quebrar o layout.

### Testes

- Novo `MemberDetailPage.test.tsx`: carregando, sucesso (todos os campos e
  links), erro genérico, 404 e campos vazios.
- `MembersAdminPage.test.tsx`: busca por nome e por e-mail, busca sem
  resultado + limpar, contagem, link do nome e ação **Ver**.
- `MemberFormPage.test.tsx`: **Ver ficha** visível só na edição.
- Rodar a suíte completa ao final e confirmar que o resultado é verde de fato
  (o comando de baseline já terminou com exit code 1 apesar de 153 testes
  passarem — investigar antes de declarar sucesso).

### QA com Playwright

- Subir a API local (TempDB) e o frontend; autenticar como administrador.
- Validar em 1280, 768 e 360: lista, busca (com e sem resultado), ficha,
  edição com retorno para a lista e cadastro de um membro de teste.
- Conferir console sem erros e ausência de overflow horizontal indevido.

## Pendências para o plano

- Nenhuma decisão de produto em aberto; o plano deve detalhar arquivos,
  assinaturas, testes por comportamento e comandos de verificação.
