# RAG-IN, RAG-OUT e compressão

Três mecanismos que atacam o custo por vias diferentes: descobrir o comando certo sem ler o
catálogo, reusar esqueleto em vez de gerar, e encolher a saída de comandos externos.

## RAG-IN: da intenção ao comando

```bash
agf retrieve-command "quero ver quanto gastei por tarefa"
```

Faz busca sobre o catálogo de comandos e devolve o mais provável. Substitui despejar 486
descrições no contexto.

**Trate o resultado como palpite, não como oráculo.** É um ranqueamento sobre prosa e ele
erra — inclusive de formas perigosas, sugerindo um comando destrutivo para uma intenção
inocente. A disciplina de uso:

1. Confirme com `agf <comando> --help` antes de executar.
2. Recuse qualquer sugestão destrutiva que você não pediu explicitamente.

Quando a confiança fica abaixo do limiar, o próprio comando recomenda cair para o `--help`.

## RAG-OUT: preencher em vez de gerar

```bash
agf montar-output --objetivo "<o que você quer produzir>"
```

Devolve um **esqueleto com lacunas** para o objetivo. O modelo preenche as lacunas em vez
de recriar a estrutura inteira.

É a aplicação direta da regra de custo: saída é a parte cara. Um esqueleto reusado troca
centenas de tokens gerados por dezenas preenchidos. Se o comando devolver um esqueleto,
**preencha as lacunas — não recrie o esqueleto**, ou a economia evapora.

## Compressão de saída de shell

```bash
agf compress run -- npm test
npm test | agf compress run --stdin
agf compress filters              # os filtros disponíveis
agf compress test                 # testa um filtro
```

Uma ressalva que muda o uso conforme o seu agente:

- **No Claude Code**, um hook já comprime a saída de comandos automaticamente. Prefixar
  `agf compress run` comprime **duas vezes** e degrada o resultado.
- **Em CLIs sem hook** (Copilot, Codex, Cursor, Gemini), o envelope explícito é necessário
  — sem ele, a saída bruta é consumida sem compressão.

## Cache

```bash
agf cache stats
agf cache clear
```

O cache de prompt guarda respostas e reaproveita entrada. Os tokens vindos de cache são
contabilizados separadamente no ledger, o que permite ver quanto do seu gasto foi
realmente novo.

## Recuperar o que foi comprimido

Nenhuma compressão do `agf` é destrutiva. Um trecho substituído por marcador volta:

```bash
agf retrieve <hash>
agf retrieve "tool-output://<hash>"
```

Se você encontrar um `⟨ccr:hash⟩` numa saída e precisar do texto original, é este o comando.

## O fluxo (Φ)

```bash
agf flow status
agf flow on
agf flow off
```

O `flow` é uma formulação de diluição de contexto: quanto do que está no contexto é sinal e
quanto é ruído.

**Ele vem desligado por padrão, e isso é um resultado medido, não um descuido.** Num teste
A/B real, ligá-lo _inflou_ o consumo em cerca de 105% — o mecanismo puxava mais material
para dentro do contexto do que podava. Ele fica disponível para quem quiser retomar o
ajuste (`agf flow on --ab` repete o experimento), mas ligá-lo hoje sem medir é gastar mais.

Este é um bom exemplo do padrão do projeto: a alavanca não foi removida nem foi ligada por
otimismo. Ela ficou desligada com o número que justifica a decisão anotado ao lado.
