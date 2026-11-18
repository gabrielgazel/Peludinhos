# QA global — responsividade e acessibilidade (D5.1)

- **Data:** 2026-11-18
- **Escopo:** as 17 rotas do roteador em **360×800, 768×900 e 1280×900** (51 combinações).
- **Método:** Playwright CLI + Vite local; API mockada apenas no navegador (`page.route` em
  `http://127.0.0.1:8000/api/**`). Papel de autenticação controlado por `?__qa=anon|bolsista|admin`,
  lido por `addInitScript` antes do carregamento do app. Nenhuma alteração de backend, contrato,
  migration ou `.env`.
- **Capturas:** `AppData/Local/Temp/opencode/d51-{rota}-{360,768,1280}.png` (fora do repositório, QA efêmero).

## Checklist por rota

Legenda: **✓** = nenhum critério bloqueante falhou na largura (overflow horizontal, texto cortado,
tabela sem adaptação, alvo de controle < 44px, foco invisível, label ausente, contraste abaixo de AA
ou animação sem `motion-reduce`). Achados não bloqueantes estão detalhados em **Exceções e dívidas**.

| Rota | 360 | 768 | 1280 | Observações não bloqueantes |
| --- | :-: | :-: | :-: | --- |
| `/` | ✓ | ✓ | ✓ | links inline no cabeçalho/rodapé; `sr-only` do carrossel |
| `/adocao` | ✓ | ✓ | ✓ | links inline; hierarquia H1→H3 |
| `/adocao/:id` | ✓ | ✓ | ✓ | links inline |
| `/adocao/:id/intencao` | ✓ | ✓ | ✓ | links inline; checkbox 22px com `<label>` de 44px; link “Entre para enviar seu pedido” (≥768) |
| `/login` | ✓ | ✓ | ✓ | — |
| `/recuperar-senha` | ✓ | ✓ | ✓ | — |
| `/redefinir-senha` | ✓ | ✓ | ✓ | — |
| `/painel` | ✓ | ✓ | ✓ | — |
| `/painel/animais` | ✓ | ✓ | ✓ | — |
| `/painel/intencoes` | ✓ | ✓ | ✓ | link `a[Thor]` (29×20px) |
| `/painel/membros` | ✓ | ✓ | ✓ | — |
| `/painel/operacao/pontos` | ✓ | ✓ | ✓ | — |
| `/painel/operacao/turnos` | ✓ | ✓ | ✓ | — |
| `/painel/operacao/ocorrencias` | ✓ | ✓ | ✓ | — |
| `/painel/operacao/racao` | ✓ | ✓ | ✓ | — |
| `/painel/insumos` | ✓ | ✓ | ✓ | — |
| `/painel/relatorios` | ✓ | ✓ | ✓ | — |

**Resultado agregado (51 combinações):** 0 overflow horizontal, 0 textos cortados de verdade,
0 tabelas não adaptadas, 0 alvos de controle < 44px, 0 focos invisíveis, 0 labels ausentes,
0 contrastes abaixo de AA, 0 animações sem `motion-reduce`, 0 erros de console, 0 erros de página
e 0 chamadas de escrita (`POST`/`PUT`/`PATCH`/`DELETE`).

## Correções aplicadas

Ajustes mínimos de CSS/token — nenhum redesenho, nenhuma mudança de contrato:

1. **`src/index.css` — `--accent-contrast: #FFFFFF` → `#2B2927`.**
   Texto do cabeçalho e do botão principal sobre o laranja (`--accent`) em `/login`,
   `/recuperar-senha` e `/redefinir-senha` media **2,65:1** (branco sobre `#E08A4E`).
   Com o marrom escuro da casa passa a **5,46:1**, mantendo o fundo laranja.
2. **`src/index.css` + `src/features/auth/pages/Login.css` — novo `--accent-text: #A85A26`.**
   Os botões “Mostrar”, “Mostrar senha” e “Mostrar confirmação” usavam `--accent` puro sobre
   fundo claro (**2,65:1**). Com o tom escuro passam a **5,05:1**; `.field__toggle` agora consome
   o novo token. A concentração de laranja no ícone da marca não foi alterada.
3. **`src/shared/layouts/PublicLayout.css` — `.pub-btn--sm`: `min-height` 40 → 44px.**
   A variante pequena estava abaixo do alvo de toque usado pelo botão base.
4. **`src/shared/layouts/PublicLayout.css` — `.pub-footer__top`: `min-height` 40 → 44px.**
   Botão “Voltar ao topo” do rodapé alinhado aos demais controles.

## Exceções e dívidas

Classificationadas como não bloqueantes; não corrigidas para respeitar “não redesenhe telas”:

- **Links inline / de navegação com altura < 44px** (marca 147×34, “Acesso da equipe” 105×20,
  itens do rodapé ~60×23, “O projeto”/“Animais” 94×42/84×42). São links de texto com espaçamento
  entre alvos; enquadram-se na exceção de espaçamento da WCAG 2.5.8. Não são botões de ação.
- **`input[type="checkbox"]` de 22×22px** em `/adocao/:id/intencao`: o `<label class="cf">` que o
  envolve tem `min-height: 44px` e é o alvo efetivo de clique/toque.
- **`sr-only` do carrossel** (“Animais anteriores”, “Próximos animais”, “1 de 3”): o auditor marcou
  como texto truncado, mas o elemento é visualmente oculto por design e anunciado por leitores de tela.
- **Salto H1→H3 em `/adocao`** (os cards de animais usam `<h3>`). É uma observação suplementar de
  hierarquia, pré-existente; agrupar os cards exigiria reestruturar o componente (fora do escopo).
- **`a[Thor]` de 29×20px** em `/painel/intencoes` e no termo de adoção demo: link inline pré-existente,
  já registrado em D4.5/D4.7.
- **`a[Notícia na UFOPA]` (125×23px)** e **`a[Entre para enviar seu pedido]` (179×21px)**: links
  dentro de parágrafos de texto (inline).
- **Falsos positivos do auditor descartados:** o ring de foco do Tailwind v4 usa `oklab(... / alpha)`
  em `box-shadow`; o detector inicial só lia `rgb()/rgba()` e apontava foco invisível. Ring real
  confirmado via Tab (ex.: `oklab(0.282318 0.00178525 0.00431363 / 0.5) 0px 0px 0px 3px`).
- **Dívida fora do escopo:** `ShiftPage.tsx:93` (`react-hooks/set-state-in-effect`) permanece como
  aviso de lint pré-existente; não é item de responsividade/acessibilidade visual desta tarefa.

## Verificação final

- `node .\node_modules\vitest\vitest.mjs run` → **41 arquivos / 295 testes**, 0 falhas (58,06s), exit 0.
- `node .\node_modules\typescript\bin\tsc -b` → exit 0 (sem erros).
- Varredura Playwright rerrodada após as quatro correções: 51 combinações, 0 achados bloqueantes.

**Limitação honesta:** este modelo não inspeciona imagens; a verificação visual foi feita por auditoria
DOM automatizada (geometria, contraste convertido para sRGB via canvas, foco por Tab real, texto e
requisições). Chamadas duplicadas em dev vêm do StrictMode do Vite, não de duplicação em produção.
