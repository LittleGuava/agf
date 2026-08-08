import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { markdownToBlocks, parseInline } from '../core/manual/markdown-to-blocks.js'

// The parser is the half of the pipeline that must stay renderer-agnostic and I/O-free:
// the Appendix A producer feeds the same blocks without any file or docx involved.
describe('markdown-to-blocks — purity', () => {
  it('imports neither docx nor node:fs', () => {
    const source = readFileSync(join(process.cwd(), 'src/core/manual/markdown-to-blocks.ts'), 'utf8')
    const imports = source.match(/^import .*$/gm) ?? []
    expect(imports.filter((line) => /['"](docx|node:fs|node:path)['"]/.test(line))).toEqual([])
  })
})

describe('markdownToBlocks — block structure', () => {
  it('reads ATX headings with their level', () => {
    const blocks = markdownToBlocks('# Um\n\n## Dois\n\n### Três')
    expect(blocks).toEqual([
      { kind: 'heading', level: 1, text: 'Um' },
      { kind: 'heading', level: 2, text: 'Dois' },
      { kind: 'heading', level: 3, text: 'Três' },
    ])
  })

  it('joins wrapped lines into one paragraph and splits on a blank line', () => {
    const blocks = markdownToBlocks('linha um\nlinha dois\n\noutro parágrafo')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ kind: 'paragraph' })
    expect(blocks[0]).toHaveProperty('spans', [{ text: 'linha um linha dois' }])
  })

  it('keeps fenced code verbatim, including markdown that must not be parsed', () => {
    const blocks = markdownToBlocks('```bash\nagf next --select data.node.id\n# não é heading\n```')
    expect(blocks).toEqual([
      {
        kind: 'code',
        language: 'bash',
        lines: ['agf next --select data.node.id', '# não é heading'],
      },
    ])
  })

  it('reads a pipe table into header and rows', () => {
    const md = '| Comando | Faz |\n| --- | --- |\n| next | puxa a task |\n| done | fecha |'
    expect(markdownToBlocks(md)).toEqual([
      {
        kind: 'table',
        header: ['Comando', 'Faz'],
        rows: [
          ['next', 'puxa a task'],
          ['done', 'fecha'],
        ],
      },
    ])
  })

  it('reads unordered and ordered lists', () => {
    const blocks = markdownToBlocks('- um\n- dois\n\n1. primeiro\n2. segundo')
    expect(blocks[0]).toMatchObject({ kind: 'list', ordered: false })
    expect(blocks[1]).toMatchObject({ kind: 'list', ordered: true })
    expect(blocks[0]).toHaveProperty('items', [[{ text: 'um' }], [{ text: 'dois' }]])
  })

  it('reads a standalone image line', () => {
    expect(markdownToBlocks('![O grafo](../graph-env.png)')).toEqual([
      { kind: 'image', path: '../graph-env.png', alt: 'O grafo' },
    ])
  })

  it('reads a block quote', () => {
    expect(markdownToBlocks('> atenção')).toEqual([{ kind: 'quote', spans: [{ text: 'atenção' }] }])
  })

  it('drops HTML comments so authoring notes never reach the reader', () => {
    expect(markdownToBlocks('<!-- nota interna -->\n\ntexto')).toEqual([
      { kind: 'paragraph', spans: [{ text: 'texto' }] },
    ])
  })

  it('returns nothing for empty or whitespace-only input', () => {
    expect(markdownToBlocks('   \n\n  ')).toEqual([])
  })
})

describe('parseInline — spans', () => {
  it('marks bold, italic and inline code', () => {
    expect(parseInline('use **isto**, não *aquilo*, via `agf done`')).toEqual([
      { text: 'use ' },
      { text: 'isto', bold: true },
      { text: ', não ' },
      { text: 'aquilo', italic: true },
      { text: ', via ' },
      { text: 'agf done', code: true },
    ])
  })

  it('leaves plain text as a single span', () => {
    expect(parseInline('sem marcação')).toEqual([{ text: 'sem marcação' }])
  })

  it('does not treat an unclosed marker as formatting', () => {
    expect(parseInline('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6' }])
  })

  it('keeps link text and drops the URL, since a manual page cannot be clicked', () => {
    expect(parseInline('veja o [README](../README.md) do repo')).toEqual([
      { text: 'veja o ' },
      { text: 'README' },
      { text: ' do repo' },
    ])
  })
})
