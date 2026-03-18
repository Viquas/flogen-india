'use client'

import { useState, useCallback } from 'react'
import { X } from 'lucide-react'

export interface BookingPreferences {
    serviceTypes: string[]
    availableDays: string[]
    hours: { start: string; end: string }
    bufferMinutes: number
}

interface BookingSetupProps {
    values: BookingPreferences | null
    onChange: (prefs: BookingPreferences) => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DEFAULT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const BUFFER_OPTIONS = [0, 15, 30, 45, 60]

function getDefaults(): BookingPreferences {
    return {
        serviceTypes: [],
        availableDays: [...DEFAULT_DAYS],
        hours: { start: '09:00', end: '17:00' },
        bufferMinutes: 15,
    }
}

export function BookingSetup({ values, onChange }: BookingSetupProps) {
    const prefs = values || getDefaults()
    const [newService, setNewService] = useState('')

    const update = useCallback(
        (partial: Partial<BookingPreferences>) => {
            onChange({ ...prefs, ...partial })
        },
        [prefs, onChange]
    )

    const addService = useCallback(() => {
        const trimmed = newService.trim()
        if (!trimmed || prefs.serviceTypes.length >= 10) return
        if (prefs.serviceTypes.includes(trimmed)) return

        update({ serviceTypes: [...prefs.serviceTypes, trimmed] })
        setNewService('')
    }, [newService, prefs.serviceTypes, update])

    const removeService = useCallback(
        (index: number) => {
            update({ serviceTypes: prefs.serviceTypes.filter((_, i) => i !== index) })
        },
        [prefs.serviceTypes, update]
    )

    const toggleDay = useCallback(
        (day: string) => {
            const current = prefs.availableDays
            const updated = current.includes(day)
                ? current.filter((d) => d !== day)
                : [...current, day]
            update({ availableDays: updated })
        },
        [prefs.availableDays, update]
    )

    return (
        <div
            className="rounded-xl border p-5"
            style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFBFC' }}
        >
            <h3 className="text-base font-semibold" style={{ color: '#0F172A' }}>
                Booking System Setup
            </h3>
            <p className="mb-5 text-xs" style={{ color: '#9CA3AF' }}>
                Configure your online appointment scheduling
            </p>

            <div className="space-y-5">
                {/* Service types */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>
                        Service Types
                    </label>

                    {/* Tags */}
                    {prefs.serviceTypes.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {prefs.serviceTypes.map((service, index) => (
                                <span
                                    key={service}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                                    style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}
                                >
                                    {service}
                                    <button
                                        type="button"
                                        onClick={() => removeService(index)}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100"
                                        aria-label={`Remove ${service}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addService()
                                }
                            }}
                            placeholder="e.g., Consultation"
                            className="flex-1 rounded-lg border px-3 py-2 text-sm"
                            style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                            maxLength={100}
                            disabled={prefs.serviceTypes.length >= 10}
                        />
                        <button
                            type="button"
                            onClick={addService}
                            disabled={!newService.trim() || prefs.serviceTypes.length >= 10}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                            style={{ backgroundColor: '#2563EB' }}
                        >
                            Add
                        </button>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>
                        {prefs.serviceTypes.length}/10 services
                    </p>
                </div>

                {/* Available days */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>
                        Available Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map((day) => {
                            const isSelected = prefs.availableDays.includes(day)
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(day)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                    style={{
                                        backgroundColor: isSelected ? '#2563EB' : '#F3F4F6',
                                        color: isSelected ? '#FFFFFF' : '#374151',
                                    }}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Business hours */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>
                        Business Hours
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="time"
                            value={prefs.hours.start}
                            onChange={(e) =>
                                update({ hours: { ...prefs.hours, start: e.target.value } })
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                            style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                        />
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                            to
                        </span>
                        <input
                            type="time"
                            value={prefs.hours.end}
                            onChange={(e) =>
                                update({ hours: { ...prefs.hours, end: e.target.value } })
                            }
                            className="rounded-lg border px-3 py-2 text-sm"
                            style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                        />
                    </div>
                </div>

                {/* Buffer time */}
                <div>
                    <label
                        htmlFor="buffer-time"
                        className="mb-1.5 block text-sm font-medium"
                        style={{ color: '#374151' }}
                    >
                        Buffer Between Appointments
                    </label>
                    <select
                        id="buffer-time"
                        value={prefs.bufferMinutes}
                        onChange={(e) => update({ bufferMinutes: Number(e.target.value) })}
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                    >
                        {BUFFER_OPTIONS.map((min) => (
                            <option key={min} value={min}>
                                {min === 0 ? 'No buffer' : `${min} minutes`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}
