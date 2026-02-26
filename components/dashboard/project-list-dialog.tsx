"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getProjectsByDate } from "@/app/dashboard/actions"
import { Loader2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProjectListDialogProps {
    date: string | null
    isOpen: boolean
    onClose: () => void
}

export function ProjectListDialog({ date, isOpen, onClose }: ProjectListDialogProps) {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [confirmingProject, setConfirmingProject] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        if (isOpen && date) {
            fetchProjects()
        } else {
            setProjects([])
            setConfirmingProject(null)
        }
    }, [isOpen, date])

    const fetchProjects = async () => {
        if (!date) return
        setLoading(true)
        const result = await getProjectsByDate(date)
        if (result.success) {
            setProjects(result.data || [])
        }
        setLoading(false)
    }

    const handleProjectClick = (project: any) => {
        setConfirmingProject(project)
    }

    const handleConfirmOpenEditor = () => {
        if (confirmingProject) {
            router.push(`/editor?id=${confirmingProject.id}`)
            onClose()
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Projects for {date ? format(parseISO(date), "MMMM d, yyyy") : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : projects.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">No projects found for this date.</p>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-auto pr-2">
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => handleProjectClick(project)}
                                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
                                    >
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                {project.business_data?.businessName || project.business_data?.brandIdentity?.core?.brandName || "Untitled Project"}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {project.business_data?.industry || "Industrial"} • {format(parseISO(project.created_at), "h:mm a")}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={!!confirmingProject} onOpenChange={(open) => !open && setConfirmingProject(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Open Editor</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Do you want to open the editor for <span className="font-semibold">"{confirmingProject?.business_data?.businessName}"</span>?
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setConfirmingProject(null)}>
                            No
                        </Button>
                        <Button onClick={handleConfirmOpenEditor} className="bg-blue-600 hover:bg-blue-700">
                            Yes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
