/**
 * Type definitions for Google Places API responses.
 * Replaces `any` typing in discovery routes.
 */

export interface GooglePlace {
  id: string
  displayName?: { text: string; languageCode?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  rating?: number
  websiteUri?: string
  types?: string[]
  location?: { latitude: number; longitude: number }
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
}

export interface PlacesSearchResponse {
  places: GooglePlace[]
  nextPageToken?: string
}

export interface BusinessDataFromPlace {
  placeId: string | null
  businessName: string
  description: string
  services: string[]
  contactInfo: {
    address: string
    phone: string
    website: string
  }
  internationalPhoneNumber: string | null
  nationalPhoneNumber: string | null
  industry: string
}
