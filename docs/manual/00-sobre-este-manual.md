# Sobre este manual

Este é o manual técnico do **agf** (`agent-graph-flow`). Ele existe para responder uma
pergunta que a ajuda embutida não responde: _o que essa ferramenta faz, por inteiro, e como
eu uso cada parte dela._

## Para quem é

Para quem opera o `agf` no terminal: desenvolvedores, tech leads, engenheiros de plataforma
e quem conduz agentes de código. Assume familiaridade com linha de comando, git e o ciclo
normal de desenvolvimento. Não assume nenhum conhecimento prévio do `agf`.

Não é um manual de contribuição. Quem vai _alterar_ o `agf` deve ler `CONTRIBUTING.md`,
`.claude/rules/` e os ADRs em `docs/adr/`.

## Como ler

O manual tem cinco partes e uma seção de apêndices. Elas não precisam ser lidas em ordem,
mas a Parte I precede as outras de propósito: os conceitos de grafo e de envelope de saída
aparecem em todos os capítulos seguintes.

| Se você quer                            | Vá para         |
| --------------------------------------- | --------------- |
| Instalar e rodar o primeiro comando     | Capítulo 2      |
| Entender o modelo antes de usar         | Capítulos 1 e 3 |
| Colocar uma tarefa para andar hoje      | Capítulo 7      |
| Usar o `agf` conduzido por outro agente | Capítulo 8      |
| Reduzir custo de token                  | Parte III       |
| Descobrir se um comando existe          | Apêndice A      |
| Achar o significado de um termo         | Apêndice E      |

## Convenções

Comandos aparecem como `agf next`. Quando um comando precisa de um identificador de nó,
ele é escrito `<id>` — na prática é algo como `node_3099ad72e7db`.

Blocos de código mostram o comando e, quando útil, a resposta:

```bash
agf stats --select data.byStatus
```

Trechos de saída são reais, não ilustrativos. Onde a saída foi encurtada, há reticências.

## Como este documento é produzido

O manual não é escrito em Word. A fonte são arquivos Markdown versionados em
`docs/manual/`, convertidos por `npm run gen:manual`.

O **Apêndice A** — a referência completa de comandos — não é escrito à mão: ele é derivado
do catálogo interno de comandos do próprio `agf`, o mesmo que o `agf retrieve-command`
consulta. Um teste automatizado reabre o `.docx` produzido e falha quando o número de
comandos dentro dele deixa de bater com o catálogo. É isso que impede este manual de
descrever uma versão do `agf` que não existe mais.

> **O sumário aparece vazio na primeira abertura.** Ele é um _campo_ do Word, não texto
> fixo — o Word o preenche ao atualizar os campos. Ele costuma perguntar isso ao abrir o
> arquivo; se não perguntar, selecione tudo (`Ctrl+A` / `Cmd+A`) e pressione `F9`. Um
> sumário fixo seria mais bonito na primeira página e mentiria na segunda vez que o
> documento mudasse.

## O que este manual não cobre

Números de desempenho, custo em dólares e listas de modelos mudam mais rápido do que um
documento consegue acompanhar. Onde eles apareceriam, o manual aponta o comando que os
mostra ao vivo — `agf status`, `agf metrics`, `agf doctor --providers` — em vez de imprimir
um valor que envelhece.
