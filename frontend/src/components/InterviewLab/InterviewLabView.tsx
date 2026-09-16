import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Zap,
  BarChart2,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Menu,
  Layers
} from 'lucide-react';
import { useInterviewStore } from '../../store/useInterviewStore.js';
import { DomainSidebar } from './DomainSidebar.js';
import { CheatsheetReader } from './CheatsheetReader.js';
import { FlashcardDrill } from './FlashcardDrill.js';
import { GapMapDashboard } from './GapMapDashboard.js';
import { GenerateTopicModal } from './GenerateTopicModal.js';

interface InterviewLabViewProps {
  onBackToCanvas?: () => void;
}

export const InterviewLabView: React.FC<InterviewLabViewProps> = ({ onBackToCanvas }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const {
    activeTab,
    setActiveTab,
    fetchDomains,
    fetchTopics,
    fetchGapMap,
    toggleGenerateModal,
    selectedDomainId
  } = useInterviewStore();

  useEffect(() => {
    fetchDomains();
    fetchTopics(selectedDomainId || undefined);
    fetchGapMap();
  }, [fetchDomains, fetchTopics, fetchGapMap, selectedDomainId]);

  return (
    <div className="interview-lab-view">
      {/* 1. Top Navigation Bar */}
      <header className="interview-lab-header">
        {/* Left: Brand & Back to Canvas */}
        <div className="interview-header-left">
          {onBackToCanvas && (
            <button
              onClick={onBackToCanvas}
              className="nut-quay-lai-canvas"
              style={{
                background: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
              title="Quay lại Sơ đồ Kiến trúc Hệ thống"
            >
              <ArrowLeft size={14} />
              <span>Canvas</span>
            </button>
          )}

          {activeTab !== 'gap_map' && (
            <button
              className="nut-mo-sidebar-mobile"
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Mở danh sách 29 Domain và các Topic"
            >
              <Menu size={14} />
              <span>Domains</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <GraduationCap size={15} />
            </div>
            <div>
              <span className="tieu-de-interview-full" style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827' }}>
                Phòng Luyện Phản Xạ Phỏng Vấn
              </span>
            </div>
          </div>
        </div>

        {/* Center: 3 Hub Tabs */}
        <div className="interview-header-center">
          <button
            onClick={() => {
              setActiveTab('reader');
              setIsMobileSidebarOpen(false);
            }}
            className={`nut-tab-hub ${activeTab === 'reader' ? 'active' : 'inactive'}`}
            title="Sổ Tay Phản Xạ (Cheatsheet)"
          >
            <BookOpen size={13} />
            <span className="tab-label-full">Sổ Tay Phản Xạ (Cheatsheet)</span>
            <span className="tab-label-short">Cheatsheet</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('drill');
              setIsMobileSidebarOpen(false);
            }}
            className={`nut-tab-hub ${activeTab === 'drill' ? 'active' : 'inactive'}`}
            title="Flashcard & Luyện Phản Xạ"
          >
            <Zap size={13} />
            <span className="tab-label-full">Flashcard & Luyện Phản Xạ</span>
            <span className="tab-label-short">Flashcard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gap_map');
              setIsMobileSidebarOpen(false);
            }}
            className={`nut-tab-hub ${activeTab === 'gap_map' ? 'active' : 'inactive'}`}
            title="Gap Map & 30-Day Routine"
          >
            <BarChart2 size={13} />
            <span className="tab-label-full">Gap Map & 30-Day Routine</span>
            <span className="tab-label-short">Gap Map</span>
          </button>
        </div>

        {/* Right: AI Generate Button */}
        <div className="interview-header-right">
          <button
            onClick={() => toggleGenerateModal(true)}
            className="nut-sinh-ai-header"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
            }}
            title="Sinh câu hỏi và cheatsheet bằng AI"
          >
            <Sparkles size={13} />
            <span>Sinh AI</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'gap_map' ? (
          <GapMapDashboard />
        ) : (
          <>
            <DomainSidebar
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
            {activeTab === 'reader' && (
              <CheatsheetReader onOpenDomains={() => setIsMobileSidebarOpen(true)} />
            )}
            {activeTab === 'drill' && (
              <FlashcardDrill onOpenDomains={() => setIsMobileSidebarOpen(true)} />
            )}
          </>
        )}
      </div>

      {/* Modal AI Generator */}
      <GenerateTopicModal />
    </div>
  );
};
