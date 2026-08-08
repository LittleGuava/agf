/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * The manual's visual contract: fonts, heading scale, code and quote treatment, list numbering.
 *
 * WHY separated from the renderer: blocks-to-docx.ts is about structure — which block becomes
 * which element. This module is about appearance. Keeping them apart means restyling the
 * manual never risks changing what it says, and the renderer stays readable.
 *
 * Font choices are deliberately conservative: a manual is read on machines we do not control,
 * and a missing font silently reflows a 200-page document. Calibri and Consolas ship with
 * Word on both Windows and macOS; Cambria is the paired serif for headings.
 *
 * Units gotcha: docx sizes are half-points (24 = 12pt) and spacing is twips (240 = 12pt).
 *
 * @see blocks-to-docx.ts — the only consumer
 */

import { AlignmentType, LevelFormat, convertInchesToTwip } from 'docx'

export const BODY_FONT = 'Calibri'
export const HEADING_FONT = 'Cambria'
export const CODE_FONT = 'Consolas'

/** Reference name the renderer cites to start an ordered list. */
export const ORDERED_LIST_REFERENCE = 'manual-ordered'

/** Light grey behind code and table headers — readable in print and on screen. */
export const CODE_SHADING = 'F2F2F2'
export const TABLE_HEADER_SHADING = 'E7EEF7'
export const ACCENT_COLOR = '1F4E79'

/** Document-wide styles. Heading levels map to Word's built-ins so the TOC field can find them. */
export const MANUAL_STYLES = {
  default: {
    document: {
      run: { font: BODY_FONT, size: 21 },
      paragraph: { spacing: { after: 120, line: 276 } },
    },
    heading1: {
      run: { font: HEADING_FONT, size: 36, bold: true, color: ACCENT_COLOR },
      paragraph: { spacing: { before: 360, after: 200 }, keepNext: true },
    },
    heading2: {
      run: { font: HEADING_FONT, size: 28, bold: true, color: ACCENT_COLOR },
      paragraph: { spacing: { before: 280, after: 140 }, keepNext: true },
    },
    heading3: {
      run: { font: HEADING_FONT, size: 24, bold: true },
      paragraph: { spacing: { before: 220, after: 120 }, keepNext: true },
    },
    heading4: {
      run: { font: HEADING_FONT, size: 22, bold: true, italics: true },
      paragraph: { spacing: { before: 180, after: 100 }, keepNext: true },
    },
  },
  paragraphStyles: [
    {
      id: 'ManualCode',
      name: 'Manual Code',
      basedOn: 'Normal',
      quickFormat: false,
      run: { font: CODE_FONT, size: 18 },
      paragraph: { spacing: { before: 0, after: 0, line: 240 }, keepLines: true },
    },
    {
      id: 'ManualQuote',
      name: 'Manual Quote',
      basedOn: 'Normal',
      quickFormat: false,
      run: { italics: true, color: '444444' },
      paragraph: {
        spacing: { before: 160, after: 160 },
        indent: { left: convertInchesToTwip(0.35) },
      },
    },
    {
      id: 'ManualCover',
      name: 'Manual Cover',
      basedOn: 'Normal',
      quickFormat: false,
      run: { font: HEADING_FONT, size: 56, bold: true, color: ACCENT_COLOR },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 } },
    },
    {
      id: 'ManualCaption',
      name: 'Manual Caption',
      basedOn: 'Normal',
      quickFormat: false,
      run: { size: 18, italics: true, color: '666666' },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 60, after: 200 } },
    },
  ],
}

/** Ordered-list numbering. Unordered lists use docx's built-in bullet and need no config. */
export const MANUAL_NUMBERING = {
  config: [
    {
      reference: ORDERED_LIST_REFERENCE,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.22) },
            },
          },
        },
      ],
    },
  ],
}
