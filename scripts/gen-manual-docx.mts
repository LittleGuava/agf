#!/usr/bin/env npx tsx
/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Builds the technical manual: docs/manual/*.md → dist-docs/manual-agf.docx.
 *
 * This is the I/O edge of the manual pipeline — the only place that writes the document to
 * disk. Chapter loading and rendering live in buildManualBuffer
 * (src/core/manual/build-manual.ts) so the CLI surface (`agf manual generate`,
 * src/cli/commands/manual-cmd.ts) can produce the same document without this script.
 *
 * The chapter list is NOT the directory listing: manual-toc.ts declares document order, and
 * a file that exists without a TOC entry fails src/tests/manual-toc.test.ts rather than
 * silently vanishing from the shipped document.
 *
 * Run: npm run gen:manual
 *
 * @see ../src/core/manual/build-manual.ts — chapter loading + rendering
 * @see ../src/core/manual/manual-toc.ts — document order
 * @see ../src/tests/gen-manual-docx.test.ts — reopens the output and reconciles it
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { COMMAND_SURFACE } from '../src/core/rag-in/command-surface.generated.js'
import { buildManualBuffer } from '../src/core/manual/build-manual.js'
import { MANUAL_CHAPTERS } from '../src/core/manual/manual-toc.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'dist-docs')
export const OUT_FILE = join(OUT_DIR, 'manual-agf.docx')

/** Entry point. Reports the numbers that matter, not just success. */
async function main(): Promise<void> {
  const buffer = await buildManualBuffer()
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(OUT_FILE, buffer)

  const chapters = MANUAL_CHAPTERS.length
  const kb = Math.round(buffer.byteLength / 1024)
  process.stdout.write(
    `${OUT_FILE}\n${chapters} capítulos · ${COMMAND_SURFACE.length} comandos no Apêndice A · ${kb} KB\n`,
  )
}

// Only run when invoked directly; the test imports buildManualBuffer without side effects.
if (process.argv[1] !== undefined && import.meta.url === `file://${resolve(process.argv[1])}`) {
  await main()
}
