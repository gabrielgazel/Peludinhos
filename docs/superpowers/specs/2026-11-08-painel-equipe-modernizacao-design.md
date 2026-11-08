# Painel da equipe — Renovação visual Design

**Data:** 2026-11-08
**Autor:** brainstorming colaborativo (Gabriel + OpenCode)
**Plano de execução:** `docs/superpowers/plans/2026-11-08-painel-equipe-modernizacao.md`

## Intenção

O painel da equipe (`/painel`) é a área operacional do projeto Peludinhos: membros
registram animais, avaliam intenções de adoção e (para administradores)
gerenciam membros. Hoje o visual é funcional mas desatualizado e heterogêneo:
topbar laranja com o conteúdo central em branco aplicado por `staff.css`, fora do
sistema visual da home modernizada. O objetivo é a **renovação visual do painel
inteiro**, mantendo estrutura, dados e comportamento exatamente como estão.

## Objetivos

- Dar ao painel uma aparência **neutra e sóbria**, inspirada na linguagem do
  GitHub, com superfícies claras e quase sem acento (referência: GitHub).
- Deixar a casca coerente: topbar + sidebar (rótulos em seções) + área de
  conteúdo como único esqueleto,herdado pelas sete páginas.
- Aplicar o mesmo **padrão técnico da home modernizada**: Tailwind v4,
  primitivas em `src/shared/ui`, tokens `@theme`, utilitário `cn`, foco visível
  AA, motion com respeito a `prefers-reduced-motion`, testes automatizados.
- 100% de paridade funcional: mesma rota, mesma lógica, mesmos dados, mesmos
  papéis (administrador/coordenador/bolsista/voluntário), mesmos textos.

## Não-objetivos

- Nenhuma mudança em contratos com a API (`animalService`, `adoptionService`,
  `memberService`), hooks de dados, modais, `window.confirm`, mensagens de erro
  e fluxos de permissão.
- Nenhum redesenho de `/login` nem das páginas públicas.
- Sem nova IA de navegação (sidebar permanece com os mesmos itens: Visão
  geral, Animais, Intenções, Membros — este último só admins).
- Sem dark mode, sem i18n, sem E2E novo.
- 21st.dev **apenas como referência de design**; nada de código gerado no projeto.

## Abordagens consideradas

### 1. Casca primeiro (escolhida)
Reconstruir primeiro a moldura (`StaffLayout`, topbar, sidebar, headings,
alertas, painéis) com o novo visual e os componentes compartilhados, e depois
o restante das páginas apenas adota a moldura, mantendo estrutura e lógica.

Trades considerados: 
- Coerência garantida cedo; as páginas só migram depois.
- A moldura é maior que o necessário num primeiro momento (ComponentesPageHead,
  etc.), mas evita retrabalho de página e mantém o painel funcional a cada commit.

### 2. Biblioteca primeiro
Primitiva compartilhada → páginas uma a uma. Preterida: a moldura só fica
uniforme no fim, com o risco de tela “inacabada” no meio do processo — e o
requisito central aqui é homogeneidade.

### 3. Reimaginar a organização
Trocar hierarquia ou agrupamento. Preterida: viola o "só visual" e mexe no fluxo
que deve ser preservado. Mantida a IA atual (Visão geral / Animais / Intenções /
Membros).

## Decisões de design

### Direção visual — "Cinza quente da casa"

Contexto: a marca Peludinhos tem vermelho-laranja-marrom. Na home, essa paleta
aguça o afeto. No painel, o pedido foi neutralidade mantendo a cara do
projeto:

| Papel | Valor | Uso |
| --- | --- | --- |
| Fundo | `#FAF7F4` | página |
| Superfície | `#FFFFFF` | topbar, cards, painéis, tabelas |
| Linha | `#E4D8D0` | bordas, divisórias |
| Tinta | `#2B2927` | texto principal |
| Tinta suave | `#6B5B52` | metadados, muted |
| Tinta leve | `#A8978B` | labels de seção da sidebar, placeholder |
| Acento | `#C97638` | estados ativos discretos, programação visual mínima |
| Acento-soft | `#F6DCC8` | fundos de item ativo |
| Sucesso | `#7BAE7F` (discreto) | badges de sucesso |
| Perigo | `#B3261E` | avisos / destrutivo |

Sem gradientes. Sombras quase ausentes (no máximo uma elevação sutil no
topbar/dropdown). Raios ~10–12px. Tabelas e dados em monospace apenas onde
puder convir (números/detalhes técnicos opcionais), sem obrigação.

### Estrutura ("opção A")

- **Topbar** (sticky, 56–64px, fundo branco com borda inferior): marca + tag
  "Painel", à direita nome do membro, papel como pill e **Sair**. Sem laranja
  em destaque.
- **Sidebar** fixa à esquerda (~220px), grupos rótulos em caixa-alta pequenina
  ("Geral" / "Equipe"), itens com ícone + rótulo, item ativo com fundo
  `#F6DCC8` e texto `#C97638`; `aria-current="page"`; foco visível; colapsa para
  cabeçalho ou menu off-canvas no mobile. Membros só se `isAdmin`.
- **Conteúdo**: container central com `padding-block: clamp(...)` reutilizando a
  cadência da home (`clamp(28px, 4vw, 48px)` por linha/gap), max-width ~1240px,
  grid de 12 colunas.
- **Stat cards** (Visão geral): 3 células, borda sutil, valor em peso 700,
  rótulo muted — sem ícones gigantes, sem gradiente.
- **Listas** continuam em **tabela** (Animais, Membros); Intenções em **cards**
  existentes, reskinados.
- **Estados vazios / carregando / erro** consistentes entre as páginas.
- **Cabeçalhos de página** (`page-head`): título + subtítulo curto + CTA alinhado.
- **Aviso (`alert`)**: caixa com borda; destrutivo só para ação irreversível.
- **Badges** dos animais/intenções usando os tons existentes de
  `utils/badges.ts` mapeados aos tokens novos (discreto).

### Tipografia

**B — só Source Sans 3** em todo o painel (400/600/700). Averia Libre não entra
(exceção permitida apenas no logo/marca). Corpo 14–16px; tabelas 12–14px;
rótulos de seção da sidebar em caixa-alta 11px.

### Padrão técnico

- `staff.css` **desaparece**: após a migração, o QA deve confirmar zero
  referência a `staff.css`, `page-head`, `stat-card`, `btn`, `panel`,
  `filter-bar`, `alert`, `empty-state`, `intent-card`, `data-table`,
  `table-scroll`, `staff-*` etc. nos estágios de migração correspondentes.
- Tokens `staff-*` definidos em `@theme` em `src/index.css` (ex.:
  `--color-staff-bg`, `--color-staff-surface`, `--color-staff-line`, ...).
- Primitivas reutilizadas: `Button`, `Card`, `Badge`, `Table`, `Input`, etc.
  copiados para `src/shared/ui` conforme a necessidade de cada página.
  `SelectField`, `TextField`, `CheckboxField` são reskinados, mantendo a API
  pública (mesmas props) ou migrados para as primitivas correspondentes.
- Foco visível 2–3px offset; contraste AA garantido em todos os textos e pills;
  respeitar `prefers-reduced-motion` em qualquer animação residual.
- Sem `flushSync`, sem observers novos a menos que necessário.

### Acessibilidade

- Sidebar: `nav` com `aria-label`; `aria-current="page"` no item ativo.
- Landmark único `<main>` por página.
- Botões de ação com texto explícito; ícones com `aria-hidden`.
- Alvos de toque ≥ 44px no mobile.
- Tabelas com `<th scope="col">`; cabeçalho sticky opcional a decidir pelo
  builder (não obrigatório).

### Testes

- Manter destacadamente o conjunto existente (suite atual verde, incluindo os
  testes de `PublicHomePage`).
- Cada página migrada atualiza/expande testes (markup + papéis).
- Rodada de QA manual no navegador com Playwright em 1280/768/360 antes da
  entrega, como na home.

### Fora da lista (não entram)

- Nada da home; nada de `src/features/public`; nada de rotas; nada de conteúdo.

## Pendências para o plano

- Uma confirmação visual do shell completo (mockup finalizado) antes da
  implementação, se o Gabriel pedir; espera-se que ele aceite a proposta A
  descrita aqui.

## Decisões validadas em mockups (navegador, 2026-11-08)

- Direção visual escolhida pelo Gabriel: **C — "Cinza quente da casa"**
  (superfícies claras #FAF7F4/#FFFFFF, acento #C97638 discreto).
- Estrutura escolhida: **A — sidebar à esquerda com ícone+rótulo e seções**
  ("Geral" / "Equipe", Membros só para admin), topbar branca com marca + membro
  + papel + Sair.
- Tipografia escolhida: **B — só Source Sans 3** em todo o painel (Averia Libre
  fica restrita à marca).
- Sessão de mockups em `.superpowers/brainstorm/2028-1794114016/content/`
  (`visual-style.html`, `shell.html`, `type.html`, `waiting.html`).
