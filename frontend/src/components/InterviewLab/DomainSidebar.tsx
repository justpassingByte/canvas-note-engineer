import React, { useState, useMemo } from 'react';
import {
  Code,
  Globe,
  Layers,
  Zap,
  Cpu,
  Compass,
  Database,
  Activity,
  FileCode,
  Server,
  Box,
  Share2,
  Shield,
  HardDrive,
  Flame,
  Repeat,
  Radio,
  UploadCloud,
  CheckCircle2,
  Terminal,
  GitBranch,
  Cloud,
  LayoutGrid,
  Eye,
  Bug,
  Zap as ZapFast,
  AlertTriangle,
  Users,
  Calendar,
  Search,
  BookOpen,
  X,
  Filter
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';
import { DomainMeta, RoleTrack } from '../../types/interviewTypes.js';
import { resolveTopicCrossLinkNodeId, jumpToCanvasNode } from '../../utils/canvasNavigator.js';

interface DomainSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Code: <Code size={14} />,
  Globe: <Globe size={14} />,
  Layers: <Layers size={14} />,
  Zap: <Zap size={14} />,
  Cpu: <Cpu size={14} />,
  Compass: <Compass size={14} />,
  Database: <Database size={14} />,
  Activity: <Activity size={14} />,
  FileCode: <FileCode size={14} />,
  Server: <Server size={14} />,
  Box: <Box size={14} />,
  Share2: <Share2 size={14} />,
  Shield: <Shield size={14} />,
  HardDrive: <HardDrive size={14} />,
  Flame: <Flame size={14} />,
  Repeat: <Repeat size={14} />,
  Radio: <Radio size={14} />,
  UploadCloud: <UploadCloud size={14} />,
  CheckCircle2: <CheckCircle2 size={14} />,
  Terminal: <Terminal size={14} />,
  GitBranch: <GitBranch size={14} />,
  Cloud: <Cloud size={14} />,
  LayoutGrid: <LayoutGrid size={14} />,
  Eye: <Eye size={14} />,
  Bug: <Bug size={14} />,
  ZapFast: <ZapFast size={14} />,
  AlertTriangle: <AlertTriangle size={14} />,
  Users: <Users size={14} />,
  Calendar: <Calendar size={14} />
};

const TRACK_CONFIG: Array<{ id: RoleTrack; label: string; shortLabel: string; icon: string; description: string }> = [
  { id: 'all', label: 'Tất Cả', shortLabel: 'Tất Cả', icon: '📁', description: 'Toàn bộ chuyên mục kỹ sư' },
  { id: 'frontend', label: 'Frontend', shortLabel: 'Frontend', icon: '🌐', description: 'JS, Browser, React, Next.js, Web Perf, TS' },
  { id: 'backend', label: 'Backend', shortLabel: 'Backend', icon: '⚙️', description: 'Node.js, NestJS, APIs, Auth, SQL, Redis, Queues' },
  { id: 'devops_cloud', label: 'AWS & DevOps', shortLabel: 'AWS & DevOps', icon: '☁️', description: 'AWS Ecosystem, Docker, CI/CD, Testing' },
  { id: 'architecture', label: 'Architecture', shortLabel: 'Architect', icon: '🏛️', description: 'System Design, Microservices, Observability, Debug' },
  { id: 'drills', label: 'Drills', shortLabel: 'Drills', icon: '⚡', description: 'Rapid Fire, Scenarios, Mock Interview, Spaced Repetition' }
];

const TRACK_HEADER_LABELS: Record<string, { title: string; color: string; bg: string; icon: string }> = {
  frontend: { title: 'FRONTEND SPECIALIST TRACK', color: '#1D4ED8', bg: '#EFF6FF', icon: '🌐' },
  backend: { title: 'BACKEND SPECIALIST TRACK', color: '#047857', bg: '#ECFDF5', icon: '⚙️' },
  devops_cloud: { title: 'CLOUD & DEVOPS ECOSYSTEM', color: '#B45309', bg: '#FFFBEB', icon: '☁️' },
  architecture: { title: 'SYSTEM ARCHITECT & RELIABILITY', color: '#6D28D9', bg: '#F5F3FF', icon: '🏛️' },
  drills: { title: 'INTERVIEW DRILLS & REFLEX BANK', color: '#BE185D', bg: '#FDF2F8', icon: '⚡' }
};

export const DomainSidebar: React.FC<DomainSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    domains,
    selectedDomainId,
    selectDomain,
    searchQuery,
    setSearchQuery,
    allTopics,
    topics,
    selectedTopicId,
    selectTopic
  } = useInterviewStore();

  const [selectedTrack, setSelectedTrack] = useState<RoleTrack>('all');

  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `domain ${d.number}`.includes(searchQuery.toLowerCase());

      const matchesTrack = selectedTrack === 'all' || d.track === selectedTrack;
      return matchesSearch && matchesTrack;
    });
  }, [domains, searchQuery, selectedTrack]);

  // Group domains by track when in "all" view without search query
  const shouldShowGroupHeaders = selectedTrack === 'all' && !searchQuery.trim();

  let lastTrack: string | null = null;

  return (
    <>
      {isMobileOpen && (
        <div
          className="domain-sidebar-mobile-backdrop"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`domain-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Header & Search */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--net-ke-bang, #E5E7EB)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px', color: '#1F2937' }}>
              <BookOpen size={16} color="#4F46E5" />
              <span>CHỦ ĐỀ PHỎNG VẤN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {onCloseMobile && (
                <button
                  className="nut-dong-sidebar-mobile"
                  onClick={onCloseMobile}
                  title="Đóng danh sách domain (Esc)"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            padding: '5px 8px',
            marginBottom: '8px'
          }}>
            <Search size={13} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Tìm domain, AWS, Docker, REST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '11.5px',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Role / Track Filter Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}>
            {TRACK_CONFIG.map((track) => {
              const isTrackActive = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  title={track.description}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 7px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: isTrackActive ? 700 : 500,
                    border: isTrackActive ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                    background: isTrackActive ? '#4F46E5' : '#F9FAFB',
                    color: isTrackActive ? '#FFFFFF' : '#4B5563',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '11px' }}>{track.icon}</span>
                  <span>{track.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Domain List (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredDomains.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
              Không tìm thấy domain nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredDomains.map((d) => {
              const isSelected = selectedDomainId === d.id;
              const hasTopics = d.total_topics > 0;
              const trackMeta = d.track ? TRACK_HEADER_LABELS[d.track] : null;

              // Render section track header if track changed
              let renderHeader = false;
              if (shouldShowGroupHeaders && d.track && d.track !== lastTrack) {
                renderHeader = true;
                lastTrack = d.track;
              }

              return (
                <React.Fragment key={d.id}>
                  {renderHeader && trackMeta && (
                    <div style={{
                      margin: '12px 0 6px 0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: trackMeta.bg,
                      color: trackMeta.color,
                      fontSize: '9.5px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{trackMeta.icon}</span>
                      <span>{trackMeta.title}</span>
                    </div>
                  )}

                  <div
                    className="sidebar-domain-item"
                    data-domain-id={d.id}
                    onClick={() => selectDomain(d.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      background: isSelected ? '#EEF2FF' : 'transparent',
                      border: isSelected ? '1px solid #C7D2FE' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: isSelected ? '#4F46E5' : '#E5E7EB',
                          color: isSelected ? '#FFFFFF' : '#4B5563',
                          fontSize: '10px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {d.number}
                        </span>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1E1B4B' : '#374151' }}>
                            {d.title}
                          </span>
                        </div>
                      </div>

                      {/* Badge count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
                        {hasTopics ? (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '10px',
                            background: d.ready_count === d.total_topics ? '#DEF7EC' : '#E5E7EB',
                            color: d.ready_count === d.total_topics ? '#03543F' : '#4B5563'
                          }}>
                            {d.total_topics}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>0</span>
                        )}
                      </div>
                    </div>

                    {/* Pre-requisite hint & Mini Status Indicator Dots */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', marginLeft: '28px' }}>
                      {d.prerequisites && d.prerequisites.length > 0 ? (
                        <span style={{
                          fontSize: '9px',
                          color: '#6B7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '120px'
                        }} title={`Tiền đề: ${d.prerequisites.join(', ')}`}>
                          ← {d.prerequisites[0]}
                        </span>
                      ) : (
                        <span style={{ fontSize: '9px', color: '#9CA3AF' }}>Core</span>
                      )}

                      {hasTopics && (
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {d.ready_count > 0 && (
                            <span style={{ fontSize: '9px', color: '#059669' }}>
                              🟢{d.ready_count}
                            </span>
                          )}
                          {d.know_count > 0 && (
                            <span style={{ fontSize: '9px', color: '#D97706' }}>
                              🟡{d.know_count}
                            </span>
                          )}
                          {d.weak_count > 0 && (
                            <span style={{ fontSize: '9px', color: '#EA580C' }}>
                              🟠{d.weak_count}
                            </span>
                          )}
                          {d.must_learn_count > 0 && (
                            <span style={{ fontSize: '9px', color: '#DC2626' }}>
                              🔴{d.must_learn_count}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Show Nested Topics when Selected */}
                    {(() => {
                      const domainTopics = allTopics.length > 0 ? allTopics.filter(t => t.domain_id === d.id) : (isSelected ? topics : []);
                      if (!isSelected || domainTopics.length === 0) return null;

                      return (
                        <div style={{ marginTop: '8px', marginLeft: '16px', borderLeft: '2px solid #C7D2FE', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {domainTopics.map((t) => {
                            const isTopicSelected = selectedTopicId === t.id;
                            const status = t.progress?.gap_status || 'MUST_LEARN';
                            const dot =
                              status === 'READY' ? '🟢' :
                              status === 'KNOW' ? '🟡' :
                              status === 'WEAK' ? '🟠' : '🔴';

                            return (
                              <div
                                key={t.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectTopic(t.id);
                                  onCloseMobile?.();
                                }}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: isTopicSelected ? 700 : 500,
                                  color: isTopicSelected ? '#4F46E5' : '#4B5563',
                                  background: isTopicSelected ? '#FFFFFF' : 'transparent',
                                  boxShadow: isTopicSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>{dot}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {t.title}
                                </span>

                                {isTopicSelected && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const targetNodeId = resolveTopicCrossLinkNodeId(t);
                                      jumpToCanvasNode(targetNodeId);
                                      onCloseMobile?.();
                                    }}
                                    style={{
                                      background: '#EEF2FF',
                                      border: 'none',
                                      borderRadius: '3px',
                                      padding: '2px 4px',
                                      color: '#4F46E5',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '9px',
                                      fontWeight: 700
                                    }}
                                    title="Mở ngay trên Sơ đồ Canvas"
                                  >
                                    <Compass size={11} />
                                    <span>Canvas</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
