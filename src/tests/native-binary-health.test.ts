/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * TDD: native binary health-check (magic bytes) before critical ops.
 *
 * Origin: better_sqlite3.node was swapped by a concurrent
 * `pack-offline.mjs --target-platform=win32` run (a Windows DLL replaced the real
 * native binary ON A MAC) — the resulting dlopen error was cryptic. The check reads
 * the first bytes and names the mismatch instead of letting it fail obscurely.
 *
 * The regression this file now guards: the original check hardcoded "Unix formats are
 * valid, MZ is a mismatch" and never consulted the platform. On Windows the native
 * binary IS a PE starting with `MZ` — so the check reported a healthy install as
 * corrupt, and `agf init` died with INIT_FAILED on 100% of Windows machines. Verified
 * against the real shipped artifact: agf-offline-win32-x64-0.24.0-node22.tgz carries a
 * better_sqlite3.node whose first bytes are 4d 5a 90 00.
 *
 * So "valid" is per-platform, and every case below is a PAIR: the format that belongs
 * on that platform passes, and a foreign format on the same platform still fails. A
 * check that accepted everything would pass the first half and betray the second.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkNativeBinary } from '../core/store/native-binary-health.js'

const ELF = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00])
const MACHO_64 = Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0x07, 0x00, 0x00, 0x01])
const MACHO_FAT = Buffer.from([0xca, 0xfe, 0xba, 0xbe, 0x00, 0x00, 0x00, 0x02])
const PE = Buffer.from([0x4d, 0x5a, 0x90, 0x00])
const GIBBERISH = Buffer.from([0x00, 0x01, 0x02, 0x03])

describe('checkNativeBinary — the expected format is the platform′s own', () => {
  let dir: string
  const write = (name: string, bytes: Buffer): string => {
    const p = join(dir, name)
    writeFileSync(p, bytes)
    return p
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'agf-native-binary-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  describe('win32 — a PE is the healthy case, not the defect', () => {
    it('accepts a PE binary', () => {
      expect(checkNativeBinary(write('win.node', PE), 'win32')).toEqual({ ok: true })
    })

    it('rejects an ELF binary as a mismatch', () => {
      const result = checkNativeBinary(write('linux.node', ELF), 'win32')
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('magic bytes mismatch')
    })

    it('rejects a Mach-O binary as a mismatch', () => {
      expect(checkNativeBinary(write('mac.node', MACHO_64), 'win32').ok).toBe(false)
    })
  })

  describe('darwin — Mach-O is healthy; the original incident still fails', () => {
    it('accepts a Mach-O 64-bit binary', () => {
      expect(checkNativeBinary(write('mac.node', MACHO_64), 'darwin')).toEqual({ ok: true })
    })

    it('accepts a Mach-O universal binary', () => {
      expect(checkNativeBinary(write('fat.node', MACHO_FAT), 'darwin')).toEqual({ ok: true })
    })

    // The incident that created this check: a Windows DLL landed on a Mac.
    it('rejects a Windows PE binary — the swap this check exists to catch', () => {
      const result = checkNativeBinary(write('win.node', PE), 'darwin')
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('magic bytes mismatch')
      expect(result.reason).toContain('npm rebuild')
    })

    it('rejects an ELF binary', () => {
      expect(checkNativeBinary(write('linux.node', ELF), 'darwin').ok).toBe(false)
    })
  })

  describe('linux — ELF is healthy', () => {
    it('accepts an ELF binary', () => {
      expect(checkNativeBinary(write('linux.node', ELF), 'linux')).toEqual({ ok: true })
    })

    it('rejects a Windows PE binary', () => {
      expect(checkNativeBinary(write('win.node', PE), 'linux').ok).toBe(false)
    })

    it('rejects a Mach-O binary', () => {
      expect(checkNativeBinary(write('mac.node', MACHO_64), 'linux').ok).toBe(false)
    })
  })

  describe('regardless of platform', () => {
    it('reports a missing file as missing, not as a mismatch', () => {
      const result = checkNativeBinary(join(dir, 'does-not-exist.node'), 'win32')
      expect(result.ok).toBe(false)
      expect(result.reason).toBe('missing')
    })

    it('rejects bytes that match no known executable format', () => {
      const result = checkNativeBinary(write('junk.node', GIBBERISH), 'linux')
      expect(result.ok).toBe(false)
      expect(result.reason).toContain('magic bytes mismatch')
    })

    // Production callers pass no platform; the default must be the running one, or
    // every non-test caller would silently validate against the wrong format.
    it('defaults to the running platform when none is given', () => {
      const own = { darwin: MACHO_64, linux: ELF, win32: PE }[process.platform as string] ?? MACHO_64
      expect(checkNativeBinary(write('own.node', own)).ok).toBe(true)
    })
  })
})
