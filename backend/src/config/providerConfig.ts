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

export const PROVIDER_PRESETS: Record<string, Partial<ProviderConfig>> = {
  deepseek: {
    name: 'DeepSeek AI',
    provider_type: 'openai-compatible',
    base_url: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.3
  },
  openai: {
    name: 'OpenAI (GPT-4o / o3)',
    provider_type: 'openai-compatible',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    temperature: 0.3
  },
  groq: {
    name: 'Groq (Ultra-fast Inference)',
    provider_type: 'openai-compatible',
    base_url: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3
  },
  ollama: {
    name: 'Ollama (Local LLM)',
    provider_type: 'openai-compatible',
    base_url: 'http://localhost:11434/v1',
    model: 'llama3.2',
    temperature: 0.3
  },
  openrouter: {
    name: 'OpenRouter (Multi-model Gateway)',
    provider_type: 'openai-compatible',
    base_url: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-chat',
    temperature: 0.3
  },
  anthropic: {
    name: 'Anthropic Claude',
    provider_type: 'anthropic',
    base_url: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3
  },
  gemini: {
    name: 'Google Gemini',
    provider_type: 'gemini',
    base_url: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-flash',
    temperature: 0.3
  },
  custom: {
    name: 'Custom Provider (OpenAI Compatible)',
    provider_type: 'openai-compatible',
    base_url: 'http://localhost:8000/v1',
    model: 'custom-model',
    temperature: 0.3
  }
};
