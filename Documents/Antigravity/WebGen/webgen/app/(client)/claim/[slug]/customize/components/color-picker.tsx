'use client'

import { useState, useCallback } from 'react'

interface ColorPickerProps {
    primaryColor: string
    secondaryColor: string
    onChange: (primary: string, secondary: string) => void
}

const PRESET_COLORS = ['#2563EB', '#DC2626', '#16A34A', '#9333EA', '#F59E0B', '#0F172A']
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/

export function ColorPicker({ primaryColor, secondaryColor, onChange }: ColorPickerProps) {
    const [enabled, setEnabled] = useState(primaryColor !== '' || secondaryColor !== '')
    const [prevPrimary, setPrevPrimary] = useState(primaryColor)
    const [prevSecondary, setPrevSecondary] = useState(secondaryColor)

    const handleToggle = useCallback(
        (checked: boolean) => {
            setEnabled(checked)
            if (!checked) {
                onChange('', '')
            } else {
                // Restore previous values or default
                onChange(prevPrimary || '#2563EB', prevSecondary || '#0F172A')
            }
        },
        [onChange, prevPrimary, prevSecondary]
    )

    const handlePrimaryChange = useCallback(
        (value: string) => {
            setPrevPrimary(value)
            onChange(value, secondaryColor)
        },
        [onChange, secondaryColor]
    )

    const handleSecondaryChange = useCallback(
        (value: string) => {
            setPrevSecondary(value)
            onChange(primaryColor, value)
        },
        [onChange, primaryColor]
    )

    const validateHex = useCallback(
        (value: string, setter: (v: string) => void, prev: string) => {
            if (value === '' || HEX_REGEX.test(value)) {
                setter(value)
            } else {
                setter(prev)
            }
        },
        []
    )

    return (
        <div>
            {/* Toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-4">
                <div className="relative">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={enabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                    />
                    <div
                        className="h-6 w-11 rounded-full transition-colors"
                        style={{ backgroundColor: enabled ? '#2563EB' : '#D1D5DB' }}
                    >
                        <div
                            className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                            style={{
                                transform: enabled ? 'translate(22px, 2px)' : 'translate(2px, 2px)',
                            }}
                        />
                    </div>
                </div>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>
                    Customize colors
                </span>
            </label>

            {!enabled && (
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                    Keep current website colors
                </p>
            )}

            {enabled && (
                <div className="space-y-4">
                    {/* Preset swatches */}
                    <div>
                        <p className="mb-2 text-xs font-medium" style={{ color: '#6B7280' }}>
                            Quick pick
                        </p>
                        <div className="flex gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handlePrimaryChange(color)}
                                    className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: color,
                                        outline: primaryColor === color ? '3px solid #2563EB' : 'none',
                                        outlineOffset: '2px',
                                    }}
                                    aria-label={`Set primary color to ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Primary color */}
                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>
                            Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={primaryColor || '#2563EB'}
                                onChange={(e) => handlePrimaryChange(e.target.value)}
                                className="h-10 w-10 cursor-pointer rounded border-0 p-0"
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => handlePrimaryChange(e.target.value)}
                                onBlur={(e) =>
                                    validateHex(e.target.value, handlePrimaryChange, prevPrimary)
                                }
                                placeholder="#2563EB"
                                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                                style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                                maxLength={7}
                            />
                        </div>
                    </div>

                    {/* Secondary color */}
                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>
                            Secondary Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={secondaryColor || '#0F172A'}
                                onChange={(e) => handleSecondaryChange(e.target.value)}
                                className="h-10 w-10 cursor-pointer rounded border-0 p-0"
                            />
                            <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => handleSecondaryChange(e.target.value)}
                                onBlur={(e) =>
                                    validateHex(e.target.value, handleSecondaryChange, prevSecondary)
                                }
                                placeholder="#0F172A"
                                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                                style={{ borderColor: '#D1D5DB', color: '#0F172A' }}
                                maxLength={7}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
