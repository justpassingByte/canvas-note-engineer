import React, { useEffect } from 'react';
import './styles/engineering-tokens.css';
import './styles/canvas.css';
import './styles/node.css';
import './styles/drawer.css';

import { SvgGridCanvas } from './components/Canvas/SvgGridCanvas.js';
import { FieldNotesDrawer } from './components/Drawer/FieldNotesDrawer.js';
import { useGraphStore } from './store/useGraphStore.js';

export const App: React.FC = () => {
  const { graph, setGraph, fetchCurrentGraph, pollCurrentGraph } = useGraphStore();

  useEffect(() => {
    // 1. Tải đồ thị ban đầu
    fetchCurrentGraph().then(() => {
      if (!useGraphStore.getState().graph) {
        setGraph({
          id: 'graph-interactive-workspace',
          topic: 'Kiến Trúc Hệ Thống Phân Tán',
          nodes: [],
          edges: []
        });
      }
    });

    // 2. Tự động đồng bộ thời gian thực mỗi 1.5 giây mà không cần reload trang
    const timer = setInterval(() => {
      pollCurrentGraph();
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="khong-gian-lam-viec">
      <SvgGridCanvas />
      <FieldNotesDrawer />
    </main>
  );
};

export default App;
