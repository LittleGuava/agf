# Providers, modelos e roteamento

Este capítulo só importa se você quer que o **próprio `agf`** faça chamadas de LLM. Em modo
delegado (Capítulo 8) nada aqui é necessário — o modelo é o do agente que conduz.

## Dois registros diferentes de provider

Esta é a distinção que causa mais confusão, então ela vem primeiro.

**Providers detectados por variável de ambiente.** São os que o `agf` reconhece
automaticamente e liga ao gateway:

```bash
agf doctor --providers
```

```
anthropic    ANTHROPIC_API_KEY        configurado: false
openai       OPENAI_API_KEY           configurado: false
openrouter   OPENROUTER_API_KEY       configurado: true
gemini       GEMINI_API_KEY           configurado: false
bedrock      BEDROCK_API_KEY          configurado: false
azure        AZURE_OPENAI_API_KEY     configurado: false
deepseek     DEEPSEEK_API_KEY         configurado: false
glm          GLM_API_KEY              configurado: false
kimi         KIMI_API_KEY             configurado: false
groq         GROQ_API_KEY             configurado: false
```

Além desses, o **GitHub Copilot** entra por autenticação de dispositivo (`agf login`) e é o
padrão, e o **Ollama** roda local, com URL manual e custo zero por token.

**O registro de endpoints compatíveis com OpenAI.** É uma lista menor, usada quando o `agf`
precisa saber a URL base de um serviço: `openai`, `openrouter`, `groq`, `deepseek`,
`cerebras`, `togetherai` e `ollama`. Um único adaptador atende todos, porque todos falam o
mesmo protocolo.

A Anthropic não aparece nessa segunda lista — deliberadamente. Ela é atendida pela primeira.

## Escolher

```bash
agf provider use openrouter
agf login                     # fluxo de dispositivo do GitHub Copilot
agf provider list
```

Para o OpenRouter, que dá acesso a muitos modelos por uma chave só:

```bash
export OPENROUTER_API_KEY=...
agf provider use openrouter
```

## Modelos e camadas

O `agf` não pede que você escolha um modelo por chamada. Ele roteia por **camada de
esforço**:

| Camada     | Para                                        |
| ---------- | ------------------------------------------- |
| `cheap`    | Tarefas mecânicas, alto volume              |
| `build`    | Trabalho de implementação normal            |
| `frontier` | Raciocínio difícil, decisões de arquitetura |

```bash
agf model                     # o modelo ativo
agf model auto                # roteamento por complexidade da tarefa
agf model --pin <id>          # fixa um modelo específico
```

Para fixar num comando só:

```bash
agf deliver "..." --live --pin deepseek/deepseek-v4-flash
```

## Marcha: o botão de esforço

```bash
agf gearshift                 # a marcha atual
agf gearshift 3               # troca
```

A marcha (1 a 4) ajusta modelo e esforço de raciocínio de uma vez. É a alavanca manual
quando o roteamento automático está sendo conservador ou perdulário demais para o que você
está fazendo agora.

## Perfis de trabalho

Empacotam camada de modelo, fluxo e política de repetição:

| Perfil     | Camada     | Repetições |
| ---------- | ---------- | ---------- |
| `fast`     | `cheap`    | 1          |
| `build`    | `build`    | 2          |
| `frontier` | `frontier` | 3          |

```bash
agf profile list
agf profile use build
```

## Escolher com dado, não com opinião

A pergunta certa ao comparar modelos não é qual custa menos por token — é qual custa menos
**por sucesso**. Um modelo barato que erra e precisa de três tentativas é caro.

```bash
agf eval --models <ids> --live      # cenários reais → placar
agf metrics --simulate              # re-precifica sua fatura real sob outros modelos
```

O `agf metrics --simulate` é o mais direto: ele pega as chamadas que você já fez e calcula
quanto teriam custado em cada modelo. É comparação sobre o seu tráfego, não sobre um
benchmark de terceiro.

## Falha e failover

O gateway repete com feedback compacto quando uma chamada falha, e faz failover entre
adaptadores quando um provedor cai. Você não precisa configurar isso; precisa saber que
existe, porque explica por que uma chamada às vezes aparece no registro mais de uma vez.

## O que fica registrado

Toda chamada entra no `llm_call_ledger` com o nó ao qual pertence, tokens de entrada, saída
e cache, custo e sessão. É isso que permite atribuir custo **por tarefa**, e não só por mês.

```bash
agf status        # painel: provider, modelo, cache, tokens, custo
agf metrics       # métricas por tarefa e sessão
```
