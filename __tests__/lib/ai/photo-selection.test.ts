import { describe, it, expect } from 'vitest'
import { rankPhotos, buildPhotoMediaUrl } from '@/lib/ai/photo-selection'

describe('rankPhotos', () => {
  it('returns an empty array for no photos', () => {
    expect(rankPhotos([], 'fake-key')).toEqual([])
  })

  it('ranks higher-resolution photos first', () => {
    const photos = [
      { name: 'places/1/photos/low', widthPx: 400, heightPx: 300 },
      { name: 'places/1/photos/high', widthPx: 4000, heightPx: 3000 },
    ]
    const result = rankPhotos(photos, 'fake-key')
    expect(result[0].url).toContain('high')
  })

  it('prefers landscape aspect ratio over portrait at similar resolution', () => {
    const photos = [
      { name: 'places/1/photos/portrait', widthPx: 1200, heightPx: 1600 },
      { name: 'places/1/photos/landscape', widthPx: 1600, heightPx: 1200 },
    ]
    const result = rankPhotos(photos, 'fake-key')
    expect(result[0].url).toContain('landscape')
  })

  it('excludes photos below the minimum resolution floor (800px width)', () => {
    const photos = [
      { name: 'places/1/photos/tiny', widthPx: 200, heightPx: 150 },
      { name: 'places/1/photos/good', widthPx: 1200, heightPx: 900 },
    ]
    const result = rankPhotos(photos, 'fake-key')
    expect(result.length).toBe(1)
    expect(result[0].url).toContain('good')
  })
})

describe('buildPhotoMediaUrl', () => {
  it('builds a valid Places Photo Media API URL', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz', 'fake-key', 1200)
    expect(url).toContain('places/abc123/photos/xyz/media')
    expect(url).toContain('key=fake-key')
    expect(url).toContain('maxWidthPx=1200')
  })

  it('defaults maxWidthPx to 1600 when not provided', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz', 'fake-key')
    expect(url).toContain('maxWidthPx=1600')
  })
})
