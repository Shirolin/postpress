/**
 * Stand-in for `modern-screenshot`, aliased in `tests/env/render.ts`.
 *
 * The real rasterizer needs a canvas and an image-decode pipeline, neither of
 * which exists in Node, so the export engine could not be reached at all with
 * the real one — and the tests that claimed to cover it called a hand-written
 * copy of the rasterizer instead, which is why a broken export filter went
 * unnoticed. Aliasing the module puts the real engine back on the hook:
 * `renderCardToBlob` runs unmodified and whatever it hands the rasterizer is
 * what these record.
 *
 * Reach this through `loadModule` in a test, not through a relative import —
 * the SSR module graph holds the instance the production code sees.
 */
export interface RasterizerCall {
  /** The node the engine asked to have rasterized. */
  target: unknown;
  options: Record<string, any>;
}

export const rasterizerCalls: RasterizerCall[] = [];

let failure: string | null = null;
let nextSize: number | null = null;

/** Makes the next rasterization reject, the way a browser failure would. */
export function failNextRasterization(message: string): void {
  failure = message;
}

/**
 * The first bytes of each format's container; a blob without them holds no
 * picture. The engine dispatches on the requested type now that format is a
 * preference, so a stub that only ever wrote PNG bytes would make a JPEG export
 * look like an empty canvas.
 */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
/** `RIFF` <size> `WEBP`; the size bytes are left zero, which is legal. */
const WEBP_SIGNATURE = [
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
];

function signatureFor(type: string): number[] {
  if (type === 'image/jpeg') return JPEG_SIGNATURE;
  if (type === 'image/webp') return WEBP_SIGNATURE;
  return PNG_SIGNATURE;
}

/**
 * Makes the next rasterization return a Blob with no picture in it.
 *
 * Two shapes, because the real engine produces two. At scale 1 the `data:,`
 * fallback decodes to zero bytes. At every other scale `domToBlob` rebuilds the
 * blob through `changePngDpi`, which lays a 54-byte header over an empty source
 * -- still `image/png`, still truthy, still no PNG signature. The default is
 * the 54-byte one, because that is the shape the shipped scale (2) produces.
 */
export function failNextRasterizationWithEmptyBlob(size = 54): void {
  nextSize = size;
  nextBlob = 'empty';
}

/** Overrides the next successful Blob's size, in bytes. */
export function setNextBlobSize(size: number): void {
  nextSize = size;
}

/** The next blob is a plausible PNG, not the empty shape. */
let nextBlob: 'png' | 'empty' = 'png';

export function resetRasterizer(): void {
  rasterizerCalls.length = 0;
  failure = null;
  nextSize = null;
  nextBlob = 'png';
}

export async function domToBlob(target: unknown, options: Record<string, any> = {}): Promise<Blob> {
  rasterizerCalls.push({ target, options });

  // Before the failure injection, which is what a real rasterizer does: its
  // first statement is the guard that hands the DOM back. A stub that failed
  // first made "the export threw" and "the rasterizer was reached" different
  // observations, so a test had to ask the call log which one had happened.
  if (!options.scale) return new Blob([], { type: options.type || 'image/png' });

  if (failure) {
    const message = failure;
    failure = null;
    throw new Error(message);
  }

  // Read only by a rasterizing call: a measurement that arrives between the
  // injection and the export must not spend it, and the engine's own readout
  // does exactly that on every mounted card.
  const signature = signatureFor(options.type || 'image/png');
  // At least the signature's own length: WebP's is 12 bytes, and a default of
  // 8 would make a perfectly real render look like the empty-canvas shape.
  const size = nextSize ?? Math.max(8, signature.length);
  const shape = nextBlob;
  nextSize = null;
  nextBlob = 'png';

  const bytes = new Uint8Array(size);
  if (shape === 'png' && size >= signature.length) {
    // A real picture starts with its format's signature; the engine checks for
    // it, so a stub that filled the blob with zeroes would look like the
    // empty-canvas shape.
    bytes.set(signature, 0);
  }
  return new Blob([bytes], { type: options.type || 'image/png' });
}
