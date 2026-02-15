"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

interface ProjectDataViewerProps {
    businessData: {
        businessName: string
        description?: string
        services?: string[]
        contactInfo?: Record<string, string>
    }
}

export function ProjectDataViewer({ businessData }: ProjectDataViewerProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(JSON.stringify(businessData, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-semibold"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <ChevronDown className="mr-2 h-4 w-4" />
                        ) : (
                            <ChevronRight className="mr-2 h-4 w-4" />
                        )}
                        <CardTitle className="text-base">Business Data</CardTitle>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="space-y-3">
                        <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</h4>
                            <p className="text-sm font-medium">{businessData.businessName}</p>
                        </div>
                        {businessData.description && (
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</h4>
                                <p className="text-sm">{businessData.description}</p>
                            </div>
                        )}
                        {businessData.services && businessData.services.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Services</h4>
                                <ul className="text-sm list-disc list-inside">
                                    {businessData.services.map((service, idx) => (
                                        <li key={idx}>{service}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {businessData.contactInfo && (
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</h4>
                                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(businessData.contactInfo, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
