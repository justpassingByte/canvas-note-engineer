import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Zap,
  Brain,
  Volume2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Compass,
  ExternalLink
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';
import { useGraphStore } from '../../store/useGraphStore.js';
import { GapStatus } from '../../types/interviewTypes.js';
import { resolveTopicCrossLinkNodeId, jumpToCanvasNode, getNodeMeta } from '../../utils/canvasNavigator.js';

interface FlashcardDrillProps {
  onOpenDomains?: () => void;
}

export const FlashcardDrill: React.FC<FlashcardDrillProps> = ({ onOpenDomains }) => {
  const {
    topics,
    domains,
    drillIndex,
    isCardFlipped,
    drillFilterDomain,
    drillFilterStatus,
    setDrillFilterDomain,
    setDrillFilterStatus,
    flipCard,
    nextDrillCard,
    prevDrillCard,
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

  // Filter topics for the drill deck
  const deck = topics.filter((t) => {
    if (drillFilterDomain !== 'ALL' && t.domain_id !== drillFilterDomain) return false;
    if (drillFilterStatus !== 'ALL') {
      const status = t.progress?.gap_status || 'MUST_LEARN';
      if (status !== drillFilterStatus) return false;
    }
    return true;
  });

  const currentIndex = Math.min(drillIndex, Math.max(0, deck.length - 1));
  const currentCard = deck[currentIndex];

  // Timer tick
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

  // Keyboard Shortcuts: Space to flip, 1-4 to rate, arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextDrillCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevDrillCard();
      } else if (e.key === '1' && currentCard) {
        updateTopicProgress(currentCard.id, 'MUST_LEARN');
        nextDrillCard();
      } else if (e.key === '2' && currentCard) {
        updateTopicProgress(currentCard.id, 'WEAK');
        nextDrillCard();
      } else if (e.key === '3' && currentCard) {
        updateTopicProgress(currentCard.id, 'KNOW');
        nextDrillCard();
      } else if (e.key === '4' && currentCard) {
        updateTopicProgress(currentCard.id, 'READY');
        nextDrillCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, flipCard, nextDrillCard, prevDrillCard, updateTopicProgress]);

  if (deck.length === 0) {
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
        <AlertCircle size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#374151' }}>
          Không có thẻ nào phù hợp với bộ lọc hiện tại
        </h3>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>
          Thử đổi bộ lọc Domain hoặc chọn "Tất cả trạng thái".
        </p>
        <button
          onClick={() => {
            setDrillFilterDomain('ALL');
            setDrillFilterStatus('ALL');
          }}
          style={{
            marginTop: '12px',
            background: '#4F46E5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Bỏ lọc để xem toàn bộ thẻ
        </button>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentStatus = currentCard.progress?.gap_status || 'MUST_LEARN';

  return (
    <div className="flashcard-drill" style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#F8FAFC',
      padding: '20px 32px',
      overflowY: 'auto'
    }}>
      {/* 1. Filter & Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* Left: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <Filter size={14} color="#6B7280" />
          {/* Domain filter */}
          <select
            value={drillFilterDomain}
            onChange={(e) => setDrillFilterDomain(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              maxWidth: '180px'
            }}
          >
            <option value="ALL">Tất cả Domain ({topics.length} topics)</option>
            {domains.filter(d => d.total_topics > 0).map(d => (
              <option key={d.id} value={d.id}>Domain {d.number}: {d.title} ({d.total_topics})</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={drillFilterStatus}
            onChange={(e) => setDrillFilterStatus(e.target.value as GapStatus | 'ALL')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              maxWidth: '140px'
            }}
          >
            <option value="ALL">Tất cả mức độ nhớ</option>
            <option value="MUST_LEARN">🔴 Chỉ thẻ Cần học (Must Learn)</option>
            <option value="WEAK">🟠 Chỉ thẻ Yếu / Hay quên (Weak)</option>
            <option value="KNOW">🟡 Chỉ thẻ Đã biết (Know)</option>
            <option value="READY">🟢 Chỉ thẻ Sẵn sàng (Ready)</option>
          </select>
        </div>

        {/* Right: Progress counter & Speech Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#4B5563' }}>
            Thẻ {currentIndex + 1} / {deck.length}
          </div>

          {/* Speech Timer */}
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
                cursor: 'pointer'
              }}
            >
              {isTimerRunning ? <Pause size={11} /> : <Play size={11} />}
            </button>

            <button onClick={resetTimer} style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '2px' }}>
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main 3D Flip Card Container */}
      <div
        className="the-flashcard-chinh"
        onClick={flipCard}
        style={{
          background: '#FFFFFF',
          border: isCardFlipped ? '2px solid #4F46E5' : '1.5px solid #E2E8F0',
          borderRadius: '12px',
          boxShadow: isCardFlipped
            ? '0 10px 25px -5px rgba(79, 70, 229, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          marginBottom: '16px'
        }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#EEF2FF',
              color: '#4F46E5',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>
              {currentCard.domain_title}
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
              {isCardFlipped ? 'MẶT SAU: PHẢN XẠ & MENTAL MODEL' : 'MẶT TRƯỚC: CÂU HỎI PHỎNG VẤN'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
            <RotateCw size={13} />
            <span>Bấm thẻ hoặc phím [Space] để lật</span>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 0' }}>
          {!isCardFlipped ? (
            /* FRONT: Question / Scenario */
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#6366F1', marginBottom: '8px', letterSpacing: '0.05em' }}>
                INTERVIEWER HỎI BẠN:
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                {currentCard.title}
              </h2>

              <div style={{
                background: '#F8FAFC',
                borderLeft: '4px solid #3B82F6',
                padding: '12px 16px',
                borderRadius: '0 8px 8px 0',
                fontSize: '13px',
                color: '#334155'
              }}>
                <strong>🎯 Điểm mấu chốt interviewer đang kiểm tra:</strong> {currentCard.target_intent}
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                💭 <em>Tập nói to câu trả lời trong 15-30 giây trước khi lật thẻ đối chiếu...</em>
              </div>
            </div>
          ) : (
            /* BACK: Trigger Keywords + 5s Recall + Spoken Answer */
            <div>
              {/* Trigger keywords */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5', marginBottom: '6px' }}>
                  ⚡ TRIGGER KEYWORDS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {currentCard.trigger_keywords.map((kw, i) => (
                    <React.Fragment key={i}>
                      <span style={{
                        background: '#EEF2FF',
                        color: '#3730A3',
                        border: '1px solid #C7D2FE',
                        borderRadius: '5px',
                        padding: '3px 8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {kw}
                      </span>
                      {i < currentCard.trigger_keywords.length - 1 && (
                        <span style={{ color: '#818CF8', fontWeight: 800, fontSize: '12px' }}>→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 5s Recall */}
              <div style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                color: '#FAF5FF',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#A5B4FC', marginBottom: '4px' }}>
                  🧠 5-SECOND RECALL:
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.5 }}>
                  {currentCard.recall_5s}
                </div>
              </div>

              {/* Spoken Answer */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  🗣️ CÂU TRẢ LỜI MẪU (20–40S):
                </div>
                <div style={{ fontSize: '12.5px', color: '#1E293B', fontStyle: 'italic', lineHeight: 1.55 }}>
                  "{currentCard.interview_answer}"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Recall Status & Cross-link to Canvas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Độ thành thạo hiện tại: <strong>
              {currentStatus === 'READY' ? '🟢 Sẵn sàng' :
               currentStatus === 'KNOW' ? '🟡 Đã biết' :
               currentStatus === 'WEAK' ? '🟠 Yếu' : '🔴 Cần học'}
            </strong> ({currentCard.progress?.reviewed_count || 0} lần ôn)
          </div>

          {(() => {
            const targetNodeId = resolveTopicCrossLinkNodeId(currentCard);
            const meta = getNodeMeta(targetNodeId);
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  useGraphStore.getState().selectNode(targetNodeId);
                  jumpToCanvasNode(targetNodeId);
                }}
                style={{
                  background: '#EEF2FF',
                  color: '#4338CA',
                  border: '1px solid #C7D2FE',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={`Chưa hiểu? Chuyển sang Canvas xem kiến trúc ${meta.title}`}
              >
                <Compass size={12} />
                <span>Xem Sơ đồ ({meta.title})</span>
                <ExternalLink size={10} />
              </button>
            );
          })()}
        </div>
      </div>

      {/* 3. Bottom Action Bar: 4-Level Manual Self-Rating & Navigation */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={prevDrillCard}
            disabled={currentIndex === 0}
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: currentIndex === 0 ? '#9CA3AF' : '#374151',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={14} />
            <span>Trước [←]</span>
          </button>

          <button
            onClick={nextDrillCard}
            disabled={currentIndex >= deck.length - 1}
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: currentIndex >= deck.length - 1 ? '#9CA3AF' : '#374151',
              cursor: currentIndex >= deck.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Sau [→]</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 4 Manual Rating Buttons */}
        <div className="nhom-nut-danh-gia-flashcard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
          {[
            { status: 'MUST_LEARN' as GapStatus, num: '1', label: 'Chưa nhớ', dotBg: '#F43F5E', color: '#9F1239', bg: '#FFF1F2', border: '#FECDD3' },
            { status: 'WEAK' as GapStatus, num: '2', label: 'Yếu / Khó', dotBg: '#F59E0B', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
            { status: 'KNOW' as GapStatus, num: '3', label: 'Đã biết', dotBg: '#3B82F6', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
            { status: 'READY' as GapStatus, num: '4', label: 'Sẵn sàng', dotBg: '#10B981', color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' }
          ].map(({ status, num, label, dotBg, color, bg, border }) => (
            <button
              key={status}
              onClick={() => {
                updateTopicProgress(currentCard.id, status);
                nextDrillCard();
              }}
              className="nut-danh-gia-card"
              style={{
                background: bg,
                color: color,
                border: `1px solid ${border}`,
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title={`Nhấn phím ${num}`}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: dotBg,
                  boxShadow: `0 0 5px ${dotBg}`,
                  flexShrink: 0
                }}
              />
              <span>{num}. {label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
