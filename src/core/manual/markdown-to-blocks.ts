/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Markdown → ManualBlock[]: the intermediate representation that lets the manual be written
 * in Markdown and rendered as a Word document.
 *
 * WHY an intermediate AST instead of Markdown straight to docx: it keeps the parser free of
 * any docx dependency, so it stays unit-testable on plain data, and it gives the generated
 * Appendix A a way in — command-appendix.ts emits the same blocks without ever producing
 * Markdown text to re-parse. Two producers, one renderer.
 *
 * Deliberately a SUBSET of Markdown — the constructs the manual actually uses. Anything
 * unrecognised degrades to a paragraph rather than throwing, because a manual that fails to
 * build over an exotic construct is worse than one that renders it plainly.
 *
 * GOTCHA: table cells stay raw strings here; inline marks inside them are parsed at render
 * time. Parsing them twice was the alternative and it loses the cell boundary.
 *
 * @see command-appendix.ts — the other producer of these blocks
 * @see blocks-to-docx.ts — the only consumer, and the only module that imports `docx`
 * @see manual-toc.ts — decides which files get fed through here, and in what order
 *
 * Pure — no I/O.
 */

/** A run of text with at most one mark. Marks do not nest in this subset. */
export interface InlineSpan {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
}

/** One renderable block. The renderer switches exhaustively on `kind`. */
export type ManualBlock =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'list'; ordered: boolean; items: InlineSpan[][] }
  | { kind: 'code'; language: string; lines: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] }
  | { kind: 'image'; path: string; alt: string }
  | { kind: 'quote'; spans: InlineSpan[] }
  | { kind: 'pagebreak' }

const HEADING = /^(#{1,4})\s+(.*)$/
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/
const FENCE = /^```(\w*)\s*$/
const UNORDERED_ITEM = /^[-*]\s+(.*)$/
const ORDERED_ITEM = /^\d+[.)]\s+(.*)$/
const QUOTE_LINE = /^>\s?(.*)$/
const TABLE_DIVIDER = /^\s*\|?[\s:|-]+\|[\s:|-]*$/

// Ordered: `**` must be tried before `*`, or bold would read as two empty italics.
const INLINE_MARKS = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_|\[([^\]]+)\]\([^)]*\)/g

/** Splits a line of prose into marked runs. Unclosed markers stay literal text. */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = []
  let cursor = 0
  INLINE_MARKS.lastIndex = 0

  for (let m = INLINE_MARKS.exec(text); m !== null; m = INLINE_MARKS.exec(text)) {
    if (m.index > cursor) spans.push({ text: text.slice(cursor, m.index) })
    const [, code, bold, star, underscore, link] = m
    if (code !== undefined) spans.push({ text: code, code: true })
    else if (bold !== undefined) spans.push({ text: bold, bold: true })
    else if (star !== undefined) spans.push({ text: star, italic: true })
    else if (underscore !== undefined) spans.push({ text: underscore, italic: true })
    else if (link !== undefined) spans.push({ text: link }) // a page cannot be clicked
    cursor = m.index + m[0].length
  }

  if (cursor < text.length) spans.push({ text: text.slice(cursor) })
  return spans.length > 0 ? spans : [{ text }]
}

/** True when the line opens a block, so paragraph and list runs know where to stop. */
function isBlockStart(line: string): boolean {
  return (
    line.trim() === '' ||
    HEADING.test(line) ||
    FENCE.test(line) ||
    IMAGE_LINE.test(line) ||
    QUOTE_LINE.test(line) ||
    UNORDERED_ITEM.test(line) ||
    ORDERED_ITEM.test(line) ||
    line.trimStart().startsWith('|')
  )
}

/** Splits `| a | b |` into trimmed cells, discarding the empty edges the pipes create. */
function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())
}

/** Reads a fenced block verbatim; markdown inside must survive untouched. */
function readCode(lines: string[], start: number): { block: ManualBlock; next: number } {
  const language = (lines[start].match(FENCE)?.[1] ?? '').trim()
  const body: string[] = []
  let i = start + 1
  while (i < lines.length && !FENCE.test(lines[i])) {
    body.push(lines[i])
    i += 1
  }
  return { block: { kind: 'code', language, lines: body }, next: i + 1 }
}

/** Reads a pipe table: header, divider, then rows until the pipes stop. */
function readTable(lines: string[], start: number): { block: ManualBlock; next: number } {
  const header = tableCells(lines[start])
  let i = start + 2 // skip the divider
  const rows: string[][] = []
  while (i < lines.length && lines[i].trimStart().startsWith('|')) {
    rows.push(tableCells(lines[i]))
    i += 1
  }
  return { block: { kind: 'table', header, rows }, next: i }
}

/** Reads consecutive items of one list flavour. */
function readList(lines: string[], start: number, ordered: boolean): { block: ManualBlock; next: number } {
  const pattern = ordered ? ORDERED_ITEM : UNORDERED_ITEM
  const items: InlineSpan[][] = []
  let i = start
  while (i < lines.length) {
    const match = lines[i].match(pattern)
    if (match === null) break
    items.push(parseInline(match[1].trim()))
    i += 1
  }
  return { block: { kind: 'list', ordered, items }, next: i }
}

/** Reads wrapped prose lines into one paragraph — soft wraps are not line breaks. */
function readParagraph(lines: string[], start: number): { block: ManualBlock; next: number } {
  const parts: string[] = [lines[start].trim()]
  let i = start + 1
  while (i < lines.length && !isBlockStart(lines[i])) {
    parts.push(lines[i].trim())
    i += 1
  }
  return { block: { kind: 'paragraph', spans: parseInline(parts.join(' ')) }, next: i }
}

/** Reads a `>` run into a single quote block. */
function readQuote(lines: string[], start: number): { block: ManualBlock; next: number } {
  const parts: string[] = []
  let i = start
  while (i < lines.length) {
    const match = lines[i].match(QUOTE_LINE)
    if (match === null) break
    parts.push(match[1].trim())
    i += 1
  }
  return { block: { kind: 'quote', spans: parseInline(parts.join(' ')) }, next: i }
}

/** Dispatches one line to the reader that owns it. */
function readBlock(lines: string[], i: number): { block: ManualBlock | null; next: number } {
  const line = lines[i]
  if (line.trim() === '') return { block: null, next: i + 1 }
  if (FENCE.test(line)) return readCode(lines, i)

  const heading = line.match(HEADING)
  if (heading !== null) {
    const level = Math.min(heading[1].length, 4) as 1 | 2 | 3 | 4
    return { block: { kind: 'heading', level, text: heading[2].trim() }, next: i + 1 }
  }

  const image = line.match(IMAGE_LINE)
  if (image !== null) return { block: { kind: 'image', path: image[2], alt: image[1] }, next: i + 1 }

  if (line.trimStart().startsWith('|') && TABLE_DIVIDER.test(lines[i + 1] ?? '')) return readTable(lines, i)
  if (QUOTE_LINE.test(line)) return readQuote(lines, i)
  if (UNORDERED_ITEM.test(line)) return readList(lines, i, false)
  if (ORDERED_ITEM.test(line)) return readList(lines, i, true)
  return readParagraph(lines, i)
}

/**
 * Parses a chapter into blocks. Authoring notes in HTML comments are dropped before parsing
 * so an internal remark can never surface in a document that goes to a reader.
 */
export function markdownToBlocks(markdown: string): ManualBlock[] {
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const blocks: ManualBlock[] = []
  let i = 0
  while (i < lines.length) {
    const { block, next } = readBlock(lines, i)
    if (block !== null) blocks.push(block)
    i = next > i ? next : i + 1
  }
  return blocks
}
