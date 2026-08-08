# Modo delegado

O modo delegado é o arranjo para o qual o `agf` foi desenhado: **você** — ou o agente de
código que você usa — escreve o código, e o `agf` faz tudo que é determinístico em volta.

## Quando ele entra

Automaticamente, sempre que um comando que geraria texto é chamado sem provedor conectado.
Ele não falha; devolve:

```json
{ "ok": true, "data": { "mode": "delegated", "brief": { "...": "..." } } }
```

Isso vale para `agf run`, `agf deliver` e `agf autopilot --live`. O `brief` é a
especificação pronta para o agente que está conduzindo executar com o próprio modelo.

## O ciclo

```bash
agf next                    # qual é a próxima tarefa
agf brief <id>              # a especificação de delegação
# ... você implementa com seu próprio modelo e aplica as edições ...
agf submit <id> --result '{"arquivos":["src/x.ts"],"testes":{"passed":12,"failed":0},"desvios":[]}'
```

O `agf submit` valida o retorno, roda o portão de testes afetados, aplica a definição de
pronto e marca o nó. Desvios declarados viram achados no grafo em vez de sumirem.

## O briefing

```bash
agf brief <id>
agf brief <id> --format markdown        # para ler
agf brief <id> --format json            # para outro programa consumir
agf brief <id> --format claude-prompt   # pronto para colar num agente
```

O `agf` preenche o que o grafo já sabe — intenção, critérios, dependências, raio de
impacto, prontidão — e deixa marcados como `<fill: …>` os campos que exigem julgamento seu.

A heurística por trás do formato é: **especifique a ponta e a saída, delegue o meio**. Onde
o executor pode errar caro — contrato, limites, incerteza — você gasta algumas palavras
preventivas. O que ele faz bem sozinho, escrever o código dentro das guardas, você deixa
livre.

Os campos que valem preencher com cuidado:

| Campo         | Por que importa                                                       |
| ------------- | --------------------------------------------------------------------- |
| **Imite**     | Um arquivo-espelho vale mais que três parágrafos de convenção         |
| **Ler/tocar** | Caminhos e símbolos exatos a reusar — evita reconstrução              |
| **Contrato**  | Assinatura e comportamento esperados                                  |
| **NÃO**       | O que está proibido: refatorar vizinho, adicionar dependência         |
| **Teste com** | A fixture concreta, para não inventar setup instável                  |
| **Incerteza** | O que fazer se o contrato não bater — parar e reportar, não adivinhar |

## O retorno estruturado

O executor devolve JSON, não prosa:

```json
{
  "arquivos": ["src/core/x.ts", "src/tests/x.test.ts"],
  "testes": { "passed": 14, "failed": 0 },
  "desvios": ["usei Map em vez de Record: a chave é dinâmica"]
}
```

Retorno estruturado torna a validação um `parse` em vez de uma leitura. Retorno inválido
deve ser recusado e pedido de novo — é mais barato que descobrir depois que o teste nunca
rodou.

## Por que o registro de tokens fica zerado

Em modo delegado, `agf metrics` e `agf savings` mostram zero de gasto de LLM. Isso é
**correto**: nenhuma chamada partiu do `agf`. O custo aconteceu no agente que você está
usando, que tem a própria contabilidade.

Confundir isso com "a economia não está funcionando" é o mal-entendido mais comum sobre a
Parte III deste manual.

## Autopilot

Para deixar o laço rodando sozinho, com guardas:

```bash
agf autopilot              # laço: next → in_progress → definição de pronto → done | escala
agf autopilot --live       # com provedor conectado, gera de fato
```

O autopilot mantém WIP=1, aplica os gates a cada passo e **escala em vez de forçar** quando
uma tarefa não passa. Ele não é um botão de "faça o projeto"; é o laço do Capítulo 7
executado sem você digitar cada comando.

## Comandos de ponta a ponta

Três comandos maiores compõem os anteriores:

| Comando       | O que faz                                          |
| ------------- | -------------------------------------------------- |
| `agf genesis` | Projeto do zero: ideia → grafo → primeiro briefing |
| `agf deliver` | Pedido → PRD → grafo → construção com TDD          |
| `agf build`   | Orquestra PRD → grafo → decomposição → autopilot   |

Todos respeitam o modo delegado: sem provedor, entregam o briefing em vez de falhar.
