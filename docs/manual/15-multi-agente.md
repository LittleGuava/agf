# Multi-agente: colônia, formigas e permissões

Vários agentes podem trabalhar sobre o mesmo grafo. Este capítulo cobre o que é preciso
para isso não virar corrida de escrita.

## O modelo: uma formiga por árvore de trabalho

```bash
agf ant spawn <nome>
agf ant list
agf ant rm <nome>
```

Cada "formiga" recebe a **própria árvore de trabalho do git**, mas todas apontam para o
**mesmo grafo central**. É esse arranjo que torna o paralelismo seguro: o grafo coordena, e
os arquivos não colidem.

A alternativa — vários agentes na mesma árvore — quebra na hora de fechar tarefa, porque o
portão de raio de impacto de um vê os arquivos modificados pelo outro.

## Identidade não é opcional

Ao operar em colônia, informe quem está agindo em `agf next` e `agf done`. Sem identidade,
um `agf next` simples pode **sequestrar a tarefa de outro agente** que já a tinha puxado.

O que marca posse é o próprio status `in_progress` no grafo — o feromônio. A trava de
tempo existe apenas para tornar o ato de puxar atômico, não para segurar a tarefa
indefinidamente.

## Castas

```bash
agf caste list
```

Uma casta associa um perfil de agente a uma camada de modelo, uma complexidade máxima e
tipos de tarefa. É como se destina trabalho difícil a modelo caro e trabalho mecânico a
modelo barato, sem decidir caso a caso.

## Coordenação

```bash
agf swarm session
agf swarm claim <id>
agf swarm mailbox
agf swarm consensus
agf claims                # as reivindicações ativas (só leitura)
```

O `agf claims` é o primeiro comando a rodar quando algo parece travado: ele mostra quem
está segurando o quê.

## Seleção por colônia (ACO)

```bash
agf next --aco
```

Em vez da ordem determinística, a escolha segue as trilhas de feromônio: caminhos que
entregaram recebem reforço, caminhos que não entregaram evaporam.

Duas coisas a saber antes de ligar:

- **É opcional e não é o padrão.** O `agf next` sem a flag continua determinístico.
- **O reforço exige evidência.** Nada é depositado por uma alegação de conclusão.

```bash
agf colony-health         # saúde da colônia e histórico
agf learn-eval            # acurácia do aprendizado: regret, Brier, calibração
```

O `agf learn-eval` existe para responder se o aprendizado está de fato aprendendo. Um
mecanismo adaptativo que ninguém mede vira superstição.

## Permissões e aprovação

```bash
agf permissions list
agf permissions allow <ação> <recurso>
agf permissions deny <ação> <recurso>
agf approval create
agf approval grant <token>
agf approval verify <token>
```

O modelo é uma lista de controle por ação e recurso, com três respostas: permitir, negar ou
perguntar. Para operações que exigem consentimento explícito, o ciclo de token de aprovação
(criar → conceder → verificar → consumir) dá um registro auditável de quem autorizou o quê.

```bash
agf exec-policy           # aprovação de comandos de shell
agf sandbox               # execução isolada por processo
agf sandbox-gate          # limites de arquivo e rede
```

## Papéis

```bash
agf agent list
agf agent create <nome>
agf role show <id>
agf implementer           # transições atribuídas a um agente, com validação de fronteira
```

Um papel (implementador, revisor, validador) define o que aquele agente pode fazer com um
nó. O `agf implementer` registra a transição atribuída, o que permite responder depois quem
marcou o quê — e é o que sustenta a auditoria em trabalho de colônia.

## Sessões e rastros

```bash
agf session show
agf session events
agf trace                 # rastros de execução: spans, custo, latência
agf audit                 # a trilha de chamadas de ferramenta
```
