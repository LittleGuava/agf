# O que é o agf

O `agf` é uma ferramenta de linha de comando que mantém o **estado de execução de um
projeto de software num grafo persistente**, em SQLite, e conduz o trabalho por cima dele.

A frase importante é _persistente_. Um agente de código conversa: o estado do trabalho vive
no histórico da conversa, e quando a janela de contexto acaba — ou a sessão cai, ou outro
agente entra — esse estado se perde. O `agf` tira o estado da conversa e o coloca num
banco: o que existe, o que depende do quê, o que já foi feito, com qual critério de
aceitação, provado por qual teste.

## As três coisas que ele faz

**Planeja.** Transforma uma ideia ou um PRD em épicos e tarefas atômicas com critérios de
aceitação testáveis, e detecta lacunas de completude nesse plano de forma determinística.

**Constrói.** Puxa a próxima tarefa desbloqueada (uma de cada vez), monta o contexto exato
para ela, e valida a entrega contra a definição de pronto antes de deixar fechar.

**Endurece.** Mede a qualidade do repositório em nove dimensões, encontra capacidade que
foi escrita mas nunca conectada, e cobra prova de que o que está marcado como pronto de
fato existe em disco.

## O grafo é a fonte de verdade

Toda unidade de trabalho é um **nó**. As relações entre elas são **arestas**. Nada disso
é decorativo: o `agf` usa o grafo para decidir o que pode ser puxado (uma tarefa com
dependência aberta não é oferecida), para calcular raio de impacto, para saber qual teste
rodar, e para recusar um `done` cujo critério não bate com o disco.

A consequência prática é uma regra de uso: **se não há nó, não há trabalho rastreado**.
Um projeto conduzido pelo `agf` cria o nó antes de escrever o código, não depois.

## Delegate-first: o agf não precisa de um modelo

Esta é a característica que mais confunde quem chega. O `agf` **não** é um wrapper de LLM.

Ele foi desenhado para ser dirigido por um agente externo — Claude Code, Copilot CLI,
Codex, Cursor, Gemini — que já tem o próprio modelo. Nesse arranjo o `agf` faz o trabalho
determinístico (grafo, gates, contexto, validação, medição, a custo zero de token) e o
agente externo faz o trabalho generativo (escrever o código).

Quando nenhum provedor está conectado, os comandos que gerariam texto **não quebram**: eles
devolvem `mode: delegated` com um _briefing_ pronto para o agente que está conduzindo
executar com o próprio modelo. O Capítulo 8 detalha esse fluxo.

> Um efeito colateral que engana: o registro de chamadas de LLM (`llm_call_ledger`) fica
> zerado em modo delegado. Isso é **correto**, não um defeito — nenhum token foi gasto
> pelo `agf` porque nenhuma chamada partiu dele.

O `agf` também sabe falar direto com provedores (Capítulo 11), quando você quer que ele
mesmo gere. Os dois modos convivem.

## Local-first, e isso é verificado

Todo o estado vive na sua máquina. O `agf` não faz nenhuma chamada de rede que você não
tenha pedido: sem telemetria, sem verificação de atualização em segundo plano, sem
identificação de máquina.

Isso não é uma promessa de README — é um teste (`src/tests/local-first-no-network.test.ts`)
que quebra o build se alguém reintroduzir uma chamada fora de uma lista curta e nomeada.
Existem exatamente duas requisições de rede em todo o produto, e as duas você digita: a
instalação e o `agf upgrade`.

## Por que formigas

O `agf` empresta um mecanismo de colônias de formigas chamado **estigmergia**: coordenação
indireta, em que o trabalho de um indivíduo altera o ambiente e é essa alteração — não uma
mensagem — que orienta o próximo.

No `agf`, o ambiente é o grafo. Quando uma tarefa é concluída, o caminho que levou até ela
recebe reforço; caminhos que não entregam evaporam. Isso permite que a escolha da próxima
tarefa aprenda com o histórico real do projeto em vez de seguir uma ordem fixa.

Duas ressalvas honestas, porque elas mudam o que você deve esperar:

- **O reforço só acontece com evidência.** Nada é depositado por uma alegação de conclusão;
  a prova precisa existir.
- **A seleção por colônia é opcional.** O comportamento padrão do `agf next` é
  determinístico — prioridade e ordem. A escolha guiada por feromônio entra com `--aco`.

## Onde ele roda

Instala-se por um comando (Capítulo 2), roda em macOS, Linux e Windows, e guarda tudo num
arquivo SQLite. O projeto é Apache-2.0.

Quatro executáveis são instalados: `agf` (o principal), `agent-graph-flow` e
`mcp-graph-agent` (aliases do mesmo binário) e `ant-swarming` (a superfície de colônia,
Capítulo 15).

## Quando o agf não é a ferramenta certa

Vale dizer o que ele não é. O `agf` não é um gerenciador de tarefas de time — não tem
noção de pessoas, sprints compartilhadas ou permissões de quadro no sentido de um Jira. Ele
também não substitui seu CI: ele _chama_ seus testes e lê o resultado, mas quem roda o
pipeline continua sendo o CI. E ele não é uma ferramenta de automação de navegador nem de
RPA, embora saiba dirigir um navegador para provar que uma tela funciona (Capítulo 9).
