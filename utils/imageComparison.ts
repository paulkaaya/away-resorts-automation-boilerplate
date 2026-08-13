import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Compares two PNG screenshot buffers and returns whether they're visually equivalent.
 * @param a - The first screenshot buffer (PNG-encoded).
 * @param b - The second screenshot buffer (PNG-encoded).
 * @param maxDiffPixels - The maximum number of differing pixels to still count as a match.
 * @param threshold - Matching threshold, ranges from 0 to 1. Smaller values make the comparison more sensitive. 0.05 by default.
 * @returns True if the images have the same dimensions and differ by at most `maxDiffPixels`.
 */
export function screenshotsMatch(
  a: Buffer,
  b: Buffer,
  maxDiffPixels: number = 10,
  threshold: number = 0.05
): boolean {
  const imageA = PNG.sync.read(a);
  const imageB = PNG.sync.read(b);

  if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
    return false;
  }

  const diffPixels = pixelmatch(imageA.data, imageB.data, undefined, imageA.width, imageA.height, {
    threshold: threshold,
  });

  return diffPixels <= maxDiffPixels;
}
