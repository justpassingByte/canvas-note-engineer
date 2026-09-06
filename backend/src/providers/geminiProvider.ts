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
        const rawText = await response.text();
        let errDetail = rawText;
        try {
          const errData = JSON.parse(rawText);
          errDetail = errData.error?.message || errData.message || rawText;
        } catch {
          // giữ rawText
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
    const apiKey = this.config.api_key.trim();
    const endpoint = `${cleanUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const bodyPayload: any = {
      contents: [
        {
          parts: [
            { text: `SYSTEM INSTRUCTION: ${params.systemPrompt}\n\nUSER REQUEST: ${params.userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: params.temperature ?? this.config.temperature ?? 0.3,
        maxOutputTokens: params.maxTokens || this.config.max_tokens || 4096
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.config.custom_headers },
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
      throw new Error(`[Gemini] Lỗi API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
