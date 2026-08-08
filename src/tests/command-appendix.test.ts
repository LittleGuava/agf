import { describe, expect, it } from 'vitest'
import { COMMAND_SURFACE } from '../core/rag-in/command-surface.generated.js'
import { buildCommandAppendix, countAppendixRows, groupByRoot } from '../core/manual/command-appendix.js'
import type { ManualBlock } from '../core/manual/markdown-to-blocks.js'

const tables = (blocks: ManualBlock[]) =>
  blocks.filter((b): b is Extract<ManualBlock, { kind: 'table' }> => b.kind === 'table')

describe('groupByRoot', () => {
  it('files every entry under its first token', () => {
    const groups = groupByRoot([
      { path: 'node', description: 'CRUD' },
      { path: 'node add', description: 'cria' },
      { path: 'edge add', description: 'liga' },
    ])
    expect([...groups.keys()]).toEqual(['edge', 'node']) // alphabetical, not insertion order
    expect(groups.get('node')).toHaveLength(2)
  })

  it('loses no entry from the real catalogue', () => {
    const groups = groupByRoot(COMMAND_SURFACE)
    const regrouped = [...groups.values()].reduce((sum, g) => sum + g.length, 0)
    expect(regrouped).toBe(COMMAND_SURFACE.length)
  })

  it('orders roots alphabetically so a reader can scan for one', () => {
    const roots = [...groupByRoot(COMMAND_SURFACE).keys()]
    expect(roots).toEqual([...roots].sort())
  })
})

describe('buildCommandAppendix — the reconciliation the manual rests on', () => {
  const blocks = buildCommandAppendix(COMMAND_SURFACE)

  // AC: exactly one row per invocable path — no drops, no duplicates from the grouping.
  it('emits exactly COMMAND_SURFACE.length table rows', () => {
    expect(countAppendixRows(blocks)).toBe(COMMAND_SURFACE.length)
  })

  it('mentions every path exactly once', () => {
    // Rows carry the copy-pasteable `agf ` prefix; the catalogue stores bare paths.
    const seen = tables(blocks).flatMap((t) => t.rows.map((r) => r[0].replace(/^agf /, '')))
    expect(seen).toHaveLength(COMMAND_SURFACE.length)
    expect(new Set(seen).size).toBe(COMMAND_SURFACE.length)
    expect(new Set(seen)).toEqual(new Set(COMMAND_SURFACE.map((e) => e.path)))
  })

  // AC: an empty cell is the classic export defect — it reads as "this command does nothing".
  it('never emits an empty cell', () => {
    for (const table of tables(blocks)) {
      for (const row of table.rows) {
        expect(row).toHaveLength(table.header.length)
        for (const cell of row) expect(cell.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('gives every root a heading so the appendix is navigable', () => {
    const headings = blocks.filter((b) => b.kind === 'heading' && b.level === 2)
    expect(headings).toHaveLength(groupByRoot(COMMAND_SURFACE).size)
  })

  it('prefixes paths with agf so a row is copy-pasteable', () => {
    const firstRow = tables(blocks)[0].rows[0][0]
    expect(firstRow.startsWith('agf ')).toBe(true)
  })

  it('substitutes a description for an entry that has none, rather than an empty cell', () => {
    const blocksWithHole = buildCommandAppendix([{ path: 'mudo', description: '   ' }])
    expect(tables(blocksWithHole)[0].rows[0][1].trim().length).toBeGreaterThan(0)
  })

  it('opens with a heading and an explanatory paragraph, not a bare table', () => {
    expect(blocks[0]).toMatchObject({ kind: 'heading', level: 1 })
    expect(blocks[1]).toMatchObject({ kind: 'paragraph' })
  })

  it('states the real count in its own prose, so a stale number is visible', () => {
    const intro = blocks[1]
    const prose = intro.kind === 'paragraph' ? intro.spans.map((s) => s.text).join('') : ''
    expect(prose).toContain(String(COMMAND_SURFACE.length))
  })
})
