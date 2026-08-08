/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * `agf manual generate` — CLI surface for the dormant manual-builder pipeline
 * (src/core/manual/build-manual.ts, node_wire_01319d0498cb): renders docs/manual/*.md plus
 * the generated command appendix into a .docx, without requiring `npm run gen:manual`.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Command } from 'commander'
import { buildManualBuffer } from '../../core/manual/build-manual.js'
import { MANUAL_CHAPTERS } from '../../core/manual/manual-toc.js'
import { COMMAND_SURFACE } from '../../core/rag-in/command-surface.generated.js'
import { createCliOutput } from '../shared/cli-output.js'
import { createLogger } from '../../core/utils/logger.js'

const log = createLogger({ layer: 'cli', source: 'manual-cmd.ts' })

/** Builds the `agf manual` CLI command with the `generate` sub-command. */
export function manualCommand(): Command {
  log.info('manual command registered')
  const cmd = new Command('manual').description('Build the technical manual (.docx) from docs/manual/*.md')

  cmd
    .command('generate')
    .description('Render docs/manual/*.md + the command appendix into a .docx')
    .option('--out <path>', 'Output .docx path', 'dist-docs/manual-agf.docx')
    .action(async (opts: { out: string }) => {
      const out = createCliOutput('manual.generate')
      try {
        const buffer = await buildManualBuffer()
        const outPath = resolve(opts.out)
        mkdirSync(dirname(outPath), { recursive: true })
        writeFileSync(outPath, buffer)
        out.ok({
          path: outPath,
          chapters: MANUAL_CHAPTERS.length,
          commands: COMMAND_SURFACE.length,
          sizeKb: Math.round(buffer.byteLength / 1024),
        })
      } catch (err) {
        out.err('MANUAL_GENERATE_FAILED', err instanceof Error ? err.message : String(err))
      }
    })

  return cmd
}
