# B3 — Registro de adoção com termo (frente) — desenho curto

Data: 2026-11-23 · Origem: bloco `B3` do roadmap externo (linhas 1278–1295) e `D4.5` (linhas 947–969).

## Intenção e por quê

Hoje o fluxo termina na intenção aprovada: `IntentsAdminPage` oferece apenas **“Ver termo de adoção (demo)”**, um painel somente leitura com marca d'água `DEMONSTRAÇÃO`, `DemoBanner` e o aviso de que o registro definitivo entraria no B3. O B3 fecha essa lacuna: registrar a adoção a partir da intenção aprovada, exibir o termo preenchido e torná-lo imprimível. O parceiro pediu que o termo seja **gerado automaticamente e somente leitura**, e delegou as demais decisões de UX ao senso comum.

## Objetivos

- Substituir a prévia demo pelo registro real na própria lista de intenções.
- Gerar o termo da intenção + animal + data da adoção + membro responsável, sem edição.
- Imprimir o termo sem biblioteca de PDF.
- Registrar a adoção por `POST /adoptions`, com o animal passando a `adotado` por transação na API.
- Documentar no `TempDB` tudo o que a API precisa, sem executar nada lá.

## Não-objetivos

- Migration, seed, backend, routers, tags ou qualquer escrita no repositório `TempDB`.
- Reabrir/cancelar uma adoção, segunda adoção para o mesmo animal ou edição do termo.
- Alterar a ficha pública, relatórios ou páginas além de `IntentsAdminPage`.
- Publicar tag ou fazer push de `main`.

## Anti-objetivos (o que seria falha mesmo funcionando)

- Termo editável ou marcado como definitivo antes da API existir de fato.
- Botão de registrar aparecendo para intenção já registrada (duplicidade) ou para intenção não aprovada.
- Registro sem membro vinculado (`memberId` nulo) — não deve haver POST.
- Prévia demo convivendo com o fluxo real e confundindo o usuário.

## Restrições

- Uma adoção por animal; reabrir exige decisão explícita e fica fora deste item.
- Nada executado no `TempDB`; alterações apenas em `docs/backlog/tarefas-api-tempdb.md`.
- Domínio em camelCase no front; `snake_case` somente nos services (`map*` e payload de saída).
- Rótulos, mensagens e documentação em português, sem mojibake.
- Mesmo padrão visual e de acessibilidade do restante do painel: botões `min-h-11`, foco visível, `Alert` para erros.
- TDD por tarefa, commits convencionais, nenhum push; `package-lock.json` nunca no commit.
- `B3` permanece `[ ]` no roadmap até o aceite de persistência real com a API executada.

## Abordagens

1. **Inline em `/painel/intencoes` (escolhida).** A prévia já vive no cartão da intenção aprovada e o roadmap manda substituí-la pelo fluxo real. Mantém o contexto (visitante, animal, motivação) na tela, não exige rota nova nem nova busca. Trade-off: a página fica maior, mas o estado é local e os testes existentes já cobrem o cartão.
2. **Rota dedicada `/painel/intencoes/:id/adocao`.** Daria uma tela só do termo, mais limpa para impressão. Descartada: exigiria buscar a intenção de novo, nova rota protegida e mais uma camada de navegação para um fluxo de um passo.
3. **Manter a prévia demo e só documentar a API.** Descartada: contraria o passo 4 do B3 (“substituir a prévia da D4.5 pelo fluxo real”).

## Decisões de UX (minhas, por delegação do parceiro)

- Intenção aprovada sem adoção → **“Registrar adoção”**; com adoção → **“Ver termo”**, que reabre o termo gravado, imprimível.
- Confirmação curta inline antes do `POST`; a operação é irreversível no escopo.
- `window.print()` + CSS `@media print` (sem PDF); o termo imprime sozinho.
- Sem `memberId` → aviso informativo, botão desabilitado e nenhum POST.
- Erro da API em `Alert`; sucesso recarrega a lista e o cartão passa a exibir “Ver termo”.
- Termo sem rótulo de demonstração; a pendência da API fica apenas na documentação.

## Contrato de API a documentar

- Migration `0007_adocao.sql`: tabela `adoption` (`adoption_id`, `fk_adoption_intent_id` único por intenção, `fk_animal_id` único, `fk_visitor_id`, `fk_responsible_member_id`, `adoption_date`, `term_text`, `created_at`, `updated_at`).
- `POST /api/adoptions` recebe `{ adoption_intent_id, fk_responsible_member_id, adoption_date, term_text }`; valida intenção `aprovada`, animal sem adoção, grava o termo e atualiza o animal para `adotado` na mesma transação; devolve a linha criada.
- `GET /api/adoption-intents` (e `/mine`) passa a incluir `adoption: ApiAdoption | null` em cada intenção — é isso que faz o botão “Ver termo” sobreviver a um recarregamento sem um endpoint extra.
- `mapIntent` aceita `adoption` ausente como `null`, preservando respostas antigas.

## O que fica para o builder

Siga o plano `docs/superpowers/plans/2026-11-23-b3-registro-adocao-front.md`: nomes, rotas, payloads, textos e testes estão fixados lá.
