import { ProviderConfig } from '../config/providerConfig.js';
import { ILLMProvider } from './baseProvider.js';
import { OpenAICompatibleProvider } from './openAICompatibleProvider.js';
import { AnthropicProvider } from './anthropicProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { EnvManager } from '../config/envManager.js';

export class ProviderFactory {
  public static createProvider(config: ProviderConfig): ILLMProvider {
    const resolvedConfig: ProviderConfig = {
      ...config,
      base_url: EnvManager.resolveBaseUrl(config.provider_type, config.base_url) || config.base_url,
      api_key: EnvManager.resolveApiKey(config.provider_type, config.api_key),
      model: EnvManager.resolveModel(config.provider_type, config.model) || config.model
    };

    switch (resolvedConfig.provider_type) {
      case 'anthropic':
        return new AnthropicProvider(resolvedConfig);
      case 'gemini':
        return new GeminiProvider(resolvedConfig);
      case 'openai':
      case 'deepseek':
      case 'groq':
      case 'ollama':
      case 'openrouter':
      case 'openai-compatible':
      case 'custom':
      default:
        return new OpenAICompatibleProvider(resolvedConfig);
    }
  }

  public static getActiveProvider(): ILLMProvider | null {
    let activeConfig = sqliteClient.getActiveProviderConfig();
    if (!activeConfig) {
      // Tự động kiểm tra xem trong .env có cấu hình nào sẵn không
      const customUrl = process.env.CUSTOM_BASE_URL || process.env.AI_BASE_URL;
      const deepseekKey = process.env.DEEPSEEK_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      if (customUrl) {
        activeConfig = {
          id: 'env-custom',
          provider_type: 'custom',
          name: 'Custom Provider (from .env)',
          base_url: customUrl,
          api_key: process.env.CUSTOM_API_KEY || process.env.AI_API_KEY || '',
          model: process.env.CUSTOM_MODEL || process.env.AI_MODEL || 'llama3.2',
          temperature: 0.3,
          is_active: true
        };
      } else if (deepseekKey) {
        activeConfig = {
          id: 'env-deepseek',
          provider_type: 'deepseek',
          name: 'DeepSeek AI (from .env)',
          base_url: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
          api_key: deepseekKey,
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          temperature: 0.3,
          is_active: true
        };
      } else if (openaiKey) {
        activeConfig = {
          id: 'env-openai',
          provider_type: 'openai',
          name: 'OpenAI (from .env)',
          base_url: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
          api_key: openaiKey,
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          temperature: 0.3,
          is_active: true
        };
      }
    }

    if (!activeConfig) return null;
    return this.createProvider(activeConfig);
  }
}
