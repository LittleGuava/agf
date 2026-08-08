# Ciclo de vida, fases e gates

O `agf` organiza o trabalho em fases, e entre fases há **gates**: verificações que precisam
passar para a entrega avançar.

## Três fases canônicas, nove internas

Você vai encontrar as duas nomenclaturas, e isso confunde até você saber por quê.

O motor tem **três** fases canônicas:

| Fase    | O que acontece                            |
| ------- | ----------------------------------------- |
| `SHAPE` | Descobrir e desenhar o que vale construir |
| `BUILD` | Construir e validar                       |
| `SHIP`  | Revisar, entregar, publicar e ouvir       |

Elas agrupam **nove** fases internas, preservadas por compatibilidade e porque nomeiam
melhor cada etapa:

| Canônica | Internas                           |
| -------- | ---------------------------------- |
| `SHAPE`  | ANALYZE, DESIGN, PLAN              |
| `BUILD`  | IMPLEMENT, VALIDATE                |
| `SHIP`   | REVIEW, HANDOFF, DEPLOY, LISTENING |

Os comandos aceitam as duas formas. Quando este manual disser "a fase de VALIDATE", entenda
que ela vive dentro de `BUILD`.

```bash
agf phase            # detecta em que fase o grafo está
agf lifecycle        # relatório consolidado de uma fase
```

## O que fazer em cada fase

| Fase      | Comandos típicos                                        |
| --------- | ------------------------------------------------------- |
| ANALYZE   | `agf import-prd`, `agf node add`, `agf gate`            |
| DESIGN    | `agf adr`, `agf edge add`, `agf constitution`           |
| PLAN      | `agf decompose`, `agf template apply`, `agf ac`         |
| IMPLEMENT | `agf start`, `agf done`, `agf harness`                  |
| VALIDATE  | `agf check`, `agf gate`, `agf certainty`, `agf metrics` |
| REVIEW    | `agf export`, `agf insights`, `agf gate review`         |
| HANDOFF   | `agf memory write`, `agf snapshot create`               |
| DEPLOY    | `agf export`, `agf forecast`, `agf gate deploy`         |
| LISTENING | `agf node add`, `agf import-prd` (o ciclo recomeça)     |

## Os gates de transição

Cada passagem de fase tem um gate nomeado e pré-requisitos:

| Transição            | Gate             | Exige                            |
| -------------------- | ---------------- | -------------------------------- |
| ANALYZE → DESIGN     | `prd_quality`    | Requisitos existem               |
| DESIGN → PLAN        | `design_ready`   | ADRs e contratos existem         |
| PLAN → IMPLEMENT     | `sprint_health`  | Decomposição e dependências      |
| IMPLEMENT → VALIDATE | `validate_ready` | Percentual de tarefas concluídas |
| VALIDATE → REVIEW    | `done_integrity` | Cobertura de cenários            |
| REVIEW → HANDOFF     | `review_ready`   | Raio de impacto avaliado         |
| HANDOFF → DEPLOY     | `handoff_ready`  | Completude de documentação       |
| DEPLOY → LISTENING   | `deploy_ready`   | Verificação de release           |

Alguns gates também exigem uma nota mínima de _harnessability_ (Capítulo 9): a passagem
para PLAN pede 55, e a de DEPLOY é a mais rígida, pedindo 70.

```bash
agf gate                # avalia todos os gates aplicáveis
agf gate deploy         # avalia um gate específico
agf gate --help         # os alvos disponíveis
```

## Presets: quão rígido você quer o processo

Nem todo projeto quer o mesmo rigor. O `agf` traz **quatro** presets:

| Preset        | Perfil                                                         |
| ------------- | -------------------------------------------------------------- |
| `default`     | Consultivo — os gates avisam, raramente bloqueiam              |
| `strict-tdd`  | Teste-primeiro obrigatório, definição de pronto sem concessões |
| `agile-light` | Cerimônia mínima                                               |
| `enterprise`  | Rastreabilidade e documentação máximas                         |

```bash
agf preset list
agf preset show strict-tdd
agf preset --apply strict-tdd
```

O preset controla quais verificações da definição de pronto são obrigatórias e quais são
recomendadas — é o botão que decide se o `agf` é um assistente ou um portão.

## Gates não são o mesmo que a definição de pronto

Vale separar, porque os dois reprovam e é fácil confundir:

- **`agf check <id>`** olha para **uma tarefa**: ela tem AC, passou por `in_progress`, tem
  teste declarado.
- **`agf gate`** olha para **a fase inteira**: o conjunto de tarefas está maduro o
  suficiente para avançar.

Uma tarefa pode passar no `check` e a fase continuar reprovando no `gate`, porque falta
outra coisa no conjunto.
