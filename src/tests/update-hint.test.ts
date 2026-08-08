/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * `agf upgrade` only self-updates the standalone bun binary. Everyone else gets a message
 * telling them how to update — and that message was wrong for the channel that needed it most.
 *
 * Real incident: on Windows, install.ps1 installs a .tgz through npm, so the CLI runs under
 * Node and `isBunRuntime` is false. `agf upgrade` refused (correctly) and then advised
 * `npm i -g agent-graph-flow@latest` — a package that is NOT on the public registry (404).
 * The user ran upgrade, saw a refusal, and stayed on the broken version believing they had
 * updated. A hint that names a command which cannot work is worse than no hint.
 *
 * The three channels have three different answers, so the matrix below is the contract.
 */

import { describe, expect, it } from 'vitest'
import { resolveUpdateHint } from '../core/upgrade/update-hint.js'

describe('resolveUpdateHint — each install channel gets the path that actually works', () => {
  const npmWin = {
    platform: 'win32',
    modulePath: 'C:\\Users\\x\\AppData\\Roaming\\npm\\node_modules\\agent-graph-flow\\dist\\cli\\index.js',
  }
  const npmMac = { platform: 'darwin', modulePath: '/usr/local/lib/node_modules/agent-graph-flow/dist/cli/index.js' }
  const source = { platform: 'darwin', modulePath: '/Users/dev/projects/agent-graph-flow/src/cli/index.ts' }

  it('tells a Windows npm install to re-run the PowerShell installer', () => {
    const hint = resolveUpdateHint(npmWin)
    expect(hint.channel).toBe('npm-global')
    expect(hint.command).toContain('install.ps1')
  })

  it('tells a macOS/Linux npm install to re-run the shell installer', () => {
    const hint = resolveUpdateHint(npmMac)
    expect(hint.channel).toBe('npm-global')
    expect(hint.command).toContain('install.sh')
  })

  it('tells a source checkout to pull and rebuild, never to reinstall over itself', () => {
    const hint = resolveUpdateHint(source)
    expect(hint.channel).toBe('source')
    expect(hint.command).toContain('git pull')
    expect(hint.command).not.toContain('install.sh')
    expect(hint.command).not.toContain('install.ps1')
  })

  // The defect in one assertion: the registry has no such package, so naming it strands the user.
  it('never points anyone at the public npm registry', () => {
    for (const input of [npmWin, npmMac, source]) {
      expect(resolveUpdateHint(input).command).not.toContain('npm i -g agent-graph-flow')
      expect(resolveUpdateHint(input).command).not.toContain('npm install -g agent-graph-flow')
    }
  })

  it('recognises a Windows source checkout as source, not as an install', () => {
    const hint = resolveUpdateHint({ platform: 'win32', modulePath: 'C:\\dev\\agent-graph-flow\\src\\cli\\index.ts' })
    expect(hint.channel).toBe('source')
  })

  it('always produces a non-empty, runnable command', () => {
    for (const input of [npmWin, npmMac, source]) {
      expect(resolveUpdateHint(input).command.trim().length).toBeGreaterThan(0)
    }
  })
})
