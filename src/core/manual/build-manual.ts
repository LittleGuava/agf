/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Builds the technical manual buffer: docs/manual/*.md (+ the generated command appendix) →
 * an in-memory .docx Buffer.
 *
 * WHY this lives in core and not in scripts/gen-manual-docx.mts: two surfaces need the same
 * document now — the standalone script (npm run gen:manual) and `agf manual generate`
 * (src/cli/commands/manual-cmd.ts). Keeping the chapter-loading/rendering logic here means
 * neither surface duplicates it; each just calls buildManualBuffer() and handles its own I/O
 * (where to write the file, what to print).
 *
 * @see ../../../scripts/gen-manual-docx.mts — the script surface (writes dist-docs/manual-agf.docx)
 * @see ../../cli/commands/manual-cmd.ts — the CLI surface
 * @see blocks-to-docx.ts — the renderer this module feeds
 * @see manual-toc.ts — document order
 * @see command-appendix.ts — the generated appendix
 */

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Packer } from 'docx'
import { COMMAND_SURFACE } from '../rag-in/command-surface.generated.js'
import { buildCommandAppendix } from './command-appendix.js'
import { buildManualDocument, type ManualChapterContent, type ResolvedImage } from './blocks-to-docx.js'
import { fitToWidth, imageDimensions } from './image-dimensions.js'
import { markdownToBlocks } from './markdown-to-blocks.js'
import { MANUAL_CHAPTERS } from './manual-toc.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const MANUAL_DIR = join(ROOT, 'docs', 'manual')

/** A6.5in text column at 96dpi. Screenshots wider than this get scaled down, never up. */
const MAX_IMAGE_WIDTH_PX = 620

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

/** Builds the manual document and returns it as bytes — the sole entry point of this module. */
export async function buildManualBuffer(): Promise<Buffer> {
  const version = (JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }).version
  const chapters = loadChapters()
  const document = buildManualDocument({
    title: 'Manual técnico do agf',
    subtitle: 'agent-graph-flow — referência completa para usuários técnicos',
    version,
    generatedAt: new Date().toISOString().slice(0, 10),
    chapters,
    resolveImage,
  })
  return Packer.toBuffer(document)
}
