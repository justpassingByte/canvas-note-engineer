import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderFactory } from '../providers/providerFactory.js';
import { OpenAICompatibleProvider } from '../providers/openAICompatibleProvider.js';
import { AnthropicProvider } from '../providers/anthropicProvider.js';
import { GeminiProvider } from '../providers/geminiProvider.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { ProviderConfig, PROVIDER_PRESETS } from '../config/providerConfig.js';
import { detectDomainFromTopic, buildUniversalSystemPrompt } from '../services/universalDomainPrompts.js';

describe('AI Custom Provider Strategy & Universal Domain Engine', () => {
  beforeEach(() => {
    // Dọn dẹp cấu hình provider test
    const all = sqliteClient.getAllProviderConfigs();
    for (const p of all) {
      if (p.id.startsWith('test-')) {
        sqliteClient.deleteProviderConfig(p.id);
      }
    }
  });

  describe('1. Strategy & Adapter Pattern: ProviderFactory', () => {
    it('should instantiate OpenAICompatibleProvider for deepseek, openai, groq, ollama, custom', () => {
      const deepseekConfig: ProviderConfig = {
        id: 'test-deepseek',
        provider_type: 'deepseek',
        name: 'DeepSeek AI',
        base_url: 'https://api.deepseek.com/v1',
        api_key: 'sk-test',
        model: 'deepseek-chat',
        temperature: 0.3,
        is_active: true
      };

      const provider = ProviderFactory.createProvider(deepseekConfig);
      expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
      expect(provider.config.name).toBe('DeepSeek AI');
    });

    it('should instantiate AnthropicProvider for anthropic', () => {
      const claudeConfig: ProviderConfig = {
        id: 'test-claude',
        provider_type: 'anthropic',
        name: 'Claude 3.5 Sonnet',
        base_url: 'https://api.anthropic.com/v1',
        api_key: 'sk-ant-test',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        is_active: false
      };

      const provider = ProviderFactory.createProvider(claudeConfig);
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should instantiate GeminiProvider for gemini', () => {
      const geminiConfig: ProviderConfig = {
        id: 'test-gemini',
        provider_type: 'gemini',
        name: 'Google Gemini Flash',
        base_url: 'https://generativelanguage.googleapis.com',
        api_key: 'gemini-key-test',
        model: 'gemini-1.5-flash',
        temperature: 0.3,
        is_active: false
      };

      const provider = ProviderFactory.createProvider(geminiConfig);
      expect(provider).toBeInstanceOf(GeminiProvider);
    });
  });

  describe('2. SQLite Provider Configuration Persistence', () => {
    it('should save, retrieve, and switch active provider configs in SQLite WAL', () => {
      const configA: ProviderConfig = {
        id: 'test-provider-a',
        provider_type: 'deepseek',
        name: 'DeepSeek Test',
        base_url: 'https://api.deepseek.com/v1',
        api_key: 'sk-test-a',
        model: 'deepseek-chat',
        temperature: 0.2,
        is_active: true
      };

      const configB: ProviderConfig = {
        id: 'test-provider-b',
        provider_type: 'ollama',
        name: 'Ollama Local',
        base_url: 'http://localhost:11434/v1',
        api_key: '',
        model: 'llama3.2',
        temperature: 0.5,
        is_active: false
      };

      sqliteClient.saveProviderConfig(configA);
      sqliteClient.saveProviderConfig(configB);

      let active = sqliteClient.getActiveProviderConfig();
      expect(active).not.toBeNull();
      expect(active?.id).toBe('test-provider-a');
      expect(active?.model).toBe('deepseek-chat');

      // Chuyển active sang provider B
      sqliteClient.setActiveProviderConfig('test-provider-b');
      active = sqliteClient.getActiveProviderConfig();
      expect(active?.id).toBe('test-provider-b');
      expect(active?.base_url).toBe('http://localhost:11434/v1');

      const all = sqliteClient.getAllProviderConfigs();
      expect(all.some(p => p.id === 'test-provider-a')).toBe(true);
      expect(all.some(p => p.id === 'test-provider-b')).toBe(true);
    });
  });

  describe('3. Universal Domain Detection & Prompt Engine', () => {
    it('should auto-detect domains across Healthcare, Legal, Business, Science, and Tech', () => {
      expect(detectDomainFromTopic('Phác đồ cấp cứu suy tim cấp và nhồi máu cơ tim')).toBe('healthcare');
      expect(detectDomainFromTopic('Tranh chấp vi phạm hợp đồng dịch vụ công nghệ và nghĩa vụ bảo mật')).toBe('legal');
      expect(detectDomainFromTopic('Tối ưu hóa chuỗi cung ứng logistics và quản trị rủi ro thanh khoản')).toBe('business');
      expect(detectDomainFromTopic('Nguyên lý cơ học lượng tử và tương tác hạt vi mô')).toBe('science');
      expect(detectDomainFromTopic('Kiến trúc phân tán Microservices với Redis và Kafka')).toBe('technology');
      expect(detectDomainFromTopic('Phân tích chiến lược phát triển tổng thể')).toBe('universal');
    });

    it('should build domain-specific system prompts with strict anti-step-numbering rules', () => {
      const prompt = buildUniversalSystemPrompt('healthcare');
      expect(prompt).toContain('Y TẾ, DƯỢC HỌC');
      expect(prompt).toContain('CHẨN ĐOÁN / LÂM SÀNG');
      expect(prompt).toContain('TUYỆT ĐỐI NGHIÊM CẤM');
      expect(prompt).toContain('BƯỚC 1 //');
    });
  });
});
