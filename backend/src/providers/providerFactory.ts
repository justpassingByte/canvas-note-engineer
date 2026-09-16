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
      case 'openai-compatible':
      default:
        return new OpenAICompatibleProvider(resolvedConfig);
    }
  }

  public static getActiveProvider(): ILLMProvider | null {
    let activeConfig = sqliteClient.getActiveProviderConfig();
    if (!activeConfig) {
      // Tự động kiểm tra xem trong .env có cấu hình nào sẵn không
      const aiBaseUrl = process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || process.env.CUSTOM_BASE_URL;
      const aiApiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

      if (aiBaseUrl || aiApiKey) {
        activeConfig = {
          id: 'env-ai',
          provider_type: 'openai-compatible',
          name: 'OpenAI-Compatible (from .env)',
          base_url: aiBaseUrl || 'https://api.openai.com/v1',
          api_key: aiApiKey || '',
          model: process.env.AI_MODEL || process.env.OPENAI_MODEL || process.env.DEEPSEEK_MODEL || 'gpt-4o',
          temperature: 0.3,
          is_active: true
        };
      } else if (anthropicApiKey) {
        activeConfig = {
          id: 'env-anthropic',
          provider_type: 'anthropic',
          name: 'Anthropic Claude (from .env)',
          base_url: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
          api_key: anthropicApiKey,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          temperature: 0.3,
          is_active: true
        };
      }
    }

    if (!activeConfig) return null;
    return this.createProvider(activeConfig);
  }
}
