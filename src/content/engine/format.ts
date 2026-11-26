/**
 * What an export's file format means to the engine: the MIME type handed to the
 * rasterizer, the extension the download carries, and whether the format can
 * hold transparency.
 *
 * One table rather than three switches. The rasterizer's `type`, the filename's
 * extension and the empty-picture check all answer the same question, and the
 * three used to answer it in different files -- the engine said `image/png`,
 * `filename.ts` said `png`, and `verifyRenderedBlob` checked the PNG signature.
 * A format added to one of them and not the others produces a file whose bytes,
 * name and validation disagree.
 */

import type { ExportFormat } from '../../types/card.ts';

export interface FormatSpec {
  /** What `canvas.toBlob` and `ClipboardItem` call this format. */
  readonly mime: string;
  /** The download's extension, without the dot. */
  readonly extension: string;
  /**
   * True when the format throws transparency away.
   *
   * JPEG has no alpha channel at all; WebP may have one but the card's mat can
   * still be a shape with nothing painted behind it. Both are encoded with an
   * opaque fill, so a transparent corner does not become black.
   */
  readonly lossy: boolean;
}

const FORMAT_SPECS: Record<ExportFormat, FormatSpec> = {
  png: { mime: 'image/png', extension: 'png', lossy: false },
  // `jpg`, not `jpeg`: the shorter spelling is what Windows, macOS and the
  // common image tools show, and it is the one a person types into a search.
  jpeg: { mime: 'image/jpeg', extension: 'jpg', lossy: true },
  webp: { mime: 'image/webp', extension: 'webp', lossy: true },
};

/**
 * The spec for a format, treating an unknown or absent one as PNG.
 *
 * Every stored value is sanitized before it reaches this module, so the
 * fallback is defensive rather than a live case: a format this build does not
 * know must not turn an export into an unstyled blob.
 */
export function formatSpec(format: ExportFormat | null | undefined): FormatSpec {
  return (format && FORMAT_SPECS[format]) || FORMAT_SPECS.png;
}

/** The extension to name a download with for a blob's MIME type. */
export function extensionForMime(mime: string): string {
  const match = Object.values(FORMAT_SPECS).find((spec) => spec.mime === mime);
  return match?.extension ?? FORMAT_SPECS.png.extension;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** How many leading bytes a signature check has to read. */
export function headLength(format: ExportFormat | null | undefined): number {
  const spec = formatSpec(format);
  if (spec.mime === 'image/png') return PNG_SIGNATURE.length;
  if (spec.mime === 'image/jpeg') return 3;
  return 12;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let text = '';
  for (let index = start; index < end; index++) text += String.fromCharCode(bytes[index]);
  return text;
}

/**
 * Whether a blob's first bytes show that the format actually wrote a picture.
 *
 * The rasterizer can hand back a truthy, correctly-typed Blob with no picture
 * in it: empty at scale 1, and a header written over an empty source at other
 * scales. Those bytes match nothing a real encoder writes, so the check is on
 * the format's own container signature rather than on the blob's length -- a
 * very small real picture must still pass.
 */
export function looksLikeImageHead(
  format: ExportFormat | null | undefined,
  head: Uint8Array
): boolean {
  const spec = formatSpec(format);
  if (spec.mime === 'image/jpeg') {
    return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  }
  if (spec.mime === 'image/webp') {
    // RIFF container: `RIFF` <4-byte size> `WEBP` <chunk>.
    return head.length >= 12 && ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP';
  }
  return (
    head.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => head[index] === byte)
  );
}
