# Configuração, presets e constituição

## Configuração em camadas

```bash
agf config list
agf config get <chave>
agf config set <chave> <valor>
```

A configuração é resolvida em camadas — o mais específico vence. Configurações de projeto
ficam no próprio banco, não num arquivo solto, o que evita a divergência clássica entre o
que o arquivo diz e o que o sistema faz.

## Presets

```bash
agf preset list
agf preset show <nome>
agf preset --apply <nome>
```

Quatro presets embutidos — `default`, `strict-tdd`, `agile-light`, `enterprise` — decidem
quais verificações da definição de pronto são obrigatórias e quais apenas avisam. É o botão
que define se o `agf` é consultivo ou é um portão (Capítulo 5).

## Constituição: princípios que os gates cobram

```bash
agf constitution list
agf constitution check
agf principles
```

A constituição é um conjunto de axiomas do projeto — princípios de engenharia que ficam
indexados e são verificados nos gates, em vez de morarem num documento que ninguém abre.

Há um pacote embutido (`karpathy-baseline`) com axiomas sobre pensar antes de codar,
simplicidade, mudança cirúrgica e orientação a objetivo. Você pode instalar o seu.

```bash
agf ubiquitous-language      # o vocabulário canônico do domínio
agf out-of-scope             # o que foi explicitamente descartado
```

O `agf out-of-scope` parece burocrático e não é: escopo descartado sem registro volta a ser
proposto a cada ciclo, e alguém acaba construindo.

## Arquivos de contexto para agentes

O `agf` gera as instruções que os agentes de código leem ao abrir o projeto — `CLAUDE.md`,
`AGENTS.md` e equivalentes.

> **Não edite esses arquivos à mão.** As seções geradas são delimitadas por marcadores e
> serão sobrescritas. A fonte é a configuração do projeto; edite lá e regenere. O `agf
doctor` acusa quando um arquivo foi editado manualmente e divergiu.

Há uma hierarquia em cascata: um `AGENTS.md` num subdiretório soma ao da raiz, e o mais
próximo vence. Isso permite que um monorepo dê instruções diferentes por pacote sem
duplicar o tronco comum.

## Memória

```bash
agf memory write "<lição>"
agf memory list
agf memory search "<termo>"
agf memory read <id>
```

A memória guarda o que uma sessão aprendeu e a próxima precisa saber.

**O que vale gravar:** a lição durável — a regra e o gatilho de invalidação. "Verifique X
antes de usar Y, e descarte esta nota quando Z shipar."

**O que não vale:** o estado atual. Uma memória que diz "12 de 20 tarefas concluídas" está
errada amanhã, e pior: ela _parece_ informação. Contagens de progresso em memória ficam
obsoletas e enganam quem confia nelas. Para saber o estado, pergunte ao grafo
(`agf stats`), não à memória.

Quando memória e código divergem, **o código vence**.

## Conhecimento e documentação

```bash
agf docs list
agf docs search "<termo>"
agf docs generate            # documentação viva derivada do grafo
agf knowledge-compile <fonte>
agf knowledge-learn <projeto>
agf federation               # conhecimento entre projetos
```

O `agf docs generate` é determinístico e não usa LLM: o mesmo grafo produz sempre o mesmo
markdown. Custa zero token e funciona em modo delegado.

## Snapshots e workspace

```bash
agf snapshot create
agf snapshot list
agf snapshot restore <id>

agf workspace snapshot
agf workspace diff
agf workspace restore
```

Vale tirar um snapshot antes de uma operação ampla sobre o grafo — importar um PRD grande,
rodar uma triagem em massa, aplicar um preset diferente. Restaurar é mais barato que
desfazer nó a nó.
