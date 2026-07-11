'use client'

import { useEffect, useMemo, useRef } from 'react'
import Map, { Marker, Source, Layer, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { MapPin } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'

// Register the pmtiles:// protocol once, at module load. This file is 'use client'
// and only ever loaded via a dynamic ssr:false import, so this runs on the client.
if (typeof window !== 'undefined' && !(maplibregl as unknown as { __pmtilesRegistered?: boolean }).__pmtilesRegistered) {
    maplibregl.addProtocol('pmtiles', new Protocol().tile)
    ;(maplibregl as unknown as { __pmtilesRegistered?: boolean }).__pmtilesRegistered = true
}

export interface AreaSelection {
    lat: number
    lng: number
    radiusKm: number
}

interface DiscoveryMapProps {
    value: AreaSelection | null
    onChange: (sel: AreaSelection | null) => void
    /** Radius in km, controlled by the parent's slider. */
    radiusKm: number
    className?: string
}

// Free, no-key vector basemap. If it ever rate-limits, swap for a MapTiler key.
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

// Australia bounds-ish center.
const INITIAL_VIEW = { longitude: 133.7751, latitude: -25.2744, zoom: 3.4 }

// Optional ABS suburb/postcode boundaries as a PMTiles archive (see
// scripts/build-au-boundaries.md). When unset, the map runs radius-only.
const BOUNDARIES_URL = process.env.NEXT_PUBLIC_AU_BOUNDARIES_PMTILES
const BOUNDARIES_LAYER = process.env.NEXT_PUBLIC_AU_BOUNDARIES_SOURCE_LAYER || 'suburbs'

/** Build a ~circle polygon (GeoJSON) around a point for the radius overlay. */
function circleFeature(lng: number, lat: number, radiusKm: number, points = 64): GeoJSON.Feature {
    const coords: [number, number][] = []
    const distanceX = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
    const distanceY = radiusKm / 110.574
    for (let i = 0; i < points; i++) {
        const theta = (i / points) * 2 * Math.PI
        coords.push([lng + distanceX * Math.cos(theta), lat + distanceY * Math.sin(theta)])
    }
    coords.push(coords[0])
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} }
}

export function DiscoveryMap({ value, onChange, radiusKm, className }: DiscoveryMapProps) {
    const mapRef = useRef<MapRef | null>(null)
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    // Keep the GL canvas matched to the wrapper. The dynamic import can mount the
    // map before the flex layout settles, freezing the canvas at a stale width.
    useEffect(() => {
        const el = wrapperRef.current
        if (!el) return
        const ro = new ResizeObserver(() => mapRef.current?.resize())
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const handleClick = (e: MapLayerMouseEvent) => {
        onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng, radiusKm })
    }

    const circle = useMemo(
        () => (value ? circleFeature(value.lng, value.lat, value.radiusKm) : null),
        [value],
    )

    return (
        <div className={className} ref={wrapperRef}>
            <Map
                ref={mapRef}
                mapStyle={BASEMAP_STYLE}
                initialViewState={INITIAL_VIEW}
                onClick={handleClick}
                onLoad={(e) => {
                    // The dynamic import can mount the map before the flex container
                    // has its final width; resize once layout has settled.
                    const m = e.target
                    requestAnimationFrame(() => m.resize())
                    setTimeout(() => m.resize(), 250)
                }}
                cursor="crosshair"
                style={{ width: '100%', height: '100%' }}
                attributionControl={{ compact: true }}
            >
                {/* Optional suburb/postcode boundaries for click-to-select (Phase 2 data). */}
                {BOUNDARIES_URL && (
                    <Source id="au-boundaries" type="vector" url={`pmtiles://${BOUNDARIES_URL}`}>
                        <Layer
                            id="au-boundaries-fill"
                            type="fill"
                            source-layer={BOUNDARIES_LAYER}
                            paint={{ 'fill-color': '#10b981', 'fill-opacity': 0.06 }}
                        />
                        <Layer
                            id="au-boundaries-line"
                            type="line"
                            source-layer={BOUNDARIES_LAYER}
                            paint={{ 'line-color': '#10b981', 'line-opacity': 0.25, 'line-width': 0.5 }}
                        />
                    </Source>
                )}

                {/* Radius overlay */}
                {circle && (
                    <Source id="radius" type="geojson" data={circle}>
                        <Layer id="radius-fill" type="fill" paint={{ 'fill-color': '#10b981', 'fill-opacity': 0.15 }} />
                        <Layer id="radius-line" type="line" paint={{ 'line-color': '#059669', 'line-width': 2 }} />
                    </Source>
                )}

                {value && (
                    <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
                        <MapPin className="h-6 w-6 text-emerald-600 drop-shadow" fill="#10b981" />
                    </Marker>
                )}
            </Map>
        </div>
    )
}
