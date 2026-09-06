import { ProviderConfig } from '../config/providerConfig.js';
import { ILLMProvider, CompletionParams, ConnectionTestResult } from './baseProvider.js';

export class AnthropicProvider implements ILLMProvider {
  constructor(public readonly config: ProviderConfig) {}

  private getEndpoint(): string {
    let url = (this.config.base_url || 'https://api.anthropic.com/v1').trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    if (url.endsWith('/messages')) {
      return url;
    }
    if (url.endsWith('/v1')) {
      return `${url}/messages`;
    }
    return `${url}/v1/messages`;
  }

  private getHeaders(): Record<string, string> {
    const key = (this.config.api_key || '').trim();
    return {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      ...this.config.custom_headers
    };
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const endpoint = this.getEndpoint();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model || 'claude-3-5-haiku-20241022',
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Hi' }]
        }),
        signal: AbortSignal.timeout(12000)
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const rawText = await response.text();
        let errDetail = rawText;
        try {
          const errData = JSON.parse(rawText);
          errDetail = errData.error?.message || errData.message || rawText;
        } catch {
          // giữ nguyên rawText nếu phản hồi không phải JSON
        }

        return {
          success: false,
          latencyMs,
          message: `HTTP ${response.status}: ${errDetail || response.statusText}`
        };
      }

      return {
        success: true,
        latencyMs,
        message: 'Kết nối thành công tới Anthropic Claude API!',
        modelInfo: `Model: ${this.config.model}`
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối Anthropic: ${err.message || 'Timeout hoặc sai URL'}`
      };
    }
  }

  public async generateCompletion(params: CompletionParams): Promise<string> {
    const endpoint = this.getEndpoint();

    const bodyPayload: any = {
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens || this.config.max_tokens || 4096,
      temperature: params.temperature ?? this.config.temperature ?? 0.3,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userPrompt }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const rawText = await response.text();
      let errText = rawText;
      try {
        const errJson = JSON.parse(rawText);
        errText = errJson.error?.message || errJson.message || rawText;
      } catch {
        // giữ rawText
      }
      throw new Error(`[Anthropic] Lỗi API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.content?.[0]?.text || '';
  }
}
