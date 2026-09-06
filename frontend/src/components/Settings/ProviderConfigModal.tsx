import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Server,
  Key,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  Zap,
  Check,
  RefreshCw
} from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore.js';
import { ProviderConfig, ProviderType } from '../../types/providerTypes.js';

export const ProviderConfigModal: React.FC = () => {
  const {
    activeProvider,
    allProviders,
    providerPresets,
    isProviderConfigOpen,
    toggleProviderConfigModal,
    saveProviderConfig,
    testProviderConnection,
    setActiveProvider,
    deleteProvider
  } = useGraphStore();

  const [selectedPreset, setSelectedPreset] = useState<string>('deepseek');
  const [providerType, setProviderType] = useState<ProviderType>('openai-compatible');
  const [name, setName] = useState<string>('DeepSeek AI');
  const [baseUrl, setBaseUrl] = useState<string>('https://api.deepseek.com/v1');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('deepseek-chat');
  const [temperature, setTemperature] = useState<number>(0.3);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    modelInfo?: string;
    availableModels?: string[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Khi mở modal, nếu đã có activeProvider, nạp dữ liệu vào form
  useEffect(() => {
    if (activeProvider) {
      setName(activeProvider.name);
      setProviderType(activeProvider.provider_type);
      setBaseUrl(activeProvider.base_url);
      setApiKey(activeProvider.api_key);
      setModel(activeProvider.model);
      setTemperature(activeProvider.temperature);
      setAvailableModels([]);
      setTestResult(null);
    }
  }, [activeProvider, isProviderConfigOpen]);

  if (!isProviderConfigOpen) return null;

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = providerPresets[presetKey];
    if (preset) {
      setName(preset.name || presetKey.toUpperCase());
      setProviderType((preset.provider_type as ProviderType) || (presetKey as ProviderType));
      setBaseUrl(preset.base_url || '');
      setModel(preset.model || '');
      setTemperature(preset.temperature ?? 0.3);
      setTestResult(null);
      setAvailableModels([]);
    }
  };

  const handleFetchModels = async () => {
    if (!baseUrl) {
      alert('Vui lòng nhập Base URL trước.');
      return;
    }
    setIsFetchingModels(true);
    try {
      const res = await fetch('/api/provider/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: providerType,
          base_url: baseUrl,
          api_key: apiKey
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModels(data.models);
        // Tự động chọn model chat tốt nhất nếu model hiện tại trống
        if (!model || !data.models.includes(model)) {
          const chatModel = data.models.find((m: string) => !m.includes('whisper') && !m.includes('guard') && !m.includes('embed')) || data.models[0];
          if (chatModel) setModel(chatModel);
        }
      } else {
        alert(data.message || 'Không thể lấy danh sách models từ provider này.');
      }
    } catch (e: any) {
      alert(`Lỗi khi lấy models: ${e.message}`);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const tempConfig: ProviderConfig = {
      id: 'temp-test',
      provider_type: providerType,
      name,
      base_url: baseUrl,
      api_key: apiKey,
      model,
      temperature,
      is_active: true
    };
    const res = await testProviderConnection(tempConfig);
    setTestResult(res);
    if (res.availableModels && res.availableModels.length > 0) {
      setAvailableModels(res.availableModels);
    }
    setIsTesting(false);
  };

  const handleSave = async () => {
    if (!baseUrl || !model) {
      alert('Vui lòng nhập Base URL và Model ID');
      return;
    }

    setIsSaving(true);
    const configToSave: ProviderConfig = {
      id: activeProvider?.id || `provider-${Date.now()}`,
      provider_type: providerType,
      name: name.trim() || 'AI Provider',
      base_url: baseUrl.trim(),
      api_key: apiKey.trim(),
      model: model.trim(),
      temperature,
      is_active: true
    };

    const success = await saveProviderConfig(configToSave);
    setIsSaving(false);

    if (success) {
      alert(`Đã lưu và kích hoạt cấu hình cho ${configToSave.name}!`);
      toggleProviderConfigModal();
    } else {
      alert('Không thể lưu cấu hình. Vui lòng kiểm tra lại kết nối backend.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={toggleProviderConfigModal}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          fontFamily: 'Inter, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#4F46E5',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Cấu hình AI Provider (Lưu vào .env)
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                🌿 Tự động lưu Base URL, API Key & Model trực tiếp vào file <code>.env</code>
              </p>
            </div>
          </div>
          <button
            onClick={toggleProviderConfigModal}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              CHỌN NHANH PROVIDER PRESET
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { id: 'deepseek', label: 'DeepSeek AI' },
                { id: 'openai', label: 'OpenAI (GPT-4o)' },
                { id: 'groq', label: 'Groq (Fast)' },
                { id: 'ollama', label: 'Ollama (Local)' },
                { id: 'openrouter', label: 'OpenRouter' },
                { id: 'anthropic', label: 'Claude Anthropic' },
                { id: 'gemini', label: 'Google Gemini' },
                { id: 'custom', label: 'Tùy Chỉnh (Custom URL)' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: selectedPreset === p.id ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    background: selectedPreset === p.id ? '#EEF2FF' : '#FFFFFF',
                    color: selectedPreset === p.id ? '#4338CA' : '#334155'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Tên Cấu Hình
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: DeepSeek Production"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Kiểu Tương Thích (Protocol)
              </label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              >
                <option value="groq">Groq (gsk_... Siêu Tốc)</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="openai">OpenAI (GPT-4o, o1, o3)</option>
                <option value="openai-compatible">OpenAI-Compatible (Chung)</option>
                <option value="ollama">Ollama (Local LLM)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="anthropic">Anthropic Messages API (Claude)</option>
                <option value="gemini">Google Gemini API</option>
                <option value="custom">Tùy Chỉnh (Custom Proxy/vLLM)</option>
              </select>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Base URL Endpoint
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color="#64748B" />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.deepseek.com/v1 hoặc https://api.groq.com/openai/v1"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>
            <p style={{ margin: '4px 0 0 24px', fontSize: '11px', color: '#64748B' }}>
              Hệ thống sẽ tự động gọi endpoint <code>/chat/completions</code> hoặc endpoint tương ứng.
            </p>
          </div>

          {/* API Key */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                API Key (Khóa bảo mật)
              </label>
              {activeProvider?.has_env_key && (
                <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 500, background: '#DCFCE7', padding: '1px 6px', borderRadius: '4px' }}>
                  ✓ Đã có trong .env ({activeProvider.env_var})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={16} color="#64748B" />
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_... hoặc sk-... (để trống nếu dùng key sẵn trong .env)"
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    display: 'flex',
                    padding: '4px'
                  }}
                >
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <p style={{ margin: '4px 0 0 24px', fontSize: '11px', color: '#64748B' }}>
              Khóa được ghi an toàn vào file <code>.env</code> máy chủ, tuyệt đối không lưu plain-text trong database.
            </p>
          </div>

          {/* Model Name & Temperature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Model ID
                </label>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels}
                  style={{
                    fontSize: '11px',
                    color: '#4F46E5',
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: isFetchingModels ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={11} className={isFetchingModels ? 'animate-spin' : ''} />
                  {isFetchingModels ? 'Đang lấy...' : 'Lấy danh sách Models'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="#64748B" />
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="deepseek-chat, qwen/qwen3.8-27b, gpt-4o..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Danh sách model khả dụng từ API */}
              {availableModels.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Chọn nhanh model từ API ({availableModels.length} models):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                    {availableModels
                      .filter(m => !m.includes('whisper') && !m.includes('guard'))
                      .map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setModel(m)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: model === m ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                            background: model === m ? '#EEF2FF' : '#F8FAFC',
                            color: model === m ? '#4338CA' : '#334155',
                            cursor: 'pointer',
                            fontWeight: model === m ? 600 : 400
                          }}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Nhiệt độ (Temp): {temperature}
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px' }}>
                <Sliders size={16} color="#64748B" />
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Test Connection Output */}
          {testResult && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: testResult.success ? '#F0FDF4' : '#FEF2F2',
                border: testResult.success ? '1px solid #86EFAC' : '1px solid #FECACA'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {testResult.success ? (
                    <CheckCircle2 size={18} color="#16A34A" />
                  ) : (
                    <AlertTriangle size={18} color="#DC2626" />
                  )}
                  <div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: testResult.success ? '#15803D' : '#B91C1C'
                      }}
                    >
                      {testResult.message}
                    </span>
                    {testResult.modelInfo && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#166534', marginTop: '2px' }}>
                        {testResult.modelInfo}
                      </span>
                    )}
                  </div>
                </div>
                {testResult.success && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#DCFCE7',
                      color: '#15803D'
                    }}
                  >
                    ⚡ {testResult.latencyMs}ms
                  </span>
                )}
              </div>

              {/* Gợi ý chọn model nếu test connection trả về availableModels */}
              {testResult.availableModels && testResult.availableModels.length > 0 && !testResult.success && (
                <div style={{ borderTop: '1px dashed #FECACA', paddingTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Nhấn vào model bên dưới để áp dụng ngay:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {testResult.availableModels
                      .filter(m => !m.includes('whisper') && !m.includes('guard'))
                      .slice(0, 6)
                      .map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setModel(m)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #DC2626',
                            background: '#FFFFFF',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          + Dùng {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved Providers Section */}
          {allProviders.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                CÁC CẤU HÌNH ĐÃ LƯU
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '130px', overflowY: 'auto' }}>
                {allProviders.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: p.is_active ? '#F8FAFC' : '#FFFFFF',
                      border: p.is_active ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: p.is_active ? '#16A34A' : '#CBD5E1'
                        }}
                      />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{p.name}</span>
                        <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '8px' }}>
                          ({p.model})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!p.is_active && (
                        <button
                          onClick={() => setActiveProvider(p.id)}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          Kích hoạt
                        </button>
                      )}
                      <button
                        onClick={() => deleteProvider(p.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Xóa cấu hình này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC'
          }}
        >
          <button
            onClick={handleTest}
            disabled={isTesting}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: isTesting ? 'wait' : 'pointer',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={15} color="#4F46E5" />
            <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleProviderConfigModal}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: '#4F46E5',
                color: '#FFFFFF',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
              }}
            >
              <Check size={16} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu & Kích Hoạt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
