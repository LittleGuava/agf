#!/usr/bin/env npx tsx
/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Builds the technical manual: docs/manual/*.md → dist-docs/manual-agf.docx.
 *
 * This is the I/O edge of the manual pipeline — the only place that reads chapters off disk
 * and writes the document. Everything it calls is pure, which is why the pipeline can be
 * tested without touching the filesystem (src/tests/*.test.ts) while this file stays thin
 * enough to read in one sitting.
 *
 * The chapter list is NOT the directory listing: manual-toc.ts declares document order, and
 * a file that exists without a TOC entry fails src/tests/manual-toc.test.ts rather than
 * silently vanishing from the shipped document.
 *
 * Appendix A has no file — it is generated from COMMAND_SURFACE at build time, so the command
 * reference cannot drift behind the CLI.
 *
 * Run: npm run gen:manual
 *
 * @see ../src/core/manual/manual-toc.ts — document order
 * @see ../src/core/manual/command-appendix.ts — the generated appendix
 * @see ../src/core/manual/blocks-to-docx.ts — rendering
 * @see ../src/tests/gen-manual-docx.test.ts — reopens the output and reconciles it
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Packer } from 'docx'
import { COMMAND_SURFACE } from '../src/core/rag-in/command-surface.generated.js'
import { buildCommandAppendix } from '../src/core/manual/command-appendix.js'
import {
  buildManualDocument,
  type ManualChapterContent,
  type ResolvedImage,
} from '../src/core/manual/blocks-to-docx.js'
import { fitToWidth, imageDimensions } from '../src/core/manual/image-dimensions.js'
import { markdownToBlocks } from '../src/core/manual/markdown-to-blocks.js'
import { MANUAL_CHAPTERS } from '../src/core/manual/manual-toc.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANUAL_DIR = join(ROOT, 'docs', 'manual')
const OUT_DIR = join(ROOT, 'dist-docs')
export const OUT_FILE = join(OUT_DIR, 'manual-agf.docx')

/** A6.5in text column at 96dpi. Screenshots wider than this get scaled down, never up. */
const MAX_IMAGE_WIDTH_PX = 620

const VERSION = (JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }).version

/** Reads an image relative to the chapter directory; null when absent or not PNG/JPEG. */
function resolveImage(relativePath: string): ResolvedImage | null {
  try {
    const absolute = resolve(MANUAL_DIR, relativePath)
    const data = readFileSync(absolute)
    const size = imageDimensions(data)
    if (size === null) return null
    const fitted = fitToWidth(size, MAX_IMAGE_WIDTH_PX)
    return { data, width: fitted.width, height: fitted.height, type: size.type }
  } catch {
    return null // a missing figure renders as a visible caption, not a build failure
  }
}

/** Loads every chapter in document order, generating the ones that have no file. */
function loadChapters(): ManualChapterContent[] {
  return MANUAL_CHAPTERS.map((chapter) => {
    if (chapter.generated === true) {
      return { title: chapter.title, part: chapter.part, blocks: buildCommandAppendix(COMMAND_SURFACE) }
    }
    const markdown = readFileSync(join(MANUAL_DIR, chapter.file), 'utf8')
    return { title: chapter.title, part: chapter.part, blocks: markdownToBlocks(markdown) }
  })
}

/** Builds the document and returns it as bytes — separated so tests can build without writing. */
export async function buildManualBuffer(): Promise<Buffer> {
  const chapters = loadChapters()
  const document = buildManualDocument({
    title: 'Manual técnico do agf',
    subtitle: 'agent-graph-flow — referência completa para usuários técnicos',
    version: VERSION,
    generatedAt: new Date().toISOString().slice(0, 10),
    chapters,
    resolveImage,
  })
  return Packer.toBuffer(document)
}

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
