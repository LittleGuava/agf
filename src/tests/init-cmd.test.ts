/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright (C) 2026 Diego Lima Nogueira de Paula
 */
import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { isProjectInitialized, runInitOrchestration } from '../cli/commands/init-cmd.js'
import { SqliteStore } from '../core/store/sqlite-store.js'

describe('isProjectInitialized (node_a0656372d551)', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true })
    dirs.length = 0
  })

  it('returns false when no graph.db exists at all', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-init-'))
    dirs.push(dir)

    expect(isProjectInitialized(dir)).toBe(false)
  })

  it('returns false when graph.db exists but has no project row — the session:start hook side effect (registerSessionResumeDetector opens the store on every CLI invocation, migrating the schema before init runs, without calling initProject())', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-init-'))
    dirs.push(dir)

    // Simulates the premature store-open: schema migrated, zero project rows.
    const store = SqliteStore.open(dir)
    store.close()

    expect(isProjectInitialized(dir)).toBe(false)
  })

  it('returns true once a project row actually exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-init-'))
    dirs.push(dir)

    const store = SqliteStore.open(dir)
    store.initProject('some-project')
    store.close()

    expect(isProjectInitialized(dir)).toBe(true)
  })
})

/**
 * A failing init must NAME what failed.
 *
 * Real incident: `agf init` died on Windows with only "Erros críticos detectados". The
 * doctor prints ~22 lines, so the failing one had scrolled off the top, and the envelope
 * carried nothing — the check had to be identified by reverse-engineering the runner's
 * ordering against a photo of a terminal. The check that failed was native-binary-health,
 * rejecting the Windows PE that is the correct format there.
 */
describe('runInitOrchestration — a blocked init names the check that blocked it', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true })
    dirs.length = 0
  })

  /** Deps that reach the doctor phase and stop there with the report we dictate. */
  function depsWith(checks: Array<{ name: string; level: string; message: string; suggestion?: string }>) {
    const lines: string[] = []
    const summary = {
      ok: checks.filter((c) => c.level === 'ok').length,
      warning: checks.filter((c) => c.level === 'warning').length,
      error: checks.filter((c) => c.level === 'error').length,
    }
    return {
      lines,
      deps: {
        out: (line: string) => lines.push(line),
        isDbInitialized: () => true,
        runSetup: async () => {},
        runGraphOnlySetup: async () => {},
        atomicWrites: async () => new Map(),
        isNeuralReady: async () => true,
        installNeural: async () => 'ready' as const,
        detectCli: async () => {},
        runDoctor: async () => ({ passed: summary.error === 0, summary, checks: checks as never }),
        startServer: async () => 'http://localhost:3000',
      } as never,
    }
  }

  it('returns the failing check so the envelope can carry it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-init-fail-'))
    dirs.push(dir)
    const { deps } = depsWith([
      { name: 'node-version', level: 'ok', message: 'Node.js v24.14.1 (>= 20)' },
      {
        name: 'native-binary-health',
        level: 'error',
        message: 'Native binary check failed: magic bytes mismatch',
        suggestion: 'Run: npm rebuild better-sqlite3',
      },
    ])

    const result = await runInitOrchestration({ dir, skipNeural: true, noServe: true, port: 3000 } as never, deps)

    expect(result.success).toBe(false)
    expect(result.failedChecks?.map((c) => c.name)).toEqual(['native-binary-health'])
    expect(result.failedChecks?.[0].suggestion).toContain('npm rebuild')
  })

  it('prints the failing check name, so it survives a scrolled terminal', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-init-fail-'))
    dirs.push(dir)
    const { deps, lines } = depsWith([
      { name: 'native-binary-health', level: 'error', message: 'magic bytes mismatch' },
    ])

    await runInitOrchestration({ dir, skipNeural: true, noServe: true, port: 3000 } as never, deps)

    expect(lines.join('\n')).toContain('native-binary-health')
  })

  it('reports no failing checks when the doctor passes', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agf-init-ok-'))
    dirs.push(dir)
    const { deps } = depsWith([{ name: 'node-version', level: 'ok', message: 'fine' }])

    const result = await runInitOrchestration({ dir, skipNeural: true, noServe: true, port: 3000 } as never, deps)

    expect(result.success).toBe(true)
    expect(result.failedChecks).toBeUndefined()
  })
})
