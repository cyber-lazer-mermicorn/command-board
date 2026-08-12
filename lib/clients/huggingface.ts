/**
 * Hugging Face Inference Client
 *
 * Typed wrappers for HF Inference API endpoints used by the constellation:
 *   - Text generation (LLM completions)
 *   - Feature extraction (embeddings)
 *   - Text classification (intent / sentiment)
 *
 * All calls are server-side only.
 *
 * Env vars required:
 *   HUGGINGFACE_API_KEY
 */

import { env } from "@/lib/env";

const BASE_URL = "https://api-inference.huggingface.co";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HFGenerationInput {
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    repetition_penalty?: number;
    return_full_text?: boolean;
  };
}

export interface HFGenerationOutput {
  generated_text: string;
}

export interface HFEmbeddingOutput {
  embeddings: number[][];
}

export interface HFClassificationOutput {
  label: string;
  score: number;
}

export class HFApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly model: string,
    message: string
  ) {
    super(message);
    this.name = "HFApiError";
  }
}

// ─── Internal fetch ──────────────────────────────────────────────────────────

async function hfFetch<TInput, TOutput>(
  model: string,
  body: TInput,
  waitForModel = true
): Promise<TOutput> {
  const res = await fetch(`${BASE_URL}/models/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
      ...(waitForModel ? { "X-Wait-For-Model": "true" } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new HFApiError(
      res.status,
      model,
      errBody?.error ?? `HuggingFace API error ${res.status} on model ${model}`
    );
  }

  return res.json() as Promise<TOutput>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const huggingface = {
  /**
   * Text generation — LLM completion from a prompt.
   * Returns the first generated candidate's text.
   */
  async generate(
    model: string,
    input: HFGenerationInput
  ): Promise<string> {
    const results = await hfFetch<HFGenerationInput, HFGenerationOutput[]>(
      model,
      input
    );
    const first = results[0];
    if (!first) throw new HFApiError(200, model, "Empty generation response");
    return first.generated_text;
  },

  /**
   * Feature extraction — returns a 2-D embedding array.
   * Typically [batch_size, embedding_dim].
   */
  async embed(model: string, inputs: string | string[]): Promise<number[][]> {
    const result = await hfFetch<{ inputs: string | string[] }, number[][]>(
      model,
      { inputs }
    );
    return result;
  },

  /**
   * Text classification — sentiment, intent, category.
   * Returns labels sorted descending by score.
   */
  async classify(
    model: string,
    inputs: string
  ): Promise<HFClassificationOutput[]> {
    const result = await hfFetch<
      { inputs: string },
      HFClassificationOutput[][] | HFClassificationOutput[]
    >(model, { inputs });
    // HF returns nested arrays for single-input batch — flatten one level
    const flat = Array.isArray(result[0]) ? (result as HFClassificationOutput[][])[0] : (result as HFClassificationOutput[]);
    return flat.sort((a, b) => b.score - a.score);
  },
} as const;
