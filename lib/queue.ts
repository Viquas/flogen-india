// Simple in-memory generation queue
// For production, use Trigger.dev or similar

import { generateAndSaveWebsite } from '@/lib/ai/generator'

interface QueueItem {
    projectId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    createdAt: Date
}

class GenerationQueue {
    private queue: QueueItem[] = []
    private isProcessing = false
    private maxConcurrent = 3

    add(projectId: string) {
        this.queue.push({
            projectId,
            status: 'pending',
            createdAt: new Date(),
        })
        this.process()
    }

    addBatch(projectIds: string[]) {
        projectIds.forEach(id => this.add(id))
    }

    private async process() {
        if (this.isProcessing) return

        this.isProcessing = true

        while (this.queue.some(item => item.status === 'pending')) {
            const pendingItems = this.queue.filter(item => item.status === 'pending')
            const processingItems = this.queue.filter(item => item.status === 'processing')

            if (processingItems.length >= this.maxConcurrent) {
                // Wait a bit before checking again
                await new Promise(resolve => setTimeout(resolve, 1000))
                continue
            }

            const item = pendingItems[0]
            if (!item) break

            item.status = 'processing'

            // Process in background
            generateAndSaveWebsite(item.projectId)
                .then(() => {
                    item.status = 'completed'
                })
                .catch((error) => {
                    console.error(`Generation failed for ${item.projectId}:`, error)
                    item.status = 'failed'
                })
        }

        this.isProcessing = false
    }

    getStatus() {
        return {
            pending: this.queue.filter(i => i.status === 'pending').length,
            processing: this.queue.filter(i => i.status === 'processing').length,
            completed: this.queue.filter(i => i.status === 'completed').length,
            failed: this.queue.filter(i => i.status === 'failed').length,
        }
    }
}

// Singleton instance
export const generationQueue = new GenerationQueue()
