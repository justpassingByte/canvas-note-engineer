import React from 'react';
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
  X
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';
import { DomainMeta } from '../../types/interviewTypes.js';
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

  const filteredDomains = domains.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `domain ${d.number}`.includes(searchQuery.toLowerCase())
  );

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
              <span>29 DOMAINS PHỎNG VẤN</span>
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

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#FFFFFF',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          padding: '4px 8px'
        }}>
          <Search size={13} color="#9CA3AF" />
          <input
            type="text"
            placeholder="Tìm theo domain hoặc công nghệ..."
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
      </div>

      {/* Domain List (Scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {filteredDomains.map((d) => {
          const isSelected = selectedDomainId === d.id;
          const hasTopics = d.total_topics > 0;

          return (
            <div
              key={d.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    fontWeight: 800
                  }}>
                    {d.number}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1E1B4B' : '#374151' }}>
                    {d.title}
                  </span>
                </div>

                {/* Badge count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {hasTopics ? (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: d.ready_count === d.total_topics ? '#DEF7EC' : '#E5E7EB',
                      color: d.ready_count === d.total_topics ? '#03543F' : '#4B5563'
                    }}>
                      {d.total_topics} topics
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#9CA3AF' }}>0</span>
                  )}
                </div>
              </div>

              {/* Mini Status Indicator Dots */}
              {hasTopics && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '5px', marginLeft: '28px' }}>
                  {d.ready_count > 0 && (
                    <span style={{ fontSize: '9px', color: '#059669', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      🟢 {d.ready_count}
                    </span>
                  )}
                  {d.know_count > 0 && (
                    <span style={{ fontSize: '9px', color: '#D97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      🟡 {d.know_count}
                    </span>
                  )}
                  {d.weak_count > 0 && (
                    <span style={{ fontSize: '9px', color: '#EA580C', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      🟠 {d.weak_count}
                    </span>
                  )}
                  {d.must_learn_count > 0 && (
                    <span style={{ fontSize: '9px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      🔴 {d.must_learn_count}
                    </span>
                  )}
                </div>
              )}

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
          );
        })}
      </div>
    </aside>
  </>
  );
};
