/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Appendix A — the complete command reference, derived rather than written.
 *
 * WHY derived: the CLI has 486 invocable paths and gains more every week. Prose written by
 * hand for that surface is stale the day a command lands, and a manual that lies about what
 * exists is worse than one that omits. So the appendix reads COMMAND_SURFACE — the same
 * catalogue `agf retrieve-command` ranks against, kept honest against the live commander tree
 * by src/tests/command-tree.test.ts. One source, two consumers.
 *
 * EFFECT: one table row per invocable path, grouped under its root command, alphabetical.
 * The row count is the manual's reconciliation number — src/tests/gen-manual-docx.test.ts
 * reopens the produced .docx and fails when the rows inside it stop matching this catalogue,
 * which is what stops the shipped document from drifting behind the CLI.
 *
 * GOTCHA: never copy entries in here. Import the generated module, or the drift test guarding
 * it stops guarding anything.
 *
 * @see ../rag-in/command-surface.generated.ts — the catalogue (regenerate: npm run gen:command-surface)
 * @see markdown-to-blocks.ts — the block shapes emitted here
 * @see manual-toc.ts — where this appendix sits in document order
 *
 * Pure — no I/O.
 */

import type { SurfaceEntry } from '../rag-in/command-surface.generated.js'
import type { ManualBlock } from './markdown-to-blocks.js'

/** Shown instead of an empty cell, so a hole in the catalogue reads as a hole. */
const MISSING_DESCRIPTION = '(sem descrição declarada no CLI)'

const HEADER: readonly string[] = ['Comando', 'O que faz']

/** Buckets entries by their root command, alphabetically, preserving catalogue order within. */
export function groupByRoot(entries: readonly SurfaceEntry[]): Map<string, SurfaceEntry[]> {
  const groups = new Map<string, SurfaceEntry[]>()
  for (const entry of entries) {
    const root = entry.path.split(' ')[0]
    const bucket = groups.get(root)
    if (bucket === undefined) groups.set(root, [entry])
    else bucket.push(entry)
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'en')))
}

/** One table per root: the row is copy-pasteable, so it carries the `agf` prefix. */
function tableFor(entries: readonly SurfaceEntry[]): ManualBlock {
  return {
    kind: 'table',
    header: [...HEADER],
    rows: entries.map((e) => [`agf ${e.path}`, e.description.trim() || MISSING_DESCRIPTION]),
  }
}

/** The number the manual reconciles against — every catalogue entry must land in a row. */
export function countAppendixRows(blocks: readonly ManualBlock[]): number {
  return blocks.reduce((sum, b) => (b.kind === 'table' ? sum + b.rows.length : sum), 0)
}

/**
 * Builds Appendix A. The intro states the count in prose on purpose: a reader comparing it
 * to the table has a chance of catching a stale build that no test was watching.
 */
export function buildCommandAppendix(entries: readonly SurfaceEntry[]): ManualBlock[] {
  const groups = groupByRoot(entries)
  const roots = groups.size

  const blocks: ManualBlock[] = [
    { kind: 'heading', level: 1, text: 'Apêndice A — Referência completa de comandos' },
    {
      kind: 'paragraph',
      spans: [
        {
          text:
            `Esta tabela é gerada do catálogo de comandos do próprio agf, não escrita à mão: ` +
            `são ${entries.length} caminhos invocáveis distribuídos em ${roots} comandos raiz. ` +
            `Cada linha pode ser copiada e executada como está. Para as flags de um comando ` +
            `específico, use `,
        },
        { text: 'agf <comando> --help', code: true },
        {
          text:
            `; para achar o comando a partir de uma intenção em linguagem natural, use ` +
            `agf retrieve-command "<intenção>".`,
        },
      ],
    },
  ]

  for (const [root, rootEntries] of groups) {
    blocks.push({ kind: 'heading', level: 2, text: `agf ${root}` })
    blocks.push(tableFor(rootEntries))
  }
  return blocks
}
