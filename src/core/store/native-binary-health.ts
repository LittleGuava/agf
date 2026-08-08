/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 */

/*!
 * native-binary-health — a native `.node` addon (better-sqlite3, onnxruntime) can get
 * silently swapped for the wrong platform's build by a concurrent cross-compile pack run
 * (this happened for real: a Windows DLL replaced the real binary mid-session on a Mac).
 * The resulting dlopen/require error is cryptic — this reads the first bytes and names the
 * mismatch so the failure is diagnosed instead of guessed at.
 *
 * WHY the platform is a parameter and not a constant: "valid" is not a global set of
 * formats, it is the ONE format that belongs on the host. The first version of this module
 * accepted ELF and Mach-O everywhere and rejected `MZ` outright, which is correct on a Mac
 * and catastrophic on Windows — where the native binary IS a PE starting with `MZ`. Every
 * Windows install reported a healthy SQLite as corrupt and `agf init` died with
 * INIT_FAILED. Reading the platform keeps the teeth (a foreign format still fails, on every
 * host) without condemning the format that is supposed to be there.
 *
 * Magic bytes:
 *   - ELF (Linux, and the BSD/Solaris family):  7f 45 4c 46
 *   - Mach-O (macOS), 32/64-bit and universal:  fe ed fa ce|cf, ce|cf fa ed fe, ca fe ba be, be ba fe ca
 *   - PE/DLL (Windows), first 2 bytes:          4d 5a  ("MZ")
 *
 * @see doctor-checks.ts `checkNativeBinaryHealth` — the caller that turns this into a check
 */
import { existsSync, readFileSync } from 'node:fs'

export interface NativeBinaryHealth {
  ok: boolean
  /** 'missing' when the file doesn't exist; a mismatch message otherwise. Absent when ok. */
  reason?: string
}

/** The executable container formats a `.node` addon can legitimately have. */
type BinaryFormat = 'elf' | 'macho' | 'pe' | 'unknown'

const ELF_MAGIC = Buffer.from([0x7f, 0x45, 0x4c, 0x46])
const MACHO_MAGICS = [
  Buffer.from([0xfe, 0xed, 0xfa, 0xce]),
  Buffer.from([0xce, 0xfa, 0xed, 0xfe]),
  Buffer.from([0xfe, 0xed, 0xfa, 0xcf]),
  Buffer.from([0xcf, 0xfa, 0xed, 0xfe]),
  Buffer.from([0xca, 0xfe, 0xba, 0xbe]),
  Buffer.from([0xbe, 0xba, 0xfe, 0xca]),
]
const MZ_MAGIC = Buffer.from([0x4d, 0x5a])

/** Everything not named here is ELF-based (freebsd, openbsd, sunos, android, aix). */
const FORMAT_BY_PLATFORM: Readonly<Record<string, BinaryFormat>> = {
  win32: 'pe',
  darwin: 'macho',
  linux: 'elf',
}

const HUMAN_NAME: Readonly<Record<BinaryFormat, string>> = {
  elf: 'ELF (Linux)',
  macho: 'Mach-O (macOS)',
  pe: 'PE/DLL (Windows)',
  unknown: 'an unrecognized format',
}

/** Which container format a host expects its native addons to be in. */
export function expectedFormatFor(platform: string): BinaryFormat {
  return FORMAT_BY_PLATFORM[platform] ?? 'elf'
}

/** Reads the container format from the leading bytes. */
function detectFormat(head: Buffer): BinaryFormat {
  if (head.subarray(0, 4).equals(ELF_MAGIC)) return 'elf'
  if (MACHO_MAGICS.some((magic) => head.subarray(0, 4).equals(magic))) return 'macho'
  if (head.subarray(0, 2).equals(MZ_MAGIC)) return 'pe'
  return 'unknown'
}

/**
 * Check a native `.node` binary against the format its host platform requires.
 *
 * `platform` defaults to the running host — production callers must not pass anything, or
 * they would validate against a platform they are not on. It is injectable so the test
 * matrix can prove all three hosts from one machine.
 */
export function checkNativeBinary(path: string, platform: string = process.platform): NativeBinaryHealth {
  if (!existsSync(path)) return { ok: false, reason: 'missing' }

  const head = readFileSync(path).subarray(0, 4)
  const found = detectFormat(head)
  const expected = expectedFormatFor(platform)

  if (found === expected) return { ok: true }

  return {
    ok: false,
    reason:
      `magic bytes mismatch (found ${HUMAN_NAME[found]} where ${platform} needs ` +
      `${HUMAN_NAME[expected]}) — native binary built for the wrong platform, ` +
      `run npm rebuild better-sqlite3`,
  }
}
