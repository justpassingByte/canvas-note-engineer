import React, { useEffect, useState } from 'react';
import './styles/engineering-tokens.css';
import './styles/canvas.css';
import './styles/node.css';
import './styles/drawer.css';
import './styles/interview.css';

import { SvgGridCanvas } from './components/Canvas/SvgGridCanvas.js';
import { FieldNotesDrawer } from './components/Drawer/FieldNotesDrawer.js';
import { ProviderConfigModal } from './components/Settings/ProviderConfigModal.js';
import { NewGraphAiModal } from './components/Modals/NewGraphAiModal.js';
import { ExpandNodeAiModal } from './components/Modals/ExpandNodeAiModal.js';
import { BrainstormRagModal } from './components/RAG/BrainstormRagModal.js';
import { InterviewLabView } from './components/InterviewLab/InterviewLabView.js';
import { useGraphStore } from './store/useGraphStore.js';
import { setDynamicDictionary } from './dictionary/technicalDictionary.js';

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
        interviewStore.selectDomainAndTopic(domainId || null, topicId || null, tab);
      });
    };
    window.addEventListener('switch-to-interview', handleSwitchToInterview);

    return () => {
      clearInterval(timer);
      window.removeEventListener('switch-to-canvas', handleSwitch);
      window.removeEventListener('switch-to-interview', handleSwitchToInterview);
    };
  }, []);

  if (appMode === 'interview_lab') {
    return <InterviewLabView onBackToCanvas={() => setAppMode('canvas')} />;
  }

  return (
    <main className="khong-gian-lam-viec" style={{ position: 'relative' }}>
      <SvgGridCanvas />
      <FieldNotesDrawer />
      <ProviderConfigModal />
      <NewGraphAiModal />
      <ExpandNodeAiModal />
      <BrainstormRagModal />
    </main>
  );
};

export default App;
