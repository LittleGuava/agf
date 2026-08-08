# Apêndice D — Tabelas de referência

Todas as contagens deste apêndice foram conferidas contra o código-fonte, não contra a
documentação existente — em vários pontos as duas divergem, e onde divergem o código vence.

## Tipos de nó (23)

| Grupo           | Tipos                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------- |
| Trabalho        | `epic`, `task`, `subtask`, `bug`                                                             |
| Especificação   | `requirement`, `constraint`, `acceptance_criteria`, `contract`, `interface`, `config_schema` |
| Decisão e risco | `decision`, `risk`, `constitution`                                                           |
| Planejamento    | `milestone`, `metric`, `performance_budget`                                                  |
| Modelagem       | `formula`, `state_machine`, `data_table`, `asset`                                            |
| Verificação     | `scenario`, `browser_test`, `journey_run`                                                    |

## Status (5 no esquema)

`backlog` · `ready` · `in_progress` · `blocked` · `done`

Em tempo de execução aparecem ainda `quarantined` e `satisfied` — este último quando um nó
de especificação é fechado pela implementação que o satisfaz.

## Tipos de aresta (15)

`parent_of` · `child_of` · `depends_on` · `blocks` · `related_to` · `priority_over` ·
`implements` · `derived_from` · `provides` · `consumes` · `requires_asset` ·
`decomposed_into` · `tests` · `validates_adr` · `mirrors_unit`

## Tamanho e prioridade

Tamanho: `XS` · `S` · `M` · `L` · `XL` — Prioridade: `1` a `5`

## Tipos de gap (18)

`traceability_break` · `ac_coverage_break` · `weak_ac_testability` · `missing_nfr` ·
`missing_edge_case` · `ambiguous_ac` · `non_atomic_task` · `design_drift` ·
`estimate_drift` · `blocking_container` · `stale_container` · `duplicate_prd` ·
`phantom_done` · `driver_boundary_missing` · `orphan_commit` · `ac_delivery_doubt` ·
`phantom_pointer` · `contract_coverage`

## Dimensões de harness (9) e pesos

| Dimensão       | Peso |
| -------------- | ---- |
| `types`        | 0,25 |
| `tests`        | 0,25 |
| `fitness`      | 0,10 |
| `docs`         | 0,10 |
| `naming`       | 0,10 |
| `errors`       | 0,05 |
| `context`      | 0,05 |
| `provenance`   | 0,05 |
| `connectivity` | 0,05 |

Os pesos somam 1,00.

| Grau | Faixa        |
| ---- | ------------ |
| A    | 85 ou mais   |
| B    | 70 a 84      |
| C    | 55 a 69      |
| D    | abaixo de 55 |

## Fases

| Canônica (3) | Internas (9)                       |
| ------------ | ---------------------------------- |
| `SHAPE`      | ANALYZE, DESIGN, PLAN              |
| `BUILD`      | IMPLEMENT, VALIDATE                |
| `SHIP`       | REVIEW, HANDOFF, DEPLOY, LISTENING |

## Gates de transição (8)

| Transição            | Gate             |
| -------------------- | ---------------- |
| ANALYZE → DESIGN     | `prd_quality`    |
| DESIGN → PLAN        | `design_ready`   |
| PLAN → IMPLEMENT     | `sprint_health`  |
| IMPLEMENT → VALIDATE | `validate_ready` |
| VALIDATE → REVIEW    | `done_integrity` |
| REVIEW → HANDOFF     | `review_ready`   |
| HANDOFF → DEPLOY     | `handoff_ready`  |
| DEPLOY → LISTENING   | `deploy_ready`   |

## Definição de pronto (8 verificações)

| #   | Verificação                          | Severidade  |
| --- | ------------------------------------ | ----------- |
| 1   | Tem critérios de aceitação           | obrigatório |
| 2   | Qualidade do AC ≥ 60                 | obrigatório |
| 3   | Sem bloqueadores não resolvidos      | obrigatório |
| 4   | Fluxo de status válido               | obrigatório |
| 5   | Tem descrição                        | recomendado |
| 6   | Não superdimensionado sem subtarefas | recomendado |
| 7   | Ao menos um AC testável              | recomendado |
| 8   | Arquivos de teste declarados         | recomendado |

## Alavancas de economia (19)

`heat_kernel` · `budget_kleiber` · `mdl_select` · `info_bottleneck` · `forage_stop` ·
`ncd_dedup` · `stigmergy` · `consolidation` · `zipf_estimate` · `context_diff` ·
`quorum_gate` · `learned_routing` · `aco_autotune` · `cognitive_debt` · `budget_governor` ·
`cascade` · `semantic_cache` · `submodular_select` · `memory_salience`

Todas nascem desligadas. Pacote seguro: `ncd_dedup`, `forage_stop`, `info_bottleneck`,
`zipf_estimate`, `heat_kernel`.

## Camadas de modelo e perfis

| Camada     | Perfil     | Repetições |
| ---------- | ---------- | ---------- |
| `cheap`    | `fast`     | 1          |
| `build`    | `build`    | 2          |
| `frontier` | `frontier` | 3          |

## Tiers de procedência (4)

`claim` → `cited` → `validated` → `proven`

A promoção a `validated` exige um identificador de execução de teste; a `proven`, um hash
determinístico. Uma alegação não vira prova sem recibo.

## Presets (4)

`default` · `strict-tdd` · `agile-light` · `enterprise`

## Portões de teste

| Portão | Comando              | Quando            |
| ------ | -------------------- | ----------------- |
| Tarefa | `npm run test:blast` | Todo `agf done`   |
| Épico  | `npm run test:node`  | Promoção de épico |
| PR     | `npm test`           | Antes de push     |

## Números da superfície

| Item                                | Quantidade |
| ----------------------------------- | ---------- |
| Caminhos de comando invocáveis      | 486        |
| Comandos raiz                       | 155        |
| Canais de hook declarados           | 46         |
| Pontos de hook ligados              | 29         |
| Skills registradas                  | 50         |
| Provedores por variável de ambiente | 10         |

> Estes últimos números mudam a cada release. O Apêndice A é regenerado junto com o manual;
> para os demais, `agf hooks list`, `agf skill list` e `agf doctor --providers` dão o valor
> ao vivo.
