'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Map, { Marker, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { SalesStatus } from '@/lib/sales/get-leads'

export interface MapLead {
    id: string
    businessName: string
    lat: number
    lng: number
    salesStatus: SalesStatus
    phone: string | null
    industry: string | null
}

const STATUS_COLOR: Record<SalesStatus, string> = {
    new: '#9ca3af',
    attempted: '#3b82f6',
    in_conversation: '#6366f1',
    interested: '#f59e0b',
    closed: '#10b981',
    not_interested: '#ef4444',
    do_not_call: '#b91c1c',
}

const STATUS_LABEL: Record<SalesStatus, string> = {
    new: 'New',
    attempted: 'Attempted',
    in_conversation: 'In conversation',
    interested: 'Interested',
    closed: 'Closed',
    not_interested: 'Not interested',
    do_not_call: 'Do not call',
}

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

function initialView(leads: MapLead[]) {
    if (leads.length === 0) return { longitude: 133.7751, latitude: -25.2744, zoom: 3.4 }
    const lng = leads.reduce((s, l) => s + l.lng, 0) / leads.length
    const lat = leads.reduce((s, l) => s + l.lat, 0) / leads.length
    return { longitude: lng, latitude: lat, zoom: 9 }
}

export function LeadsMap({ leads }: { leads: MapLead[] }) {
    const router = useRouter()
    const [active, setActive] = useState<MapLead | null>(null)

    return (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="h-[600px] w-full">
                <Map
                    mapStyle={BASEMAP_STYLE}
                    initialViewState={initialView(leads)}
                    onLoad={(e) => {
                        const m = e.target
                        requestAnimationFrame(() => m.resize())
                        setTimeout(() => m.resize(), 250)
                    }}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={{ compact: true }}
                >
                    {leads.map((lead) => (
                        <Marker
                            key={lead.id}
                            longitude={lead.lng}
                            latitude={lead.lat}
                            anchor="center"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation()
                                setActive(lead)
                            }}
                        >
                            <span
                                className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow cursor-pointer"
                                style={{ background: STATUS_COLOR[lead.salesStatus] }}
                                title={lead.businessName}
                            />
                        </Marker>
                    ))}

                    {active && (
                        <Popup
                            longitude={active.lng}
                            latitude={active.lat}
                            anchor="bottom"
                            offset={14}
                            onClose={() => setActive(null)}
                            closeButton
                            closeOnClick={false}
                        >
                            <div className="space-y-1 p-0.5">
                                <p className="font-semibold text-gray-900 text-sm">{active.businessName}</p>
                                {active.industry && <p className="text-xs text-gray-500">{active.industry}</p>}
                                {active.phone && <p className="text-xs text-gray-600">{active.phone}</p>}
                                <div className="flex items-center gap-1.5 pt-0.5">
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ background: STATUS_COLOR[active.salesStatus] }}
                                    />
                                    <span className="text-[11px] text-gray-500">{STATUS_LABEL[active.salesStatus]}</span>
                                </div>
                                <button
                                    onClick={() => router.push(`/sales/leads/${active.id}`)}
                                    className="mt-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    Open lead →
                                </button>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 px-4 py-2.5">
                {(Object.keys(STATUS_LABEL) as SalesStatus[]).map((s) => (
                    <span key={s} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                        {STATUS_LABEL[s]}
                    </span>
                ))}
            </div>
        </div>
    )
}
