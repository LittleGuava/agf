# O modelo mental do grafo

Tudo no `agf` é nó e aresta. Entender essas duas coisas é entender a ferramenta.

## Nós

Um nó é uma unidade de trabalho ou de conhecimento. Ele tem tipo, título, status,
prioridade, descrição, critérios de aceitação e — quando é trabalho de código — as listas
de arquivos de implementação e de teste que declaram seu escopo.

Existem **23 tipos de nó**. Na prática você usará meia dúzia; os demais existem para
projetos que modelam o domínio com mais rigor.

| Grupo           | Tipos                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------- |
| Trabalho        | `epic`, `task`, `subtask`, `bug`                                                             |
| Especificação   | `requirement`, `constraint`, `acceptance_criteria`, `contract`, `interface`, `config_schema` |
| Decisão e risco | `decision`, `risk`, `constitution`                                                           |
| Planejamento    | `milestone`, `metric`, `performance_budget`                                                  |
| Modelagem       | `formula`, `state_machine`, `data_table`, `asset`                                            |
| Verificação     | `scenario`, `browser_test`, `journey_run`                                                    |

A distinção que mais importa no dia a dia é entre **nó de trabalho** e **nó de
especificação**. Um `task` drena: nasce em backlog e morre em done. Um `requirement` ou um
`contract` não drena da mesma forma — ele _existe_ enquanto o sistema existir, e fecha
quando algo o implementa. Tratar os dois como fila é o erro mais comum de quem começa, e
ele infla suas métricas com trabalho que não é trabalho.

## Status

São **cinco** status no esquema:

| Status        | Significado                                               |
| ------------- | --------------------------------------------------------- |
| `backlog`     | Existe, ainda não foi puxado                              |
| `ready`       | Pronto para ser puxado (critérios de entrada satisfeitos) |
| `in_progress` | Sendo trabalhado agora                                    |
| `blocked`     | Impedido por algo declarado                               |
| `done`        | Concluído e validado                                      |

A transição é validada: o `agf` recusa marcar como `done` algo que nunca passou por
`in_progress`. Isso não é burocracia — é o que permite dizer depois se o trabalho de fato
aconteceu ou se alguém só mudou um campo.

> **Detalhe que aparece na prática:** além dos cinco do esquema, o tipo em tempo de execução
> admite `quarantined` e `satisfied`. O segundo é usado quando um nó de especificação é
> fechado automaticamente pela implementação que o satisfaz. Você não os digita; eles
> aparecem.

## Arestas

Uma aresta liga dois nós e diz **como** eles se relacionam. São **15 tipos**:

| Tipo              | Lê-se                               |
| ----------------- | ----------------------------------- |
| `parent_of`       | A contém B                          |
| `child_of`        | A está contido em B                 |
| `depends_on`      | A precisa de B antes de começar     |
| `blocks`          | A impede B                          |
| `related_to`      | A tem a ver com B (sem ordem)       |
| `priority_over`   | A vem antes de B                    |
| `implements`      | A implementa o requisito B          |
| `derived_from`    | A nasceu de B                       |
| `provides`        | A fornece o artefato B              |
| `consumes`        | A consome o artefato B              |
| `requires_asset`  | A precisa do recurso B              |
| `decomposed_into` | A foi quebrado em B                 |
| `tests`           | A testa B                           |
| `validates_adr`   | A valida a decisão de arquitetura B |
| `mirrors_unit`    | A espelha a unidade B               |

A aresta que mais governa o dia a dia é `depends_on`: ela é o que faz uma tarefa **não**
ser oferecida pelo `agf next` enquanto a dependência estiver aberta. Bloqueio no `agf` não
é um campo que alguém marca — é uma consequência calculada da topologia.

## Comandos essenciais

```bash
agf node add --type task --title "Título" --ac "critério testável"
agf node show <id>
agf node status <id> in_progress
agf node update <id> --implementation-files src/a.ts --test-files src/tests/a.test.ts
agf edge add --from <id-a> --to <id-b> --type depends_on
agf query --type task --status backlog
agf search "termo"
agf stats
```

Duas observações que economizam tempo:

- **`agf node rm` é remoção lógica.** O nó é arquivado, não apagado. Qualquer contagem que
  você fizer direto no SQLite precisa filtrar os arquivados.
- **Critério de aceitação é praticamente imutável.** Corrigir um AC significa substituir a
  lista inteira via `agf node update --ac`, não editar uma linha.

## WIP = 1, e por quê

O `agf` limita o trabalho em progresso a **uma** tarefa por vez, e oferece trabalho por
**pull** (`agf next` puxa) em vez de push (você empurra).

O fundamento é a Lei de Little: `tempo de ciclo = trabalho em progresso ÷ vazão`. Com o
trabalho em progresso fixo em 1, o tempo de ciclo é o menor possível para a vazão que você
tem. Cinco tarefas começadas ao mesmo tempo não entregam mais rápido — entregam cinco
coisas pela metade, e pela metade não entrega nada.

Na prática isso significa: termine antes de puxar. O `agf next` não oferece uma segunda
tarefa enquanto a primeira estiver aberta.

## Ver o grafo

```bash
agf stats                      # contagens por tipo e status
agf export --format mermaid    # diagrama
agf dashboard                  # painel web, aba Grafo
agf kanban                     # quadro por status, com métricas de fluxo
```
