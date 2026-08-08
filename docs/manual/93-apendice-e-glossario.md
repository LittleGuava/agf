# Apêndice E — Glossário

**AC (critério de aceitação).** A condição verificável que diz se uma tarefa entregou. Se
não dá para escrever um teste que o afirma ou nega, não é um AC.

**Advisory.** Terceiro estado do envelope: funcionou, mas há algo a saber. `ok` continua
`true`. Tratá-lo como falha bloqueia fluxo correto.

**Aresta.** Ligação entre dois nós, com um tipo que diz _como_ eles se relacionam. São 15
tipos.

**ACO / estigmergia.** Coordenação indireta inspirada em colônias de formigas: o trabalho
concluído altera o ambiente (o grafo) e é essa alteração que orienta a próxima escolha.
Opcional, via `agf next --aco`.

**Blast radius (raio de impacto).** O conjunto de arquivos que uma mudança toca. O `agf`
compara os arquivos modificados contra o escopo declarado e recusa fechar quando algo vaza.

**Capacidade dormente.** Código escrito e nunca conectado — exportado sem consumidor, sem
superfície, atrás de flag desligada. Passa no build, passa nos testes, entrega zero.

**CCR.** Substituição reversível de conteúdo repetido por um marcador `⟨ccr:hash⟩`. O
original fica em cache e volta com `agf retrieve`.

**Constituição.** Conjunto de axiomas do projeto, indexados e cobrados nos gates.

**Definição de pronto (DoD).** As oito verificações que o `agf check` aplica a uma tarefa.

**Delegate-first.** O arranjo padrão: um agente externo escreve o código com o próprio
modelo, e o `agf` faz o trabalho determinístico em volta. Sem provedor, comandos generativos
devolvem `mode: delegated` com o briefing em vez de falhar.

**Envelope.** O JSON único que todo comando escreve em `stdout`.

**Fase.** Etapa do ciclo. Três canônicas (`SHAPE`, `BUILD`, `SHIP`) agrupando nove internas.

**Gap.** Lacuna de completude detectada de forma determinística no grafo. São 18 tipos, cada
um com o comando que o fecha.

**Gate.** Verificação que precisa passar para avançar de fase. Distinto do `check`, que
avalia uma tarefa isolada.

**Grafo.** O banco SQLite onde vive todo o estado de execução do projeto. Fonte de verdade.

**Harnessability.** Nota de 0 a 100 em nove dimensões que mede quanto o repositório sustenta
trabalho de agente. Vira grau de A a D.

**Lever (alavanca).** Mecanismo opcional de economia de token. São 19, todas desligadas por
padrão, ligadas apenas com ganho medido.

**Modo delegado.** Ver _delegate-first_.

**Nó.** Unidade de trabalho ou de conhecimento no grafo. São 23 tipos.

**Nó de especificação.** Nó que descreve algo em vez de ser trabalho a fazer — requisito,
contrato, interface. Não drena como tarefa; contá-lo como fila infla as métricas.

**Phantom done.** Nó marcado como concluído que declara arquivo inexistente em disco. O gap
mais valioso de detectar, porque o status diz que está feito.

**Ponteiro obsoleto.** Registro que aponta para um arquivo renomeado ou movido. O trabalho
existe; só a referência envelheceu. Distingue-se de _artefato ausente_, onde ninguém
escreveu nada — e as duas causas pedem ações opostas.

**Preset.** Pacote de rigor do processo. Quatro embutidos, do consultivo ao corporativo.

**Procedência.** Escada epistêmica de quatro degraus — `claim`, `cited`, `validated`,
`proven` — em que promover exige recibo, não alegação.

**Pull (puxar).** O `agf next` oferece a próxima tarefa; você não empurra trabalho para
`in_progress`.

**RAG-IN.** Da intenção em linguagem natural ao comando exato (`agf retrieve-command`). É
um ranqueamento, não um oráculo — confirme com `--help`.

**RAG-OUT.** Devolve um esqueleto com lacunas para preencher, em vez de gerar do zero
(`agf montar-output`).

**Silent failure (falha silenciosa).** Erro engolido por um fallback — `|| []`, `catch`
vazio — que transforma "quebrou aqui" em "funcionou com metade do dado". Build, teste e lint
ficam verdes.

**Triangulação.** Cruzar AC do grafo, código em disco e teste em disco. Faltando qualquer um,
não está implementado, por mais que o status diga.

**WIP = 1.** Uma tarefa em progresso por vez. Consequência da Lei de Little: tempo de ciclo
igual a trabalho em progresso dividido por vazão.
