/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * ManualBlock[] → a Word document. The only module in the manual pipeline that imports `docx`.
 *
 * WHY the boundary is here: keeping the docx dependency in one file means the parser and the
 * appendix generator stay testable on plain data, and swapping the output format later touches
 * one module. It is also why `docx` can live in devDependencies — nothing at runtime imports it.
 *
 * EFFECT: a cover page, a TOC field, then every chapter starting on its own page, with parts
 * announced as dividers so a 200-page document stays navigable.
 *
 * Images arrive through an injected resolver rather than being read here (DIP): this module
 * never touches the filesystem, so a chapter referencing a missing image degrades to a caption
 * instead of exploding mid-build — and the test suite renders images without any disk at all.
 *
 * GOTCHA: the TOC is a Word FIELD, not baked text. Word shows it empty until fields update
 * (it prompts on open; Ctrl+A then F9 forces it). That is expected, and chapter 00 says so to
 * the reader. Rendering a fake static TOC instead would drift from the real headings.
 *
 * @see markdown-to-blocks.ts — where the blocks come from
 * @see command-appendix.ts — the other producer of blocks
 * @see docx-styles.ts — fonts, spacing and numbering
 * @see ../../../scripts/gen-manual-docx.mts — the I/O edge that reads files and writes the .docx
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { InlineSpan, ManualBlock } from './markdown-to-blocks.js'
import {
  CODE_FONT,
  CODE_SHADING,
  MANUAL_NUMBERING,
  MANUAL_STYLES,
  ORDERED_LIST_REFERENCE,
  TABLE_HEADER_SHADING,
} from './docx-styles.js'

/** A decoded image the renderer can place. Supplied by the caller — this module reads no files. */
export interface ResolvedImage {
  data: Buffer
  width: number
  height: number
  type: 'png' | 'jpg'
}

/** Resolves a chapter-relative image path, or null when it cannot be found. */
export type ImageResolver = (path: string) => ResolvedImage | null

/** One chapter ready to render. */
export interface ManualChapterContent {
  title: string
  part: string
  blocks: ManualBlock[]
}

export interface ManualDocumentInput {
  title: string
  subtitle: string
  version: string
  generatedAt: string
  chapters: ManualChapterContent[]
  resolveImage: ImageResolver
}

const HEADINGS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
] as const

/** Inline spans become runs; code spans switch font so a command never reads as prose. */
export function spansToRuns(spans: readonly InlineSpan[]): TextRun[] {
  return spans.map(
    (span) =>
      new TextRun({
        text: span.text,
        bold: span.bold === true,
        italics: span.italic === true,
        ...(span.code === true ? { font: CODE_FONT, shading: { type: ShadingType.CLEAR, fill: CODE_SHADING } } : {}),
      }),
  )
}

/** Code keeps one paragraph per line: Word reflows a single paragraph and destroys alignment. */
function codeParagraphs(lines: readonly string[]): Paragraph[] {
  const body = lines.length > 0 ? lines : ['']
  return body.map(
    (line) =>
      new Paragraph({
        style: 'ManualCode',
        shading: { type: ShadingType.CLEAR, fill: CODE_SHADING },
        children: [new TextRun({ text: line === '' ? ' ' : line })],
      }),
  )
}

function cell(text: string, header: boolean): TableCell {
  return new TableCell({
    shading: header ? { type: ShadingType.CLEAR, fill: TABLE_HEADER_SHADING } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: header })] })],
  })
}

/** Tables span the text column; a row narrower than the page reads as a mistake. */
function tableFrom(header: readonly string[], rows: readonly string[][]): Table {
  const width = { size: 100, type: WidthType.PERCENTAGE }
  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map((h) => cell(h, true)),
  })
  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: header.map((_, i) => cell(row[i] ?? '', false)),
      }),
  )
  return new Table({ width, rows: [headerRow, ...bodyRows] })
}

/** A missing image becomes a visible caption — a silent gap would read as intentional. */
function imageElements(block: Extract<ManualBlock, { kind: 'image' }>, resolve: ImageResolver): Paragraph[] {
  const image = resolve(block.path)
  if (image === null) {
    return [new Paragraph({ style: 'ManualCaption', children: [new TextRun(`[imagem ausente: ${block.path}]`)] })]
  }
  const picture = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type: image.type,
        data: image.data,
        transformation: { width: image.width, height: image.height },
      }),
    ],
  })
  if (block.alt.trim() === '') return [picture]
  return [picture, new Paragraph({ style: 'ManualCaption', children: [new TextRun(block.alt)] })]
}

/** One block becomes one or more docx elements. Exhaustive over ManualBlock by design. */
export function blockToElements(block: ManualBlock, resolve: ImageResolver): (Paragraph | Table)[] {
  switch (block.kind) {
    case 'heading':
      return [new Paragraph({ heading: HEADINGS[block.level - 1], children: [new TextRun(block.text)] })]
    case 'paragraph':
      return [new Paragraph({ children: spansToRuns(block.spans) })]
    case 'code':
      return codeParagraphs(block.lines)
    case 'table':
      return [tableFrom(block.header, block.rows), new Paragraph({ children: [] })]
    case 'list':
      return block.items.map(
        (item) =>
          new Paragraph({
            children: spansToRuns(item),
            ...(block.ordered
              ? { numbering: { reference: ORDERED_LIST_REFERENCE, level: 0 } }
              : { bullet: { level: 0 } }),
          }),
      )
    case 'quote':
      return [new Paragraph({ style: 'ManualQuote', children: spansToRuns(block.spans) })]
    case 'image':
      return imageElements(block, resolve)
    case 'pagebreak':
      return [new Paragraph({ children: [new PageBreak()] })]
  }
}

/** Flattens a chapter's blocks into elements. */
export function blocksToElements(blocks: readonly ManualBlock[], resolve: ImageResolver): (Paragraph | Table)[] {
  return blocks.flatMap((block) => blockToElements(block, resolve))
}

/** Cover page: title, subtitle, and the provenance a reader needs to trust the document. */
function coverElements(input: ManualDocumentInput): Paragraph[] {
  return [
    new Paragraph({ children: [], spacing: { before: 2400 } }),
    new Paragraph({ style: 'ManualCover', children: [new TextRun(input.title)] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: input.subtitle, size: 26, color: '444444' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [new TextRun({ text: `Versão ${input.version} · gerado em ${input.generatedAt}`, size: 20 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ]
}

/** Parts print as dividers so the reader sees the manual's five movements. */
function partDivider(part: string): Paragraph {
  return new Paragraph({
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 2000, after: 400 },
    children: [new TextRun({ text: part, size: 40, bold: true, color: '1F4E79' })],
  })
}

/** Emits chapters, opening a divider whenever the part changes. */
function chapterElements(input: ManualDocumentInput): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []
  let currentPart = ''
  for (const chapter of input.chapters) {
    if (chapter.part !== currentPart) {
      elements.push(partDivider(chapter.part))
      currentPart = chapter.part
    } else {
      elements.push(new Paragraph({ children: [new PageBreak()] }))
    }
    elements.push(...blocksToElements(chapter.blocks, input.resolveImage))
  }
  return elements
}

/** Assembles the whole document: cover, TOC field, then every chapter. */
export function buildManualDocument(input: ManualDocumentInput): Document {
  const toc = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Sumário')] }),
    // `hyperlink`, singular. The plural is silently ignored and ships a TOC you cannot click.
    new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-3' }),
  ]
  return new Document({
    creator: 'agent-graph-flow',
    title: input.title,
    description: input.subtitle,
    styles: MANUAL_STYLES,
    numbering: MANUAL_NUMBERING,
    sections: [
      {
        properties: {},
        children: [...coverElements(input), ...toc, ...chapterElements(input)],
      },
    ],
  })
}
