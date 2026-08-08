# Operação e troubleshooting

## Primeiro comando quando algo está estranho

```bash
agf doctor
```

Ele valida versão de Node, permissões de escrita, o banco e sua integridade, se o grafo foi
inicializado, coerência dos arquivos de contexto, e se o painel web foi construído.

```bash
agf doctor --providers      # quais provedores estão configurados
```

## Problemas frequentes

### `agf next` devolve `NO_TASKS`

Significa "nada desbloqueado agora", não "acabou o trabalho". Investigue nesta ordem:

```bash
agf stats --select data.byStatus     # há coisa em backlog?
agf query --status blocked           # o que está preso, e atrás do quê
agf gaps                             # há lacuna impedindo o avanço
```

As três causas usuais: tudo está atrás de uma dependência aberta; o backlog está cheio de
nós de _especificação_, que não drenam como tarefa; ou já existe uma tarefa `in_progress`
(WIP=1 impede a segunda).

### `agf done` recusa com `BLAST_RADIUS_EXCEEDED`

Há arquivo modificado fora do escopo declarado. A mensagem enumera quais. Duas
possibilidades, e vale distinguir:

- **São seus** — declare-os: `agf node update <id> --implementation-files ...`
- **Não são seus** — há trabalho de outra sessão na árvore. Não os varra para dentro do seu
  commit. Comite por caminho explícito, nunca `git add -A`.

O `--force` existe, mas leia a lista antes de usá-lo: ela é exatamente o aviso de que algo
está entrando onde não devia.

### `agf check` reprova por qualidade de AC

O critério não é verificável. Reescreva com o esqueleto Dado-Quando-Então:

```bash
agf ac harden <id>
```

### O painel não mostra minha mudança

O `agf dashboard` serve o painel **já construído**. Reconstrua:

```bash
npm run dashboard:build
```

### As métricas mostram custo zero

Se você está em modo delegado, isso é correto — nenhuma chamada partiu do `agf`. Confirme
com `agf status`. Só investigue se você tem provedor conectado e mesmo assim vê zero.

### Um teste falha só na suíte completa

Testes que passam isolados e falham em paralelo indicam contenção, não regressão. Confirme
isoladamente antes de tratar como quebra:

```bash
npx vitest run src/tests/<arquivo>.test.ts
```

### Um nó marcado como pronto parece não existir

```bash
agf gaps --kind phantom_done
```

Ele cruza os arquivos declarados contra o disco. O Capítulo 10 explica como remediar sem
cegar o detector.

## Manutenção

```bash
agf gc                  # remove árvores e ramos órfãos
agf heal                # auto-reparo do grafo
agf cycle-repair        # detecta ciclos de dependência e propõe correção
agf snapshot create     # antes de qualquer operação ampla
agf risk triage         # drena riscos acumulados
agf spec-triage         # drena nós de especificação órfãos
```

Os dois últimos merecem virar hábito: risco e especificação acumulam silenciosamente e são
a causa mais comum de um backlog que parece cheio e não tem nada para puxar.

## Higiene do grafo

Três sintomas indicam que o grafo precisa de atenção, não a ferramenta:

| Sintoma                            | O que costuma ser                                 |
| ---------------------------------- | ------------------------------------------------- |
| Backlog cresce e nada é puxável    | Nós de especificação contados como trabalho       |
| Muitos épicos parados              | Falta decomposição — rode `agf decompose`         |
| Métricas de fluxo pioram sem causa | Trabalho em progresso passou de 1 sem ninguém ver |

```bash
agf insights            # DORA, gargalos, fases
agf kanban              # o quadro, com os limites de WIP visíveis
agf replan-analyze      # saúde do sprint e sugestão de replanejamento
```

## Atualizar

```bash
agf upgrade
```

Só age quando você digita. Se a rede corporativa bloqueia o host de releases, aponte
`AGF_RELEASES_BASE` para um espelho.

## Reportar um problema

Antes de abrir uma issue, colete:

```bash
agf doctor --pretty
agf --version
```

E, se o problema envolve um nó específico, `agf node show <id> --pretty`. Isso costuma ser
suficiente para reproduzir sem trocar mensagens.
