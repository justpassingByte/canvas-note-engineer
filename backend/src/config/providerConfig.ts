export type ProviderType =
  | 'openai-compatible'
  | 'anthropic'
  | 'deepseek'
  | 'openai'
  | 'gemini'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'custom'
  | string;

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
  has_env_key?: boolean;
  env_var?: string;
}

export const PROVIDER_PRESETS: Record<string, Partial<ProviderConfig>> = {
  'openai-compatible': {
    name: 'OpenAI-Compatible Provider',
    provider_type: 'openai-compatible',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    temperature: 0.3
  },
  anthropic: {
    name: 'Anthropic Claude',
    provider_type: 'anthropic',
    base_url: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3
  }
};

