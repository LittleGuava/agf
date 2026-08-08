# Validar e endurecer

Validar é confirmar que a tarefa entregou. Endurecer é melhorar o que já existe. Este
capítulo cobre os dois, porque as ferramentas se sobrepõem.

## Harnessability: a nota do repositório

```bash
agf harness
```

Mede quão bem o repositório sustenta trabalho de agente, em **nove dimensões**:

| Dimensão       | Peso | O que mede                                 |
| -------------- | ---- | ------------------------------------------ |
| `types`        | 0,25 | Cobertura e rigor de tipos                 |
| `tests`        | 0,25 | Cobertura e qualidade de teste             |
| `fitness`      | 0,10 | Funções de aptidão arquitetural            |
| `docs`         | 0,10 | Documentação presente e viva               |
| `naming`       | 0,10 | Clareza de nomes                           |
| `errors`       | 0,05 | Tratamento explícito de erro               |
| `context`      | 0,05 | Densidade de contexto para navegação       |
| `provenance`   | 0,05 | Rastreabilidade das afirmações             |
| `connectivity` | 0,05 | Capacidade alcançável de alguma superfície |

A nota composta vira grau:

| Grau | Faixa        |
| ---- | ------------ |
| A    | 85 ou mais   |
| B    | 70 a 84      |
| C    | 55 a 69      |
| D    | abaixo de 55 |

O gate de DEPLOY exige 70. O de PLAN exige 55.

```bash
agf harness --violations --select data.violations   # o que está puxando a nota para baixo
agf harness --gate                                  # falha o processo abaixo do limiar
```

## Capacidade dormente

A dimensão `connectivity` existe por um motivo específico: **código pronto e não conectado
entrega zero**. Um módulo exportado que ninguém importa, um comando sem superfície, uma
funcionalidade atrás de uma flag desligada — tudo isso passa no build, passa nos testes e
não acontece.

```bash
agf harness --dormant       # lista capacidade exportada sem consumidor
agf wire-dormant            # propõe tarefas de conexão (simulação por padrão)
agf wire-check              # ramos que só um mock ativa, nunca um chamador real
```

O `agf wire-check` merece atenção. Ele acha lógica condicional que **nunca dispara em
produção** porque a condição que a ativa só existe nos testes. É um defeito invisível: o
código está lá, o teste está verde, e o comportamento é constante.

Uma ressalva de leitura: essas varreduras devolvem **candidatos, não vereditos**. Um número
como "40 dormentes" é uma hipótese. Abrindo um a um, eles se separam em gap real, falso
positivo, mecanismo sem fonte de dados, e fixture deliberada. Reportar o total cru como se
fosse tudo defeito infla a métrica e manda o próximo executor caçar fantasma.

## Certeza de entrega

```bash
agf certainty <id>
```

Responde a uma pergunta só: _isto está realmente pronto?_ Ele cruza os eixos que podem
mentir isoladamente — o AC do grafo, o código em disco, o teste em disco, a prova no modo
do consumidor — e explicita cada pilar.

O caso que ele pega é o "pronto fantasma": um nó marcado como concluído que declara um
arquivo de teste que não existe. Status auto-reportado é alucinável; o sistema de arquivos
não é.

## Varreduras de qualidade

```bash
agf scan                      # agrega harness, tipos, segurança e taint
agf scan-silent-failures      # fallbacks que mascaram erro
agf quality                   # portão 95/95 sobre src/
agf lint                      # eslint só nos arquivos afetados
agf lint-files                # conformidade com o teto de 800 linhas por arquivo
```

O `agf scan-silent-failures` procura a assinatura de defeito mais cara que existe: o erro
engolido. Um `|| []`, um `catch` vazio, um `?? ''` no lugar errado transformam "quebrou
neste campo" em "funcionou com metade do dado" — e a tela mostra vazio em vez de erro,
enquanto build, teste e lint ficam verdes.

## Testes e cenários

```bash
agf test                # testes afetados pela tarefa atual
agf scenario            # suíte de auto-verificação, com teste de mutação
agf eval                # cenários reais → placar de resolução × custo
```

O `agf eval` responde à pergunta que importa quando se escolhe modelo: não "qual é mais
barato por token", mas **qual custa menos por sucesso**.

## Fluxo e previsão

```bash
agf insights            # analítica determinística: DORA, gargalos, fases
agf forecast            # previsão de conclusão do backlog com intervalo de confiança
agf kanban              # quadro com métricas de fluxo
```

A métrica que mais ensina é a **eficiência de fluxo**: quanto do tempo de ciclo foi
trabalho de fato e quanto foi espera. Abaixo de 40% o problema quase nunca é velocidade de
digitação — é fila.

Se a fase de validação acumula, pare de implementar e valide. Um gargalo à frente não
melhora com mais entrada.

## Endurecer em ciclo

O laço de endurecimento espelha o de construção, mas parte de um achado em vez de uma
tarefa:

```bash
agf harness --violations       # 1. mede
agf node add --type bug ...    # 2. registra o achado como nó
agf start                      # 3. puxa
# 4. escreve o teste que reproduz o defeito, vê falhar, corrige
agf done <id>                  # 5. fecha com a regressão travada
```

O passo 4 é o que separa correção de remendo: se o teste não reproduziu o defeito **antes**
da correção, ele não prova que o defeito foi corrigido.
