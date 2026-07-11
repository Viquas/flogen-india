'use client'

import dynamic from 'next/dynamic'
import type { MapLead } from './leads-map'

// MapLibre is browser-only — load the map without SSR.
const LeadsMap = dynamic(() => import('./leads-map').then((m) => m.LeadsMap), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
    ),
})

export function LeadsMapView({ leads }: { leads: MapLead[] }) {
    if (leads.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
                No mappable leads yet. Leads discovered from the map carry coordinates; older leads may not.
            </div>
        )
    }
    return <LeadsMap leads={leads} />
}
