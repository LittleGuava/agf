/*!
 * SPDX-License-Identifier: Apache-2.0
 * Copyright © 2026 Diego Lima Nogueira de Paula
 *
 * Intrinsic pixel size of a PNG or JPEG, read from the bytes themselves.
 *
 * WHY this exists at all: docx cannot place an image without explicit dimensions — it has no
 * layout engine to ask. Guessing a fixed size stretches every screenshot to the same aspect
 * ratio, which is exactly the kind of defect nobody notices until the document is printed.
 * Reading the header is a dozen lines and removes the guess.
 *
 * WHY not an image library: the two facts needed (width, height) live in fixed positions of
 * the PNG IHDR chunk and in the JPEG SOF marker. Pulling a dependency in to read four integers
 * would be the larger cost, and this runs at build time on files we ship.
 *
 * @see blocks-to-docx.ts — consumes the result via ResolvedImage
 * @see ../../../scripts/gen-manual-docx.mts — reads the file and applies page-width scaling
 *
 * Pure — takes bytes, returns numbers. No I/O.
 */

/** What the renderer needs to place a picture. */
export interface ImageDimensions {
  width: number
  height: number
  type: 'png' | 'jpg'
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Markers that are not frame headers even though they sit in the SOF range. */
const NON_SOF = new Set([0xc4, 0xc8, 0xcc])

/** PNG keeps width and height as big-endian 32-bit ints at fixed offsets in the IHDR chunk. */
function readPng(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return null
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), type: 'png' }
}

/** JPEG requires walking the marker chain until a start-of-frame carries the size. */
function readJpeg(bytes: Buffer): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    if (marker >= 0xc0 && marker <= 0xcf && !NON_SOF.has(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7), type: 'jpg' }
    }
    offset += 2 + bytes.readUInt16BE(offset + 2)
  }
  return null
}

/** Reads the intrinsic size, or null when the bytes are neither PNG nor JPEG. */
export function imageDimensions(bytes: Buffer): ImageDimensions | null {
  return readPng(bytes) ?? readJpeg(bytes)
}

/**
 * Scales an image down to the printable text column, never up — enlarging a screenshot past
 * its native resolution turns crisp text into mush, which is the whole point of the figure.
 */
export function fitToWidth(size: ImageDimensions, maxWidth: number): { width: number; height: number } {
  if (size.width <= maxWidth) return { width: size.width, height: size.height }
  const ratio = maxWidth / size.width
  return { width: maxWidth, height: Math.round(size.height * ratio) }
}
