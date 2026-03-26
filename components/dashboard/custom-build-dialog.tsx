"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Wrench, Sparkles, Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Tab = "url" | "data"

export function CustomBuildDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("url")
  const [urlValue, setUrlValue] = useState("")
  const [dataValue, setDataValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === "string") {
        setDataValue(text)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-selected
    e.target.value = ""
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const endpoint =
        activeTab === "url"
          ? "/api/custom-build/from-url"
          : "/api/custom-build/from-data"

      const payload =
        activeTab === "url"
          ? { url: urlValue }
          : { data: dataValue }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setOpen(false)
        setUrlValue("")
        setDataValue("")
        toast.success("Starting generation...")
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error || "Something went wrong")
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Network error",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled =
    isSubmitting ||
    (activeTab === "url" && !urlValue.trim()) ||
    (activeTab === "data" && !dataValue.trim())

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Wrench className="h-4 w-4" />
        Custom Build
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Custom Build</DialogTitle>
            <DialogDescription>
              Generate a website from a Google Maps URL or business data
            </DialogDescription>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                activeTab === "url"
                  ? "bg-white shadow-sm text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Google Maps URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
                activeTab === "data"
                  ? "bg-white shadow-sm text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Upload Business Data
            </button>
          </div>

          {/* Tab content */}
          <div className="space-y-3">
            {activeTab === "url" ? (
              <Input
                type="url"
                placeholder="https://maps.google.com/maps/place/..."
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isDisabled) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
            ) : (
              <>
                <textarea
                  className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Paste business info as JSON or plain text..."
                  value={dataValue}
                  onChange={(e) => setDataValue(e.target.value)}
                />
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Website
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
