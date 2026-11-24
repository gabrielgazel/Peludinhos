# B4 — Relatórios 4–6 (frente) — desenho

Data: 2026-11-24 · Origem: bloco `B4` do roadmap externo (linhas 1297–1313), `D4.2` e `D4.6` (linhas 972–991).

## Intenção e por quê

Hoje `ReportsPage` mostra três relatórios reais (status, pontos, consumo de ração) e uma seção **“Próximos relatórios”** com três cartões tracejados: ocorrências mensais, medicamentos e produtos. O parceiro pediu para deixar o front pronto para **exibir esses números via API**, porque é possível que apareçam na apresentação, e para registrar no `.md` do backlog tudo o que precisa ser feito no `TempDB`. A fatia atual só implementa o front: nenhuma alteração é executada no projeto da API.

O ponto sensível é a honestidade dos números. O B1 expõe apenas o **estoque atual** de medicamentos e produtos; não há histórico que permita calcular consumo por período. Inferir consumo a partir do estoque geraria um número falso na apresentação. Por isso o front consumirá um contrato de relatório dedicado, com histórico de movimentação previsto no backlog, e **não** terá fallback para fixtures nem para valores estimados.

## Objetivos

- Substituir os três cartões “Próximos relatórios” por três painéis reais, alimentados por `GET /api/reports/...`.
- Manter os três relatórios existentes exatamente como estão (dados, rótulos, CSV e testes atuais).
- Compartilhar o filtro de período já existente entre os seis painéis; trocar o período recarrega os três novos.
- Oferecer **Exportar CSV** em cada um dos três novos painéis, usando o gerador de `src/features/staff/utils/csv.ts`.
- Documentar no backlog o contrato completo da API (migration, schemas, routers, registro, smoke test, seed, comandos e checklist), sem executá-lo.
- Deixar o aceite de persistência suspenso e o item `B4` como `[ ]` no roadmap até a API ser executada e os números conferidos com o seed estendido.

## Não-objetivos

- Migration, seed, backend, routers, tags ou qualquer escrita no repositório `TempDB`.
- Alterar relatórios 1–3, o `PageHead`, a navegação ou qualquer outra página.
- Criar um segundo filtro de período ou uma página nova.
- Biblioteca de gráficos: barras continuam em CSS puro, como em `D4.1`.
- Edição, exclusão ou criação de ocorrências/insumos a partir dos relatórios (sem DELETE, sem botão de exclusão).
- Push de `main`, criação de tag ou marcação de `B4` como concluído no roadmap.

## Anti-objetivos (o que seria falha mesmo funcionando)

- Número inventado, fallback para fixture, ou estoque atual pintado como “consumo do período”.
- Painel novo exibendo dado enquanto a requisição falhou ou antes de carregar.
- Um painel quebrado impedindo os outros cinco de aparecerem.
- CSV com número em formato de máquina (`7.5` em vez de `7,5`) ou sem BOM/separador `;`.
- Dois filtros de período com intervalos divergentes na mesma página.

## Restrições

- Nada executado no `TempDB`; toda pendência vai para `docs/backlog/tarefas-api-tempdb.md`.
- Domínio em `camelCase` no front; `snake_case` **somente** nos services (`map*` e query params).
- Rótulos, mensagens de erro, CSV e documentação em português, sem mojibake.
- Padrão visual e de acessibilidade do painel: botões `min-h-11`, foco visível, erros em `Alert` (não `console.error`).
- TDD por tarefa, commits convencionais, nenhum push; `package-lock.json` nunca entra no commit.
- `B4` permanece `[ ]` no roadmap até o aceite de persistência real com a API executada.

## Abordagens

1. **Contrato de relatório dedicado (escolhida).** Dois endpoints novos, `GET /api/reports/occurrences-by-month` e `GET /api/reports/supply-consumption`, com services novos no front. O histórico de movimentação de insumos entra na migration `0008` do `TempDB`, documentada no backlog. Trade-off: mais trabalho na API (fora desta fatia), mas nenhum número é chutado — quando a API roda, o painel mostra dado real; antes disso, mostra erro/estado vazio. Foi a escolha do parceiro justamente pela apresentação.
2. **Reaproveitar os endpoints atuais.** Ocorrências viriam de `GET /api/events` com `from`/`to` (isso é viável), mas medicamentos e produtos só têm estoque atual: “consumo no período” teria que ser deduzido da diferença de estoque, o que estaria errado sempre que houvesse reposição. Descartada: produziria número falso.
3. **Híbrido com fallback.** Tentar o endpoint novo e, se der 404, calcular com os endpoints antigos. Descartada pela mesma razão da anterior e por mascarar a ausência da API: o erro precisa aparecer, não ser substituído por um chute.

## Decisões de interface (minhas, confirmadas no navegador)

- **Grade de três:** os três novos painéis ocupam `lg:grid-cols-3`, com o mesmo peso visual, um ao lado do outro. Em telas menores, `md:grid-cols-2` e uma coluna por fim (`grid-cols-1` no celular). O filtro fica em um `Panel` único acima da grade, como hoje.
- A seção “Próximos relatórios” é **removida**; os três painéis a substituem no mesmo lugar da página. Nenhum badge “Planejado” permanece.
- Cada painel usa o `ReportSection` existente: título, subtítulo com o intervalo, total em destaque e botão **Exportar CSV** à direita. Os testes atuais dos relatórios 1–3 continuam valendo.
- **Ocorrências mensais:** linhas são meses (mais recente primeiro), valor em `plural(total, 'ocorrência', 'ocorrências')`, barra proporcional ao mês com mais ocorrências e detalhe com até 3 entradas no formato `DD/MM — descrição (animal)`, com `+N` quando houver mais; sem animal, o parênteses é omitido. Ordenação vem da API; o front não reordena. CSV: cabeçalho `['Mês', 'Data', 'Animal', 'Descrição', 'Autor']`, uma linha por ocorrência na ordem da API e linha final `['Total', '', '', total, '']`.
- **Medicamentos / Produtos:** linhas são itens em ordem decrescente de consumo, valor em `${quantidade} ${unidade}` com número em pt-BR (até 2 casas), detalhe com tipo, ponto e estoque atual, e barra proporcional ao maior consumo. Nenhuma conversão para kg. Como as unidades podem ser diferentes entre itens, o total em destaque é `plural(items.length, 'item', 'itens')` com rótulo "itens no período"; `total_quantity` não é somado nem exibido como número isolado. CSV: cabeçalho `['Item', 'Tipo', 'Consumo', 'Unidade', 'Ponto', 'Estoque atual']`, uma linha por item, sem linha de total.
- Cada painel tem estados próprios: carregando (`EmptyState`), erro (`Alert variant="danger"`), vazio (`EmptyState` específico) e sucesso. Um erro em um não apaga os outros.
- Com intervalo invertido, o comportamento atual é preservado: o `Alert` do filtro explica o motivo e os painéis não disparam novas buscas. Com intervalo personalizado incompleto também não há nova busca, mas o filtro mantém o texto atual “Intervalo não definido.” — não ganha `Alert` novo, para não alterar os relatórios 1–3. Em ambos os casos os painéis conservam o último estado válido, como hoje.
- CSV por painel: cabeçalho em português, `;`, BOM, CRLF e nome `relatorio-<slug>-YYYY-MM-DD.csv`, via `downloadCsv(csvFilename(slug), toCsvFile(rows))`. Botão só aparece quando há dado.

## Contrato a consumir (fixado para o plano)

Services novos em `src/features/staff/services/reportService.ts`, com `httpClient`/`withQuery`, funções `getOccurrencesByMonth({ from, to })` e `getSupplyConsumption({ from, to, kind })`, e `map*` converting `snake_case` → `camelCase` apenas nesse arquivo. Tipos de domínio exportados pelo próprio service.

- `GET /api/reports/occurrences-by-month?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - resposta: `{ total, months: [{ month, total, items: [{ event_id, animal_id, animal_name, description, event_date, member_name }] }] }`;
  - origem no `TempDB`: tabela `events` existente, agrupada por `event_date`; `animal_name`/`member_name` vêm por join e podem ser `null`;
  - no front: `months[].items[].id`, `animalId`, `animalName`, `eventDate`, `memberName`.
- `GET /api/reports/supply-consumption?kind=medication|product&from=YYYY-MM-DD&to=YYYY-MM-DD`
  - resposta: `{ kind, from, to, total_quantity, items: [{ supply_id, name, type, quantity, unit, point, stock_quantity }] }`;
  - origem no `TempDB`: nova tabela de movimentação `0008` (somente movimentos `consumo` no intervalo), com `stock_quantity` lida da tabela atual de medicamentos/produtos;
  - no front: `totalQuantity`, `items[].supplyId`, `stockQuantity`;
  - um chamado por painel (`kind=medication` e `kind=product`), em paralelo, com o mesmo `from`/`to` do filtro compartilhado.

Leitura para membros, sem DELETE e sem escrita a partir da tela. Erros da API em português, exibidos no `Alert` do painel correspondente.

## Pendência registrada no backlog

`docs/backlog/tarefas-api-tempdb.md` ganha a seção **B4 — Relatórios 4–6**, com: migration aditiva `0008_supply_movement.sql` (tabela de movimentação com `supply_type`, `supply_id`, `movement_kind`, `quantity`, `movement_date`, `point`, autor, auditoria, RLS e `notify pgrst`), schemas Pydantic, router `app/routers/reports.py`, registro em `app/main.py`, smoke test (anon 401, leitura de membro 200, uso de `kind` inválido 422, intervalo invertido 422, contagens batendo com o seed e nenhuma rota DELETE), extensão determinística do seed, atualização do `DOCUMENTACAO.md` e checklist com os comandos de aplicação/uvicorn/smoke. Aceite suspenso até a execução pelo usuário.

No roadmap externo, o item `B4` continua `- [ ]`; acrescento apenas a nota `> B4 (frente) concluído em 2026-11-24; API pendente em docs/backlog/tarefas-api-tempdb.md.`, no mesmo padrão do B3, sem data na coluna de conclusão.

## O que fica para o builder

O plano `docs/superpowers/plans/2026-11-24-b4-relatorios-4-6-front.md` ainda não existe: ele será escrito na etapa de planejamento, **a partir deste desenho**, e é nele que os textos exatos, os testes e a redação do backlog serão fixados. Isto é decisão minha, não pendência do parceiro. Toda decisão não listada acima (nomes de variáveis internas, ordem exata de props, detalhes de CSS) é livre para o builder, desde que não mude o comportamento visível nem o contrato.
