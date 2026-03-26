// Barrel re-export — maintains backward compatibility for all consumers.
// Each domain file has its own "use server" directive.

// Project CRUD & queries
export {
    getProjectsByDate,
    getProjectById,
    getRecentProjects,
    searchProjects,
    approveProject,
    deployProjects,
    saveEditModeChanges,
} from './actions/project-actions'

// Generation & queue
export {
    resetStuckProjects,
    regenerateProject,
    regenerateProjects,
    stopAllQueuedProcesses,
} from './actions/generation-actions'

// Auto-fix
export {
    fixWebsiteErrors,
    autoFixAllErrors,
    getErrorProjectCount,
} from './actions/fix-actions'

// Batch management
export {
    getBatches,
    updateBatchAssignee,
    getMonthActivityCounts,
} from './actions/batch-actions'

// Autopilot pipeline
export {
    runAutopilot,
    resumeAutopilot,
    getAutopilotProgress,
    getActiveAutopilotRuns,
} from './actions/autopilot-actions'

// Templates
export {
    saveTemplate,
    saveCleanedTemplate,
    getTemplates,
    getTemplateById,
    deleteTemplate,
    getTemplateVersionHistory,
    restoreTemplateVersion,
} from './actions/template-actions'

// Revisions
export {
    getProjectRevisions,
    restoreProjectRevision,
} from './actions/revision-actions'

// Analytics
export {
    getCostStats,
} from './actions/analytics-actions'
