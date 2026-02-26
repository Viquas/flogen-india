const { generateText, Output } = require('ai');
const { openai } = require('@ai-sdk/openai');
const { z } = require('zod');
require('dotenv').config({ path: '.env' });

const model = openai('o3-mini');

async function test() {
    console.log("Starting o3-mini revision test...");
    try {
        const { output } = await generateText({
            model: model,
            system: "Return a structured object with 'code' and 'updatedJson'.",
            output: Output.object({
                schema: z.object({
                    code: z.string(),
                    updatedJson: z.string()
                }),
            }),
            prompt: "Fix this code: console.log('hello')",
        });
        console.log("Output received:", output);
    } catch (e) {
        console.error("Error detected:", e);
    }
}

test();
