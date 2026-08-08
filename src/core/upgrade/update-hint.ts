/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * How to update, for the installs that `agf upgrade` cannot update itself.
 *
 * WHY this is not one sentence: `agf upgrade` replaces the standalone bun binary in place,
 * which only exists on the install.sh channel. Windows installs a .tgz through npm and runs
 * under Node; a developer runs from a checkout. Three channels, three different answers —
 * and the old code gave all of them the same one.
 *
 * The answer it gave was `npm i -g agent-graph-flow@latest`, and that package is NOT on the
 * public registry (404). So the one channel that most needed the hint — Windows, where
 * upgrade genuinely cannot self-update — was handed a command that fails. The user runs
 * upgrade, sees a refusal, runs the suggested command, sees a 404, and stays on the old
 * version believing they tried. A hint naming an impossible command is worse than silence.
 *
 * The discriminator is the module's own path: code living under `node_modules/` was
 * installed; anything else is a checkout. That is observable and needs no extra probing.
 *
 * GOTCHA: never tell a checkout to re-run an installer — it would drop a released build on
 * top of someone's working tree.
 *
 * @see ../../cli/commands/upgrade-cmd.ts — the caller, which refuses and then shows this
 * @see upgrade.ts — the self-update path, for the binary channel only
 *
 * Pure — no I/O. The installer commands come from upgrade.ts, the module already allowed to
 * name the release host, so a mirror set via AGF_RELEASES_BASE redirects the printed
 * instruction too — and the hostname never spreads to a third file.
 */
import { INSTALL_COMMAND_UNIX, INSTALL_COMMAND_WINDOWS } from './upgrade.js'

/** Which channel the running code came from. */
export type InstallChannel = 'npm-global' | 'source'

export interface UpdateHint {
  channel: InstallChannel
  /** A command the user can paste as-is. */
  command: string
}

const FROM_SOURCE = 'git pull && npm run build'

/**
 * Picks the update instruction for a non-binary install.
 *
 * `modulePath` is where the running module lives; under `node_modules/` means it was
 * installed rather than checked out.
 */
export function resolveUpdateHint(opts: { platform: string; modulePath: string }): UpdateHint {
  const normalised = opts.modulePath.replace(/\\/g, '/')
  const isInstalled = normalised.includes('/node_modules/')

  if (!isInstalled) return { channel: 'source', command: FROM_SOURCE }

  return {
    channel: 'npm-global',
    command: opts.platform === 'win32' ? INSTALL_COMMAND_WINDOWS : INSTALL_COMMAND_UNIX,
  }
}
