import { ProviderConfig } from '../config/providerConfig.js';

export interface CompletionParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  modelInfo?: string;
  availableModels?: string[];
}

export interface ILLMProvider {
  readonly config: ProviderConfig;
  testConnection(): Promise<ConnectionTestResult>;
  generateCompletion(params: CompletionParams): Promise<string>;
  fetchModels?(): Promise<string[]>;
}
