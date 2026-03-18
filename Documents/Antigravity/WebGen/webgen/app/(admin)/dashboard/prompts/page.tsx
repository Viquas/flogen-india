import { getPromptVersions } from './actions'
import { PromptVersionList } from './prompt-version-list'

export default async function PromptsPage() {
    const versionsByName = await getPromptVersions()

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Prompt Versions</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage system prompt versions. The active version is used for all new generations.
                </p>
            </div>

            <PromptVersionList initialVersions={versionsByName} />
        </div>
    )
}
