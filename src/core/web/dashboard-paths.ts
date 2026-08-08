/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Where the built dashboard SPA lives — the single answer, for everyone who needs it.
 *
 * WHY a module for one path: two consumers need it and they must never disagree. The
 * server (api/app-factory) resolves it to serve the SPA; the doctor resolves it to report
 * whether the dashboard is available. When the doctor kept its own opinion, it looked for
 * `<projeto-do-usuário>/dist/web/dashboard/index.html` — the wrong ROOT (the dashboard
 * ships inside the installed package, not in the user's project) and the wrong PATH (the
 * build nests a second `dist/`). Result: every end user was told "Dashboard build not
 * found" about a dashboard that was installed and working.
 *
 * The path is resolved relative to THIS module, not to any working directory, because the
 * dashboard travels with the package — it has nothing to do with where the user stands.
 *
 * GOTCHA: a standalone bun binary carries no `dist/` at all — the SPA is compiled into the
 * executable (api/embedded-spa). Absence on disk is therefore NOT absence of a dashboard;
 * ask `isDashboardAvailable` rather than testing the directory yourself.
 *
 * @see ../../api/app-factory.ts — serves it
 * @see ../doctor/doctor-checks.ts — `checkDashboardBuild` reports on it
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Absolute path to the built SPA. Both in source (`src/core/web` → `src/web/dashboard/dist`)
 * and after the bundle (`dist/core/web` → `dist/web/dashboard/dist`) the same two levels up
 * land on the right place, because the build mirrors the source tree.
 */
export function resolveDashboardDist(): string {
  return path.resolve(moduleDir, '..', '..', 'web', 'dashboard', 'dist')
}

/** The entry point the server hands to a browser. */
export function resolveDashboardIndex(): string {
  return path.join(resolveDashboardDist(), 'index.html')
}

/**
 * Is a dashboard actually reachable? True when the built SPA is on disk, or when running
 * as a bun binary that embeds it. Injectable so both branches are provable from one host.
 */
export function isDashboardAvailable(opts: { isBun: boolean; distExists?: boolean } = { isBun: false }): boolean {
  const distExists = opts.distExists ?? existsSync(resolveDashboardDist())
  return distExists || opts.isBun
}
