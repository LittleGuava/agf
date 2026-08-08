/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * The manual's table of contents — the single ordered list that decides what the .docx
 * contains and in which order.
 *
 * WHY a TS module instead of reading the directory: a chapter dropped into docs/manual/
 * but never registered here would be silently absent from the shipped document, and
 * nothing would fail. Declaring the order explicitly turns that omission into a test
 * failure (src/tests/manual-toc.test.ts cross-checks this list against the disk in both
 * directions). File order and document order are the same thing by construction.
 *
 * Appendix A carries `generated: true`: its rows come from COMMAND_SURFACE, not from a
 * file — see command-appendix.ts, which is the module that owns it.
 *
 * Pure — no I/O. The caller reads the files; this module only says which and in what order.
 */

/** One entry in the manual, in document order. */
export interface ManualChapter {
  /** Basename inside docs/manual (or a synthetic name when `generated`). */
  file: string
  /** Heading 1 text in the rendered document. */
  title: string
  /** The part this chapter belongs to; parts print as section dividers. */
  part: string
  /** True when the body is built in code rather than read off disk. */
  generated?: boolean
}

export const PART_FRONT = 'Início'
export const PART_I = 'Parte I — Fundamentos'
export const PART_II = 'Parte II — Fluxos de trabalho'
export const PART_III = 'Parte III — Economia e modelos'
export const PART_IV = 'Parte IV — Superfícies'
export const PART_V = 'Parte V — Operação'
export const PART_APPENDIX = 'Apêndices'

/** Every part, in document order. */
export const MANUAL_PARTS: readonly string[] = [PART_FRONT, PART_I, PART_II, PART_III, PART_IV, PART_V, PART_APPENDIX]

/** The manual, in document order. Numeric filename prefixes keep sort order == reading order. */
export const MANUAL_CHAPTERS: readonly ManualChapter[] = [
  { file: '00-sobre-este-manual.md', title: 'Sobre este manual', part: PART_FRONT },

  { file: '01-o-que-e-o-agf.md', title: 'O que é o agf', part: PART_I },
  { file: '02-instalacao.md', title: 'Instalação e primeiro contato', part: PART_I },
  { file: '03-modelo-do-grafo.md', title: 'O modelo mental do grafo', part: PART_I },
  { file: '04-contrato-de-saida.md', title: 'O contrato de saída e a economia de entrada', part: PART_I },

  { file: '05-ciclo-de-vida.md', title: 'Ciclo de vida, fases e gates', part: PART_II },
  { file: '06-do-prd-ao-backlog.md', title: 'Do PRD ao backlog', part: PART_II },
  { file: '07-construir.md', title: 'Construir: o laço de implementação', part: PART_II },
  { file: '08-modo-delegado.md', title: 'Modo delegado', part: PART_II },
  { file: '09-validar-e-endurecer.md', title: 'Validar e endurecer', part: PART_II },
  { file: '10-gaps.md', title: 'Gaps: completude detectada por máquina', part: PART_II },

  { file: '11-providers-e-modelos.md', title: 'Providers, modelos e roteamento', part: PART_III },
  { file: '12-economia-de-tokens.md', title: 'Economia de tokens: levers e ledgers', part: PART_III },
  { file: '13-rag-e-compressao.md', title: 'RAG-IN, RAG-OUT e compressão', part: PART_III },

  { file: '14-superficies.md', title: 'Superfícies: CLI, TUI, dashboard, MCP, plugins e hooks', part: PART_IV },
  { file: '15-multi-agente.md', title: 'Multi-agente: colônia, formigas e permissões', part: PART_IV },

  { file: '16-configuracao.md', title: 'Configuração, presets e constituição', part: PART_V },
  { file: '17-troubleshooting.md', title: 'Operação e troubleshooting', part: PART_V },

  {
    file: 'apendice-a-comandos.generated',
    title: 'Apêndice A — Referência completa de comandos',
    part: PART_APPENDIX,
    generated: true,
  },
  { file: '90-apendice-b-flags.md', title: 'Apêndice B — Flags globais', part: PART_APPENDIX },
  { file: '91-apendice-c-envelope.md', title: 'Apêndice C — Envelope e códigos de erro', part: PART_APPENDIX },
  { file: '92-apendice-d-tabelas.md', title: 'Apêndice D — Tabelas de referência', part: PART_APPENDIX },
  { file: '93-apendice-e-glossario.md', title: 'Apêndice E — Glossário', part: PART_APPENDIX },
]

/** The files a caller must read off disk — generated chapters have no file to read. */
export function chapterFiles(): string[] {
  return MANUAL_CHAPTERS.filter((c) => !c.generated).map((c) => c.file)
}

/** Markdown present on disk that no TOC entry claims — it would never reach the reader. */
export function missingFromToc(filesOnDisk: readonly string[]): string[] {
  const known = new Set(chapterFiles())
  return filesOnDisk.filter((f) => !known.has(f))
}

/** TOC entries whose file is absent — they would render as an empty chapter. */
export function orphanTocEntries(filesOnDisk: readonly string[]): string[] {
  const present = new Set(filesOnDisk)
  return chapterFiles().filter((f) => !present.has(f))
}
