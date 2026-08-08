import { beforeAll, describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import mammoth from 'mammoth'
import { COMMAND_SURFACE } from '../core/rag-in/command-surface.generated.js'
import { MANUAL_CHAPTERS } from '../core/manual/manual-toc.js'
import { buildManualBuffer } from '../core/manual/build-manual.js'

/**
 * The anti-stale gate.
 *
 * Building the .docx proves the pipeline runs; it does not prove the document says the right
 * thing. So this suite reopens the produced file with mammoth — a real docx reader, not our
 * own writer — and reconciles what is INSIDE it against the sources of truth. A command added
 * to the CLI without regenerating the manual fails here, which is the only thing standing
 * between this document and describing a version of agf that no longer exists.
 *
 * Reading back with a different library than the one that wrote it is deliberate: asserting
 * our writer against our writer would pass even if both were wrong.
 */
describe('manual .docx — round-trip reconciliation', () => {
  let html = ''

  beforeAll(async () => {
    const buffer = await buildManualBuffer()
    html = (await mammoth.convertToHtml({ buffer })).value
  }, 120_000)

  /** Every <td> in the document, in order. */
  function cells(): string[] {
    return [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim())
  }

  /** Heading text at a given level, in document order. */
  function headings(level: number): string[] {
    return [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'g'))].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
  }

  /** The command paths actually present in the shipped document. */
  function commandCells(): string[] {
    return cells()
      .filter((c) => c.startsWith('agf '))
      .map((c) => c.replace(/^agf /, ''))
  }

  it('produces a non-trivial document', () => {
    expect(html.length).toBeGreaterThan(50_000)
  })

  // THE reconciliation: one row per invocable path, no drops, no duplicates.
  it('contains exactly one row per command in the catalogue', () => {
    const inDocument = commandCells()
    expect(inDocument).toHaveLength(COMMAND_SURFACE.length)
    expect(new Set(inDocument).size).toBe(COMMAND_SURFACE.length)
  })

  it('is missing no command from the catalogue', () => {
    const inDocument = new Set(commandCells())
    const missing = COMMAND_SURFACE.filter((e) => !inDocument.has(e.path)).map((e) => e.path)
    expect(missing).toEqual([])
  })

  it('invents no command that is not in the catalogue', () => {
    const known = new Set(COMMAND_SURFACE.map((e) => e.path))
    const invented = commandCells().filter((p) => !known.has(p))
    expect(invented).toEqual([])
  })

  // An empty cell reads as "this command does nothing" — the classic export defect.
  it('ships no empty table cell', () => {
    expect(cells().filter((c) => c === '')).toEqual([])
  })

  it('carries every chapter as a top-level heading, in TOC order', () => {
    const h1 = headings(1)
    for (const chapter of MANUAL_CHAPTERS) {
      expect(h1, `capítulo ausente: ${chapter.file}`).toContain(chapter.title)
    }
    const positions = MANUAL_CHAPTERS.map((c) => h1.indexOf(c.title))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('renders the figures rather than reporting them missing', () => {
    expect(html).not.toContain('[imagem ausente')
    expect(html).toContain('<img')
  })

  it('keeps every markdown file in docs/manual reachable from the document', () => {
    const onDisk = readdirSync(join(process.cwd(), 'docs', 'manual')).filter((f) => f.endsWith('.md'))
    const registered = new Set(MANUAL_CHAPTERS.map((c) => c.file))
    expect(onDisk.filter((f) => !registered.has(f))).toEqual([])
  })
})
