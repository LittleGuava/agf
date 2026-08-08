# Apêndice B — Flags globais

Estas flags funcionam em **qualquer** comando e em qualquer posição da linha, inclusive
depois do subcomando.

## Controle de saída

| Flag               | Efeito                                                           |
| ------------------ | ---------------------------------------------------------------- |
| `--select <paths>` | Projeta o envelope nos caminhos indicados, separados por vírgula |
| `--profile <nome>` | Preset de saída: `claude-code`, `copilot`, `opencode`, `minimal` |
| `--ai`             | Modo compacto — envelope mínimo, sem registros                   |
| `--quiet`          | Suprime `stderr`; ativa sozinho quando a saída não é um terminal |
| `--pretty`         | JSON indentado                                                   |
| `--auto-format`    | Escolhe entre formato rico e JSON conforme o destino             |
| `--decision-only`  | Emite apenas o veredito; o contexto vai para a memória           |

Quando `--select` e `--profile` aparecem juntos, **`--select` vence**.

## Contexto de execução

| Flag              | Efeito                                                    |
| ----------------- | --------------------------------------------------------- |
| `-d`, `--dir`     | Diretório do projeto (padrão: o diretório atual)          |
| `--db <caminho>`  | Aponta um banco específico, acima de qualquer outra regra |
| `-v`, `--version` | Versão                                                    |
| `-h`, `--help`    | Ajuda do comando                                          |

O diretório resolvido volta ecoado em `meta.dir`, o que ajuda a diagnosticar quando um
comando age no projeto errado.

## Convenções frequentes (não globais)

Aparecem em muitos comandos, com significado consistente:

| Flag             | Convenção                                                      |
| ---------------- | -------------------------------------------------------------- |
| `--limit <n>`    | Teto de itens em listagens (padrão 20 em comandos de consulta) |
| `--json`         | Força o envelope JSON onde o padrão é legível por humano       |
| `--dry-run`      | Simula sem gravar                                              |
| `--apply`        | Executa de fato o que o `--dry-run` mostraria                  |
| `--force`        | Ignora um portão — leia sempre a mensagem antes                |
| `--kind <k>`     | Filtra por tipo (em `gaps`, `insights`)                        |
| `--severity <s>` | `required` ou `recommended`                                    |
| `--live`         | Usa o provedor de verdade em vez de devolver o briefing        |
| `--gate`         | Falha o processo quando o limiar não é atingido                |

## Variáveis de ambiente

| Variável             | Para que serve                                                  |
| -------------------- | --------------------------------------------------------------- |
| `MCP_GRAPH_DB`       | Caminho do banco (mesma precedência de `--db`)                  |
| `AGF_RELEASES_BASE`  | Espelho para a instalação e o `agf upgrade`                     |
| `AGF_ECONOMY_AUTO=0` | Desliga a ativação automática do pacote seguro de alavancas     |
| `OPENROUTER_API_KEY` | E as demais chaves por provedor (veja `agf doctor --providers`) |

## Padrões de uso que valem memorizar

```bash
agf stats --select data.byStatus            # só o ramo que interessa
agf query --type task --status backlog --limit 5
agf gaps --severity required --json          # para consumo por programa
agf harness --violations --select data.violations
agf <qualquer> --pretty                      # para ler com os olhos
```
