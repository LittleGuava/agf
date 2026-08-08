# Do PRD ao backlog

Este capítulo cobre a entrada do funil: transformar uma ideia ou um documento em nós de
grafo que alguém consegue puxar e construir.

## Importar um documento existente

```bash
agf import-prd caminho/para/PRD.md
```

Aceita `.md`, `.txt`, `.pdf` e `.html`. O comando lê o documento, extrai requisitos e
tarefas, e cria a estrutura no grafo — épico, tarefas filhas e as arestas entre elas.

Se você ainda não tem o documento:

```bash
agf generate-prd "descrição do que você quer construir"
agf generate-prd "..." --import      # gera e já cria o grafo
```

## Criar a estrutura à mão

Para escopo pequeno, criar direto costuma ser mais rápido:

```bash
agf node add --type epic --title "Autenticação"
agf node add --type task --parent <id-epico> --title "Login com e-mail e senha" \
  --ac "credencial válida devolve sessão com expiração de 24h" \
  --ac "credencial inválida devolve 401 sem revelar se o e-mail existe"
agf edge add --from <id-tarefa-b> --to <id-tarefa-a> --type depends_on
```

## Critérios de aceitação que valem alguma coisa

Um AC serve se ele é **verificável**: dá para escrever um teste que o afirma ou nega sem
julgamento. "A tela deve ser rápida" não serve. "A listagem responde em menos de 300ms com
1000 registros" serve.

O `agf` mede a qualidade dos AC pelos critérios INVEST e reprova abaixo de 60 na definição
de pronto. Ferramentas para melhorar:

```bash
agf ac lint <id>          # aponta AC fraco
agf ac harden <id>        # reescreve para o esqueleto Dado-Quando-Então
agf ac suggest <id>       # propõe critérios faltantes
agf ac nfr <id>           # aponta requisitos não-funcionais ausentes
agf verify-ac <id>        # checa se o AC já está satisfeito por código existente
```

O `agf verify-ac` merece destaque: antes de implementar, ele diz se aquilo já existe. É a
defesa mais barata contra reconstruir o que já está pronto.

## Quebrar o que está grande demais

```bash
agf decompose             # acha tarefas superdimensionadas e sugere subtarefas
agf decompose <id>        # decompõe uma específica
```

A régua é a atomicidade: uma tarefa deve caber em cerca de duas horas de trabalho. Uma
tarefa que não cabe não é uma tarefa, é um épico disfarçado, e ela vai reprovar a
verificação de "não superdimensionado" na definição de pronto.

Para repetir uma decomposição que funciona:

```bash
agf template list
agf template apply <template> --parent <id>
```

## Encadear dependências

```bash
agf sequence <id-pai>     # encadeia os filhos em depends_on, respeitando WIP=1
```

Isso transforma um conjunto de irmãos paralelos numa fila, o que é normalmente o que você
quer quando há um só executor.

## Objetivos e resultados-chave

Épicos podem carregar OKR — o objetivo e os resultados que dizem se ele valeu:

```bash
agf okr                   # painel de OKR: objetivo, atingimento, status derivado
```

Um resultado-chave precisa de uma fonte de dados que o produza. Um KR sem produtor fica
"verde fazendo nada" — ele reporta 100% porque nada foi medido. O painel distingue
"sem dado" de "0%" justamente para expor isso.

## Fechar as lacunas do plano

Depois de montar o backlog, rode:

```bash
agf gaps
```

Ele encontra, sem gastar token, os buracos de completude: requisito sem tarefa que o
implemente, AC sem teste, tarefa não-atômica, critério ambíguo, requisito não-funcional
ausente. O Capítulo 10 é inteiro sobre isso.

## Registrar o que não é tarefa

Nem tudo que aparece no planejamento é trabalho. Use o tipo certo, ou suas métricas mentem:

```bash
agf node add --type risk --title "..."          # risco a triar depois
agf node add --type decision --title "..."      # decisão tomada
agf adr create "..."                            # decisão de arquitetura
agf out-of-scope add "..."                      # escopo descartado, explicitamente
agf question ask "..."                          # pergunta que depende de outra pessoa
```

O `agf question` existe para o caso que mais trava entrega: uma ambiguidade que **não** se
resolve lendo mais código, porque a informação está com outra pessoa ou outro time.
Registre a pergunta, siga com o que não depende dela, e deixe a suposição visível — em vez
de parar ou de inventar o contrato.
