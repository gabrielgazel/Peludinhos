# Modernização da Homepage — Design

**Data:** 2026-11-04
**Status:** aguardando aprovação

## Intenção

A home do Peludinhos hoje cumpre o papel, mas usa um kit de cartões genéricos:
mesmo raio, mesma borda, mesma sombra em todas as seções, hero sem imagem real
e nenhum momento visual próprio. Quem chega não sente que existem animais
concretos esperando por perto.

A modernização mantém a identidade do projeto — paleta quente, Averia Libre +
Source Sans 3, tom acolhedor e institucional — e troca a execução por uma
composição contemporânea, com componentes reutilizáveis, imagens reais dos
animais e movimento discreto.

**Conceito visual: "mural do campus".** A página deve parecer um mural de
recados afixado no campus da UFOPA: papel creme, tinta marrom, fotos de bichos
presas com leve rotação, etiquetas escritas à mão. Não deve parecer um SaaS com
tema laranja.

**Quem chega e o que precisa acontecer:** estudante, servidor ou morador de
Santarém que vê um bicho no campus e quer ajudar ou adotar. Em até 5 segundos
precisa entender (a) o que é o Peludinhos, (b) que há animais disponíveis agora
e (c) como começar a adoção.

## Objetivos

1. Home visualmente atual, com hero editorial que usa **fotos reais** dos
   animais da API, não ilustração genérica.
2. Componentes reutilizáveis (botão, badge, card, carrossel) com acessibilidade
   de teclado e foco visível.
3. Hierarquia clara entre as cinco seções atuais, sem perder nenhum conteúdo
   institucional (pilares, lei 9.605/98, local, contato, fonte).
4. Estados de carregamento, vazio e erro dos animais tratados com o mesmo
   cuidado visual das seções.
5. Motion discreto e orquestrado, desligado em `prefers-reduced-motion`.
6. Build, lint e checagem de tipos passando; layout íntegro em 360, 768 e
   1280 px.

## Não-objetivos

- Redesenhar as demais páginas (`/adocao`, detalhe, intenção, login, painel).
  O layout público recebe apenas um ajuste leve de cabeçalho/rodapé para não
  destoar da nova home.
- Mudar rotas, contratos da API, regras de autenticação ou conteúdo jurídico.
- Semear fotos no banco, criar backend ou mock permanente em produção.
- Dark mode, internacionalização, novos testes E2E permanentes.

## Anti-objetivos

- Perder a identidade: se ao final parecer um template SaaS genérico, falhou.
- Excesso de movimento: nada de reveal em cada cartão, parallax ou hover em
  tudo. Um momento de entrada e um carrossel; o resto é estático.
- Dependência pesada só por moda: nada de framer-motion/GSAP para o que CSS e
  IntersectionObserver resolvem.
- Contraste insuficiente: laranja `#E08A4E` **não** é usado como cor de texto
  sobre creme (≈2,4:1). Laranja é preenchimento; texto sobre ele é tinta escura.
- Cards idênticos empilhados: variação de raio, escala e alinhamento conforme
  a hierarquia.

## Restrições técnicas

- React 19, TypeScript, Vite 8, Tailwind v4, React Router 7. Já instalados.
- Tokens atuais em `src/index.css`; tokens `--pub-*` em
  `src/shared/layouts/PublicLayout.css` são usados por todas as páginas
  públicas — **não podem ser removidos nem ter valor alterado**.
- Tailwind v4 sem `tailwind.config.js`; tema declarado via `@theme` no CSS.
- Não há alias `@/` configurado. O plano precisa criar alias em
  `tsconfig.app.json` + `vite.config.ts` se shadcn/ui for adotado.
- Não há framework de testes. Para o ciclo TDD, adicionar Vitest + Testing
  Library apenas para lógica de hooks/utilitários e comportamento do carrossel.
- A API local está offline no ambiente de validação. O Playwright vai
  interceptar `**/api/animals*` com um fixture; nenhum mock entra no código de
  produção. O fixture usa URLs de imagem estáveis de CDN pública apenas para a
  checagem visual; se uma imagem falhar, o fallback de pata do
  `AnimalPhoto` cobre o layout, e a validação continua medindo hierarquia,
  espaçamento e responsividade.
- **21st.dev está no plano free**: geração por IA desabilitada
  (`aiGenerationEnabled: false`) e 2 recuperações de código restantes hoje.
  Portanto: usar busca/inspiração (grátis) como referência de composição e
  recuperar no máximo 2 componentes de código para adaptar — sem copiar
  dependências cegamente.

## Abordagens consideradas

1. **Tailwind + shadcn/ui + composições 21st.dev (escolhida).** Instala a base
   do shadcn (sem CLI global, componentes copiados para `src/shared/ui`), mapeia
   os tokens da identidade e compõe as seções com utilitários. Entrega
   acessibilidade via Radix e um vocabulário de componentes reutilizável.
   Custo: algumas dependências (`clsx`, `tailwind-merge`,
   `class-variance-authority`, `@radix-ui/react-slot`, `embla-carousel-react`)
   e reescrita integral da home.
2. **Só Tailwind + primitivas próprias.** Mesmo desenho, sem Radix. Bundle
   menor e controle total; mais tempo e risco de furos de acessibilidade.
3. **Evoluir o CSS atual.** Menor diff, mas não entrega componentes atuais nem
   reuso — contraria o pedido.

**Decisão do parceiro:** abordagem 1, mantendo a identidade visual.

## Sistema visual

### Cores

| Papel | Token | Valor | Uso |
| --- | --- | --- | --- |
| Papel | `paper` | `#F5EBE6` | fundo da página |
| Cartão | `card` | `#FFFAF6` | superfícies elevadas |
| Tinta | `ink` | `#2B2927` | texto e seção escura |
| Tinta suave | `ink-soft` | `#4A3C35` | seção de contato (marrom profundo) |
| Marrom | `muted` | `#6B5B52` | texto secundário |
| Laranja | `marker` | `#E08A4E` | CTA, destaque, marcador |
| Laranja escuro | `marker-hover` | `#C97638` | hover do CTA |
| Laranja claro | `marker-soft` | `#F6DCC8` | fundos de ícone |
| Verde | `leaf` | `#7BAE7F` | selo "disponível", apoio |
| Verde claro | `leaf-soft` | `#DCEBDC` | fundos de ícone |
| Borda | `line` | `rgba(107,91,82,0.28)` | contornos de 1px |

Sem gradientes decorativos. A profundidade vem de sobreposição de papel,
bordas e uma única sombra quente na pilha de fotos do hero.

### Tipografia

- Display: **Averia Libre** 700. Usada em títulos de seção, nomes de animais e
  números da timeline. Tamanhos: hero `clamp(44px, 6.4vw, 72px)` com
  `line-height: 0.98` e `letter-spacing: -0.025em`; seção 34–40px; nome de
  card 22px.
- Corpo: **Source Sans 3** 400/600/700. Lead 19–20px com no máximo 60ch;
  corpo 16–17px/1.6; rótulos 14px.
- Sem caixa-alta em rótulos. Sem itálico decorativo em palavra do título.
- Uma única família display e uma de corpo; nada de fonte nova.

### Layout

Largura máxima 1120px (a atual é 1080; o hero ganha respiro). Grade de 12
colunas no desktop; gutter 24px; seções com `padding-block: clamp(56px, 8vw, 96px)`.

```
DESKTOP
┌──────────────────────────────────────────────────────────────┐
│ 🐾 Peludinhos          O projeto   Animais   [Quero adotar]  │
├──────────────────────────────────────────────────────────────┤
│  (selo Adoções abertas)              ╭───────╮               │
│  Todo peludinho                      │ foto  │  ╭───────╮    │
│  merece um lar.        ← 72px        │ Mel   │  │ foto  │    │
│                                      ╰───────╯  │ Thor  │    │
│  lead curto, 52ch                              ╰───────╯    │
│  [Conhecer os peludinhos] [Como funciona]     ╭───────╮      │
│  3 esperando agora · Campus Santarém          │ foto  │      │
│                                               ╰───────╯      │
├──────────────────────────────────────────────────────────────┤
│ ▸ alimentação · saúde · castração · adoção responsável (fita)│
├──────────────────────────────────────────────────────────────┤
│  O projeto                                                   │
│  ┌──────────────────────┐ ┌────────┐ ┌────────┐             │
│  │ Cuidados diários     │ │ Ações  │ │Controle│             │
│  │ (tile grande)        │ │coletivas│ │populac.│             │
│  └──────────────────────┘ └────────┘ └────────┘             │
│                          ┌────────────────────┐              │
│                          │ Conscientização    │              │
│                          └────────────────────┘              │
├──────────────────────────────────────────────────────────────┤
│  Como funciona a adoção                                      │
│  ①───────────────②───────────────③                           │
├──────────────────────────────────────────────────────────────┤
│  Quem está esperando            [←] [→]   Ver todos          │
│  ┌────────┐ ┌────────┐ ┌────────┐  → scroll-snap             │
│  └────────┘ └────────┘ └────────┘                            │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Venha nos visitar (marrom profundo)                    │  │
│  │ Local          Contato            Fonte                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

No mobile tudo vira uma coluna; a pilha de fotos vira um leque horizontal
compacto (3 cards sobrepostos, sem rotação excessiva); a timeline fica vertical
com a linha à esquerda.

### Princípios

1. **Papel, não vidro.** Superfícies opacas, bordas finas, sombra só onde algo
   está "preso" (fotos do hero).
2. **Foto é conteúdo.** O hero e os cards mostram bichos reais; fallback com
   pata só quando não há foto.
3. **Um gesto ousado.** A pilha de fotos rotacionadas do hero é o momento
   memorável. Todo o resto é disciplinado.
4. **Assimetria com intenção.** Bento do projeto quebra a grade de cards
   iguais; nada de 4 caixas idênticas.
5. **Movimento responde, não enfeita.** Entrada do hero + reveal de seções;
   hover só eleva o que é clicável.

## Especificação por seção

### 1. Cabeçalho (ajuste leve em `PublicLayout`)

- Mantém estrutura e navegação atuais.
- Fundo `paper` com `backdrop-filter: blur(8px)` e transparência de 88%,
  borda inferior `line`.
- Link "Animais" adicionado ao lado de "O projeto" (leva a `/adocao`).
- CTA "Quero adotar" mantém `/adocao`.
- Em mobile, o painel desdobrável existente é preservado; apenas herda as
  cores novas.

### 2. Hero

- Grade 2 colunas (`1.05fr / 0.95fr`), alinhamento central, gap 56px.
- Coluna esquerda:
  - Selo `Adoções abertas` com ponto verde pulsante (pausa em reduced motion).
  - H1 "Todo peludinho merece um lar" (sem destaque de palavra).
  - Lead de até 3 linhas, derivado do texto atual, foco em cuidado + adoção.
  - CTA primário "Conhecer os peludinhos" → `/adocao`; secundário
    "Como funciona" → `#como-funciona`.
  - Linha de fato real: `{n} peludinhos esperando agora · Campus Santarém`.
    `n` vem de `animals.length`; em loading mostra "Buscando peludinhos...";
    em erro, "Adoções no campus da UFOPA".
- Coluna direita: pilha de até 3 fotos (`AnimalPhoto`), rotacionadas em
  −3°, +2°, −1.5°, com etiqueta de papel contendo nome e selo de sexo. Se não
  houver animais, mostra 3 cartões de pata em tons alternados. A pilha entra
  com um "assentar" de 500ms (rotação final + translateY), uma vez.
- **Seleção de dados:** a home deriva sua lista com
  `animals.filter(a => a.status === 'disponivel' && !a.isDeceased)`. Isso é
  feito na home, sem alterar `useAvailableAnimals`, porque membros
  autenticados recebem todos os status da API; a home nunca deve anunciar
  animal adotado ou em processo como disponível. Hero, contador, carrossel e
  links "Tenho interesse" usam essa mesma lista filtrada.
- Fundo: `paper` com uma textura sutil de pontos (radial-gradient de 1px,
  opacidade 6%) — não é gradiente decorativo, é textura de papel.

### 3. Fita de cuidados

- Faixa full-width `ink` com texto `paper`, altura 44px.
- Itens separados por pata: "alimentação · saúde · castração · adoção
  responsável · vida livre no campus".
- No desktop, marquee contínuo de 40s, pausa no hover e quando a aba perde
  foco; em reduced motion, estática e centralizada.
- Em telas < 640px, a fita vira um trilho horizontal rolável (sem animação,
  `overflow-x: auto`, scrollbar oculta), mantendo uma linha e sem estourar a
  largura da página.
- `aria-hidden` no conteúdo duplicado; a lista real fica acessível uma vez.

### 4. O projeto (bento)

- Título "O projeto" + lead institucional atual (texto preservado, no máximo
  um ajuste de pontuação).
- Bento **4 colunas × 2 linhas** no desktop:
  - Tile grande (2×2, ocupa colunas 1–2 e linhas 1–2): "Cuidados diários" —
    ícone `HeartPulse`, texto atual, fundo `marker-soft`, raio 24px. Sem
    números decorativos.
  - Tile "Ações coletivas" (`Users`): coluna 3, linha 1.
  - Tile "Controle populacional" (`Scale`): coluna 4, linha 1.
  - Tile "Conscientização" (`Megaphone`, ocupa colunas 3–4, linha 2) + a frase
    da lei 9.605/98 como nota de rodapé, com borda tracejada.
  - Em telas < 900px vira 2 colunas; < 600px, coluna única, com o tile grande
    em primeiro.
- Cada tile: fundo `card`, borda `line`, raio 20px (grande) / 16px (pequenos),
  sem sombra. Ícones em círculo `marker-soft` ou `leaf-soft`.
- Hover: borda escurece para `muted`; sem elevação.

### 5. Como funciona a adoção

- Timeline de 3 passos (sequência real, então numeração é legítima):
  1. Escolha um peludinho
  2. Manifeste seu interesse
  3. Converse com a equipe
- Desktop: linha tracejada horizontal ligando três círculos numerados
  (44px, fundo `marker`, tinta escura). Título e texto abaixo de cada nó.
- Mobile: linha vertical à esquerda, conteúdo à direita.
- Sem animação por passo; o reveal da seção inteira basta.

### 6. Quem está esperando

- Cabeçalho da seção: título, contador real ("3 disponíveis") e link "Ver
  todos" → `/adocao`.
- Carrossel horizontal com scroll-snap, 1 card em mobile, 2 em tablet, 3 em
  desktop. Botões anterior/próximo (desktop, aparecem só quando há overflow),
  arraste/swipe no touch. Teclado: setas movem o foco entre cards.
- Card de animal novo:
  - Foto 4:3 com raio 18px; nome sobreposto em etiqueta de papel no canto
    inferior esquerdo.
  - Selos: sexo (`leaf-soft`) e comportamento (`marker-soft`).
  - Linha de idade/cor.
  - Ações: "Ver mais" (secundário) e "Tenho interesse" (primário).
  - Foco visível em todo o card e botões; card inteiro não é link (evita
    alvo duplicado), apenas os botões.
- Limite de 8 animais na home.
- Estados:
  - Carregando: 3 skeletons com a mesma proporção (4:3) — sem salto de layout.
  - Vazio: cartão tracejado com pata, "Nenhum peludinho disponível agora" e
    link para "Conhecer o projeto".
  - Erro: cartão com mensagem clara e link "Tentar novamente" que recarrega a
    página (`window.location.reload()` é aceitável aqui) — sem linguagem
    apologética.

### 7. Venha nos visitar (contato)

- Card único full-width, fundo `ink-soft`, texto `paper`, raio 28px,
  `padding: clamp(28px, 5vw, 48px)`.
- Grade de 3 colunas: Local (UFOPA, Campus Santarém), Contato (Profa. Cintya
  Martins — IEG/UFOPA) e Fonte (11/04/2019 + link externo "Notícia na UFOPA").
- CTA final "Quero adotar" (fundo `marker`, texto `ink`) e link discreto
  "Acesso da equipe" → `/login`.
- Ícones `MapPin`, `GraduationCap`, `Newspaper` em `paper` com opacidade 70%.

### 8. Rodapé

- Mantém estrutura, cores e links. Ajuste apenas de espaçamento e da borda
  superior para casar com a nova home.

## Copy

- Português do Brasil, sentence case, voz ativa, sem exclamações.
- Títulos de seção: "O projeto", "Como funciona a adoção", "Quem está
  esperando", "Venha nos visitar".
- CTA principal: "Conhecer os peludinhos"; secundário: "Como funciona";
  card: "Ver mais" / "Tenho interesse"; final: "Quero adotar".
- Preservar integralmente: lei nº 9.605/98, local, nome da professora, data e
  URL da fonte, texto dos pilares e passos (ajustes só de clareza).
- Erros dizem o que aconteceu e o que fazer; não pedem desculpas.

## Movimento

- Entrada do hero: opacidade 0→1 e `translateY(16px)`→0, 480ms, stagger de
  80ms entre selo, título, lead, CTAs e pilha. A pilha assenta rotação e
  `translateY` em 520ms.
- Reveal de seções: `IntersectionObserver` com `threshold: 0.15`, uma vez por
  seção, 400ms, `translateY(12px)`.
- Marquee: 40s linear infinito; pausa em hover e em `:focus-within`.
- `prefers-reduced-motion: reduce`: sem marquee, sem stagger, sem reveal;
  estados finais aplicados direto.
- Nenhum parallax, nenhum hover em card não clicável.

## Acessibilidade

- Contraste mínimo AA: texto `ink`/`muted` sobre `paper`/`card`; texto `ink`
  sobre `marker`; texto `paper` sobre `ink-soft` (verificar ≥ 4,5:1; se
  necessário, clarear para `#F5EBE6` já é o usado).
- Selo "Adoções abertas" com `role="status"`? Não: é estático. Ponto pulsante
  é decorativo (`aria-hidden`).
- Carrossel: região com `aria-roledescription="carrossel"`, `aria-label`,
  botões com rótulos "Animais anteriores"/"Próximos animais", desabilitados nos
  limites, e anúncio do slide atual via `aria-live="polite"`.
- Imagens com `alt` descritivo ("Foto de Mel"); fallback decorativo com
  `aria-hidden`.
- Foco visível: anel de 3px `ink` com offset 2px em todos os interativos sobre
  superfícies claras. Sobre `ink-soft`/`ink` (card de contato e rodapé), o anel
  é de 3px `paper` — `ink` sobre marrom seria invisível.
- Ordem de tabulação segue a ordem visual; menu mobile retém o comportamento
  atual.
- Headings em ordem: um `h1`, `h2` por seção, `h3` nos cards.

## Estrutura de arquivos prevista

```
src/
  shared/
    lib/utils.ts                  # cn()
    ui/
      button.tsx                  # shadcn adaptado aos tokens
      badge.tsx
      card.tsx
      carousel.tsx                # embla + controles acessíveis
  features/public/
    components/
      HomeHero.tsx
      HeroPhotoStack.tsx
      CareTicker.tsx
      ProjectBento.tsx
      AdoptionTimeline.tsx
      FeaturedAnimals.tsx
      ContactPanel.tsx
    hooks/
      useScrollReveal.ts
    pages/
      PublicHomePage.tsx          # composição
      PublicHomePage.css          # keyframes, textura e ajustes finos
```

`PublicHomePage.css` encolhe para movimento/textura; layout e aparência usam
Tailwind. `animals.css` e as classes `pub-*` permanecem intactas para as outras
páginas.

## Critérios de aceite

1. `npm run build` e `npm run lint` passam sem erro.
2. Home renderiza em 360, 768 e 1280 px sem overflow horizontal.
3. Com API mockada: hero mostra 3 fotos, contador "3 peludinhos esperando
   agora" e 3 cards no carrossel.
4. Sem API: hero cai no fallback de patas, contador usa o texto alternativo e a
   seção de animais mostra o estado de erro com saída.
5. Navegação por teclado alcança menu, CTAs, carrossel e links do contato; foco
   visível em todos.
6. `prefers-reduced-motion` desliga marquee e reveals.
7. Nenhuma regressão visual em `/adocao` (classes `pub-*` intactas).
8. Capturas Playwright em 360/768/1280 revisadas; nenhum texto cortado ou
   sobreposto.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Shadcn gerar CSS paralelo e conflitar com `pub-*` | Componentes em `src/shared/ui` usam apenas tokens novos; `pub-*` fica intocado |
| API offline impedir validação | Fixture interceptado no Playwright; nada no código de produção |
| 21st.dev sem geração por IA e com 2 créditos | Usar busca/inspiração como referência; recuperar no máximo 2 códigos, adaptando |
| Fotos reais ausentes em produção | Fallback de pata com tons alternados já existe e é reaproveitado |
| Home ficar pesada | Sem framer-motion; imagens `loading="lazy"`, `aspect-ratio` fixo |
| 21 arquivos não commitados do usuário | Commitar como baseline antes de criar o branch de trabalho; nada é descartado |

## Decisões tomadas por mim (sujeitas a revisão)

- Sem biblioteca de animação; CSS + `useScrollReveal`.
- shadcn instalado por cópia de componentes + `components.json`, sem CLI
  interativo.
- Carrossel com Embla (usado pelo shadcn Carousel) em vez de implementação
  própria.
- O hero usa fotos da própria listagem de animais; não haverá curadoria manual.
- Textura de papel via CSS, sem imagem de fundo.
- Testes automatizados limitados a lógica (hook de reveal, carrossel, `cn`) —
  a validação visual fica com Playwright CLI.
- Bento em 4 colunas × 2 linhas (o diagrama é a fonte da geometria).
- Anel de foco claro sobre superfícies escuras.
- Filtro de disponibilidade aplicado na home, não no hook compartilhado.
- Fixture do Playwright usa imagens de CDN pública e aceita o fallback de pata
  quando a rede falha.
- Fita de cuidados vira trilho rolável no mobile, preservando a linha única.

## O que fica para o plano

- Ordem das tarefas e commits.
- Assinaturas exatas de componentes e hooks.
- Testes concretos (nomes e asserções).
- Comandos de verificação e capturas.
- Estratégia de baseline/branch.
