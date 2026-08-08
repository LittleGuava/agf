# Economia de tokens: levers e ledgers

O terceiro pilar do `agf` é custo. Este capítulo explica o que economiza sozinho, o que é
opcional, e como saber se alguma coisa de fato economizou.

## O que já age sem você pedir

Estas alavancas operam no gateway, sem comando:

| Alavanca             | O que faz                                                    |
| -------------------- | ------------------------------------------------------------ |
| Edições por diff     | Envia só a região alterada, não o arquivo                    |
| Mapa do repositório  | Ranqueia por relevância em vez de despejar a árvore          |
| Portão de perda      | Reverte automaticamente uma compressão que quebrou o sentido |
| Roteador de conteúdo | Compressão específica por tipo (JSON homogêneo, código)      |
| CCR reversível       | Substitui trecho repetido por marcador, recuperável          |
| Repetição compacta   | Reenvia com feedback curto em vez do contexto inteiro        |

A CCR merece nota: o conteúdo original fica em cache e o texto leva um marcador
`⟨ccr:hash⟩`. Se você precisar do original de volta:

```bash
agf retrieve <hash>
```

## As alavancas opcionais

Existem **19** alavancas adicionais, com fundamento em papers de teoria da informação e
biologia. Todas nascem **desligadas**:

```bash
agf economy list                  # estado real de cada uma, com tokens acumulados
agf economy on forage_stop
agf economy off forage_stop
```

| Alavanca            | Ideia por trás                                                   |
| ------------------- | ---------------------------------------------------------------- |
| `forage_stop`       | Teorema do valor marginal — parar de buscar quando o retorno cai |
| `ncd_dedup`         | Distância de compressão normalizada (Kolmogorov)                 |
| `info_bottleneck`   | Gargalo de informação                                            |
| `zipf_estimate`     | Lei de Zipf                                                      |
| `heat_kernel`       | Difusão em grafo                                                 |
| `mdl_select`        | Comprimento mínimo de descrição                                  |
| `budget_kleiber`    | Lei de Kleiber (escala 3/4)                                      |
| `memory_salience`   | Saliência de memória (ACT-R)                                     |
| `semantic_cache`    | Cache por similaridade semântica                                 |
| `submodular_select` | Seleção submodular                                               |
| `cascade`           | Cascata do modelo barato para o caro                             |
| `learned_routing`   | Roteamento aprendido do histórico                                |
| `stigmergy`         | Reforço por trilha                                               |
| `consolidation`     | Consolidação de memória                                          |
| `context_diff`      | Diferença de contexto entre chamadas                             |
| `quorum_gate`       | Quórum antes de aceitar                                          |
| `aco_autotune`      | Autoajuste dos parâmetros de colônia                             |
| `cognitive_debt`    | Dívida cognitiva acumulada                                       |
| `budget_governor`   | Governador de orçamento                                          |

### O que é honesto dizer sobre elas

Medido em três repositórios reais: **só o `forage_stop` corta de fato** — entre 62% e 96%
da carga útil. As outras ficam no ruído.

Por isso a política é: nenhuma alavanca "nasce ligada" por promessa. Ela só liga por padrão
depois que um teste A/B mostrou ganho líquido. É o mesmo princípio do resto do manual — a
alegação precisa da medição.

Existe um pacote seguro que agrupa as que não perdem informação (`ncd_dedup`,
`forage_stop`, `info_bottleneck`, `zipf_estimate`, `heat_kernel`). Quando um agente de CLI
está conduzindo, esse pacote é ativado automaticamente; `AGF_ECONOMY_AUTO=0` desliga a
ativação.

Note que `mdl_select` fica **fora** do pacote seguro de propósito: ele reescreve com perda,
e um pacote "seguro" que reescreve não é seguro.

## Medir

Aqui está o que separa economia real de economia alegada:

```bash
agf status                      # painel: provider, tokens, custo, economia
agf savings                     # economia acumulada por tarefa, do ledger real
agf metrics                     # tokens e custo por tarefa e sessão
agf metrics --economy-report    # o que cada alavanca poupou
agf economy list                # estado + acumulado por alavanca
```

Toda economia entra num registro (`economy_lever_ledger`), e toda chamada num outro
(`llm_call_ledger`). **Antes de afirmar que uma alavanca economizou, confira se existe
linha no ledger.** Uma alavanca ligada que nunca disparou economiza zero, e "ligada" é
fácil de confundir com "agindo".

## O caso do ledger vazio

Se `agf metrics` mostra zero, há duas explicações e elas são muito diferentes:

1. **Você está em modo delegado.** Nenhuma chamada partiu do `agf`; o custo está no seu
   agente. Isso é o esperado, não um defeito.
2. **A alavanca está ligada mas não disparou.** Aí sim há algo a investigar.

O `agf status` distingue os dois casos.

## Portão de regressão de custo

Para impedir que uma mudança encareça o projeto sem ninguém ver:

```bash
npm run economy:gate            # falha quando a regressão passa de 10% da linha de base
```

Vale rodar antes de fundir alterações que tocam providers, roteamento ou as alavancas.

## A regra que explica o resto

Token de **saída** custa vários múltiplos do de **entrada**, e entrada é cacheável. Isso
tem duas consequências práticas que aparecem em todo o `agf`:

- Prefira reusar um esqueleto a gerar do zero. O modelo decide e preenche; não redesenha.
- Filtre na origem antes de ler. `--select`, `grep`, `--limit` custam quase nada; ler um
  arquivo inteiro para extrair três linhas afoga o contexto e a janela útil.
