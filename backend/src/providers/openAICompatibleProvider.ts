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

  public async fetchModels(): Promise<string[]> {
    const cleanUrl = this.getCleanBaseUrl();
    const modelsEndpoint = `${cleanUrl}/models`;
    try {
      const response = await fetch(modelsEndpoint, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      if (Array.isArray(data.data)) {
        return data.data
          .map((m: any) => m.id || m.name)
          .filter(Boolean)
          .sort();
      }
      return [];
    } catch {
      return [];
    }
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const cleanUrl = this.getCleanBaseUrl();

    try {
      // 1. Kiểm tra xác thực qua endpoint /models trước (Không tốn token, kiểm tra chuẩn xác API Key & Base URL)
      let availableModels: string[] = [];
      try {
        const modelsRes = await fetch(`${cleanUrl}/models`, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(6000)
        });

        if (modelsRes.status === 401 || modelsRes.status === 403) {
          const errData: any = await modelsRes.json().catch(() => ({}));
          const msg = errData.error?.message || modelsRes.statusText;
          return {
            success: false,
            latencyMs: Date.now() - startTime,
            message: `Lỗi xác thực (HTTP ${modelsRes.status}): API Key không hợp lệ hoặc bị từ chối truy cập. (${msg})`
          };
        }

        if (modelsRes.ok) {
          const modelsData: any = await modelsRes.json();
          if (Array.isArray(modelsData.data)) {
            availableModels = modelsData.data
              .map((m: any) => m.id || m.name)
              .filter(Boolean);
          }
        }
      } catch {
        // Một số custom proxy / local LLM có thể không hỗ trợ /models, tiếp tục thử chat completions
      }

      // 2. Thử endpoint chat completion nhẹ (1 token)
      const targetModel = this.config.model || availableModels[0] || 'gpt-4o-mini';
      const chatEndpoint = `${cleanUrl}/chat/completions`;
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(12000)
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const rawText = await response.text();
        let errDetail = rawText;
        try {
          const errData: any = JSON.parse(rawText);
          errDetail = errData.error?.message || errData.message || rawText;
        } catch {
          // giữ rawText
        }

        // Nếu API Key đúng (status 404 hoặc model_not_found) nhưng model chưa đúng
        if (
          response.status === 404 ||
          errDetail.includes('model_not_found') ||
          errDetail.includes('does not exist') ||
          errDetail.includes('do not have access')
        ) {
          const chatCandidates = availableModels.filter(
            m => !m.includes('whisper') && !m.includes('guard') && !m.includes('embed')
          );
          const suggestions = (chatCandidates.length > 0 ? chatCandidates : availableModels).slice(0, 4).join(', ');
          return {
            success: false,
            latencyMs,
            message: `API Key hợp lệ! Nhưng model "${targetModel}" không tồn tại trên tài khoản của bạn.${
              suggestions ? ` Gợi ý model khả dụng: ${suggestions}` : ''
            }`,
            availableModels
          };
        }

        return {
          success: false,
          latencyMs,
          message: `HTTP ${response.status}: ${errDetail || response.statusText}`,
          availableModels: availableModels.length > 0 ? availableModels : undefined
        };
      }

      const resData: any = await response.json();
      const modelUsed = resData.model || targetModel;

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công tới ${this.config.name || 'Provider'}!`,
        modelInfo: `Model: ${modelUsed}`,
        availableModels: availableModels.length > 0 ? availableModels : undefined
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        message: `Lỗi kết nối: ${err.message || 'Timeout hoặc sai Base URL'}`
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
      const rawText = await response.text();
      let errText = rawText;
      let errJson: any = null;
      try {
        errJson = JSON.parse(rawText);
        errText = errJson.error?.message || errJson.message || rawText;
      } catch {
        // không phải JSON
      }

      // Nếu lỗi do json_object không được hỗ trợ bởi model này, thử lại không có response_format
      if (params.jsonMode && errJson?.error?.message?.includes('response_format')) {
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

      throw new Error(`[${this.config.name}] Lỗi API (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
