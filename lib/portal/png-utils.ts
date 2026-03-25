/**
 * Zero-dependency PNG alpha channel detection.
 * Reads the IHDR chunk color type byte to determine if alpha is present.
 */

/** PNG file signature bytes */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]

/**
 * Detect whether a PNG buffer has an alpha channel.
 *
 * PNG color types at byte offset 25:
 * - 0: Grayscale
 * - 2: RGB
 * - 3: Indexed (palette)
 * - 4: Grayscale + Alpha
 * - 6: RGBA
 *
 * Bit 2 (value 4) indicates alpha channel presence.
 *
 * @returns true if PNG with alpha channel, false for non-PNG or no alpha
 */
export function pngHasAlpha(buffer: Buffer | Uint8Array): boolean {
    // Need at least 26 bytes for PNG signature + IHDR color type
    if (buffer.length < 26) return false

    // Verify PNG signature
    for (let i = 0; i < 4; i++) {
        if (buffer[i] !== PNG_SIGNATURE[i]) return false
    }

    // Color type is at byte offset 25 in the IHDR chunk
    const colorType = buffer[25]

    // Bit 2 (value 4) indicates alpha channel
    return (colorType & 4) !== 0
}
