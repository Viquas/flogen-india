"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Settings2, Save } from "lucide-react"

export function SettingsDialog() {
    const [rules, setRules] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    // Load rules from localStorage on mount
    useEffect(() => {
        const savedRules = localStorage.getItem("web-factory-rules")
        if (savedRules) {
            setRules(savedRules)
        }
    }, [])

    const handleSave = () => {
        localStorage.setItem("web-factory-rules", rules)
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-zinc-600 hover:text-zinc-900">
                    <Settings2 className="h-4 w-4" />
                    Rules
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Global Agent Rules (rules.md)</DialogTitle>
                    <DialogDescription>
                        These instructions will be followed by the AI agent for every generation and revision.
                        Define your design system, layout rules, and coding standards here.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 py-4">
                    <Textarea
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        placeholder="# Design Rules\n- Use a dark theme by default\n- Use Inter font\n- All buttons should have rounded-full class\n- Spacing should be generous (p-8 or more)"
                        className="h-full font-mono text-sm resize-none bg-zinc-50 border-zinc-200"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Rules
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
