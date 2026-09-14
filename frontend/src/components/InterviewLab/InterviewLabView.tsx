import React, { useEffect } from 'react';
import {
  BookOpen,
  Zap,
  BarChart2,
  Sparkles,
  ArrowLeft,
  GraduationCap
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
    <div className="interview-lab-view" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#FFFFFF',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: 'hidden'
    }}>
      {/* 1. Top Navigation Bar */}
      <header style={{
        height: '50px',
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 10
      }}>
        {/* Left: Brand & Back to Canvas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToCanvas && (
            <button
              onClick={onBackToCanvas}
              style={{
                background: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '5px 10px',
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
              <ArrowLeft size={13} />
              <span>Sơ đồ Kiến trúc</span>
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
              justifyContent: 'center'
            }}>
              <GraduationCap size={15} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                Phòng Luyện Phản Xạ Phỏng Vấn (Interview Lab)
              </span>
              <span style={{
                marginLeft: '8px',
                background: '#EEF2FF',
                color: '#4F46E5',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                Fullstack 3 YoE
              </span>
            </div>
          </div>
        </div>

        {/* Center: 3 Hub Tabs */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('reader')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'reader' ? 800 : 600,
              background: activeTab === 'reader' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'reader' ? '#4F46E5' : '#64748B',
              border: 'none',
              boxShadow: activeTab === 'reader' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer'
            }}
          >
            <BookOpen size={13} />
            <span>Sổ Tay Phản Xạ (Cheatsheet)</span>
          </button>

          <button
            onClick={() => setActiveTab('drill')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'drill' ? 800 : 600,
              background: activeTab === 'drill' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'drill' ? '#4F46E5' : '#64748B',
              border: 'none',
              boxShadow: activeTab === 'drill' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Zap size={13} />
            <span>Flashcard & Luyện Phản Xạ</span>
          </button>

          <button
            onClick={() => setActiveTab('gap_map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'gap_map' ? 800 : 600,
              background: activeTab === 'gap_map' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'gap_map' ? '#4F46E5' : '#64748B',
              border: 'none',
              boxShadow: activeTab === 'gap_map' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={13} />
            <span>Gap Map & 30-Day Routine</span>
          </button>
        </div>

        {/* Right: AI Generate Button */}
        <div>
          <button
            onClick={() => toggleGenerateModal(true)}
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
          >
            <Sparkles size={13} />
            <span>Sinh Topic Bằng AI</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'gap_map' ? (
          <GapMapDashboard />
        ) : (
          <>
            <DomainSidebar />
            {activeTab === 'reader' && <CheatsheetReader />}
            {activeTab === 'drill' && <FlashcardDrill />}
          </>
        )}
      </div>

      {/* Modal AI Generator */}
      <GenerateTopicModal />
    </div>
  );
};
