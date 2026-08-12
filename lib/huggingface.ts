import { HfInference } from '@huggingface/inference'

export function getHFClient() {
  const token = process.env.HUGGINGFACE_API_TOKEN
  if (!token) throw new Error('HUGGINGFACE_API_TOKEN is not set')
  return new HfInference(token)
}

// Text generation helper
export async function generateText(prompt: string, model = 'mistralai/Mistral-7B-Instruct-v0.2') {
  const hf = getHFClient()
  const result = await hf.textGeneration({
    model,
    inputs: prompt,
    parameters: { max_new_tokens: 512 },
  })
  return result.generated_text
}

// Embedding helper (for semantic search)
export async function getEmbedding(text: string, model = 'sentence-transformers/all-MiniLM-L6-v2') {
  const hf = getHFClient()
  const result = await hf.featureExtraction({ model, inputs: text })
  return result as number[]
}
