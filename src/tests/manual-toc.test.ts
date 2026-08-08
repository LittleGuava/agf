import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MANUAL_CHAPTERS,
  MANUAL_PARTS,
  chapterFiles,
  missingFromToc,
  orphanTocEntries,
} from '../core/manual/manual-toc.js'

const MANUAL_DIR = join(process.cwd(), 'docs', 'manual')

/** The manual's own files on disk — the TOC claims to describe exactly these. */
function markdownOnDisk(): string[] {
  try {
    return readdirSync(MANUAL_DIR).filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }
}

describe('manual-toc — purity', () => {
  it('imports neither docx nor node:fs — the caller owns the reading', () => {
    const source = readFileSync(join(process.cwd(), 'src/core/manual/manual-toc.ts'), 'utf8')
    const imports = source.match(/^import .*$/gm) ?? []
    expect(imports.filter((line) => /['"](docx|node:fs|node:path)['"]/.test(line))).toEqual([])
  })
})

describe('manual-toc', () => {
  it('orders chapters by their file prefix so document order is the file order', () => {
    const files = MANUAL_CHAPTERS.filter((c) => !c.generated).map((c) => c.file)
    expect(files).toEqual([...files].sort())
  })

  it('assigns every chapter to a declared part', () => {
    for (const chapter of MANUAL_CHAPTERS) {
      expect(MANUAL_PARTS).toContain(chapter.part)
    }
  })

  it('gives every chapter a non-empty title', () => {
    for (const chapter of MANUAL_CHAPTERS) {
      expect(chapter.title.trim().length).toBeGreaterThan(0)
    }
  })

  it('never repeats a file', () => {
    const files = chapterFiles()
    expect(new Set(files).size).toBe(files.length)
  })

  it('excludes generated chapters from the files to read off disk', () => {
    const generated = MANUAL_CHAPTERS.filter((c) => c.generated)
    expect(generated.length).toBeGreaterThan(0)
    for (const chapter of generated) {
      expect(chapterFiles()).not.toContain(chapter.file)
    }
  })

  it('reports a markdown file that exists on disk but has no TOC entry', () => {
    expect(missingFromToc(['01-o-que-e-o-agf.md', 'intruso.md'])).toEqual(['intruso.md'])
  })

  it('reports a TOC entry whose file is absent from disk', () => {
    expect(orphanTocEntries([])).toEqual(chapterFiles())
  })

  // The gate: a chapter written but never registered would silently vanish from the .docx.
  it('has a TOC entry for every markdown file actually in docs/manual', () => {
    const onDisk = markdownOnDisk()
    if (onDisk.length === 0) return
    expect(missingFromToc(onDisk)).toEqual([])
  })

  // The mirror gate: a TOC entry with no file would render an empty chapter.
  it('has a file on disk for every non-generated TOC entry', () => {
    const onDisk = markdownOnDisk()
    if (onDisk.length === 0) return
    expect(orphanTocEntries(onDisk)).toEqual([])
  })
})
