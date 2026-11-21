# D5.6 — Tag, PDF de entrega e backlog priorizado — Design (curto)

## Intenção

Fechar o D5 com um ponto identificável no tempo (`v0.5-demo`) e um pacote que
se explica sozinho: um único PDF com manual e roteiro, um README coerente com o
estado real do produto e o backlog confirmado. A banca deve abrir um arquivo e
entender o que é real, o que é demo e como rodar.

## Objetivos

1. README com o que a demo faz, o que é simulado e como subir API + frontend + seed.
2. Tag anotada `v0.5-demo` no commit final do dia, publicada em `origin`.
3. Um `docs/pacote-entrega.pdf` com manual e roteiro (capa + seções numeradas).
4. Backlog B1–B7 conferido: estimativas e ordem (S07–S09, ~6 dias).
5. Datas de conclusão de cada dia registradas no fim do roadmap externo.

## Não-objetivos e anti-objetivos

- Não mudar domínio, migration, contrato de API, UI nem testes de produto.
- Não prometer B1–B7 como entregues; não fingir e-mail real de recuperação (D4.3).
- Não mover a tag depois de publicada: correção vira `v0.5.1`.
- Não colocar no pacote nada que não esteja no build sem rótulo explícito de demo/artefato.

## Restrições

- Roadmap `C:/Users/gabri/OneDrive/Área de Trabalho/Dump/...` é arquivo local, fora de git.
- Worktree ativo: `C:/Users/gabri/.local/share/opencode/worktree/6a3308/s04-crud-voluntarios`, branch `feat/s05-operacao`; checkout principal em `main`.
- Sem biblioteca de PDF nem conversor Markdown instalados. Usar HTML temporário + `playwright-cli pdf`.
- Interface e documentação em português; commit convencional.

## Abordagens

| Abordagem | Trade-off | Decisão |
| --- | --- | --- |
| PDF único com manual + roteiro | Um artefato só; exige conversor Markdown mínimo e conferência de paginação/acentuação | **Escolhida pelo usuário** |
| Manter `manual-do-usuario.pdf` e gerar `roteiro-demo.pdf` | Reaproveita PDF já validado, mas a entrega fica em dois arquivos | Rejeitada |

## Decisões já tomadas

- Ordem: README → backlog → datas no roadmap → PDF → commit → tag → push commit e tag.
- Conversor e HTML ficam fora do repo (temp); entra no repo apenas o PDF final.
- Datas no roadmap: D0 16/11, D1 16/11, D2 17/11, D3 18/11, D4 18/11, D5 20/11
  (origem: tabela de acompanhamento; D5.5 já está com 20/11).
- README mantém `bun` como gerador de scripts e documenta também os comandos
  `node ...\node_modules\...` usados na verificação.
- Tag anotada com mensagem curta em português; push de `v0.5-demo` junto com o branch.

## A critério do implementador

- Conversor Markdown→HTML: cobrir cabeçalhos, parágrafos, listas, tabelas,
  bloco de código, citação, negrito e código inline; conferir acentos e quebras.
- Texto exato das seções novas do README.
- Verificação final: abrir o PDF, `git tag -n`, leitura do README e `git diff --check`.
