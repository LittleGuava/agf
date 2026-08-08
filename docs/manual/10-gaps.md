# Gaps: completude detectada por máquina

Um _gap_ é uma lacuna de completude no grafo. O `agf` os detecta de forma determinística —
sem LLM, sem token — e devolve, para cada um, o comando exato que o fecha.

```bash
agf gaps
agf gaps --severity required --json     # só os bloqueadores, para consumo por programa
agf gaps --kind phantom_done            # um tipo específico
```

## Os 18 tipos

| Tipo                      | O que significa                                       |
| ------------------------- | ----------------------------------------------------- |
| `traceability_break`      | Requisito sem tarefa que o implemente                 |
| `ac_coverage_break`       | AC do pai não coberto por nenhum filho                |
| `weak_ac_testability`     | Critério que não dá para testar como está             |
| `missing_nfr`             | Requisito não-funcional ausente onde era esperado     |
| `missing_edge_case`       | Caso de borda não contemplado                         |
| `ambiguous_ac`            | Critério com mais de uma leitura possível             |
| `non_atomic_task`         | Tarefa grande demais para ser uma tarefa              |
| `design_drift`            | Implementação divergiu do desenho                     |
| `estimate_drift`          | Estimativa descolada da realidade medida              |
| `blocking_container`      | Contêiner que bloqueia sem ser trabalho               |
| `stale_container`         | Épico parado sem movimento                            |
| `duplicate_prd`           | Documento importado duas vezes                        |
| `phantom_done`            | Marcado como pronto declarando arquivo que não existe |
| `driver_boundary_missing` | Fronteira de driver não declarada                     |
| `orphan_commit`           | Commit sem nó correspondente                          |
| `ac_delivery_doubt`       | Dúvida sobre o AC ter sido de fato entregue           |
| `phantom_pointer`         | Ponteiro para arquivo ou símbolo inexistente          |
| `contract_coverage`       | Contrato sem cobertura                                |

## O laço de fechamento

O `agf` **detecta**; quem fecha é você (ou o agente que conduz). Cada gap traz um campo
`applyVia` com os comandos exatos:

```bash
agf gaps --severity required --json          # 1. pega os bloqueadores
# 2. para cada gap, rode o applyVia — por exemplo:
agf edge add --from <tarefa> --to <requisito> --type implements
agf gaps                                      # 3. repita até ready: true
```

O desfecho é determinístico e independe de qual agente fechou.

## `phantom_done`: o mais importante

Dos dezoito, este é o que mais paga. Ele cruza dois eixos físicos — os arquivos de teste e
os de implementação declarados no nó — contra o disco, e recusa qualquer arquivo fantasma.

O defeito que ele pega: um nó marcado como concluído cujo teste declarado **não existe**.
Isso acontece o tempo todo quando alguém (humano ou agente) reporta o próprio progresso, e
é invisível para qualquer contagem de "X/Y concluídos", porque o status diz que está feito.

```bash
agf gaps --kind phantom_done
```

## Remediar de verdade, e não enganar o detector

Este é o ponto onde é fácil causar dano achando que se está consertando.

Diante de um `phantom_done`, há **duas** causas possíveis, e elas pedem ações opostas:

**(a) Ponteiro obsoleto** — o trabalho existe, o registro é que envelheceu. O arquivo foi
renomeado ou mudou de pasta. Corrigir o ponteiro custa quase nada e o "pronto" era
verdadeiro o tempo todo.

**(b) Artefato ausente** — o registro diz a verdade sobre a intenção e mente sobre a
entrega: ninguém escreveu aquilo. A única remediação honesta é **escrever o artefato**.

Para decidir qual é, procure o arquivo **por conteúdo, não por caminho**: se o símbolo ou o
tema existe em algum lugar do repositório, é (a); se não existe em lugar nenhum, é (b).

> **O que nunca fazer:** apontar o registro para um arquivo vizinho de nome parecido para
> zerar o contador. Isso não conserta nada — converte um detector que funcionava num
> detector cego, e o defeito volta a ser invisível com a bênção de um gate verde. Se for o
> caso (b) e você não puder escrever o artefato agora, **deixe o gate vermelho e diga por
> quê**. Vermelho honesto é informação; verde comprado é dano.

Um sinal de alerta: o pensamento "existe um teste parecido, deve dar no mesmo". Um teste
vizinho só serve se ele trava o **mesmo invariante**.

## Quando um lote inteiro aparece

Renomeações em massa e migrações de diretório fabricam ponteiros obsoletos em silêncio —
nada quebra no build, porque o grafo não é compilado. Depois de qualquer renomeação ampla,
rode o detector de propósito, em vez de esperar que ele apareça meses depois parecendo
fraude.

E abra os achados **um a um**. Um mesmo lote costuma misturar as duas classes.

## Enriquecimento

Cada gap emite um pedido de enriquecimento com uma ação de uma lista curta: adicionar nós,
adicionar arestas, reescrever AC, esclarecer, decompor, anotar. É o que torna o laço
utilizável por qualquer CLI — o `agf` diz o que falta e qual comando resolve, e quem
conduz executa.
