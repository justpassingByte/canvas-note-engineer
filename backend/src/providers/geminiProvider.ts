import { ProviderConfig } from '../config/providerConfig.js';
import { ILLMProvider, CompletionParams, ConnectionTestResult } from './baseProvider.js';

export class GeminiProvider implements ILLMProvider {
  constructor(public readonly config: ProviderConfig) {}

  private getCleanBaseUrl(): string {
    let url = (this.config.base_url || 'https://generativelanguage.googleapis.com').trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const cleanUrl = this.getCleanBaseUrl();
    const model = this.config.model || 'gemini-1.5-flash';
    const endpoint = `${cleanUrl}/v1beta/models/${model}:generateContent?key=${this.config.api_key.trim()}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 5 }
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

      return {
        success: true,
        latencyMs,
        message: 'Kết nối thành công tới Google Gemini API!',
        modelInfo: `Model: ${model}`
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối Gemini: ${err.message || 'Timeout hoặc sai URL'}`
      };
    }
  }

  public async generateCompletion(params: CompletionParams): Promise<string> {
    const cleanUrl = this.getCleanBaseUrl();
    const model = this.config.model || 'gemini-1.5-flash';
    const endpoint = `${cleanUrl}/v1beta/models/${model}:generateContent?key=${this.config.api_key.trim()}`;

    const genConfig: any = {
      temperature: params.temperature ?? this.config.temperature ?? 0.3
    };

    if (params.jsonMode) {
      genConfig.responseMimeType = 'application/json';
    }
    if (params.maxTokens || this.config.max_tokens) {
      genConfig.maxOutputTokens = params.maxTokens || this.config.max_tokens;
    }

    const bodyPayload = {
      systemInstruction: {
        parts: [{ text: params.systemPrompt }]
      },
      contents: [
        { role: 'user', parts: [{ text: params.userPrompt }] }
      ],
      generationConfig: genConfig
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.config.custom_headers },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      let errText = '';
      try {
        const errJson: any = await response.json();
        errText = errJson.error?.message || JSON.stringify(errJson);
      } catch {
        errText = await response.text();
      }
      throw new Error(`[Gemini] Lỗi API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
