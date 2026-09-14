import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Compass,
  ExternalLink
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';
import { useGraphStore } from '../../store/useGraphStore.js';
import { resolveTopicCrossLinkNodeId, jumpToCanvasNode, getNodeMeta } from '../../utils/canvasNavigator.js';

export const GapMapDashboard: React.FC = () => {
  const {
    domains,
    topics,
    gapMapSummary,
    selectDomain,
    setActiveTab
  } = useInterviewStore();

  const totalTopics = gapMapSummary?.total_topics || topics.length;
  const readyCount = gapMapSummary?.ready_count || 0;
  const knowCount = gapMapSummary?.know_count || 0;
  const weakCount = gapMapSummary?.weak_count || 0;
  const mustLearnCount = gapMapSummary?.must_learn_count || totalTopics;
  const readyPct = gapMapSummary?.ready_percentage || (totalTopics > 0 ? Math.round((readyCount / totalTopics) * 100) : 0);

  const ROUTINE_STEPS = [
    { time: '10 min', title: 'Rapid Recall', desc: 'Luyện 5–10 câu hỏi phản xạ 10–20 giây trên Flashcard Drill', icon: '⚡' },
    { time: '20 min', title: 'Deep Topic', desc: 'Đọc sâu tầng L3 & Bậc thang Why-Ladder của 1 topic trọng tâm', icon: '🔍' },
    { time: '20 min', title: 'Scenario & Failure', desc: 'Phân tích tình huống sự cố thực tế & cách debug khi hệ thống sập', icon: '💥' },
    { time: '10 min', title: 'Explain Out Loud', desc: 'Bật đồng hồ luyện nói và giải thích to thành tiếng như đang phỏng vấn', icon: '🗣️' }
  ];

  const SPACED_SCHEDULE = [
    { day: 'Day 0', task: 'Tự giải thích toàn bộ kiến thức vừa đọc bằng trí nhớ, không nhìn tài liệu.', status: 'Khởi động' },
    { day: 'Day 1', task: 'Lật 3 câu hỏi Flashcard bất ngờ và trả lời trong 30 giây.', status: 'Củng cố' },
    { day: 'Day 3', task: 'Giải quyết 2 bài toán tình huống thực tế (Scenario Drills).', status: 'Áp dụng' },
    { day: 'Day 7', task: 'Vẽ lại luồng kiến trúc hệ thống và giải thích trade-offs không ghi chú.', status: 'Khắc sâu' },
    { day: 'Day 14', task: 'Thực hiện 1 buổi Mock Interview chuyên sâu về domain.', status: 'Kiểm tra' },
    { day: 'Day 30', task: 'Phỏng vấn trộn ngẫu nhiên tất cả các domain (Mixed Mock Mode).', status: 'Thành thạo' }
  ];

  return (
    <div className="gap-map-dashboard" style={{
      flex: 1,
      overflowY: 'auto',
      padding: '28px 36px',
      background: '#F8FAFC',
      color: '#1E293B'
    }}>
      {/* 1. Header & Summary Stats */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ĐÁNH GIÁ NĂNG LỰC & ĐỘ SẴN SÀNG PHỎNG VẤN 3 YOE
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '4px 0 16px 0' }}>
          Personal Gap Map & 30-Day Active Recall Program
        </h1>

        {/* 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Card 1: Readiness Score */}
          <div style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 100%)',
            color: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(55, 48, 163, 0.15)'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#C7D2FE', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={15} />
              <span>INTERVIEW READINESS</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px' }}>
              {readyPct}%
            </div>
            <div style={{ fontSize: '11.5px', color: '#E0E7FF', marginTop: '2px' }}>
              {readyCount} / {totalTopics} topics đã sẵn sàng
            </div>
          </div>

          {/* Card 2: Must Learn */}
          <div style={{ background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#991B1B' }}>🔴 CẦN HỌC (MUST LEARN)</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{mustLearnCount}</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>Chưa thuộc mental model cốt lõi</div>
          </div>

          {/* Card 3: Weak */}
          <div style={{ background: '#FFFFFF', border: '1px solid #FED7AA', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9A3412' }}>🟠 YẾU / CẦN LUYỆN (WEAK)</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#EA580C', marginTop: '4px' }}>{weakCount}</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>Thường bị ngắc ngứ khi đào sâu</div>
          </div>

          {/* Card 4: Know & Ready */}
          <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>🟢 SẴN SÀNG & 🟡 ĐÃ BIẾT</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>{readyCount + knowCount}</div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>Phản xạ tự tin dưới 15 giây</div>
          </div>
        </div>
      </div>

      {/* 2. Daily 60-Minute Routine Formula */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Clock size={18} color="#4F46E5" />
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            CÔNG THỨC 60 PHÚT PHẢN XẠ MỖI NGÀY (DAILY INTERVIEW ROUTINE)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {ROUTINE_STEPS.map((step, idx) => (
            <div
              key={idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>{step.icon}</span>
                <span style={{
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {step.time}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.45 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 29-Domain Gap Map Visual Matrix */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#4F46E5" />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              MA TRẬN NĂNG LỰC 29 DOMAIN KỸ SƯ
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Bấm vào domain để xem chi tiết các topic</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px'
        }}>
          {domains.map((d) => {
            const domainReadyPct = d.total_topics > 0 ? Math.round((d.ready_count / d.total_topics) * 100) : 0;

            return (
              <div
                key={d.id}
                onClick={() => {
                  selectDomain(d.id);
                  setActiveTab('reader');
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#4F46E5';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '10px',
                        fontWeight: 800
                      }}>
                        #{d.number}
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                        {d.title}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#4F46E5' }}>
                      {d.total_topics} topics
                    </span>
                  </div>

                  <p style={{
                    fontSize: '11px',
                    color: '#64748B',
                    margin: '6px 0 10px 0',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {d.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{
                    height: '6px',
                    background: '#E2E8F0',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    display: 'flex',
                    marginBottom: '6px'
                  }}>
                    {d.total_topics > 0 ? (
                      <>
                        <div style={{ width: `${(d.ready_count / d.total_topics) * 100}%`, background: '#10B981' }} title="Ready" />
                        <div style={{ width: `${(d.know_count / d.total_topics) * 100}%`, background: '#F59E0B' }} title="Know" />
                        <div style={{ width: `${(d.weak_count / d.total_topics) * 100}%`, background: '#F97316' }} title="Weak" />
                        <div style={{ width: `${(d.must_learn_count / d.total_topics) * 100}%`, background: '#EF4444' }} title="Must Learn" />
                      </>
                    ) : (
                      <div style={{ width: '100%', background: '#F1F5F9' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B' }}>
                    <span>🟢 {d.ready_count} sẵn sàng</span>
                    <span>{domainReadyPct}%</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectDomain(d.id);
                        setActiveTab('reader');
                      }}
                      style={{
                        flex: 1,
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Đọc Cheatsheet
                    </button>

                    {(() => {
                      const targetNodeId = resolveTopicCrossLinkNodeId(null, d.id);
                      const meta = getNodeMeta(targetNodeId);
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            useGraphStore.getState().selectNode(targetNodeId);
                            jumpToCanvasNode(targetNodeId);
                          }}
                          style={{
                            background: '#FFFFFF',
                            color: '#374151',
                            border: '1px solid #D1D5DB',
                            borderRadius: '5px',
                            padding: '5px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Xem sơ đồ kiến trúc node ${meta.title}`}
                        >
                          <Compass size={12} />
                          <span>Sơ đồ Canvas</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Spaced Repetition Roadmap */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Calendar size={18} color="#4F46E5" />
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            LỘ TRÌNH ÔN TẬP NGẮT QUÃNG 30 NGÀY (SPACED REPETITION SCHEDULE)
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SPACED_SCHEDULE.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {item.day}
                </span>
                <span style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 500 }}>
                  {item.task}
                </span>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#6366F1',
                background: '#F5F3FF',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
