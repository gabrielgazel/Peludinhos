# Manual do usuário — Peludinhos

Versão 1.0 · 18 de novembro de 2026 · Ambiente de demonstração

Este manual ensina a usar o Peludinhos pelo navegador. Cada tarefa vem com
passos numerados e o texto **Resultado esperado**, para você conferir se deu
certo. Não é necessário conhecer o código nem a API.

> Convenção: **“Demo”** identifica funcionalidade de demonstração — ela existe
> na tela para mostrar o fluxo, mas não grava dados no banco. Nada marcado como
> demo deve ser usado como registro definitivo.

---

## 1. O que é o Peludinhos e quem usa

### 1.1 O que é

O Peludinhos é uma aplicação web para apoiar um projeto de adoção de animais.
Ela tem duas partes:

- **Vitrine pública:** qualquer pessoa pode ver os animais disponíveis e
  manifestar interesse em adotar.
- **Painel da equipe:** as pessoas do projeto acompanham animais, intenções de
  adoção, pontos de alimentação, turnos, ocorrências, ração e relatórios.

A adoção **não** é concluída pelo site. O interesse é encaminhado à equipe,
que avalia o pedido e entra em contato por e-mail.

### 1.2 Quem usa e o que cada um faz

1. **Visitante:** navega pelo catálogo, abre o detalhe de um animal e envia uma
   intenção de adoção. Não precisa estar logado para isso; se não tiver conta,
   o próprio formulário cria uma.
2. **Membro da equipe** (bolsista ou voluntário): usa o painel para consultar
   animais, registrar turnos e ocorrências, registrar consumo de ração e
   acompanhar intenções e relatórios.
3. **Administração** (administrador ou coordenador): faz tudo o que o membro
   faz e também cadastra e edita animais, gerencia membros, cria pontos de
   alimentação e registra a compra de ração.

> **Resultado esperado:** você sabe qual dos três perfis se aplica a você e,
> portanto, quais tarefas deste manual pode executar. Se tentar abrir uma tela
> de administração sem ter esse papel, a aplicação mostra “Acesso não
> autorizado”.

---

## 2. Como entrar e recuperar a senha

### 2.1 Entrar na conta da equipe

1. Abra o endereço do sistema e clique em **Entrar** no cabeçalho, ou acesse
   diretamente a página de login (`/login`).
2. Em **E-mail ou usuário**, informe o e-mail da sua conta.
3. Em **Senha**, digite sua senha. Se quiser conferir o que digitou, clique em
   **Mostrar**; para esconder, clique em **Ocultar**.
4. Clique em **Entrar**.

> **Resultado esperado:** visitantes voltam para a página inicial e pessoas da
> equipe vão para `/painel`, com a saudação “Olá, {seu primeiro nome}!” e o
> papel exibido. Se houver erro, a tela mostra “E-mail ou senha inválidos.”
> (dados errados), “E-mail ainda não confirmado. Fale com a equipe.” ou “Não
> foi possível entrar agora. Tenta de novo em instantes.”.

> **Demo:** no ambiente de demonstração existem contas semeadas para ensaio,
> com a senha pública `Demo@12345`: `admin.demo@peludinhos.example`
> (administrador), `bolsista.demo@peludinhos.example`,
> `voluntario.demo@peludinhos.example` e, para o fluxo de visitante,
> `visitante1.demo@peludinhos.example` e
> `visitante2.demo@peludinhos.example`. Use-as **somente na demo**; a tela de
> login não exibe essas contas e em produção o acesso deve ser solicitado ao
> administrador.

### 2.2 Recuperar a senha

1. Na página de login, clique em **Esqueci minha senha**.
2. Informe o **E-mail** da sua conta.
3. Clique em **Enviar instruções**.

> **Resultado esperado:** aparece a mensagem “Se o e-mail existir, enviaremos
> as instruções.” e, abaixo, “Verifique sua caixa de entrada (e o spam). O link
> de recuperação pode expirar.” A resposta é a mesma mesmo que o e-mail não
> esteja cadastrado — isso evita revelar quais contas existem.

### 2.3 Definir a nova senha

1. Abra o link recebido por e-mail. Ele leva a `/redefinir-senha`.
2. Preencha **Nova senha** e **Confirmar nova senha** (mínimo de 8 e máximo de
   128 caracteres). Use os botões **Mostrar senha** e **Mostrar confirmação**
   se precisar conferir.
3. Clique em **Redefinir senha**.

> **Resultado esperado:** você volta ao login com o aviso “Senha redefinida
> com sucesso. Faça login com a nova senha.” e entra com a senha nova. Se o
> link estiver inválido ou expirado, a tela mostra “Link de recuperação
> inválido ou expirado. Solicite um novo e-mail.” e oferece **Solicitar novo
> link**.

### 2.4 Sair da conta

1. No painel, clique em **Sair** no cabeçalho.

> **Resultado esperado:** a sessão é encerrada e você volta para a área
> pública; ao tentar abrir outro endereço do painel, é redirecionado para o
> login.

---

## 3. Fluxo do visitante: catálogo › detalhe › intenção

### 3.1 Explorar o catálogo

1. Acesse `/adocao` pelo menu da página inicial.
2. Use **Buscar por nome** para encontrar um animal específico.
3. Use os filtros **Todos**, **Fêmeas** ou **Machos** para refinar a lista.
4. Confira o contador de peludinhos disponíveis acima dos cards.

> **Resultado esperado:** a lista mostra a foto, o nome, selos de sexo e
> comportamento, idade e pelagem de cada animal. Se nada corresponder aos
> filtros, aparece “Nenhum peludinho encontrado com esses filtros.”.

### 3.2 Ver o detalhe de um animal

1. No catálogo, clique em **Ver mais** no card do animal.
2. Leia os campos **Sexo**, **Idade**, **Cor**, **Castrado** e
   **Comportamento**, além da seção “Sobre {nome}” quando houver observações.
3. Se quiser seguir com a adoção, clique em **Tenho interesse em adotar**.

> **Resultado esperado:** você vai para `/adocao/:id/intencao`. Se o animal não
> estiver com status `disponivel` ou já tiver falecido, o botão não aparece e a
> tela informa: “Este animal não está disponível para adoção no momento.”.

### 3.3 Enviar uma intenção (sem conta)

1. Confirme que o bloco “Você quer adotar” mostra o nome do animal escolhido.
2. Em **Seus dados**, preencha **Nome completo**, **E-mail**,
   **Crie uma senha de acesso** (mínimo de 8 caracteres), **Data de
   nascimento** (é preciso ser maior de 18 anos) e **CPF**. Marque
   **Faço parte da comunidade da Ufopa** e/ou **Já tenho outro animal em
   casa** se for o caso.
3. Em **Onde o animal vai morar**, preencha **CEP**, **Bairro**, **Rua**,
   **Número** e, se quiser, **Ponto de referência**.
4. Em **Sobre a adoção**, responda “Por que você quer adotar {nome}?” com pelo
   menos 20 caracteres — conte sobre sua rotina, sua casa e o que espera da
   adoção.
5. Clique em **Enviar interesse**.

> **Resultado esperado:** aparece “Interesse enviado!” com a confirmação de que
> a equipe vai analisar o pedido e entrar em contato pelo e-mail informado. A
> tela oferece os links **Ver outros peludinhos** e **Voltar ao início**; não
> há redirecionamento automático. Sua conta de visitante é criada junto com o
> pedido, e você poderá usá-la para entrar depois.

### 3.4 Enviar uma intenção (já logado)

1. Entre com sua conta de visitante.
2. No catálogo, clique em **Tenho interesse** ou, no detalhe, em **Tenho
   interesse em adotar**.
3. Confira a mensagem “Você está logado como {seu nome}. Vamos usar os dados da
   sua conta para registrar o pedido.”
4. Preencha apenas a motivação em **Sobre a adoção** e clique em **Enviar
   interesse**.

> **Resultado esperado:** a confirmação “Interesse enviado!” aparece como no
> fluxo anterior. Se você estiver logado como membro da equipe, a tela não
> permite enviar: mostra que a manifestação deve ser feita pelo adotante e
> oferece o link **Ir para o painel**.

### 3.5 Entender as mensagens de erro do envio

1. Leia o aviso exibido no formulário.
2. Corrija o que ele indicar e envie novamente.

> **Resultado esperado:** os textos possíveis são: “Sua conta foi criada, mas
> você já tem um pedido pendente para este animal.”; “Já existe uma conta com
> este e-mail. Entre para continuar o pedido.” (nesse caso, use **Já tem uma
> conta? Entre para enviar seu pedido**); “Você já tem um pedido pendente para
> este animal.”; “Este animal não está mais disponível para adoção.”;
> “Confira os dados informados.”; ou “Não foi possível enviar agora. Tente de
> novo em instantes.”. O primeiro campo inválido recebe o foco automaticamente.

---

## 4. Fluxo do membro: painel, animais, pontos, turno, ocorrências, ração, relatórios

Todas as telas desta seção ficam em `/painel` e exigem login com um papel da
equipe. No menu lateral, o grupo **Geral** reúne as opções abaixo.

### 4.1 Abrir a visão geral

1. Entre com sua conta e clique em **Visão geral**.
2. Confira a saudação, os cartões **Animais cadastrados** e **Intenções
   pendentes** e o painel **Meu turno**.

> **Resultado esperado:** o painel mostra “Nenhum turno aberto.” ou “Turno
> aberto desde HH:MM.”, com atalhos **Iniciar turno**, **Encerrar** ou **Ver
> turnos**, além das ações rápidas **Ver animais** e **Avaliar intenções**.
> Administradores também veem **Membros da equipe** e **Gerenciar membros**.

### 4.2 Consultar animais e registrar um óbito

1. Clique em **Animais** no menu.
2. Use **Buscar por nome** e o filtro **Status** (inclusive a opção
   **Falecidos**) para localizar o animal; a coluna **Data do óbito** mostra a
   data registrada.
3. Para registrar um falecimento, clique em **Registrar óbito** e confirme.
4. Clique em **Ver ficha** para abrir a ficha interna do animal e, na aba **Saúde**, consultar histórico, vacinas e receitas.
5. Para animais falecidos, abra a aba **Dados** e confira **Data do óbito** e
   **Causa do óbito** no painel **Óbito**; clique em **Editar óbito** para
   corrigir os campos, **Salvar óbito** para enviar a correção ou **Cancelar**
   para desistir.

> **Resultado esperado:** a lista mostra os animais cadastrados, incluindo os
> que já encontraram um lar. A confirmação diz “Registrar o óbito de {nome}?
> Esta ação não pode ser desfeita.” — depois de confirmar, o animal deixa de
> aparecer como disponível no catálogo. Animais vivos aparecem com `—` na
> coluna **Data do óbito**. A correção feita em **Editar óbito** só aparece
> depois que a API do `TempDB` estiver executada; até lá nenhum dado é
> inventado e a persistência continua pendente
> (`docs/backlog/tarefas-api-tempdb.md`). O botão **Editar** aparece apenas
> para a administração. Na aba **Saúde**, **Editar** aparece só para o autor
> do registro ou a administração; não há exclusão.

### 4.3 Consultar e manter pontos de alimentação

1. Clique em **Pontos** no menu.
2. Use o campo **Buscar** (Nome ou prédio) para encontrar um ponto.
3. Confira as colunas **Nome**, **Prédio**, **Animais vinculados**, **Status** e
   **Ações**.

> **Resultado esperado:** você vê quantos animais estão vinculados a cada
> ponto. A administração tem os botões **Novo ponto** e **Editar**; os demais
> membros apenas consultam. Não há opção de excluir pontos.

### 4.4 Abrir e encerrar um turno

1. Clique em **Turnos** no menu.
2. Se houver turno em andamento, confira a data de início, os pontos e as
   observações em **Turno atual**.
3. Para encerrar, clique em **Encerrar turno**, confirme com **Confirmar
   encerramento** ou desista com **Cancelar**.
4. Para abrir, clique em **Iniciar turno**, marque os pontos atendidos, preencha
   a **Observação** (opcional) e clique em **Iniciar turno**.
5. Para consultar o passado, use o filtro **Período** em **Histórico**
   (“Últimos 7 dias” ou “Últimos 30 dias”).

> **Resultado esperado:** a confirmação de encerramento pergunta “Encerrar o
> turno agora?”. Depois de iniciar, o painel “Turno atual” passa a mostrar
> **Em andamento** com a data de início; depois de encerrar, volta a oferecer o
> formulário **Iniciar turno** (e a visão geral passa a dizer “Nenhum turno
> aberto.”). Se os pontos não carregarem, use **Tentar novamente**.

### 4.5 Registrar uma ocorrência

1. Clique em **Ocorrências** no menu e depois em **Nova ocorrência**.
2. Preencha **Descrição** e **Data**. Se fizer sentido, escolha um **Animal**;
   caso contrário, deixe “Sem vínculo com animal”.
3. Confira os dados e confirme com **Confirmar registro**; para editar, use
   **Confirmar alterações**.

> **Resultado esperado:** a tela pergunta “Registrar esta ocorrência?” (ou
> “Salvar alterações nesta ocorrência?”) antes de salvar. A ocorrência aparece
> na listagem com descrição, data, animal (quando houver) e autor. Somente a
> administração ou quem registrou pode editá-la.

### 4.6 Registrar compra, consumo e encerramento de ração

1. Clique em **Ração** no menu. A administração começa com **Registrar
   compra**; os demais membros começam pela listagem.
2. Para registrar uma compra, preencha **Nome**, **Peso** (em quilogramas;
   aceita vírgula) e **Data de entrada**, e clique em **Salvar compra**.
3. Para registrar consumo, clique em **Registrar consumo** na linha da ração,
   informe **Quantidade (kg)** e **Data**; **Ponto de alimentação (opcional)**
   e **Observação (opcional)** podem ficar em branco. Clique em **Salvar
   consumo**.
4. Para encerrar uma ração, clique em **Encerrar ração** e confirme.
5. Use **Histórico** para conferir tipo, quantidade, data, ponto, autor e
   observação de cada movimentação.

> **Resultado esperado:** cada ração mostra o saldo em kg e um selo:
> **Sem estoque** (saldo zero), **Reposição** (saldo abaixo de 20% do peso
> inicial) ou **Suficiente**. A confirmação de encerramento avisa “Encerrar a
> ração {nome}? Esta ação não pode ser desfeita.”. Se não houver rações, a
> administração vê “Nenhuma ração cadastrada ainda.” e **Registrar primeira
> compra**. Não é possível editar uma ração já registrada pela interface.

### 4.7 Consultar e exportar relatórios

1. Clique em **Relatórios** no menu.
2. Escolha o **Período**: “Últimos 7 dias”, “Últimos 30 dias”, “Últimos 90
   dias” ou “Personalizado”.
3. Leia os seis cartões: **Animais por status**, **Animais por ponto**,
   **Consumo de ração**, **Ocorrências mensais**, **Medicamentos** e
   **Produtos**.
4. Se precisar levar os números para uma planilha, clique em **Exportar CSV**
   no cartão desejado.

> **Resultado esperado:** os seis painéis do front leem a API; o filtro de
> período altera **Animais por ponto**, **Consumo de ração**, **Ocorrências
> mensais**, **Medicamentos** e **Produtos**, mas não **Animais por status**.
> Os três novos dependem do contrato B4 documentado em
> `docs/backlog/tarefas-api-tempdb.md`: sem a API, mostram erro em `Alert` ou
> estado vazio, sem fallback nem número inventado. O rodapé lembra: “Os números
> são recalculados a cada visita; nenhuma informação é gravada.”.

### 4.8 Avaliar intenções de adoção

1. Clique em **Intenções** no menu. O filtro **Status** já vem em “pendente”.
2. Leia o cartão do pedido: visitante, e-mail, marcas “comunidade Ufopa” e
   “já tem animal” quando aplicável, animal, data e motivação.
3. Para decidir, clique em **Aprovar** ou **Rejeitar**.
4. Filtre as aprovadas, clique em **Registrar adoção**, confirme e use
   **Imprimir termo**.

> **Resultado esperado:** o pedido sai da lista de pendentes após a decisão.
> Em pedidos já aprovados, aparece **Registrar adoção**; depois de registrada a
> adoção, o mesmo cartão passa a oferecer **Ver termo**, que reabre o termo da
> adoção registrada para conferência e impressão.

---

## 5. Fluxo da administração: membros, cadastro de pontos, compra de ração

Estas tarefas exigem papel de administrador ou coordenador. Se o botão não
aparecer, peça acesso ao administrador.

### 5.1 Cadastrar ou editar um membro

1. Clique em **Membros** no menu e depois em **Novo membro**.
2. Preencha **Nome completo**, **E-mail**, **Papel**, **Senha de acesso**,
   **CPF**, **Data de nascimento**, **Matrícula Ufopa**, **Entrada no projeto**
   e **Dias de alimentação** (os campos obrigatórios variam conforme o papel).
3. Clique em **Salvar**. Para alterar um cadastro existente, use **Editar** na
   listagem ou na ficha; **Ver** abre a ficha com “Dados pessoais” e “Vínculo”.

> **Resultado esperado:** o membro aparece na listagem com nome, e-mail e
> papel. O campo **E-mail** só é preenchido na criação; na edição, a senha
> passa a se chamar **Nova senha**. Não há opção de excluir membros.

### 5.2 Cadastrar ou editar um ponto de alimentação

1. Em **Pontos**, clique em **Novo ponto** ou em **Editar** na linha desejada.
2. Preencha **Nome** e **Prédio**, ajuste **Ponto ativo**, e complete
   **Descrição**, **Latitude** e **Longitude** quando fizer sentido.
3. Clique em **Salvar** ou **Cancelar**.

> **Resultado esperado:** o ponto volta para a lista com o nome, o prédio, a
> quantidade de animais vinculados e o status **Ativo**/**Inativo**. Para
> vincular animais a um ponto, use o formulário de animal da seção 5.4.

### 5.3 Registrar a compra de ração

1. Em **Ração**, clique em **Registrar compra** (ou em **Registrar primeira
   compra**, se a lista estiver vazia).
2. Preencha **Nome**, **Peso** em quilogramas — vírgula é aceita, por exemplo
   `7,5` — e **Data de entrada**.
3. Clique em **Salvar compra**.

> **Resultado esperado:** a nova ração entra na listagem com saldo igual ao
> peso comprado e selo **Suficiente**. O consumo e o encerramento podem ser
> registrados por qualquer membro, conforme a seção 4.6.

### 5.4 Cadastrar ou editar um animal

1. Em **Animais**, clique em **Novo animal** ou em **Editar** na linha do
   animal.
2. Preencha **Nome**, **Sexo**, **Status**, **Comportamento**, **Idade
   aproximada**, **Cor / pelagem**, **Castrado** e **Observações**.
3. Se quiser incluir uma imagem, clique em **Escolher foto** ou **Trocar
   foto**; JPG, PNG, WEBP ou GIF de até 5 MB. Para retirar, use **Remover
   foto** — a remoção só é aplicada ao salvar, e **Desfazer remoção** volta
   atrás antes disso.
4. Em **Pontos de alimentação**, marque os pontos onde o animal é alimentado.
   Se a lista falhar, clique em **Tentar novamente**.
5. Clique em **Salvar** ou **Cancelar**.

> **Resultado esperado:** o animal aparece na listagem do painel e, se estiver
> disponível e não tiver falecido, também no catálogo público com a foto e as
> informações preenchidas. Os pontos marcados passam a constar em **Animais
> vinculados** na tela de pontos.

---

## 6. Demonstração e pendências de API

Nesta seção estão os itens que continuam como demonstração e as pendências de
API. O termo de adoção já é o registro real do fluxo: a adoção é registrada em
**Intenções** e o termo salvo pode ser reaberto e impresso. Ainda assim, a
persistência depende da API pendente em `docs/backlog/tarefas-api-tempdb.md`;
até a execução e o aceite, `B3` continua desmarcado no roadmap e o termo não
deve ser apresentado como registro definitivo. Os painéis de relatórios 4–6
(**Ocorrências mensais**, **Medicamentos** e **Produtos**) já estão na tela,
mas seus números dependem da API B4 documentada no mesmo backlog; `B4` permanece
desmarcado no roadmap até o aceite da persistência real. A tela de insumos já
usa cadastro com API, mas a persistência efetiva depende da API de insumos
(§6.1), ainda pendente.

### 6.1 Insumos (medicamentos e produtos)

1. No painel, clique em **Insumos**.
2. Confira as tabelas **Medicamentos** e **Produtos**, com **Nome**, **Tipo**,
   **Quantidade**, **Unidade**, **Validade**, **Ponto/uso** e **Ações**.
3. Se você tiver perfil de administrador, clique em **Novo medicamento** ou
   **Novo produto** para criar um registro, e em **Editar** na linha de um item
   para alterá-lo. Preencha **Nome**, **Tipo**, **Quantidade**, **Unidade** e
   **Ponto** (obrigatórios); **Validade** e **Observação** são opcionais.
   Conclua com **Salvar medicamento** ou **Salvar produto**, ou desista com
   **Cancelar**.

> **Resultado esperado:** as duas listas aparecem e, para a administração, a
> tela oferece criação e edição. Membros da equipe podem consultar; criar e
> editar é restrito à administração. A persistência efetiva do que for
> cadastrado depende da execução da API de insumos, ainda pendente (ver
> `docs/backlog/tarefas-api-tempdb.md`): não apresente os dados como registro
> definitivo antes disso.

### 6.2 Termo de adoção

1. Em **Intenções**, filtre as aprovadas e, se a adoção ainda não foi
   registrada, clique em **Registrar adoção** e confirme em **Confirmar
   adoção**.
2. Clique em **Ver termo** para reabrir o termo da adoção registrada e confira
   os campos:
   **Adotante**, **CPF**, **E-mail**, **Animal**, **Idade**, **Pelagem**,
   **Sexo**, **Castrado**, **Temperamento**, **Pedido**, **Data da adoção**,
   **Data do pedido**, **Responsável** e **Motivação**.
3. Clique em **Imprimir termo** para abrir a impressão do navegador.

> **Resultado esperado:** o termo mostra os dados reais da intenção aprovada,
> sem marca d’água. A persistência do registro depende da API pendente em
> `docs/backlog/tarefas-api-tempdb.md`: até a execução e o aceite, `B3` continua
> desmarcado no roadmap e o termo não deve ser apresentado como registro
> definitivo.

### 6.3 Relatórios 4–6

1. Em **Relatórios**, confira, ao lado dos três primeiros, os painéis
   **Ocorrências mensais**, **Medicamentos** e **Produtos**.
2. Troque o **Período** e veja os três novos painéis recalcularem os números
   vindos da API; use **Exportar CSV** em cada um quando houver dados.

> **Resultado esperado:** os seis painéis aparecem na tela e todos leem a API.
> Os três novos dependem do contrato B4 documentado em
> `docs/backlog/tarefas-api-tempdb.md`, ainda pendente: sem a API, mostram um
> `Alert` de erro ou estado vazio, sem fallback nem número inventado. `B4`
> continua desmarcado no roadmap até o aceite da persistência real.

### 6.4 O que mudou no termo de adoção

A antiga prévia do termo foi substituída pelo registro real da adoção: em
**Intenções**, **Registrar adoção** registra a adoção e **Ver termo** reabre o
termo registrado para impressão. A faixa amarela do termo deixou de existir. A
pendência que resta é a execução da API documentada em
`docs/backlog/tarefas-api-tempdb.md`; até o aceite, `B3` continua desmarcado no
roadmap.

> **Resultado esperado:** você consegue explicar à banca que o termo é o
> registro real do fluxo, que a persistência depende da API pendente e que os
> seis painéis de front são animais por status, animais por ponto, consumo de
> ração, **Ocorrências mensais**, **Medicamentos** e **Produtos**. Os três
> novos dependem da API B4 documentada em `docs/backlog/tarefas-api-tempdb.md`,
> ainda pendente; `B4` permanece desmarcado no roadmap até o aceite da
> persistência real.

### 6.5 Saúde do animal (histórico, vacinas e receitas)

1. Em **Animais**, clique em **Ver ficha** e abra a aba **Saúde**.

> **Resultado esperado:** o caminho é **Animais → Ver ficha → Saúde**. A leitura
> é permitida a qualquer membro; para criar é preciso ter vínculo com membro,
> e **Editar** aparece só para o autor do registro ou a administração. O autor
> aparece como `Membro #id` ou `—` quando não há vínculo. Não há botão de
> exclusão. Criar ou editar e recarregar a página só persiste depois que a API
> do `TempDB` for executada (ver `docs/backlog/tarefas-api-tempdb.md`); até lá,
> não apresente os dados como registro definitivo.

---

## 7. Perguntas frequentes e o que fazer quando a API está fora do ar

### 7.1 Perguntas frequentes

1. **Preciso de conta para ver os animais?** Não. O catálogo e o detalhe são
   públicos. A conta só é criada quando você envia uma intenção sem estar
   logado.
2. **O site conclui a adoção?** Não. Ele registra o interesse; a equipe avalia
   e entra em contato por e-mail.
3. **Por que não vejo o botão de adotar?** O animal pode estar com outro
   status (em processo, adotado ou indisponível) ou ter falecido.
4. **Posso entrar com uma conta de visitante no painel?** Não. O painel exige
   um papel da equipe; visitantes são redirecionados para “Acesso não
   autorizado”.
5. **Posso excluir um animal, membro, ponto ou ração?** Não. A interface não
   oferece exclusão; a única remoção é a **foto** no formulário de animal.
6. **O que significa “Reposição” na ração?** O saldo caiu abaixo de 20% do peso
   inicial. **Sem estoque** quer dizer saldo zero.
7. **O CSV dos relatórios grava dados?** Não. Os números são recalculados a
   cada visita e o CSV é apenas um download local.
8. **Esqueci minha senha e o link expirou.** Solicite um novo link em
   `/recuperar-senha` e use-o antes de expirar.

> **Resultado esperado:** a maioria das dúvidas é respondida sem acionar a
> equipe de suporte; as demais estão nas mensagens de erro das próprias telas.

### 7.2 Quando a API está fora do ar

A interface precisa da API em `http://127.0.0.1:8000/api` (ou no endereço
definido em `VITE_API_URL`). Se ela não responder:

1. Verifique se o servidor da API está rodando e se a URL configurada está
   correta.
2. Recarregue a página. Se a tela oferecer **Tentar novamente**, clique nela.
3. Se a mensagem for de login inválido, tente entrar de novo; a sessão pode ter
   expirado e o sistema já tenta renová-la automaticamente uma vez.
4. Se o erro persistir, aguarde e tente mais tarde. O que já foi salvo antes
   continua salvo; se a falha aconteceu durante um envio, refaça essa ação
   quando a API voltar.

> **Resultado esperado:** a tela mostra uma mensagem de erro local, sem travar:
> catálogo — “Não foi possível carregar os animais agora. Tente novamente em
> instantes.”; detalhe — “Não foi possível carregar este animal agora.”;
> início — “Não foi possível carregar os peludinhos agora. Verifique sua
> conexão e tente de novo.” com **Tentar novamente**; painel — “Não foi
> possível carregar o resumo: {erro}”. Em várias telas, o texto cru do navegador
> (como “Failed to fetch”) pode aparecer dentro da mensagem — isso significa
> que a requisição não chegou à API.

> **Atenção:** não existe um aviso global de “API fora do ar”. Os erros
> aparecem dentro da própria tela, com **Tentar novamente** quando disponível.

### 7.3 Roteiro rápido de verificação

1. Abra `/adocao` e confirme que os animais aparecem.
2. Abra o detalhe de um animal disponível e clique em **Tenho interesse em
   adotar**.
3. Envie a intenção e confirme “Interesse enviado!”.
4. Entre no painel com uma conta da equipe e abra **Turnos**.
5. Inicie um turno, encerre-o e confira o histórico.
6. Abra **Ração**, registre consumo e confira o saldo.
7. Abra **Relatórios** e confira os três cartões reais.

> **Resultado esperado:** você percorreu o fluxo completo do membro usando
> apenas este manual — catálogo, intenção, painel, turno, ração e relatórios —
> sem precisar consultar o código nem pedir instruções adicionais.
