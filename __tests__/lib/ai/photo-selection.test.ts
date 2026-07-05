import { describe, it, expect } from 'vitest'
import { rankPhotos, buildPhotoMediaUrl } from '@/lib/ai/photo-selection'

describe('rankPhotos', () => {
  it('returns an empty array for no photos', () => {
    expect(rankPhotos([])).toEqual([])
  })

  it('ranks higher-resolution photos first', () => {
    const photos = [
      { name: 'places/1/photos/low', widthPx: 400, heightPx: 300 },
      { name: 'places/1/photos/high', widthPx: 4000, heightPx: 3000 },
    ]
    const result = rankPhotos(photos)
    expect(result[0].url).toContain('high')
  })

  it('prefers landscape aspect ratio over portrait at similar resolution', () => {
    const photos = [
      { name: 'places/1/photos/portrait', widthPx: 1200, heightPx: 1600 },
      { name: 'places/1/photos/landscape', widthPx: 1600, heightPx: 1200 },
    ]
    const result = rankPhotos(photos)
    expect(result[0].url).toContain('landscape')
  })

  it('excludes photos below the minimum resolution floor (800px width)', () => {
    const photos = [
      { name: 'places/1/photos/tiny', widthPx: 200, heightPx: 150 },
      { name: 'places/1/photos/good', widthPx: 1200, heightPx: 900 },
    ]
    const result = rankPhotos(photos)
    expect(result.length).toBe(1)
    expect(result[0].url).toContain('good')
  })
})

describe('buildPhotoMediaUrl (proxy URLs — never expose the Places API key)', () => {
  it('builds a proxy URL with the encoded photo name and width', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz', 1200)
    expect(url).toContain('/api/photos?name=places%2Fabc123%2Fphotos%2Fxyz')
    expect(url).toContain('w=1200')
  })

  it('defaults width to 1600 when not provided', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz')
    expect(url).toContain('w=1600')
  })

  it('never embeds an API key in the URL', () => {
    const url = buildPhotoMediaUrl('places/abc123/photos/xyz')
    expect(url).not.toContain('key=')
    expect(url).not.toContain('googleapis.com')
  })
})
