import { openai, createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'

// Configure OpenRouter if key is present
export const openrouter = createOpenAI({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
})

// Select model based on available keys
export const getModel = (modelId?: string) => {
    // If a specific model is requested
    if (modelId && modelId !== 'default') {
        // Google Gemini models
        if (modelId.startsWith('gemini-')) {
            return google(modelId)
        }
        // OpenAI models
        if (modelId.startsWith('gpt-') || modelId.startsWith('o3-')) {
            return openai(modelId)
        }
        // OpenRouter models (if key exists)
        if (process.env.OPENROUTER_API_KEY) {
            return openrouter(modelId)
        }
    }

    // Default: Google Gemini 3.1 Pro
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return google('gemini-3-flash-preview')
    }
    // Fallback to OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        return openrouter('moonshotai/kimi-k2.5')
    }
    return openai('o3')
}
