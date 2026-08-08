# Instalação e primeiro contato

A instalação é sempre **por comando**. Não há binário nem `.zip` para baixar e clicar.

Isso é deliberado. Um executável baixado pelo navegador chega sem procedência, dispara o
Gatekeeper (macOS) ou o SmartScreen (Windows), e treina você a ignorar exatamente os avisos
que existem para proteger. Um comando que você lê antes de rodar é mais honesto que um
botão que você clica sem ler. O instalador é um script curto — abra a URL no navegador e
leia antes, são cerca de 90 linhas. Ele não usa `sudo`, não escreve no seu `.zshrc` e não
envia nada a lugar nenhum.

## macOS e Linux

```bash
curl -fsSL https://graph-flow.cloud/install.sh | bash
```

Instala em `~/.local/bin` — sua pasta, sem senha de administrador. Se o `agf` não for
encontrado depois, a pasta não está no PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

O instalador confere o `SHA256` do download e **aborta** se não bater. Um pacote truncado
instalaria "com sucesso" e só quebraria depois.

## Windows

Requer **Node.js LTS 22 ou 24, x64**. No PowerShell normal (não precisa ser
administrador):

```powershell
irm https://graph-flow.cloud/install.ps1 | iex
```

Instala como pacote npm global no escopo do seu usuário, sem exigir Visual Studio Build
Tools — o SQLite nativo já vem pré-compilado. Abra um **novo** terminal depois.

O script recusa, com a causa na tela, o que não consegue entregar: Node fora das linhas
22/24, ou Node que não seja x64. Uma recusa aqui é melhor que uma instalação que só quebra
depois, ao carregar o SQLite.

> Não existe mais um `.exe` do Windows — foi aposentado na v0.24.0. Um executável
> standalone sem assinatura Authenticode é exatamente a assinatura que EDR e AppLocker
> corporativo bloqueiam.

## Alternativa: npm

Em qualquer sistema, se a rede corporativa bloqueia o `curl`:

```bash
npm install -g agent-graph-flow
agf --version
```

Requer Node.js 20 ou superior.

## Atualizar

```bash
agf upgrade
```

Só age quando você digita o comando. O `agf` nunca verifica atualizações sozinho — não há
checagem em segundo plano nem no encerramento do processo.

Se você prefere não confiar no host de releases, aponte `AGF_RELEASES_BASE` para um espelho
seu; os instaladores e o `agf upgrade` respeitam essa variável.

## Primeiro comando

Digite `agf` sem argumento nenhum. Você verá a tela de boas-vindas, que custa zero token e
mostra o estado do projeto e o próximo passo sugerido.

Em seguida, dentro do diretório do seu projeto:

```bash
agf init
```

O `init` prepara o ambiente: cria a estrutura, detecta a stack, roda o diagnóstico e sobe o
painel web. Ele é idempotente — rodar de novo não duplica nada.

Confira o ambiente a qualquer momento:

```bash
agf doctor
```

O `doctor` valida versão de Node, permissões de escrita, integridade do banco, se o grafo
foi inicializado, se os arquivos de contexto estão coerentes e se o painel foi construído.
Use `agf doctor --providers` para ver quais provedores de LLM estão configurados nas suas
variáveis de ambiente.

## Onde ficam os dados

Tudo vive num arquivo SQLite. O caminho é resolvido em três níveis, nesta ordem:

| Precedência | Origem                             | Quando é usado                   |
| ----------- | ---------------------------------- | -------------------------------- |
| 1 (maior)   | `--db <caminho>` ou `MCP_GRAPH_DB` | Você apontou explicitamente      |
| 2           | `./workflow-graph/graph.db`        | Existe um grafo local no projeto |
| 3 (padrão)  | `~/.mcp-graph/graph.db`            | Nenhum dos anteriores            |

O modo local (nível 2) é o recomendado para um repositório: o grafo daquele projeto fica
junto do código. O arquivo é adicionado ao `.gitignore` pelo `init` — o grafo é estado
local, não artefato versionado.

Backups automáticos vão para `.mcp-graph-backups/`.

## Se algo der errado

| Sintoma                           | O que fazer                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `agf: command not found`          | A pasta de instalação não está no PATH — veja a seção do seu sistema |
| `Checksum mismatch`               | O instalador recusou o binário. Não force; rode de novo              |
| `ERR! cannot read property` (npm) | Node.js abaixo de 20 — atualize                                      |
| `better-sqlite3` falha (npm)      | `npm install -g agent-graph-flow --build-from-source`                |
| Rede bloqueia o GitHub            | Use a instalação por npm                                             |

O Capítulo 17 trata dos problemas que aparecem depois, em uso.
