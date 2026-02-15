const { generateText } = require('ai')
const { openai } = require('@ai-sdk/openai')
require('dotenv').config({ path: '.env.local' })

const SYSTEM_PROMPT = `You are an expert React Developer specializing in creating beautiful, modern landing pages.
Output ONLY the complete TypeScript/React code, no explanations.`

async function test() {
    console.log('Testing AI Generation...')
    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: SYSTEM_PROMPT,
            prompt: 'Create a simple landing page for a tech company.',
        })
        console.log('Success! Generated code length:', text.length)
        console.log('First 100 chars:', text.substring(0, 100))
    } catch (err) {
        console.error('Generation failed:', err)
    }
}

test()
