export interface ModelPricing {
  inputPer1kTokens: number   // USD per 1000 input tokens
  outputPer1kTokens: number  // USD per 1000 output tokens
}

// Configurable pricing -- update when providers change prices
// Prices as of March 2026
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Google
  'gemini-3.1-pro-preview': { inputPer1kTokens: 0.00125, outputPer1kTokens: 0.005 },
  'gemini-3-flash-preview':       { inputPer1kTokens: 0.0001,  outputPer1kTokens: 0.0004 },
  // OpenAI
  'gpt-4o':                 { inputPer1kTokens: 0.0025,  outputPer1kTokens: 0.01 },
  'gpt-4o-mini':            { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006 },
  'o3-mini':                { inputPer1kTokens: 0.0011,  outputPer1kTokens: 0.0044 },
  'o3':                     { inputPer1kTokens: 0.01,    outputPer1kTokens: 0.04 },
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'] // fallback to gpt-4o pricing
  return (inputTokens / 1000) * pricing.inputPer1kTokens +
         (outputTokens / 1000) * pricing.outputPer1kTokens
}
