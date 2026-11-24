# Roteiro da demo — Peludinhos (10 minutos)

Versão 1.0 · ensaios em 20/11/2026 · build de produção (`vite preview`) + API real

Este é o roteiro **falado e clicado** da apresentação. Ele cobre exatamente o
que existe no build de produção; o que é demonstração ou está fora do build
tem frase própria nas seções abaixo. Tempo total alvo: **10:00**.

## Tabela-mestre

| Bloco | Janela | Tempo alvo | Assunto |
| --- | --- | --- | --- |
| 1 | 0:00–1:00 | 1:00 | Home pública |
| 2 | 1:00–3:00 | 2:00 | Visitante: catálogo › detalhe › intenção com autocadastro |
| 3 | 3:00–4:00 | 1:00 | Login da equipe e painel |
| 4 | 4:00–5:00 | 1:00 | Animais: busca, ficha, foto, óbito |
| 5 | 5:00–6:00 | 1:00 | Pontos: criar e vincular animais |
| 6 | 6:00–7:00 | 1:00 | Turno: iniciar, encerrar, histórico |
| 7 | 7:00–8:00 | 1:00 | Ocorrência e ração: 20 kg › 5 kg › saldo |
| 8 | 8:00–10:00 | 2:00 | Relatórios 1–3, membros, recuperação, manual e backlog |
| | | **10:00** | |

## Pré-ensaio (fora dos 10 minutos)

1. API no ar em `http://127.0.0.1:8000` (`/health` responde `{"status":"ok"}`).
2. Build de produção servido em `http://127.0.0.1:4173` (`/adocao` responde 200).
3. Limpar apenas os resíduos dos ensaios anteriores no banco demo: registros com
   nome `Ensaio 1` ou `Ensaio 2`, visitantes `adotante.ensaio%` (incluindo o
   usuário de autenticação de mesmo e-mail) e turnos com observação
   `Turno do ensaio cronometrado.`.
4. Rodar `.venv\Scripts\python.exe scripts\seed_demo.py` no TempDB **antes de cada ensaio**.
5. Abrir o Chromium em `http://127.0.0.1:4173/` com `playwright-cli.cmd open`.

> O seed é idempotente e nunca apaga dados. A limpeza do passo 3 evita conflito
> de nome, CPF e e-mail; mesmo assim **selecione sempre pelo nome com sufixo do
> ensaio** (`Ensaio 1`, `Ensaio 2`), nunca pelo índice da linha.

---

## Blocos

### 1. Home pública

- Clique: abrir `http://127.0.0.1:4173/`; rolar até a seção “O projeto”.
- Aparece: marca “Peludinhos”, vitrine com animais em destaque e a explicação do projeto. Se a API falhar: “Não foi possível carregar os peludinhos agora. Verifique sua conexão e tente de novo.” com **Tentar novamente**.
- Tempo alvo: 1:00
- Frase de demo: “Esta é a vitrine pública: qualquer pessoa vê os peludinhos antes de falar com a equipe.”
- Plano B: se a vitrine não carregar, mostrar o cabeçalho e a seção “O projeto” e dizer que a lista pública aparece no bloco seguinte; print descrito: cabeçalho “Peludinhos” + seção “O projeto”.

### 2. Visitante: catálogo › detalhe › intenção com autocadastro

- Clique: menu **Animais** → `/adocao`; **Ver mais** em *Demo Nina* → **Tenho interesse em adotar**; preencher **Nome completo**, **E-mail** novo e único por execução (`adotante.ensaio1<sufixo>@peludinhos.example` no Ensaio 1 / `adotante.ensaio2<sufixo>@peludinhos.example` no Ensaio 2), **Crie uma senha de acesso** (`Demo@12345`), **Data de nascimento** (maior de 18 anos), **CPF** `168.995.350-09` no Ensaio 1 / `123.456.789-09` no Ensaio 2, **CEP** `66000-000`, **Bairro**, **Rua**, **Número** e a motivação (≥20 caracteres); clicar em **Enviar interesse**.
- Aparece: contador de peludinhos disponíveis; detalhe com “Sobre Demo Nina”; ao final, **“Interesse enviado!”** com a confirmação de que a equipe entrará em contato por e-mail. O autocadastro já deixa a sessão do adotante aberta.
- Tempo alvo: 2:00
- Frase de demo: “O interesse cria a conta do adotante junto com o pedido — o site não conclui a adoção.”
- Plano B: se o e-mail já existir, trocar o sufixo do ensaio; se a API falhar, mostrar o print descrito da tela “Interesse enviado!” do ensaio anterior e seguir para o login.

### 3. Login da equipe e painel

- Clique: **Sair** (o bloco 2 deixa a sessão do adotante aberta) → **Login** → **E-mail ou usuário** `admin.demo@peludinhos.example` → **Senha** `Demo@12345` → **Entrar**.
- Aparece: `/painel` com “Olá, Admin!” e “Você está conectado como Administrador.”, cartões de resumo e o painel “Meu turno”.
- Tempo alvo: 1:00
- Frase de demo: “Conta de demonstração com senha pública, usada somente neste ambiente.”
- Plano B: se o login falhar, mostrar o print descrito do painel do ensaio anterior; nunca dizer que são credenciais reais.

### 4. Animais: busca, ficha, foto, óbito

- Clique: menu **Animais** → **Novo animal** → preencher **Nome** `Demo Ensaio 1` (ou `2`), **Sexo**, **Status**, **Idade aproximada**, **Cor / pelagem** → **Salvar**; usar **Buscar por nome** com o mesmo nome; abrir **Editar** (ficha com **Foto do animal**); voltar à listagem e clicar em **Registrar óbito** → confirmar.
- Aparece: animal na listagem; ficha com o campo **Foto do animal** e a dica “JPG, PNG, WEBP ou GIF, até 5 MB”; confirmação “Registrar o óbito de Demo Ensaio 1? Esta ação não pode ser desfeita.”
- Tempo alvo: 1:00
- Frase de demo: “O óbito é aplicado só ao animal criado para o ensaio — nenhum animal do catálogo é alterado.”
- Frase de demo: “A ficha interna reúne histórico, vacinas e receitas; a gravação depende da API do `TempDB`, ainda pendente (ver `docs/backlog/tarefas-api-tempdb.md`).” Abra com **Ver ficha**; na aba **Saúde**, mostre histórico, vacinas e receitas.
- Plano B: se o upload falhar, pular a foto e mostrar o campo **Foto do animal** na ficha; se o óbito falhar duas vezes, sai do roteiro e vira apenas a frase.

### 5. Pontos: criar e vincular animais

- Clique: menu **Pontos** → **Novo ponto** → **Nome** `Ponto Ensaio 1` (ou `2`), **Prédio** `Prédio Ensaio`, **Descrição**, manter **Ponto ativo** → **Salvar**; abrir **Animais** → **Editar** em *Demo Mel* → marcar o novo ponto em **Pontos de alimentação** → **Salvar** e esperar o retorno à listagem de animais antes de sair da tela; voltar a **Pontos** e conferir a coluna **Animais vinculados**.
- Aparece: novo ponto na lista com status **Ativo**; coluna **Animais vinculados** passa a mostrar **1 animal** para o ponto do ensaio (ela sai de “Carregando...” depois de alguns segundos). Se os pontos falharem ao carregar, aparece **Tentar novamente**.
- Tempo alvo: 1:00
- Frase de demo: “Cada ponto diz quantos animais atende — o vínculo é feito no formulário do animal.”
- Plano B: se o vínculo falhar, mostrar os vínculos já existentes (Bloco A 3, Biblioteca 2, Canil 3) e dizer que o vínculo é feito na ficha do animal; print descrito da tabela de pontos.

### 6. Turno: iniciar, encerrar, histórico

- Clique: menu **Turnos** → marcar *Demo Biblioteca* → preencher **Observação (opcional)** → **Iniciar turno** → **Encerrar turno** → **Confirmar encerramento** → em **Histórico**, escolher **Últimos 7 dias**.
- Aparece: **Em andamento** com “Iniciado em …”; confirmação “Encerrar o turno agora?”; depois de encerrar, a tela volta a oferecer **Iniciar turno** e o histórico mostra o turno com data e ponto.
- Tempo alvo: 1:00
- Frase de demo: “O turno guarda quem atendeu, quais pontos e a observação — nada some quando ele é encerrado.”
- Plano B: se os pontos não carregarem, clicar em **Tentar novamente**; se falhar duas vezes, sai do roteiro e vira o print descrito do histórico.

### 7. Ocorrência e ração: 20 kg › 5 kg › saldo

- Clique: menu **Ocorrências** → **Nova ocorrência** → **Descrição** `Ocorrência Ensaio 1` (ou `2`) + **Data** → **Registrar ocorrência**; menu **Ração** → **Registrar compra** → **Nome** `Demo Ração Ensaio 1` (ou `2`), **Peso** `20`, **Data de entrada** → **Salvar compra**; **Registrar consumo** → **Quantidade (kg)** `5` → **Salvar consumo**; **Histórico**.
- Aparece: ocorrência na listagem; ração com 20 kg comprados, saldo 15 kg e selo **Suficiente**; histórico com a compra e o consumo.
- Tempo alvo: 1:00
- Frase de demo: “Compra de 20 kg, consumo de 5 kg, saldo de 15 kg — cada movimentação fica no histórico.”
- Plano B: se a compra falhar, usar a ração de seed *Demo Ração Premium* e mostrar o consumo; se falhar duas vezes, sai do roteiro e vira o print descrito do saldo 15 kg do ensaio anterior.

### 8. Relatórios 1–3, membros, recuperação, manual e backlog

- Clique: menu **Relatórios** → conferir **Animais por status**, **Animais por ponto** e **Consumo de ração**, com **Exportar CSV**; se sobrar tempo: menu **Membros**, `/recuperar-senha` (somente o formulário), o PDF único de entrega (`docs/pacote-entrega.pdf`) e a seção “Próximos relatórios”.
- Aparece: três cartões com números reais da API; seção “Próximos relatórios” com selo **Planejado**; rodapé “Os números são recalculados a cada visita; nenhuma informação é gravada.”
- Tempo alvo: 2:00
- Frase de demo: “Três relatórios são reais; o restante é plano do backlog, e o PDF é um artefato de entrega — não uma tela do sistema.”
- Plano B: se **Animais por ponto** mostrar “Failed to fetch”, recarregar a página até três vezes — a API remota é intermitente e os outros dois cartões costumam carregar; se persistir, mostrar o print descrito dos três cartões do ensaio anterior. Nunca apresentar “Próximos relatórios” como pronto.

---

## O que é demo e como dizer

| Item | Frase em uma frase |
| --- | --- |
| Contas `*.demo@peludinhos.example` | “São contas de ensaio com senha pública, válidas só neste ambiente.” |
| Intenção de adoção | “É uma manifestação de interesse; a equipe avalia e entra em contato por e-mail.” |
| Insumos | “Medicamentos e produtos são listados e cadastrados na tela, com criação e edição restritas à administração; a persistência depende da execução da API pendente (ver `docs/backlog/tarefas-api-tempdb.md`).” |
| Termo de adoção | “Em uma intenção aprovada, registre a adoção, abra **Ver termo** e demonstre a impressão — lembrando que a persistência depende da API documentada em `docs/backlog/tarefas-api-tempdb.md`.” |
| Relatórios 4–6 | “Estão marcados como Planejado: são plano do backlog, não relatório pronto.” |
| Recuperação de senha | “A tela existe; o e-mail real de recuperação depende do servidor de e-mail e não é simulado aqui.” |

## Fora do build de produção

- **`docs/pacote-entrega.pdf`** — artefato único de entrega (manual + roteiro), não rota da aplicação. Mostrar como PDF, nunca como tela.
- **Backlog priorizado** — artefato da D5.6, ainda não existe no build.
- **Relatórios 4–6** — apenas “Próximos relatórios” com selo **Planejado**.
- **Recuperação com e-mail real (D4.3)** — segue pendente de aceite; não fingir recebimento.

## Regra “falhou duas vezes sai”

Se um passo falhar duas vezes em qualquer ensaio, ele sai do caminho principal,
é substituído pelo Plano B e entra na tabela abaixo. O tempo liberado volta para
os blocos seguintes; o roteiro é reajustado antes do próximo ensaio.

| Passo | Ensaio | Falha 1 | Falha 2 | Substituto |
| --- | --- | --- | --- | --- |
| Cadastro do adotante | calibração | 409 em `visitors` (CPF repetido) | 409 em `auth.users` (e-mail repetido) | E-mail único por execução + limpeza prévia |
| Vínculo do ponto | calibração | Salvamento abortado ao navegar antes da confirmação | Coluna presa em “Carregando...” | Esperar o retorno da listagem e até 45 s pela coluna |
| Relatório Animais por ponto | calibração | “Failed to fetch” | “Failed to fetch” após um recarregamento | Recarregar até três vezes |

> As três falhas acima aconteceram nos ensaios de calibração. A causa raiz de
> cada uma foi removida e os passos voltaram ao caminho principal; nos dois
> ensaios registrados abaixo, todos passaram.

## Registro dos ensaios

| Bloco | Tempo alvo | Ensaio 1 | Ensaio 2 | Ajuste (narração) |
| --- | --- | --- | --- | --- |
| 1 — Home | 1:00 | 0:00 | 0:00 | +1:00 |
| 2 — Visitante | 2:00 | 0:07 | 0:06 | +1:54 |
| 3 — Login/painel | 1:00 | 0:03 | 0:03 | +0:57 |
| 4 — Animais | 1:00 | 0:13 | 0:11 | +0:48 |
| 5 — Pontos | 1:00 | 0:27 | 0:25 | +0:34 |
| 6 — Turno | 1:00 | 0:09 | 0:09 | +0:51 |
| 7 — Ocorrência/ração | 1:00 | 0:08 | 0:07 | +0:52 |
| 8 — Relatórios | 2:00 | 0:09 | 0:10 | +1:50 |
| **Total** | **10:00** | **1:16** | **1:12** | **+8:46** |

Os tempos reais são medidos com cronômetro por bloco. Como os cliques são
conduzidos por automação, os valores medidos são um **limite inferior** para
uma apresentação humana: os tempos alvo continuam sendo a meta de narração.

### Notas dos ensaios

- Data: 20/11/2026. Banco demo limpo e seed re-aplicado antes de cada ensaio.
- Ensaio 1: 8/8 blocos OK em **76,3 s**. Ensaio 2: 8/8 blocos OK em **71,6 s**.
  Nenhum travou; os dois ficaram bem abaixo do limite de 10:00.
- E-mails e CPFs únicos por execução: `adotante.ensaio103759@peludinhos.example`
  (Ensaio 1) e `adotante.ensaio297347@peludinhos.example` (Ensaio 2).
- A coluna **Animais vinculados** mostrou **1 animal** nos dois ensaios; em
  calibração ela ficou em “Carregando...” por até ~30 s por lentidão da API remota.
- “Animais por ponto” falhou uma vez no Ensaio 2 e precisou de um recarregamento;
  o retry de até três tentativas foi mantido no roteiro.
- Tempos medidos por automação são limite inferior; a narração ocupa o restante
  de cada janela (coluna **Ajuste**).
- Fora do aceite desta tarefa: o teste de recuperação com e-mail real de dev
  (D4.3) segue pendente e não foi fingido.
