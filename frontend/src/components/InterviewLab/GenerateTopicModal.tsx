import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';

export const GenerateTopicModal: React.FC = () => {
  const {
    domains,
    selectedDomainId,
    isGenerateModalOpen,
    toggleGenerateModal,
    generateTopic,
    generateDomain,
    isGenerating,
    generatingStatus
  } = useInterviewStore();

  const [mode, setMode] = useState<'single' | 'domain'>('single');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [targetDomainId, setTargetDomainId] = useState(selectedDomainId || domains[0]?.id || '');

  if (!isGenerateModalOpen) return null;

  const handleGenerate = async () => {
    if (mode === 'single') {
      if (!topicPrompt.trim()) {
        alert('Vui lòng nhập tên chủ đề kỹ thuật!');
        return;
      }
      await generateTopic(topicPrompt.trim(), targetDomainId);
    } else {
      if (!targetDomainId) {
        alert('Vui lòng chọn domain cần sinh!');
        return;
      }
      await generateDomain(targetDomainId);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        width: '520px',
        maxWidth: '90vw',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAF5FF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: '#9333EA',
              color: '#FFFFFF',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#581C87', margin: 0 }}>
                AI Interview Cheatsheet Generator
              </h3>
              <p style={{ fontSize: '11px', color: '#7E22CE', margin: 0 }}>
                Sinh phản xạ phỏng vấn chuẩn 3 YoE từ LLM Provider đã cấu hình
              </p>
            </div>
          </div>

          <button
            onClick={() => !isGenerating && toggleGenerateModal(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setMode('single')}
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: mode === 'single' ? 700 : 500,
                background: mode === 'single' ? '#FFFFFF' : 'transparent',
                color: mode === 'single' ? '#4F46E5' : '#64748B',
                border: 'none',
                boxShadow: mode === 'single' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer'
              }}
            >
              Sinh 1 Topic Tùy Biến
            </button>
            <button
              onClick={() => setMode('domain')}
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: mode === 'domain' ? 700 : 500,
                background: mode === 'domain' ? '#FFFFFF' : 'transparent',
                color: mode === 'domain' ? '#4F46E5' : '#64748B',
                border: 'none',
                boxShadow: mode === 'domain' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer'
              }}
            >
              Sinh Trọn Gói Domain
            </button>
          </div>

          {/* Domain Picker */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
              Lĩnh vực (Domain):
            </label>
            <select
              value={targetDomainId}
              onChange={(e) => setTargetDomainId(e.target.value)}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '12.5px',
                color: '#1F2937',
                background: '#FFFFFF'
              }}
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  Domain {d.number}: {d.title} ({d.total_topics} topics)
                </option>
              ))}
            </select>
          </div>

          {/* Single Topic Input */}
          {mode === 'single' ? (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                Tên chủ đề hoặc câu hỏi phỏng vấn cần sinh:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: WebSocket reconnection & Redis pub/sub clustering"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '12.5px',
                  color: '#1F2937',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                💡 Gợi ý: Có thể nhập tên công nghệ, cơ chế ("Stale closure", "DLQ retry", "S3 multipart upload"), hoặc tình huống ("Double payment").
              </div>
            </div>
          ) : (
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              color: '#1E40AF',
              marginBottom: '14px'
            }}>
              <strong>Cơ chế sinh Domain:</strong> AI sẽ tự động phân tích Domain đã chọn, trích xuất 3–5 chủ đề quan trọng nhất hay xuất hiện trong phỏng vấn Middle ~3 YoE, và tạo đầy đủ cấu trúc L1-L3, Why-Ladder, Code Reaction vào SQLite.
            </div>
          )}

          {/* Status message when generating */}
          {isGenerating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FAF5FF',
              border: '1px solid #E9D5FF',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#6B21A8',
              marginBottom: '14px'
            }}>
              <Loader2 size={16} className="animate-spin" />
              <span>{generatingStatus || 'Đang kết nối LLM Provider...'}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={() => toggleGenerateModal(false)}
            disabled={isGenerating}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              background: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              color: '#4B5563',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            Đóng
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isGenerating ? '#9CA3AF' : '#4F46E5',
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Bắt đầu sinh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
