import React, { useEffect, useState } from 'react';
import './styles/engineering-tokens.css';
import './styles/canvas.css';
import './styles/node.css';
import './styles/drawer.css';

import { SvgGridCanvas } from './components/Canvas/SvgGridCanvas.js';
import { FieldNotesDrawer } from './components/Drawer/FieldNotesDrawer.js';
import { ProviderConfigModal } from './components/Settings/ProviderConfigModal.js';
import { NewGraphAiModal } from './components/Modals/NewGraphAiModal.js';
import { ExpandNodeAiModal } from './components/Modals/ExpandNodeAiModal.js';
import { InterviewLabView } from './components/InterviewLab/InterviewLabView.js';
import { useGraphStore } from './store/useGraphStore.js';
import { setDynamicDictionary } from './dictionary/technicalDictionary.js';
import { GraduationCap } from 'lucide-react';

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'canvas' | 'interview_lab'>('canvas');
  const { graph, setGraph, fetchCurrentGraph, pollCurrentGraph, fetchProviderConfig } = useGraphStore();

  useEffect(() => {
    // 1. Nạp từ điển thuật ngữ động từ RAG documents
    fetch('/api/rag/dictionary')
      .then(res => res.json())
      .then(data => {
        if (data.dictionary) {
          setDynamicDictionary(data.dictionary);
        }
      })
      .catch(() => {});

    // 2. Nạp cấu hình AI Provider
    fetchProviderConfig();

    // 3. Tải đồ thị ban đầu từ backend (SQLite WAL)
    fetchCurrentGraph();

    // 4. Tự động đồng bộ thời gian thực mỗi 1.5 giây mà không cần reload trang
    const timer = setInterval(() => {
      pollCurrentGraph();
    }, 1500);

    // 5. Lắng nghe yêu cầu chuyển từ Interview Lab sang Canvas (Auto Pan & Highlight)
    const handleSwitch = (e: any) => {
      setAppMode('canvas');
      const targetId = e.detail?.nodeId;
      if (targetId) {
        const store = useGraphStore.getState();
        store.selectNode(targetId);
        store.openDrawer();

        // Tự động căn giữa camera (Pan) vào node đích trong không gian khả dụng (trừ 520px của drawer)
        setTimeout(() => {
          const currentGraph = useGraphStore.getState().graph;
          const targetNode = currentGraph?.nodes.find((n) => n.id === targetId);
          if (targetNode) {
            const zoom = useGraphStore.getState().zoom || 1;
            const nodeX = targetNode.tam ? targetNode.tam.x : targetNode.toa_do.x + 110;
            const nodeY = targetNode.tam ? targetNode.tam.y : targetNode.toa_do.y + 70;

            const availableWidth = window.innerWidth > 900 ? window.innerWidth - 520 : window.innerWidth;
            const centerX = availableWidth / 2;
            const centerY = window.innerHeight / 2;

            store.setPan({
              x: centerX - nodeX * zoom,
              y: centerY - nodeY * zoom
            });
          }
        }, 100);
      }
    };
    window.addEventListener('switch-to-canvas', handleSwitch);

    // 6. Lắng nghe yêu cầu chuyển từ Canvas sang Interview Lab (Auto Select Topic & Tab)
    const handleSwitchToInterview = (e: any) => {
      setAppMode('interview_lab');
      const { topicId, domainId, tab } = e.detail || {};
      import('./store/useInterviewStore.js').then(({ useInterviewStore }) => {
        const interviewStore = useInterviewStore.getState();
        if (tab) {
          interviewStore.setActiveTab(tab);
        }
        if (domainId) {
          interviewStore.selectDomain(domainId);
        }
        if (topicId) {
          interviewStore.selectTopic(topicId);
        }
      });
    };
    window.addEventListener('switch-to-interview', handleSwitchToInterview);

    return () => {
      clearInterval(timer);
      window.removeEventListener('switch-to-canvas', handleSwitch);
      window.removeEventListener('switch-to-interview', handleSwitchToInterview);
    };
  }, []);

  const isDrawerOpen = useGraphStore(state => state.isDrawerOpen);

  if (appMode === 'interview_lab') {
    return <InterviewLabView onBackToCanvas={() => setAppMode('canvas')} />;
  }

  return (
    <main className="khong-gian-lam-viec" style={{ position: 'relative' }}>
      {/* Floating Button chuyển sang Phòng Luyện Phỏng Vấn (Tự động dịch sang trái khi Drawer mở để không đè nút đóng) */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: isDrawerOpen ? '536px' : '16px',
        transition: 'right 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 900
      }}>
        <button
          onClick={() => setAppMode('interview_lab')}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
          title="Mở Phòng Luyện Phản Xạ Phỏng Vấn (Fullstack 3 YoE - 99 Đề tài / 29 Domain)"
        >
          <GraduationCap size={16} />
          <span>Luyện Phỏng Vấn (Interview Lab)</span>
          <span style={{
            background: 'rgba(255, 255, 255, 0.22)',
            borderRadius: '999px',
            padding: '2px 7px',
            fontSize: '10.5px',
            fontWeight: 800
          }}>
            99 đề tài
          </span>
        </button>
      </div>

      <SvgGridCanvas />
      <FieldNotesDrawer />
      <ProviderConfigModal />
      <NewGraphAiModal />
      <ExpandNodeAiModal />
    </main>
  );
};

export default App;
