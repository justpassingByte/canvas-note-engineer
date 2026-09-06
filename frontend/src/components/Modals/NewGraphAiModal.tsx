import React, { useState } from 'react';
import { X, Sparkles, Compass, Lightbulb, Check, AlertCircle } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore.js';
import { DomainType } from '../../types/providerTypes.js';

export const NewGraphAiModal: React.FC = () => {
  const {
    isNewGraphModalOpen,
    toggleNewGraphModal,
    activeProvider,
    toggleProviderConfigModal,
    generateGraphWithAI,
    isAiGenerating,
    aiStatusMessage
  } = useGraphStore();

  const [topic, setTopic] = useState<string>('');
  const [domain, setDomain] = useState<DomainType | 'auto'>('auto');
  const [userPrompt, setUserPrompt] = useState<string>('');

  if (!isNewGraphModalOpen) return null;

  const quickSuggestions = [
    { title: 'Sự cố Concurrency & Distributed Lock', domain: 'technology' as DomainType },
    { title: 'Chẩn đoán & Xử trí Hội chứng Vành Cấp', domain: 'healthcare' as DomainType },
    { title: 'Tranh chấp Vi phạm Cam kết Bảo mật & NDA', domain: 'legal' as DomainType },
    { title: 'Quản trị Khủng hoảng Đứt gãy Chuỗi Cung Ứng', domain: 'business' as DomainType },
    { title: 'Nhiệt động học & Cân bằng Hóa phân rã', domain: 'science' as DomainType }
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('Vui lòng nhập chủ đề hoặc bài toán cần dựng đồ thị.');
      return;
    }

    if (!activeProvider) {
      alert('Chưa có AI Provider nào được kích hoạt. Hãy cấu hình Provider trước!');
      toggleProviderConfigModal();
      return;
    }

    const domainParam = domain === 'auto' ? undefined : domain;
    await generateGraphWithAI(topic, domainParam, userPrompt);
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
      onClick={toggleNewGraphModal}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '620px',
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
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Sinh Đồ Thị Tri Thức Mới Bằng AI
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                Phân tích tình huống, dựng bản đồ tương quan và rủi ro trực tiếp trên UI
              </p>
            </div>
          </div>
          <button
            onClick={toggleNewGraphModal}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Provider Status Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: activeProvider ? '#F0FDF4' : '#FEF3C7',
              border: activeProvider ? '1px solid #BBF7D0' : '1px solid #FDE68A',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activeProvider ? '#16A34A' : '#D97706'
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: activeProvider ? '#166534' : '#92400E' }}>
                {activeProvider
                  ? `Đang sử dụng: ${activeProvider.name} (${activeProvider.model})`
                  : 'Chưa cấu hình AI Provider!'}
              </span>
            </div>
            <button
              onClick={() => {
                toggleNewGraphModal();
                toggleProviderConfigModal();
              }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#4F46E5',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {activeProvider ? 'Đổi cấu hình' : 'Thiết lập ngay'}
            </button>
          </div>

          {/* Topic Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Chủ Đề Hoặc Vấn Đề Cần Phân Tích *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Nhập tên bài toán, sự cố, tình huống thực tế..."
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAiGenerating) handleGenerate();
              }}
            />
          </div>

          {/* Quick Suggestions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Lightbulb size={14} color="#F59E0B" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Gợi ý đề tài mẫu:</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTopic(s.title);
                    setDomain(s.domain);
                  }}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Ngành Nghề / Lĩnh Vực Chuyên Môn
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as any)}
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
              <option value="auto">✨ Tự động nhận diện theo chủ đề (Khuyên dùng)</option>
              <option value="technology">Công nghệ & Hệ thống phần mềm</option>
              <option value="healthcare">Y tế, Lâm sàng & Dược học</option>
              <option value="legal">Luật pháp, Hợp đồng & Tuân thủ</option>
              <option value="business">Tài chính, Kinh doanh & Vận hành</option>
              <option value="science">Khoa học tự nhiên & Nghiên cứu</option>
              <option value="universal">Mô hình phổ quát (Đa lĩnh vực)</option>
            </select>
          </div>

          {/* Optional Prompt */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Yêu Cầu Tinh Chỉnh Bổ Sung (Không bắt buộc)
            </label>
            <textarea
              rows={2}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Ví dụ: Tập trung phân tích rủi ro tương tranh dữ liệu, hoặc Đi sâu vào phác đồ điều trị ban đầu..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Progress Banner if generating */}
          {isAiGenerating && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div className="spinner-ai" style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#4338CA' }}>
                {aiStatusMessage || 'Đang tạo đồ thị tri thức...'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC'
          }}
        >
          <button
            onClick={toggleNewGraphModal}
            disabled={isAiGenerating}
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
            Hủy
          </button>
          <button
            onClick={handleGenerate}
            disabled={isAiGenerating}
            style={{
              padding: '8px 22px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              background: isAiGenerating ? '#94A3B8' : '#4F46E5',
              color: '#FFFFFF',
              cursor: isAiGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Sparkles size={16} />
            <span>{isAiGenerating ? 'Đang Tạo Đồ Thị...' : 'Sinh Đồ Thị Tri Thức'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
