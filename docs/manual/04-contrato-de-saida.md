# O contrato de saída e a economia de entrada

Todo comando do `agf` responde com o mesmo envelope JSON em `stdout`. Não existe comando
que imprima texto solto. Isso é o que torna a ferramenta programável por outro agente sem
precisar interpretar prosa.

## O envelope

Sucesso:

```json
{ "ok": true, "data": { "totalNodes": 4015 }, "meta": { "command": "stats", "ms": 18 } }
```

Falha:

```json
{ "ok": false, "code": "NOT_FOUND", "error": "Nó não encontrado: node_x", "meta": { "command": "node.show" } }
```

| Campo    | Presença     | O que carrega                                                 |
| -------- | ------------ | ------------------------------------------------------------- |
| `ok`     | sempre       | `true` ou `false`                                             |
| `status` | às vezes     | `ok`, `advisory` ou `fail`                                    |
| `code`   | em falha     | Código estável em `MAIÚSCULA_COM_UNDERSCORE`                  |
| `error`  | em falha     | Mensagem legível                                              |
| `data`   | quase sempre | A carga útil do comando                                       |
| `meta`   | sempre       | `command`, `ms`, e conforme o caso `dir`, `count`, `warnings` |

Há um terceiro estado além de sucesso e falha: **advisory**. Ele significa "funcionou, mas
tem algo que você precisa saber" — `ok` continua `true` e a mensagem vem em `message`.
Tratar advisory como falha faz você bloquear um fluxo que está correto.

Registros e avisos vão para `stderr`, nunca para `stdout`. Isso permite `agf ... | jq`
sem sujeira.

Os códigos de erro mais frequentes estão no Apêndice C.

## Filtrar na origem: `--select`

Esta é a flag mais importante do manual para quem paga por token.

Sem ela, `agf stats` devolve o envelope inteiro. Com ela, devolve só o ramo pedido:

```bash
agf stats --select data.byStatus
```

```json
{ "ok": true, "data": { "byStatus": { "backlog": 541, "done": 3091 } }, "meta": { "command": "stats" } }
```

O `--select` aceita caminho com ponto e funciona em **todo** comando. A diferença de custo
não é marginal: um `agf query` sem filtro pode devolver centenas de nós completos quando
você queria três identificadores.

A regra prática: se você sabe qual campo quer, peça o campo.

## As outras flags globais

Funcionam em qualquer posição da linha, inclusive depois do subcomando.

| Flag               | Efeito                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| `--select <paths>` | Projeta o envelope nos caminhos indicados                                    |
| `--profile <nome>` | Preset de saída por agente (`claude-code`, `copilot`, `opencode`, `minimal`) |
| `--ai`             | Modo compacto — envelope mínimo e sem registros                              |
| `--quiet`          | Suprime `stderr`; ativa sozinho quando a saída não é um terminal             |
| `--pretty`         | JSON indentado, para leitura humana                                          |
| `--auto-format`    | Escolhe entre formato rico e JSON conforme o destino                         |
| `--decision-only`  | Emite só o veredito, mandando o contexto para a memória                      |

Quando `--select` e `--profile` aparecem juntos, `--select` vence.

Além dessas, dois parâmetros aparecem em quase todo comando: `--dir` (o diretório do
projeto, ecoado de volta em `meta.dir`) e `--limit` (teto de itens em comandos de listagem).

## Descobrir comandos sem inflar o contexto

São 486 caminhos invocáveis. Ninguém memoriza isso, e despejar a lista inteira no contexto
custa caro. Há três caminhos, do mais barato ao mais caro:

```bash
agf help                          # índice agrupado dos comandos principais
agf <comando> --help              # flags de um comando específico
agf retrieve-command "<intenção>" # descrição em linguagem natural → comando
```

O `agf retrieve-command` faz busca sobre o mesmo catálogo que gera o Apêndice A deste
manual. Ele é **um ranqueamento, não um oráculo**: confirme o resultado com `--help` antes
de executar, e desconfie especialmente quando ele sugerir algo destrutivo.

## Comprimir saída de comandos externos

Ler a saída bruta de um comando de shell num contexto de agente é desperdício. O `agf`
oferece um compressor:

```bash
agf compress run -- npm test
comando_qualquer | agf compress run --stdin
```

Uma ressalva importante de uso: se você está no Claude Code, a compressão já acontece
automaticamente por um hook, e prefixar `agf compress run` comprime duas vezes. Em CLIs sem
hook — Copilot, Codex, Cursor, Gemini — o envelope explícito é necessário.

## Por que a saída é assim

Duas razões que valem entender, porque explicam decisões que aparecem no resto do manual.

A primeira é que **token de saída custa vários múltiplos do token de entrada**, e entrada é
cacheável. Por isso o `agf` prefere devolver um esqueleto preenchível a gerar texto do
zero, e prefere um ponteiro a um despejo.

A segunda é que um formato estável permite **gates determinísticos**. Um comando que
devolve `{"ok": false, "code": "BLAST_RADIUS_EXCEEDED"}` pode ser lido por um script, por um
hook ou por outro agente sem ambiguidade. Prosa não pode.
