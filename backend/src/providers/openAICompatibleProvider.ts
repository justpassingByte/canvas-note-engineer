import { ProviderConfig } from '../config/providerConfig.js';
import { ILLMProvider, CompletionParams, ConnectionTestResult } from './baseProvider.js';

export class OpenAICompatibleProvider implements ILLMProvider {
  constructor(public readonly config: ProviderConfig) {}

  private getCleanBaseUrl(): string {
    let url = (this.config.base_url || 'https://api.openai.com/v1').trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.custom_headers
    };

    if (this.config.api_key && this.config.api_key.trim().length > 0) {
      headers['Authorization'] = `Bearer ${this.config.api_key.trim()}`;
    }

    return headers;
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const cleanUrl = this.getCleanBaseUrl();

    try {
      // Thử endpoint chat completion nhẹ (1 token)
      const chatEndpoint = `${cleanUrl}/chat/completions`;
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(12000)
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        let errDetail = '';
        try {
          const errData: any = await response.json();
          errDetail = errData.error?.message || JSON.stringify(errData);
        } catch {
          errDetail = await response.text();
        }
        return {
          success: false,
          latencyMs,
          message: `HTTP ${response.status}: ${errDetail || response.statusText}`
        };
      }

      const resData: any = await response.json();
      const modelUsed = resData.model || this.config.model;

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công tới ${this.config.name || 'Provider'}!`,
        modelInfo: `Model: ${modelUsed}`
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối: ${err.message || 'Timeout hoặc sai URL'}`
      };
    }
  }

  public async generateCompletion(params: CompletionParams): Promise<string> {
    const cleanUrl = this.getCleanBaseUrl();
    const chatEndpoint = `${cleanUrl}/chat/completions`;

    const bodyPayload: any = {
      model: this.config.model,
      temperature: params.temperature ?? this.config.temperature ?? 0.3,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt }
      ]
    };

    if (params.maxTokens || this.config.max_tokens) {
      bodyPayload.max_tokens = params.maxTokens || this.config.max_tokens;
    }

    if (params.jsonMode) {
      // Một số provider (DeepSeek, OpenAI) hỗ trợ response_format json_object
      bodyPayload.response_format = { type: 'json_object' };
    }

    let response: Response;
    try {
      response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(60000)
      });
    } catch (fetchErr: any) {
      // Nếu lỗi do response_format json_object không được hỗ trợ, thử lại không có response_format
      if (params.jsonMode) {
        delete bodyPayload.response_format;
        response = await fetch(chatEndpoint, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(60000)
        });
      } else {
        throw fetchErr;
      }
    }

    if (!response.ok) {
      let errText = '';
      try {
        const errJson: any = await response.json();
        // Nếu lỗi do json_object không được hỗ trợ
        if (params.jsonMode && errJson.error?.message?.includes('response_format')) {
          delete bodyPayload.response_format;
          const retryRes = await fetch(chatEndpoint, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(bodyPayload),
            signal: AbortSignal.timeout(60000)
          });
          if (retryRes.ok) {
            const data: any = await retryRes.json();
            return data.choices?.[0]?.message?.content || '';
          }
        }
        errText = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errText = await response.text();
      }
      throw new Error(`[${this.config.name}] Lỗi API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
