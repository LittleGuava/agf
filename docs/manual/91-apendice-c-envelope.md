# Apêndice C — Envelope e códigos de erro

## O envelope

Todo comando escreve **exatamente um** envelope JSON em `stdout`. Registros e avisos vão
para `stderr`.

```json
{
  "ok": true,
  "status": "ok",
  "data": {},
  "meta": { "command": "node.add", "ms": 12, "dir": "/caminho", "count": 3 }
}
```

```json
{
  "ok": false,
  "status": "fail",
  "code": "NOT_FOUND",
  "error": "Nó não encontrado: node_x",
  "meta": { "command": "node.show" }
}
```

## Campos

| Campo                   | Quando aparece | Conteúdo                                   |
| ----------------------- | -------------- | ------------------------------------------ |
| `ok`                    | sempre         | `true` ou `false`                          |
| `status`                | frequente      | `ok`, `advisory` ou `fail`                 |
| `code`                  | em falha       | Código estável, `MAIÚSCULA_COM_UNDERSCORE` |
| `error`                 | em falha       | Mensagem legível                           |
| `message`               | em advisory    | O aviso                                    |
| `data`                  | quase sempre   | A carga do comando                         |
| `meta.command`          | sempre         | O comando executado                        |
| `meta.ms`               | quase sempre   | Duração                                    |
| `meta.dir`              | frequente      | Diretório resolvido                        |
| `meta.count`            | em listagens   | Quantidade de itens                        |
| `meta.warnings`         | eventual       | Avisos que não reprovam                    |
| `meta.compressionRatio` | com compressão | Quanto foi comprimido                      |
| `meta.trace`            | com rastro     | Identificador, se é parcial, e os passos   |

## Os três estados

Este é o ponto onde integrações erram com mais frequência.

| Estado     | `ok`    | Significa                                       |
| ---------- | ------- | ----------------------------------------------- |
| `ok`       | `true`  | Funcionou                                       |
| `advisory` | `true`  | Funcionou, **e** há algo que você precisa saber |
| `fail`     | `false` | Não funcionou                                   |

**Advisory não é falha.** Tratá-lo como erro faz você bloquear um fluxo correto. A regra
segura é ramificar por `ok`, e ler `message` quando `status` for `advisory`.

## Códigos de erro frequentes

| Código                  | Significa                                   | O que fazer                              |
| ----------------------- | ------------------------------------------- | ---------------------------------------- |
| `NOT_FOUND`             | Nó, aresta ou recurso inexistente           | Confira o identificador com `agf query`  |
| `NO_TASKS`              | Nada desbloqueado para puxar                | Veja o Capítulo 17                       |
| `INVALID_TRANSITION`    | Violação do fluxo de status                 | Passe por `in_progress` antes de `done`  |
| `STORE_NOT_FOUND`       | O grafo não existe no diretório             | Rode `agf init`                          |
| `BLAST_RADIUS_EXCEEDED` | Arquivo modificado fora do escopo declarado | Declare o escopo ou revise o que vazou   |
| `NO_SCENARIOS`          | Suíte de avaliação sem cenários             | Crie os cenários antes de rodar o portão |

Os códigos são estáveis: pode-se ramificar sobre eles em script. As mensagens em `error`
são para humanos e podem mudar de redação.

## Ler o envelope em script

```bash
# só o dado
agf stats --select data.byStatus | jq '.data.byStatus'

# ramificar por sucesso
if agf check "$ID" --select data.dod.ready | jq -e '.data.dod.ready' >/dev/null; then
  agf done "$ID"
fi

# capturar o código de erro
CODE=$(agf node show inexistente | jq -r '.code // empty')
```

Como `stdout` carrega só o envelope, `| jq` funciona sem filtragem prévia.

## Saída de processo

Comandos de portão (`--gate`, `agf quality`, `npm run economy:gate`) devolvem código de
saída diferente de zero quando reprovam, para poderem ser usados em CI diretamente.
