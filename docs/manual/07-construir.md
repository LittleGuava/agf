# Construir: o laço de implementação

Este é o capítulo que você usa todo dia. Ele descreve o caminho de uma tarefa: de puxar até
fechar, com a validação no meio.

## O laço curto (dois comandos)

```bash
agf start          # acorda, puxa a próxima tarefa, monta o contexto, marca in_progress
# ... implementa com TDD ...
agf done <id>      # valida a definição de pronto, roda os testes, marca done
```

É o suficiente para a maioria das tarefas. O `agf start` faz num passo o que o laço
granular faz em três, e o `agf done` sugere a próxima tarefa ao terminar.

## O laço granular (controle fino)

Quando você quer ver cada etapa:

```bash
agf next                    # puxa a próxima tarefa desbloqueada (WIP=1)
agf context <id>            # pacote de contexto compacto da tarefa
agf brief <id>              # a especificação de delegação, se outro agente vai executar
# ... TDD: Red → Green → Refactor ...
agf check <id>              # definição de pronto + aderência a TDD
agf node status <id> done   # transição validada
```

## Puxar: `agf next`

O `agf next` devolve a próxima tarefa **desbloqueada**. Bloqueio é calculado da topologia:
uma tarefa com `depends_on` aberto não é oferecida.

Duas coisas que surpreendem quem começa:

- **A escolha é global, não por épico.** O `agf next` ordena por prioridade e ordem de
  criação em todo o grafo. Ele pode devolver uma tarefa de outro épico que não é o que você
  tinha em mente — confira o `parentId` do que voltou em vez de aceitar cego.
- **`NO_TASKS` não significa "acabou o trabalho".** Significa que nada está desbloqueado
  agora. Frequentemente há trabalho preso atrás de uma dependência, ou o backlog está cheio
  de nós de especificação que não drenam. O Capítulo 9 mostra o que fazer nesse caso.

Para deixar a colônia escolher em vez da ordem determinística, use `agf next --aco`
(Capítulo 15).

## O contexto: pedir o que basta

```bash
agf context <id>
```

Devolve um pacote compacto: a intenção da tarefa, seus critérios de aceitação, as
dependências, os arquivos relevantes e o raio de impacto. É o substituto de despejar
arquivos inteiros no contexto do agente.

Quando outro agente vai executar, o `agf brief <id>` é melhor: ele monta uma especificação
de delegação com contrato, escopo proibido e critérios — veja o Capítulo 8.

## TDD não é sugestão

O `agf` mede aderência a teste-primeiro e o `agf check` a cobra. O ciclo é o clássico:

1. **Red** — escreva o teste e veja-o falhar. Um teste que passa de primeira não provou nada.
2. **Green** — a implementação mínima que faz passar.
3. **Refactor** — melhore com o teste segurando.

O rigor sobre o passo 1 tem uma razão prática que aparece muito: um teste escrito depois
tende a afirmar a implementação em vez do efeito. Ele fica verde e não morde.

```bash
agf test                # roda só os testes afetados pela tarefa atual
agf tdd-score           # pontua a qualidade do TDD de 0 a 100
```

## Declarar o escopo

Antes de fechar, diga quais arquivos são seus:

```bash
agf node update <id> \
  --implementation-files src/core/x/y.ts \
  --test-files src/tests/y.test.ts
```

Isso não é papelada. É o que alimenta dois mecanismos: a triangulação (o `agf` cruza esses
caminhos com o disco e recusa arquivo fantasma) e o **gate de raio de impacto**, que
compara os arquivos modificados na árvore contra o escopo declarado.

Se você tentar fechar com arquivos modificados fora do escopo, o `agf` recusa:

```json
{ "ok": false, "code": "BLAST_RADIUS_EXCEEDED", "error": "modified file(s) outside the declared scope: ..." }
```

Essa recusa é útil mesmo quando você a contorna com `--force`: a mensagem enumera
exatamente o que está fora do escopo, o que revela na hora se o seu trabalho vazou — ou se
há trabalho de outra pessoa na árvore que você estava prestes a varrer para dentro do seu
commit.

## Validar: `agf check`

```bash
agf check <id>
```

Roda a definição de pronto. Os critérios obrigatórios reprovam; os recomendados baixam a
nota.

| #   | Verificação                                     | Severidade  |
| --- | ----------------------------------------------- | ----------- |
| 1   | Tem critérios de aceitação                      | obrigatório |
| 2   | Qualidade do AC ≥ 60 (INVEST)                   | obrigatório |
| 3   | Sem bloqueadores não resolvidos                 | obrigatório |
| 4   | Fluxo de status válido (passou por in_progress) | obrigatório |
| 5   | Tem descrição                                   | recomendado |
| 6   | Não está superdimensionado sem subtarefas       | recomendado |
| 7   | Ao menos um AC testável                         | recomendado |
| 8   | Lista de arquivos de teste preenchida           | recomendado |

## Fechar: `agf done`

```bash
agf done <id>
```

O `done` faz mais do que mudar um campo: roda a definição de pronto, executa o portão de
testes, registra o aprendizado em memória, marca o nó e sugere o próximo passo.

Os portões de teste são hierárquicos, para que o custo seja proporcional ao risco:

| Portão | Comando              | Quando                                   |
| ------ | -------------------- | ---------------------------------------- |
| Tarefa | `npm run test:blast` | Todo `agf done` — só os testes afetados  |
| Épico  | `npm run test:node`  | Quando o épico está pronto para promoção |
| PR     | `npm test`           | Antes de push / abertura de PR           |

O portão de tarefa usa o grafo de módulos do bundler para achar todos os testes
transitivamente afetados pelos seus arquivos alterados — inclusive os que não importam seu
arquivo diretamente.

## Um exemplo completo

```bash
agf node add --type task --title "Validar CPF na entrada do formulário" \
  --ac "CPF com dígito verificador inválido é recusado com erro no campo" \
  --ac "CPF válido com máscara e sem máscara são ambos aceitos"

agf node status <id> in_progress
# escreve src/tests/cpf.test.ts, vê falhar, implementa src/core/cpf.ts, vê passar

agf node update <id> --implementation-files src/core/cpf.ts --test-files src/tests/cpf.test.ts
agf check <id>
agf done <id>
```

## Quando o laço trava

| Sintoma                          | Causa provável                     | Onde ler   |
| -------------------------------- | ---------------------------------- | ---------- |
| `agf next` devolve `NO_TASKS`    | Tudo bloqueado ou só especificação | Capítulo 9 |
| `agf done` recusa com blast      | Arquivo fora do escopo declarado   | Acima      |
| `agf check` reprova por AC fraco | Critério não é verificável         | Capítulo 6 |
| Não há provedor configurado      | Modo delegado é o esperado         | Capítulo 8 |
