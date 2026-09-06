export type ProviderType =
  | 'openai-compatible'
  | 'deepseek'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'custom';

export interface ProviderConfig {
  id: string;
  provider_type: ProviderType;
  name: string;
  base_url: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens?: number;
  custom_headers?: Record<string, string>;
  is_active: boolean;
  updated_at?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  modelInfo?: string;
}

export type DomainType =
  | 'technology'
  | 'healthcare'
  | 'legal'
  | 'business'
  | 'science'
  | 'universal';
