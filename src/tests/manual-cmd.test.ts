/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Coverage: src/cli/commands/manual-cmd.ts — wires the dormant manual-builder pipeline
 * (src/core/manual/build-manual.ts, node_wire_01319d0498cb) to the CLI surface via
 * `agf manual generate`.
 */

import { describe, it, expect, vi } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { manualCommand } from '../cli/commands/manual-cmd.js'

function lastEnvelope(out: string[]): Record<string, unknown> {
  return JSON.parse(out.join('').trim().split('\n').pop() ?? '{}')
}

async function withCapturedStdout(fn: () => Promise<void>): Promise<Record<string, unknown>> {
  const out: string[] = []
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    out.push(String(chunk))
    return true
  })
  try {
    await fn()
  } finally {
    spy.mockRestore()
  }
  return lastEnvelope(out)
}

describe('manualCommand', () => {
  it('builds the "manual" command with a "generate" sub-command', () => {
    const cmd = manualCommand()
    expect(cmd.name()).toBe('manual')
    expect(cmd.commands.map((c) => c.name())).toContain('generate')
  })
})

describe('agf manual generate (node_wire_01319d0498cb)', () => {
  it('writes a non-trivial .docx to --out and reports chapters/commands/size', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-manual-generate-'))
    const outPath = join(dir, 'nested', 'manual.docx')
    try {
      const envelope = await withCapturedStdout(() =>
        manualCommand().parseAsync(['generate', '--out', outPath], { from: 'user' }),
      )
      const data = envelope.data as { path: string; chapters: number; commands: number; sizeKb: number }

      expect(envelope.ok).toBe(true)
      expect(data.path).toBe(outPath)
      expect(data.chapters).toBeGreaterThan(0)
      expect(data.commands).toBeGreaterThan(0)
      expect(data.sizeKb).toBeGreaterThan(0)

      expect(existsSync(outPath)).toBe(true)
      expect(readFileSync(outPath).byteLength).toBeGreaterThan(50_000)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 30_000)
})
