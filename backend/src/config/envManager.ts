import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProviderType } from './providerConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EnvManager {
  private static envFilePath: string = EnvManager.resolveEnvPath();

  private static resolveEnvPath(): string {
    const candidates = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '../../../.env'),
      path.resolve(__dirname, '../../.env'),
      path.resolve(__dirname, '../.env')
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }

    return candidates[1] || candidates[0];
  }

  /**
   * Khởi tạo và nạp các biến môi trường từ file .env vào process.env
   */
  public static init(): void {
    const envPath = this.getEnvPath();
    if (!fs.existsSync(envPath)) {
      return;
    }

    try {
      if (typeof (process as any).loadEnvFile === 'function') {
        (process as any).loadEnvFile(envPath);
      } else {
        this.loadEnvManually(envPath);
      }
    } catch {
      this.loadEnvManually(envPath);
    }
  }

  private static loadEnvManually(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (e: any) {
      console.warn('[EnvManager] Không thể nạp .env thủ công:', e.message);
    }
  }

  public static getEnvPath(): string {
    return this.envFilePath;
  }

  public static getPrefixForProvider(providerType: ProviderType): string {
    switch (providerType) {
      case 'deepseek':
        return 'DEEPSEEK';
      case 'openai':
        return 'OPENAI';
      case 'anthropic':
        return 'ANTHROPIC';
      case 'gemini':
        return 'GEMINI';
      case 'groq':
        return 'GROQ';
      case 'openrouter':
        return 'OPENROUTER';
      case 'ollama':
        return 'CUSTOM';
      case 'custom':
      case 'openai-compatible':
      default:
        return 'CUSTOM';
    }
  }

  /**
   * Giải quyết Base URL: ưu tiên input -> sau đó lấy từ env riêng -> sau đó generic AI_BASE_URL
   */
  public static resolveBaseUrl(providerType: ProviderType, inputUrl?: string): string {
    const trimmed = (inputUrl || '').trim();
    if (trimmed) return trimmed;

    const prefix = this.getPrefixForProvider(providerType);
    const envUrl = process.env[`${prefix}_BASE_URL`] || process.env.AI_BASE_URL;
    return (envUrl || '').trim();
  }

  /**
   * Giải quyết API Key: ưu tiên input thật -> sau đó lấy từ process.env riêng -> sau đó AI_API_KEY
   */
  public static resolveApiKey(providerType: ProviderType, inputKey?: string): string {
    const trimmed = (inputKey || '').trim();

    // Nếu người dùng truyền key thật (không phải placeholder đã mask)
    if (trimmed && !trimmed.startsWith('sk-...') && !trimmed.includes('***') && trimmed !== '[ENV]') {
      return trimmed;
    }

    const prefix = this.getPrefixForProvider(providerType);
    const envVal = process.env[`${prefix}_API_KEY`] || process.env.AI_API_KEY || '';
    return envVal.trim();
  }

  /**
   * Giải quyết Model ID
   */
  public static resolveModel(providerType: ProviderType, inputModel?: string): string {
    const trimmed = (inputModel || '').trim();
    if (trimmed) return trimmed;

    const prefix = this.getPrefixForProvider(providerType);
    const envModel = process.env[`${prefix}_MODEL`] || process.env.AI_MODEL;
    return (envModel || '').trim();
  }

  /**
   * Kiểm tra xem provider này đã có API Key trong file .env chưa
   */
  public static hasKeyInEnv(providerType: ProviderType): boolean {
    const prefix = this.getPrefixForProvider(providerType);
    return Boolean(process.env[`${prefix}_API_KEY`] || process.env.AI_API_KEY);
  }

  /**
   * Lưu hoặc cập nhật toàn bộ cấu hình (Base URL, API Key, Model) vào file .env
   */
  public static saveProviderToEnv(
    providerType: ProviderType,
    params: { baseUrl?: string; apiKey?: string; model?: string }
  ): void {
    const prefix = this.getPrefixForProvider(providerType);
    const envPath = this.getEnvPath();

    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    const updates: Record<string, string> = {};

    if (params.baseUrl && params.baseUrl.trim()) {
      updates[`${prefix}_BASE_URL`] = params.baseUrl.trim();
    }

    if (params.apiKey && params.apiKey.trim() && !params.apiKey.startsWith('sk-...') && !params.apiKey.includes('***')) {
      updates[`${prefix}_API_KEY`] = params.apiKey.trim();
    }

    if (params.model && params.model.trim()) {
      updates[`${prefix}_MODEL`] = params.model.trim();
    }

    // Cập nhật cả runtime process.env và nội dung file .env
    for (const [key, val] of Object.entries(updates)) {
      process.env[key] = val;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${val}`;
      if (regex.test(content)) {
        content = content.replace(regex, newLine);
      } else {
        content = content ? `${content.trim()}\n${newLine}\n` : `${newLine}\n`;
      }
    }

    const dir = path.dirname(envPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(envPath, content, 'utf-8');
    console.log(`[EnvManager] Đã cập nhật .env cho ${prefix} (${Object.keys(updates).join(', ')})`);
  }

  /**
   * Che giấu key (masking) để gửi về client an toàn
   */
  public static maskKey(key: string): string {
    if (!key) return '';
    const clean = key.trim();
    if (clean.length <= 8) return 'sk-...';
    return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
  }
}
