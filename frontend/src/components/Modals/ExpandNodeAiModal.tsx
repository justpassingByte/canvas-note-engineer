import React, { useState } from 'react';
import { X, Sparkles, GitBranch, ArrowRight } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore.js';

export const ExpandNodeAiModal: React.FC = () => {
  const {
    isExpandWithAiOpen,
    toggleExpandWithAiModal,
    graph,
    selectedNodeId,
    activeProvider,
    toggleProviderConfigModal,
    expandNodeWithAI,
    isAiGenerating,
    aiStatusMessage
  } = useGraphStore();

  const [intent, setIntent] = useState<string>('Biện pháp phòng vệ & Giải pháp đối ứng');
  const [instruction, setInstruction] = useState<string>('');

  if (!isExpandWithAiOpen) return null;

  const targetNode = graph?.nodes.find((n) => n.id === selectedNodeId);

  const intentOptions = [
    'Biện pháp phòng vệ & Giải pháp đối ứng',
    'Phân tích rủi ro & Điểm nghẽn nghiêm trọng',
    'Cơ chế gốc rễ & Mắt xích vận hành',
    'Phân hệ phụ trách & Tương tác ngoại vi',
    'Tùy chỉnh yêu cầu'
  ];

  const handleExpand = async () => {
    if (!targetNode) return;
    if (!activeProvider) {
      alert('Chưa cấu hình AI Provider. Hãy cấu hình Provider trước!');
      toggleExpandWithAiModal();
      toggleProviderConfigModal();
      return;
    }

    await expandNodeWithAI(targetNode.id, intent, instruction);
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
      onClick={toggleExpandWithAiModal}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
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
              <GitBranch size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Hỏi AI Mở Rộng Nhánh
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                Sinh 1-2 node con kế tiếp liên kết logic với khái niệm hiện tại
              </p>
            </div>
          </div>
          <button
            onClick={toggleExpandWithAiModal}
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

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Node Display */}
          {targetNode && (
            <div
              style={{
                padding: '12px 14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: '#4F46E5',
                  marginBottom: '4px'
                }}
              >
                {targetNode.nhan_buoc}
              </span>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                {targetNode.tieu_de}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#475569',
                  lineHeight: 1.4
                }}
                dangerouslySetInnerHTML={{ __html: targetNode.tom_tat }}
              />
            </div>
          )}

          {/* Expansion Intent */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Hướng Phân Tích Mở Rộng Mong Muốn
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {intentOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setIntent(opt)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: intent === opt ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                    background: intent === opt ? '#EEF2FF' : '#FFFFFF',
                    color: intent === opt ? '#4338CA' : '#334155'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Ghi Chú Hoặc Ràng Buộc Thêm (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ví dụ: Chỉ tập trung vào giải pháp 0 I/O in-memory, hoặc Nêu rõ điều khoản bồi thường..."
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

          {/* Active Provider notice */}
          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Provider:</span>
            <strong style={{ color: '#0F172A' }}>
              {activeProvider ? `${activeProvider.name} (${activeProvider.model})` : 'Chưa thiết lập'}
            </strong>
          </div>

          {/* Progress message */}
          {isAiGenerating && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
                fontSize: '12px',
                color: '#4338CA',
                fontWeight: 500
              }}
            >
              {aiStatusMessage || 'Đang mở rộng phân nhánh...'}
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
            onClick={toggleExpandWithAiModal}
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
            Đóng
          </button>
          <button
            onClick={handleExpand}
            disabled={isAiGenerating}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              background: isAiGenerating ? '#94A3B8' : '#4F46E5',
              color: '#FFFFFF',
              cursor: isAiGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={16} />
            <span>{isAiGenerating ? 'Đang Mở Rộng...' : 'Mở Rộng Nhánh Này'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
