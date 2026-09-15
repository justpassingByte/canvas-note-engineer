import React, { useState, useEffect } from 'react';
import {
  Zap,
  Brain,
  Volume2,
  Layers,
  HelpCircle,
  Code2,
  Scale,
  AlertOctagon,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Flame,
  Check,
  Compass,
  Target
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';
import { useGraphStore } from '../../store/useGraphStore.js';
import { GapStatus } from '../../types/interviewTypes.js';
import { resolveTopicCrossLinkNodeId, jumpToCanvasNode, getNodeMeta } from '../../utils/canvasNavigator.js';

interface CheatsheetReaderProps {
  onOpenDomains?: () => void;
}

export const CheatsheetReader: React.FC<CheatsheetReaderProps> = ({ onOpenDomains }) => {
  const {
    allTopics,
    topics,
    selectedTopicId,
    isLoading,
    updateTopicProgress,
    timerDuration,
    timeLeft,
    isTimerRunning,
    setTimerDuration,
    startTimer,
    pauseTimer,
    resetTimer,
    tickTimer
  } = useInterviewStore();

  const { selectNode } = useGraphStore();

  const [activeLayer, setActiveLayer] = useState<'l1' | 'l2' | 'l3'>('l3');
  const [showCodeFix, setShowCodeFix] = useState(false);
  const [openFollowUpIdx, setOpenFollowUpIdx] = useState<number | null>(null);

  // Exact topic matching without fallback to stale previous domain topics
  const topic = selectedTopicId
    ? (topics.find((t) => t.id === selectedTopicId) || allTopics.find((t) => t.id === selectedTopicId) || null)
    : (topics[0] || allTopics[0] || null);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, tickTimer]);

  if (!topic) {
    if (isLoading) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B7280',
          padding: '32px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid #EEF2FF',
            borderTopColor: '#4F46E5',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px'
          }} />
          <p style={{ fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>Đang nạp dữ liệu phản xạ...</p>
        </div>
      );
    }

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280',
        padding: '32px'
      }}>
        <Brain size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Chưa chọn chủ đề phản xạ nào</h3>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>Vui lòng chọn một domain và topic ở sidebar bên trái hoặc bấm "Sinh AI".</p>
      </div>
    );
  }

  const currentStatus = topic.progress?.gap_status || 'MUST_LEARN';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      key={topic.id}
      className="cheatsheet-reader fade-in-topic"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 36px',
        background: '#FFFFFF',
        color: '#1F2937',
        lineHeight: 1.6
      }}
    >
      {/* 1. Header Area: 2-Row Layout (Meta Row + Title & Status Row) */}
      <div className="cheatsheet-hero-header">
        {/* Row 1: Domain Meta & Canvas Cross-Link */}
        <div className="cheatsheet-hero-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="cheatsheet-domain-tag">
              {topic.domain_title}
            </span>
            {onOpenDomains && (
              <button
                className="nut-doi-domain-mini"
                onClick={onOpenDomains}
                title="Mở danh sách 29 Domain để đổi chủ đề"
              >
                <span>Đổi Domain ▾</span>
              </button>
            )}
          </div>

          {(() => {
            const targetNodeId = resolveTopicCrossLinkNodeId(topic);
            const meta = getNodeMeta(targetNodeId);
            return (
              <button
                className="nut-cross-link-canvas-mini"
                onClick={() => {
                  selectNode(targetNodeId);
                  jumpToCanvasNode(targetNodeId);
                }}
                title={`Mở và phóng to node "${meta.title}" trên Canvas`}
              >
                <Compass size={13} />
                <span>Sơ đồ: {meta.title}</span>
                <ExternalLink size={11} style={{ opacity: 0.8 }} />
              </button>
            );
          })()}
        </div>

        {/* Row 2: Title H1 & Gap Status Segmented Bar */}
        <div className="cheatsheet-title-row">
          <h1 className="cheatsheet-title-h1">
            {topic.title}
          </h1>

          {/* Gap Status Linear/Apple Segmented Pill Bar */}
          <div className="gap-status-segmented-bar">
            {[
              { status: 'MUST_LEARN' as GapStatus, label: 'Cần học', color: '#E11D48', dotBg: '#F43F5E', border: 'rgba(244, 63, 94, 0.35)' },
              { status: 'WEAK' as GapStatus, label: 'Yếu', color: '#D97706', dotBg: '#F59E0B', border: 'rgba(245, 158, 11, 0.35)' },
              { status: 'KNOW' as GapStatus, label: 'Đã biết', color: '#2563EB', dotBg: '#3B82F6', border: 'rgba(59, 130, 246, 0.35)' },
              { status: 'READY' as GapStatus, label: 'Sẵn sàng', color: '#059669', dotBg: '#10B981', border: 'rgba(16, 185, 129, 0.4)' }
            ].map(({ status, label, color, dotBg, border }) => {
              const isCurrent = currentStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => updateTopicProgress(topic.id, status)}
                  className={`nut-trang-thai-pill ${isCurrent ? 'active' : ''}`}
                  style={{
                    color: isCurrent ? color : '#64748B',
                    borderColor: isCurrent ? border : 'transparent'
                  }}
                  title={`Đánh dấu tiến độ: ${label}`}
                >
                  <span
                    className="pill-dot"
                    style={{
                      backgroundColor: dotBg,
                      boxShadow: isCurrent ? `0 0 7px ${dotBg}` : 'none'
                    }}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Bento Grid: Intent + Trigger Keywords (Col 1) & 5-Second Recall (Col 2) */}
      <div className="bento-intro-grid">
        {/* Col 1: Target Intent & Trigger Keywords */}
        <div className="bento-card bento-card-intent">
          <div className="bento-intent-label">
            <Target size={14} color="#2563EB" />
            <span>INTERVIEWER ĐANG TEST GÌ?</span>
          </div>
          <p className="bento-intent-text">
            {topic.target_intent}
          </p>

          {/* Trigger Keywords Flow */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#6366F1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={12} />
              <span>CHUỖI TỪ KHÓA BẬT PHẢN XẠ:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {topic.trigger_keywords.map((kw, idx) => (
                <React.Fragment key={idx}>
                  <span className="chip-trigger-kw">
                    {kw}
                  </span>
                  {idx < topic.trigger_keywords.length - 1 && (
                    <span style={{ color: '#818CF8', fontWeight: 800, fontSize: '11px' }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: 5-Second Recall Card */}
        <div className="bento-card bento-card-recall">
          <div className="bento-recall-label">
            <Brain size={14} color="#A5B4FC" />
            <span>5-SECOND RECALL (MÔ HÌNH NẰM LÒNG)</span>
          </div>
          <p className="bento-recall-text">
            {topic.recall_5s}
          </p>
        </div>
      </div>

      {/* 4. Interview Spoken Answer & Speech Practice Timer */}
      <div style={{
        border: '1.5px solid #E0E7FF',
        borderRadius: '8px',
        background: '#F8FAFC',
        padding: '16px 18px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
            <Volume2 size={16} color="#4F46E5" />
            <span>CÂU TRẢ LỜI MẪU NÓI TRỰC TIẾP (20–40 GIÂY)</span>
          </div>

          {/* Speech Practice Timer Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '2px 8px' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 800,
              color: timeLeft <= 5 && isTimerRunning ? '#DC2626' : '#1F2937',
              minWidth: '38px',
              textAlign: 'center'
            }}>
              {formatTime(timeLeft)}
            </span>

            <button
              onClick={() => isTimerRunning ? pauseTimer() : startTimer()}
              style={{
                background: isTimerRunning ? '#FEF2F2' : '#EEF2FF',
                color: isTimerRunning ? '#DC2626' : '#4F46E5',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 6px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              {isTimerRunning ? <Pause size={11} /> : <Play size={11} />}
              <span>{isTimerRunning ? 'Dừng' : 'Luyện Nói'}</span>
            </button>

            <button
              onClick={resetTimer}
              style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '3px' }}
              title="Đặt lại đồng hồ"
            >
              <RotateCcw size={12} />
            </button>

            {/* Quick time switcher */}
            <select
              value={timerDuration}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '10px',
                color: '#4B5563',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>60s</option>
            </select>
          </div>
        </div>

        <p style={{
          fontSize: '13.5px',
          color: '#1E293B',
          fontStyle: 'italic',
          lineHeight: 1.6,
          background: '#FFFFFF',
          padding: '12px 14px',
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
          margin: 0
        }}>
          "{topic.interview_answer}"
        </p>
      </div>

      {/* 5. Interactive Layer Switcher (L1 / L2 / L3) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Layers size={16} color="#4F46E5" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>PHÂN TẦNG NHẬN THỨC THEO KINH NGHIỆM</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveLayer('l1')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: activeLayer === 'l1' ? 800 : 600,
              background: activeLayer === 'l1' ? '#EEF2FF' : 'transparent',
              color: activeLayer === 'l1' ? '#4F46E5' : '#6B7280',
              border: activeLayer === 'l1' ? '1px solid #C7D2FE' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            L1 — Junior Recall (Là gì)
          </button>
          <button
            onClick={() => setActiveLayer('l2')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: activeLayer === 'l2' ? 800 : 600,
              background: activeLayer === 'l2' ? '#EEF2FF' : 'transparent',
              color: activeLayer === 'l2' ? '#4F46E5' : '#6B7280',
              border: activeLayer === 'l2' ? '1px solid #C7D2FE' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            L2 — Middle Explanation (Tại sao hoạt động như vậy)
          </button>
          <button
            onClick={() => setActiveLayer('l3')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: activeLayer === 'l3' ? 800 : 600,
              background: activeLayer === 'l3' ? '#FEF3C7' : 'transparent',
              color: activeLayer === 'l3' ? '#B45309' : '#6B7280',
              border: activeLayer === 'l3' ? '1px solid #FDE68A' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            L3 — 3 YoE Interview (Trade-offs & Production Implication)
          </button>
        </div>

        <div style={{
          marginTop: '10px',
          background: '#F8FAFC',
          padding: '12px 14px',
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
          fontSize: '13px',
          color: '#1E293B',
          lineHeight: 1.6
        }}>
          {activeLayer === 'l1' && <div><strong>Tầng Junior:</strong> {topic.layers.l1_junior}</div>}
          {activeLayer === 'l2' && <div><strong>Tầng Middle:</strong> {topic.layers.l2_middle}</div>}
          {activeLayer === 'l3' && <div><strong>Tầng 3 YoE Thực Chiến:</strong> {topic.layers.l3_senior}</div>}
        </div>
      </div>

      {/* 5.5. Kiến trúc hệ thống liên quan (Canvas Interactive Bridge) */}
      {(() => {
        const targetNodeId = resolveTopicCrossLinkNodeId(topic);
        const meta = getNodeMeta(targetNodeId);
        return (
          <div style={{
            margin: '0 0 24px 0',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '1.5px solid #C7D2FE',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
              }}>
                <Compass size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TẦNG HỆ THỐNG LIÊN QUAN: {meta.layer}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E1B4B', marginTop: '1px' }}>
                  Node Canvas: {meta.title}
                </div>
                <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px' }}>
                  {meta.description}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                selectNode(targetNodeId);
                jumpToCanvasNode(targetNodeId);
              }}
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '7px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <ExternalLink size={13} />
              <span>Chuyển sang Canvas để xem kỹ</span>
            </button>
          </div>
        );
      })()}

      {/* 6. "Why?" Ladder */}
      {topic.why_ladder && topic.why_ladder.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
            <HelpCircle size={15} color="#D97706" />
            <span>BẬC THANG "WHY?" (ĐÀO SÂU TẬN GỐC RỄ NGUYÊN NHÂN)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topic.why_ladder.map((item, idx) => (
              <div
                key={idx}
                className="bac-thang-why-item"
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  ['--why-depth' as any]: idx,
                  borderLeft: '3px solid #D97706'
                }}
              >
                <div style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: '1px'
                }}>
                  {idx + 1}
                </div>
                <div style={{ fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: '#B45309' }}>{item.question}</div>
                  <div style={{ color: '#374151', marginTop: '2px' }}>→ {item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Code Reaction & Practical Example */}
      {topic.code_reaction && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
            <Code2 size={15} color="#2563EB" />
            <span>CODE REACTION (NHẬN DIỆN LỖ HỔNG & PHẢN ĐOÁN HÀNH VI)</span>
          </div>

          <div style={{
            background: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '6px',
            padding: '12px 14px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11.5px',
            overflowX: 'auto',
            marginBottom: '8px'
          }}>
            <pre style={{ margin: 0 }}>{topic.code_reaction.code}</pre>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
            <div style={{ fontWeight: 800, color: '#1E40AF', marginBottom: '4px' }}>
              ❓ Câu hỏi phản xạ: {topic.code_reaction.question}
            </div>

            <button
              onClick={() => setShowCodeFix(!showCodeFix)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              {showCodeFix ? 'Ẩn phân tích lỗi' : 'Xem phân tích & Code Fix'}
            </button>

            {showCodeFix && (
              <div style={{ marginTop: '8px', borderTop: '1px solid #DBEAFE', paddingTop: '8px', color: '#1E3A8A' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong>Giải thích:</strong> {topic.code_reaction.explanation}</p>
                {topic.code_reaction.fix && (
                  <div style={{ background: '#1E293B', color: '#34D399', padding: '8px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                    <strong>Code Fix:</strong> {topic.code_reaction.fix}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Practical Example Scenario */}
      {topic.practical_example && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
            💻 VÍ DỤ THỰC CHIẾN: {topic.practical_example.title || 'Mẫu áp dụng'}
          </div>
          {topic.practical_example.scenario && (
            <p style={{ fontSize: '12.5px', color: '#4B5563', margin: '0 0 8px 0' }}>
              <strong>Ngữ cảnh:</strong> {topic.practical_example.scenario}
            </p>
          )}
          {topic.practical_example.code && (
            <div style={{
              background: '#1E293B',
              color: '#F1F5F9',
              borderRadius: '6px',
              padding: '12px 14px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11.5px',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0 }}>{topic.practical_example.code}</pre>
            </div>
          )}
        </div>
      )}

      {/* 9. Trade-offs Matrix */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
          <Scale size={15} color="#059669" />
          <span>TRADE-OFFS & QUYẾT ĐỊNH KỸ THUẬT</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontWeight: 800, color: '#065F46', fontSize: '11.5px', marginBottom: '4px' }}>✅ KHI NÀO DÙNG:</div>
            <div style={{ fontSize: '12px', color: '#047857' }}>{topic.trade_offs.when_use}</div>
          </div>

          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontWeight: 800, color: '#991B1B', fontSize: '11.5px', marginBottom: '4px' }}>❌ KHI NÀO KHÔNG DÙNG:</div>
            <div style={{ fontSize: '12px', color: '#B91C1C' }}>{topic.trade_offs.when_not_use}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontWeight: 700, color: '#374151', fontSize: '11px', marginBottom: '4px' }}>ƯU ĐIỂM (PROS):</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#4B5563' }}>
              {topic.trade_offs.pros.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontWeight: 700, color: '#374151', fontSize: '11px', marginBottom: '4px' }}>NHƯỢC ĐIỂM (CONS):</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#4B5563' }}>
              {topic.trade_offs.cons.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* 10. Follow-up Questions & Common Traps */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
          <Flame size={15} color="#DC2626" />
          <span>FOLLOW-UP QUESTIONS & COMMON TRAPS</span>
        </div>

        {/* Traps */}
        {topic.common_traps && topic.common_traps.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px 12px', marginBottom: '10px' }}>
            <div style={{ fontWeight: 800, color: '#991B1B', fontSize: '11.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={13} />
              <span>CÁC CÂU TRẢ LỜI SAI / HIỂU LẦM TAI HẠI PHỔ BIẾN:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#7F1D1D' }}>
              {topic.common_traps.map((trap, idx) => (
                <li key={idx} style={{ marginBottom: '2px' }}>{trap}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow ups */}
        {topic.follow_ups && topic.follow_ups.map((fu, idx) => {
          const isOpen = openFollowUpIdx === idx;
          return (
            <div
              key={idx}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                marginBottom: '6px',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => setOpenFollowUpIdx(isOpen ? null : idx)}
                style={{
                  padding: '8px 12px',
                  background: '#F9FAFB',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <span>Q: {fu.question}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {isOpen && (
                <div style={{ padding: '10px 12px', fontSize: '12px', color: '#374151', background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
                  <strong>Khung trả lời:</strong> {fu.answer_skeleton}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
